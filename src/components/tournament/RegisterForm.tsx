import React, { useLayoutEffect, useRef, useState } from 'react';
import { applyMask, getPhoneFormat, isValidPhone, phoneDigits } from '../../utils/phone';
import { solveCaptcha } from '../../utils/captcha';
import {
    PRIVACY_URL, errorText, joinTournament, registerTournament,
    type PersonForm, type PublicTournament, type RegisterResult,
} from '../../utils/tournamentApi';

type Mode = 'solo' | 'party' | 'team';

interface Props {
    token: string;
    data: PublicTournament;
    brandColor: string;
    /** Вход по ссылке капитана `?team=<код>` — форма вступления, а не новой заявки. */
    inviteCode?: string | null;
    utm?: Record<string, string>;
    onDone: (r: RegisterResult, ctx: { mode: Mode | 'join'; nick: string }) => void;
}

const LEVELS: Array<{ key: NonNullable<PersonForm['level']>; label: string }> = [
    { key: 'novice', label: 'Новичок' },
    { key: 'amateur', label: 'Любитель' },
    { key: 'experienced', label: 'Опытный' },
    { key: 'pro', label: 'Про' },
];

const Chip: React.FC<{ on: boolean; onClick: () => void; children: React.ReactNode; brandColor: string }> = ({ on, onClick, children, brandColor }) => (
    <button
        type="button"
        aria-pressed={on}
        onClick={onClick}
        className={`flex-1 min-w-0 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${on ? 'text-black' : 'text-white/70 bg-white/[0.06] hover:bg-white/[0.1]'}`}
        style={on ? { backgroundColor: brandColor } : undefined}
    >
        {children}
    </button>
);

