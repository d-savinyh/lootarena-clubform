import React, { useEffect, useState } from 'react';
import { errorText, withdrawTournament, type WithdrawInfo } from '../../utils/tournamentApi';

/**
 * «Не смогу прийти» — по ссылке из напоминания (`?drop=<код чек-ина>`). Сначала показываем, что будет снято
 * (своя заявка целиком или только вы из пати), снимаем — по кнопке. Освободившееся место сервер сразу отдаёт
 * следующему из листа ожидания.
 */
const players = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'игрок' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'игрока' : 'игроков');

const WithdrawCard: React.FC<{ token: string; code: string; brandColor: string; pageUrl: string }> = ({ token, code, brandColor, pageUrl }) => {
    const [info, setInfo] = useState<WithdrawInfo | null>(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState<{ promoted: number } | null>(null);

    useEffect(() => {
        let alive = true;
        withdrawTournament(token, code, false).then((r) => {
            if (!alive) return;
            if (r.ok && r.data) setInfo(r.data); else setError(errorText(r.error));
        });
        return () => { alive = false; };
    }, [token, code]);

    const confirm = async () => {
        if (busy) return;
        setBusy(true); setError('');
        const r = await withdrawTournament(token, code, true);
        setBusy(false);
        if (!r.ok) { setError(errorText(r.error)); return; }
        setDone({ promoted: r.data?.promoted ?? 0 });
    };

    const box = 'glass rounded-[28px] p-6 flex flex-col items-center gap-4 text-center';
    if (done || info?.status === 'already_withdrawn') {
        return (
            <div className={box} role="status">
                <div className="text-4xl" aria-hidden>👋</div>
                <h2 className="text-xl font-black text-white">Вы отказались от участия</h2>
                <p className="text-sm text-white/55 max-w-sm">Спасибо, что предупредили — {done && done.promoted > 0 ? 'место ушло следующему в очереди' : 'место освободилось для других'}. Передумаете — запишитесь снова, если будут места.</p>
                <a href={pageUrl} className="text-sm underline text-white/70">К странице турнира</a>
            </div>
        );
    }
    if (error && !info) {
        return <div className={box}><h2 className="text-xl font-black text-white">Ссылка не работает</h2><p className="text-sm text-white/55">{error}</p><a href={pageUrl} className="text-sm underline text-white/70">К странице турнира</a></div>;
    }
    if (!info) return <div className={box}><p className="text-sm text-white/50">Загружаем…</p></div>;
    return (
        <div className={box}>
            <div className="text-4xl" aria-hidden>🗓️</div>
            <h2 className="text-xl font-black text-white text-balance">Не сможете прийти?</h2>
            <p className="text-sm text-white/60 max-w-sm">
                {info.whole_entry
                    ? info.kind === 'solo' ? `Снимем вашу заявку (${info.nick}).` : `Снимем всю заявку${info.team_name ? ` «${info.team_name}»` : ''} — ${info.members} ${players(info.members ?? 0)}. Предупредите друзей.`
                    : `Снимем только вас (${info.nick}) — остальные из ${info.kind === 'team' ? 'команды' : 'пати'} останутся.`}
                {' '}Место сразу получит следующий из листа ожидания.
            </p>
            {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
            <button type="button" onClick={confirm} disabled={busy}
                className="w-full rounded-2xl py-4 text-base font-bold text-black btn-apple disabled:opacity-50" style={{ backgroundColor: brandColor }}>
                {busy ? 'Снимаем…' : 'Не смогу прийти'}
            </button>
            <a href={pageUrl} className="text-sm underline text-white/60">Я приду — оставить как есть</a>
        </div>
    );
};

export default WithdrawCard;
