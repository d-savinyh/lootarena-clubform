import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ClubHeader from '../components/ClubHeader';
import RegisterForm from '../components/tournament/RegisterForm';
import RegisterResultCard from '../components/tournament/RegisterResultCard';
import PublicBracket from '../components/tournament/PublicBracket';
import { formatStart, viewTournament, type PublicTournament, type RegisterResult } from '../utils/tournamentApi';

/**
 * Публичная страница турнира `/t/<токен>` (TRN-114). До старта — запись (один / пати / команда / по коду),
 * после — сетка только для чтения. Обновление сетки раз в 60 с и только на видимой вкладке; сервер отвечает
 * «без изменений» по etag.
 */
const BRAND = '#30D158';
const GAME: Record<string, string> = { cs2: 'CS2', dota2: 'Dota 2' };

const shape = (t: PublicTournament['tournament']) =>
    t.team_size === 1 ? '1×1' : `${t.entry_mode === 'mix' ? 'MIX' : 'Команды'} ${t.team_size}×${t.team_size}`;

const placeLabel = (p: { place_from: number; place_to: number }) =>
    p.place_from === p.place_to ? `${p.place_from} место` : `${p.place_from}–${p.place_to} места`;

const useIsDesktop = (bp = 1024) => {
    const [v, setV] = useState(() => typeof window !== 'undefined' && window.innerWidth >= bp);
    useEffect(() => {
        const mq = window.matchMedia(`(min-width: ${bp}px)`);
        const h = (e: MediaQueryListEvent) => setV(e.matches);
        mq.addEventListener('change', h);
        return () => mq.removeEventListener('change', h);
    }, [bp]);
    return v;
};

const readUtm = (): Record<string, string> => {
    const q = new URLSearchParams(window.location.search);
    const out: Record<string, string> = {};
    for (const k of ['source', 'medium', 'campaign', 'content', 'term']) {
        const v = q.get(`utm_${k}`);
        if (v) out[k] = v.slice(0, 100);
    }
    return out;
};