const Check: React.FC<{ checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; required?: boolean }> = ({ checked, onChange, children, required }) => (
    <label className="flex items-start gap-3 cursor-pointer select-none">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded-md accent-[#30D158]" required={required} />
        <span className="text-[13px] leading-snug text-white/60">{children}</span>
    </label>
);

const RegisterForm: React.FC<Props> = ({ token, data, brandColor, inviteCode, utm, onDone }) => {
    const t = data.tournament;
    const fmt = getPhoneFormat(data.club.currency_code || undefined);
    const isJoin = !!inviteCode && !!data.invite?.valid;
    const modes: Array<{ key: Mode; label: string }> = t.entry_mode === 'mix'
        ? [{ key: 'solo', label: 'Играю один' }, ...(t.team_size >= 2 ? [{ key: 'party' as Mode, label: 'С друзьями' }] : [])]
        : t.team_size === 1 ? [{ key: 'solo', label: 'Записаться' }] : [{ key: 'team', label: 'Записать команду' }];
    const [mode, setMode] = useState<Mode>(modes[0].key);
    const [partySize, setPartySize] = useState(2);
    const [teamName, setTeamName] = useState('');
    const [nick, setNick] = useState('');
    const [phone, setPhone] = useState('');
    const [age, setAge] = useState<'adult' | 'minor'>('adult');
    const [birthYear, setBirthYear] = useState('');
    const [level, setLevel] = useState<PersonForm['level']>();
    const [pd, setPd] = useState(false);
    const [rules, setRules] = useState(false);
    const [showNick, setShowNick] = useState(true);
    const [marketing, setMarketing] = useState(false);
    const [hp, setHp] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    // Момент показа формы — для замера скорости заполнения (антиспам).
    const [mountedAt] = useState(() => Date.now());
    const phoneRef = useRef<HTMLInputElement>(null);
    const caretRef = useRef<number | null>(null);
    const askLevel = t.game_key === 'cs2' || t.game_key === 'dota2';

    useLayoutEffect(() => {
        if (caretRef.current === null) return;
        phoneRef.current?.setSelectionRange(caretRef.current, caretRef.current);
        caretRef.current = null;
    }, [phone]);

    const onPhone = (e: React.ChangeEvent<HTMLInputElement>) => {
        const el = e.target;
        const next = applyMask(el.value, el.selectionStart ?? el.value.length, phone, fmt);
        if (next.value === phone) { el.value = next.value; el.setSelectionRange(next.caret, next.caret); }
        else { caretRef.current = next.caret; setPhone(next.value); }
        if (error) setError('');
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (busy) return;
        if (!nick.trim()) { setError('Укажите ник'); return; }
        if (!isValidPhone(phone, fmt)) { setError(fmt.hint); return; }
        if (age === 'minor' && !/^\d{4}$/.test(birthYear)) { setError('Укажите год рождения'); return; }
        if (mode === 'team' && !teamName.trim()) { setError('Укажите название команды'); return; }
        if (!pd || !rules) { setError(errorText('consent_required')); return; }
        setBusy(true); setError('');
        const person: PersonForm = {
            nick: nick.trim(), phone: `+${phoneDigits(phone, fmt)}`, age, birth_year: age === 'minor' ? birthYear : undefined,
            level: askLevel ? level : undefined,
            consents: { pd, rules, show_nick: showNick, marketing },
            hp, form_ms: Date.now() - mountedAt,
        };
        const send = (p: PersonForm) => isJoin
            ? joinTournament(token, inviteCode!, p)
            : registerTournament(token, mode, p, {
                party_size: mode === 'party' ? partySize : undefined,
                team_name: mode === 'team' ? teamName.trim() : undefined, utm,
            });
        let r = await send(person);
        // Подозрительно быстро или поток с одного адреса — сервер просит капчу (контракт лид-форм).
        if (!r.ok && r.requireCaptcha && r.captchaKey) {
            const captcha = await solveCaptcha(r.captchaKey);
            if (!captcha) { setBusy(false); setError('Проверка не пройдена — попробуйте ещё раз'); return; }
            r = await send({ ...person, captcha_token: captcha });
        }
        setBusy(false);
        if (!r.ok) { setError(errorText(r.error)); return; }
        onDone(r, { mode: isJoin ? 'join' : mode, nick: person.nick });
    };

    const input = 'w-full rounded-2xl px-4 py-3.5 text-base text-white placeholder:text-white/25 font-medium input-apple';

    return (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            {isJoin ? (
                <div className="rounded-2xl bg-white/[0.06] px-4 py-3 text-sm text-white/80">
                    Вы вступаете в {data.invite?.kind === 'team' ? 'команду' : 'пати'}
                    {data.invite?.team_name ? <> «<b className="text-white">{data.invite.team_name}</b>»</> : null}
                    {data.invite?.size ? <> — уже {data.invite.members} из {data.invite.size}</> : null}
                </div>
            ) : modes.length > 1 && (
                <div className="flex gap-2" role="group" aria-label="Как записаться">
                    {modes.map((m) => <Chip key={m.key} on={mode === m.key} onClick={() => setMode(m.key)} brandColor={brandColor}>{m.label}</Chip>)}
                </div>
            )}

            {!isJoin && mode === 'party' && (
                <div className="flex flex-col gap-2">
                    <span className="text-[13px] text-white/50">Сколько вас вместе с вами — места бронируем сразу на всех</span>
                    <div className="flex gap-2">
                        {[2, 3].filter((n) => n <= t.team_size).map((n) => (
                            <Chip key={n} on={partySize === n} onClick={() => setPartySize(n)} brandColor={brandColor}>{n} игрока</Chip>
                        ))}
                    </div>
                </div>
            )}
            {!isJoin && mode === 'team' && (
                <input className={input} value={teamName} maxLength={40} placeholder="Название команды…"
                    onChange={(e) => setTeamName(e.target.value)} aria-label="Название команды" />
            )}

            <input className={input} value={nick} maxLength={32} placeholder="Ваш ник…" autoComplete="nickname"
                onChange={(e) => { setNick(e.target.value); if (error) setError(''); }} aria-label="Ник" />
            <input ref={phoneRef} className={input} type="tel" inputMode="tel" autoComplete="tel" placeholder={fmt.placeholder}
                value={phone} onChange={onPhone} aria-label="Телефон"
                onFocus={() => { if (!phone) { setPhone(`+${fmt.code}`); caretRef.current = fmt.code.length + 1; } }} />

            {askLevel && (
                <div className="flex flex-col gap-2">
                    <span className="text-[13px] text-white/50">Ваш уровень — чтобы собрать равные команды. Если в приложении привязан FACEIT или Dota, возьмём оттуда</span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {LEVELS.map((l) => <Chip key={l.key} on={level === l.key} onClick={() => setLevel(l.key)} brandColor={brandColor}>{l.label}</Chip>)}
                    </div>
                </div>
            )}

            {t.age_policy === 'minors_allowed' ? (
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <Chip on={age === 'adult'} onClick={() => setAge('adult')} brandColor={brandColor}>Мне есть 18</Chip>
                        <Chip on={age === 'minor'} onClick={() => setAge('minor')} brandColor={brandColor}>Мне 14–17</Chip>
                    </div>
                    {age === 'minor' && (
                        <input className={input} inputMode="numeric" maxLength={4} placeholder="Год рождения, например 2010…" value={birthYear}
                            onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, ''))} aria-label="Год рождения" />
                    )}
                </div>
            ) : (
                <p className="text-[13px] text-white/40">Турнир для игроков старше 18 лет</p>
            )}

            <div className="flex flex-col gap-3 rounded-2xl bg-white/[0.04] p-4">
                <Check checked={pd} onChange={setPd} required>
                    Согласен на обработку персональных данных по{' '}
                    <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="underline text-white/80">политике конфиденциальности</a>
                </Check>
                <Check checked={rules} onChange={setRules} required>С правилами турнира согласен</Check>
                <Check checked={showNick} onChange={setShowNick}>Показывать мой ник на экранах клуба и в итогах</Check>
                <Check checked={marketing} onChange={setMarketing}>Присылать новости клуба и следующих турниров</Check>
            </div>

            {/* Ловушка для ботов — как у лид-форм: вне экрана, без табуляции и автозаполнения. */}
            <div aria-hidden="true" className="absolute w-px h-px -left-[9999px] overflow-hidden">
                <label htmlFor="trn-company">Не заполняйте это поле</label>
                <input id="trn-company" name="company" type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
            </div>

            {error && <p className="text-sm text-red-400 text-center" role="alert">{error}</p>}

            <button type="submit" disabled={busy}
                className="w-full rounded-2xl py-4 text-base font-bold text-black btn-apple disabled:opacity-50"
                style={{ backgroundColor: brandColor, boxShadow: `0 0 24px ${brandColor}30` }}>
                {busy ? 'Записываем…' : isJoin ? 'Вступить' : mode === 'team' ? 'Записать команду' : 'Записаться'}
            </button>
            <p className="text-[11px] text-white/20 text-center">
                Форма защищена{' '}
                <a href="https://yandex.ru/legal/smartcaptcha_termsofuse/" target="_blank" rel="noopener noreferrer" className="underline decoration-white/10">Yandex SmartCaptcha</a>
            </p>
        </form>
    );
};

export default RegisterForm;
