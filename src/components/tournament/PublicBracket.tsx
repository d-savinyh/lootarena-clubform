import React from 'react';
import type { PublicTournament } from '../../utils/tournamentApi';

type Match = NonNullable<PublicTournament['matches']>[number];

const BRACKETS: Array<{ key: Match['bracket']; label: string }> = [
    { key: 'upper', label: 'Сетка' },
    { key: 'lower', label: 'Нижняя сетка' },
    { key: 'third_place', label: 'Матч за 3-е место' },
    { key: 'grand_final', label: 'Гранд-финал' },
];

const roundName = (b: Match['bracket'], r: number, upperRounds: number) => {
    if (b !== 'upper') return b === 'lower' ? `Раунд ${r}` : '';
    const left = upperRounds - r;
    return left === 0 ? 'Финал' : `1/${2 ** left}`;
};

/** Сетка только для чтения: из публичного ответа — названия команд и счёт, без ников игроков. */
const PublicBracket: React.FC<{ data: PublicTournament; brandColor: string }> = ({ data, brandColor }) => {
    const matches = data.matches || [];
    const teams = new Map((data.teams || []).map((t) => [t.id, t.name]));
    const upperRounds = Math.max(0, ...matches.filter((m) => m.bracket === 'upper').map((m) => m.round));
    if (!matches.length) return null;

    const side = (m: Match, id: string | null, wins: number) => {
        const win = !!id && id === m.winner_team_id;
        return (
            <div className={`flex items-center justify-between gap-2 px-3 py-2 text-sm ${win ? 'font-bold text-white' : id ? 'text-white/70' : 'text-white/25'}`}>
                <span className="truncate">{id ? teams.get(id) || 'Команда' : m.status === 'bye' ? '—' : 'ждём'}</span>
                <span className="tabular-nums" style={win ? { color: brandColor } : undefined}>
                    {m.status === 'forfeit' ? (win ? 'W' : 'L') : m.winner_team_id && m.score?.length ? wins : ''}
                </span>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6">
            {BRACKETS.filter((b) => matches.some((m) => m.bracket === b.key)).map((b) => {
                const ms = matches.filter((m) => m.bracket === b.key);
                const rounds = [...new Set(ms.map((m) => m.round))].sort((x, y) => x - y);
                return (
                    <section key={b.key} className="flex flex-col gap-3">
                        {(b.key !== 'upper' || matches.some((m) => m.bracket !== 'upper')) && (
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">{b.label}</h3>
                        )}
                        <div className="overflow-x-auto -mx-1 px-1 pb-1">
                            <div className="grid grid-flow-col auto-cols-[minmax(11rem,1fr)] gap-3">
                                {rounds.map((r) => (
                                    <div key={r} className="flex flex-col justify-around gap-3">
                                        {roundName(b.key, r, upperRounds) && (
                                            <span className="text-[11px] uppercase tracking-wider text-white/35">{roundName(b.key, r, upperRounds)}</span>
                                        )}
                                        {ms.filter((m) => m.round === r).sort((x, y) => x.slot - y.slot).map((m) => {
                                            const wa = (m.score || []).filter((s) => s.a > s.b).length;
                                            const wb = (m.score || []).filter((s) => s.b > s.a).length;
                                            const now = m.status === 'ready' || m.status === 'live';
                                            return (
                                                <div key={m.id} className="glass rounded-2xl overflow-hidden" style={now ? { boxShadow: `inset 0 0 0 1px ${brandColor}` } : undefined}>
                                                    {side(m, m.team_a_id, wa)}
                                                    <div className="h-px bg-white/[0.06]" />
                                                    {side(m, m.team_b_id, wb)}
                                                    {now && (m.pcs?.a?.length || m.pcs?.b?.length) ? (
                                                        <div className="px-3 pb-2 pt-1 text-[11px] text-white/45">
                                                            ПК: {[m.pcs?.a?.join(', '), m.pcs?.b?.join(', ')].filter(Boolean).join(' · ')}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                );
            })}
        </div>
    );
};

export default PublicBracket;