const TournamentPage: React.FC<{ token: string }> = ({ token }) => {
    const isDesktop = useIsDesktop();
    const invite = useMemo(() => {
        const c = new URLSearchParams(window.location.search).get('team');
        return c && /^[0-9a-f]{12}$/.test(c) ? c : null;
    }, []);
    const [data, setData] = useState<PublicTournament | null>(null);
    const [state, setState] = useState<'loading' | 'ready' | 'not_found' | 'error'>('loading');
    const [result, setResult] = useState<{ r: RegisterResult; mode: 'solo' | 'party' | 'team' | 'join' } | null>(null);
    const [rulesOpen, setRulesOpen] = useState(false);
    const etag = useRef<string | null>(null);

    const load = useCallback(async () => {
        const r = await viewTournament(token, { invite, etag: etag.current });
        if (!r.ok) { setState(r.error === 'not_found' ? 'not_found' : (etag.current ? 'ready' : 'error')); return; }
        if ('data' in r && r.data) { etag.current = r.etag; setData(r.data); }
        setState('ready');
    }, [token, invite]);

    // Первая загрузка — вне синхронного тела эффекта (react-hooks/set-state-in-effect).
    useEffect(() => { const id = window.setTimeout(load, 0); return () => window.clearTimeout(id); }, [load]);

    // Сетка обновляется сама только во время турнира и только на видимой вкладке.
    const live = data?.tournament.status === 'live';
    useEffect(() => {
        if (!live) return;
        const id = window.setInterval(() => { if (!document.hidden) load(); }, 60_000);
        return () => window.clearInterval(id);
    }, [live, load]);

    useEffect(() => { if (data) document.title = `${data.tournament.title} — ${data.club.name}`; }, [data]);

    if (state === 'loading') {
        return <div className="min-h-screen grid place-items-center"><div className="h-10 w-10 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" aria-label="Загрузка" /></div>;
    }
    if (state === 'not_found' || state === 'error' || !data) {
        return (
            <div className="min-h-screen grid place-items-center px-6 text-center">
                <div className="flex flex-col gap-3 max-w-sm">
                    <div className="text-4xl" aria-hidden>🏆</div>
                    <h1 className="text-xl font-black">{state === 'not_found' ? 'Турнир не найден' : 'Не удалось загрузить турнир'}</h1>
                    <p className="text-sm text-white/50">{state === 'not_found' ? 'Проверьте ссылку или спросите её у администратора клуба.' : 'Проверьте интернет и обновите страницу.'}</p>
                    {state === 'error' && <button type="button" onClick={() => { setState('loading'); load(); }} className="mt-2 rounded-2xl bg-white/[0.08] py-3 font-semibold">Обновить</button>}
                </div>
            </div>
        );
    }

    const t = data.tournament;
    const tz = data.club.timezone;
    const start = formatStart(t.starts_at, tz);
    const game = t.game_key === 'other' ? (t.game_title || 'Игра') : GAME[t.game_key];
    const unit = t.capacity_unit === 'teams' ? 'команд' : 'мест';
    const left = Math.max(0, t.capacity - data.counts.used);
    const pct = Math.min(100, Math.round((data.counts.used / Math.max(1, t.capacity)) * 100));
    const pageUrl = `${window.location.origin}/t/${token}`;
    const cancelled = t.status === 'cancelled';
    const finished = t.status === 'finished';
    const podium = (data.teams || []).filter((x) => x.place && x.place <= 3).sort((a, b) => (a.place || 0) - (b.place || 0));

    const info = (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 animate-slide-up">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: BRAND }}>Турнир · {game} · {shape(t)}</span>
                <h1 className={`font-black text-white text-balance leading-tight ${isDesktop ? 'text-4xl' : 'text-3xl'}`}>{t.title}</h1>
                <div className="flex flex-wrap gap-2 text-[13px]">
                    {[start, t.format === 'de' ? 'Двойная сетка' : 'На выбывание', `Bo${t.best_of.default}${t.best_of.final !== t.best_of.default ? `, финал Bo${t.best_of.final}` : ''}`,
                        t.entry_fee > 0 ? `Взнос ${new Intl.NumberFormat('ru-RU', { style: 'currency', currency: data.club.currency_code || 'RUB', maximumFractionDigits: 0 }).format(t.entry_fee)} — на кассе` : 'Бесплатно',
                        t.age_policy === 'adults' ? '18+' : 'С 14 лет'].map((c) => (
                        <span key={c} className="rounded-full bg-white/[0.07] px-3 py-1 text-white/75">{c}</span>
                    ))}
                </div>
            </div>

            {cancelled ? (
                <div className="glass rounded-[24px] p-5 text-white/70">Турнир отменён клубом.</div>
            ) : !finished && t.status !== 'live' && (
                <div className="glass rounded-[24px] p-5 flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="text-2xl font-black tabular-nums">{data.counts.used} <span className="text-base font-semibold text-white/40">из {t.capacity} {unit}</span></span>
                        <span className="text-sm text-white/50">{left > 0 ? `осталось ${left}` : data.counts.waitlist > 0 ? `в листе ожидания ${data.counts.waitlist}` : 'мест нет — запишем в лист ожидания'}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: BRAND }} /></div>
                </div>
            )}

            {finished && podium.length > 0 && (
                <div className="glass rounded-[24px] p-5 flex flex-col gap-3">
                    <h2 className="text-lg font-bold">Итоги</h2>
                    {podium.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 text-base">
                            <span className="text-2xl" aria-hidden>{['🥇', '🥈', '🥉'][(p.place || 1) - 1]}</span>
                            <span className="font-semibold truncate">{p.name}</span>
                        </div>
                    ))}
                </div>
            )}

            {(t.prizes.length > 0 || t.nominations.length > 0 || t.participation_prize) && (
                <div className="glass rounded-[24px] p-5 flex flex-col gap-3">
                    <h2 className="text-lg font-bold">Призы</h2>
                    {t.prizes.map((p) => (
                        <div key={p.place_from} className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="text-white/50 shrink-0">{placeLabel(p)}</span>
                            <span className="text-right font-semibold text-white">{p.text}</span>
                        </div>
                    ))}
                    {t.nominations.map((n) => (
                        <div key={n.title} className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="text-white/50">{n.title}</span>
                            {n.prize && <span className="text-right font-semibold text-white">{n.prize}</span>}
                        </div>
                    ))}
                    {t.participation_prize && (
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="text-white/50">Всем, кто сыграл</span>
                            <span className="text-right font-semibold text-white">{t.participation_prize}</span>
                        </div>
                    )}
                    <p className="text-xs text-white/35">Призы придут в приложение Loot Arena на номер, указанный при записи.</p>
                </div>
            )}

            {t.stream_url && /^https:\/\//.test(t.stream_url) && (
                <a href={t.stream_url} target="_blank" rel="noopener noreferrer" className="glass rounded-[24px] p-4 text-center font-semibold text-white hover:bg-white/[0.06]">
                    📺 Смотреть трансляцию
                </a>
            )}

            {t.rules && (
                <div className="glass rounded-[24px] p-5">
                    <button type="button" onClick={() => setRulesOpen((v) => !v)} aria-expanded={rulesOpen}
                        className="flex w-full items-center justify-between text-left text-lg font-bold">
                        Правила <span className="text-white/40 text-sm font-normal">{rulesOpen ? 'свернуть' : 'читать'}</span>
                    </button>
                    {rulesOpen && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/65">{t.rules}</p>}
                </div>
            )}
        </div>
    );

    const action = (() => {
        if (result) return <RegisterResultCard result={result.r} mode={result.mode} brandColor={BRAND} pageUrl={pageUrl} startText={start}
            tournamentToken={token} confirmRequired={!!t.confirm_required} />;
        if (t.status === 'live' || finished) {
            return (
                <div className="glass rounded-[28px] p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold">{finished ? 'Сетка турнира' : 'Идёт турнир'}</h2>
                        {!finished && <span className="text-xs text-white/40">обновляется сама</span>}
                    </div>
                    <PublicBracket data={data} brandColor={BRAND} />
                </div>
            );
        }
        if (cancelled) return null;
        if (!data.registration_open) {
            return <div className="glass rounded-[28px] p-6 text-center flex flex-col gap-2"><h2 className="text-xl font-black">Запись закрыта</h2><p className="text-sm text-white/50">Приходите посмотреть — {start}.</p></div>;
        }
        if (invite && data.invite && !data.invite.valid) {
            return <div className="glass rounded-[28px] p-6 text-center flex flex-col gap-2"><h2 className="text-xl font-black">Ссылка-приглашение не работает</h2><p className="text-sm text-white/50">Попросите у капитана новую ссылку или запишитесь сами — <a className="underline" href={pageUrl}>на странице турнира</a>.</p></div>;
        }
        return (
            <div className={`glass rounded-[28px] ${isDesktop ? 'p-8' : 'p-6'} flex flex-col gap-4 animate-slide-up-delay-2`}>
                <h2 className="text-xl font-black">{invite ? 'Вступить в команду' : 'Записаться на турнир'}</h2>
                <RegisterForm token={token} data={data} brandColor={BRAND} inviteCode={invite} utm={readUtm()}
                    onDone={(r, ctx) => { setResult({ r, mode: ctx.mode }); window.scrollTo({ top: 0, behavior: 'smooth' }); load(); }} />
            </div>
        );
    })();

    return (
        <div className="min-h-screen">
            {isDesktop ? (
                <div className="desktop-grid">
                    <div className="desktop-grid-left">
                        <ClubHeader clubName={data.club.name} clubLogo={data.club.avatar_url || undefined} coverUrl={data.club.cover_url || undefined}
                            address={[data.club.city, data.club.address].filter(Boolean).join(', ') || null} brandColor={BRAND} isDesktopHero />
                    </div>
                    <div className="desktop-grid-right px-10 py-12 flex flex-col gap-6 max-w-[560px]">{result ? <>{action}{info}</> : <>{info}{action}</>}</div>
                </div>
            ) : (
                <div className="px-4 pb-12 flex flex-col gap-5">
                    <ClubHeader clubName={data.club.name} clubLogo={data.club.avatar_url || undefined} coverUrl={data.club.cover_url || undefined}
                        address={[data.club.city, data.club.address].filter(Boolean).join(', ') || null} brandColor={BRAND} />
                    {result ? <>{action}{info}</> : <>{info}{action}</>}
                </div>
            )}
        </div>
    );
};

export default TournamentPage;
