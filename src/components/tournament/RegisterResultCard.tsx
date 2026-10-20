import React, { useState } from 'react';
import QrCode from './QrCode';
import type { RegisterResult } from '../../utils/tournamentApi';

interface Props {
    result: RegisterResult;
    mode: 'solo' | 'party' | 'team' | 'join';
    brandColor: string;
    /** Адрес страницы турнира без параметров — к нему добавляется код приглашения. */
    pageUrl: string;
    startText: string;
}

/** Экран итога называет статус: молчаливое «Готово!» приводит к повторным заявкам (план §4.7). */
const RegisterResultCard: React.FC<Props> = ({ result, mode, brandColor, pageUrl, startText }) => {
    const [copied, setCopied] = useState(false);
    const invite = result.invite_code ? `${pageUrl}?team=${result.invite_code}` : null;

    const head = (() => {
        switch (result.status) {
            case 'registered': return { icon: '🏆', title: result.number ? `Вы в списке, №${result.number}` : 'Вы в списке', text: `Начало — ${startText}. Приходите к чек-ину и покажите код ниже.` };
            case 'waitlist': return { icon: '⏳', title: `Вы в листе ожидания, №${result.waitlist_pos ?? '—'}`, text: 'Мест пока нет. Освободится место — напишем в бот Loot Arena, если он подключён. Можно прийти к началу: вас могут позвать на месте.' };
            case 'joined': return { icon: '🤝', title: result.team_name ? `Вы в команде «${result.team_name}»` : 'Вы в составе', text: `Начало — ${startText}. Покажите код на чек-ине.` };
            case 'already': return { icon: 'ℹ️', title: 'Этот номер уже записан', text: 'Код для чек-ина пришёл в бот Loot Arena, если он подключён. Нет кода — назовите номер телефона на стойке.' };
            default: return { icon: '✅', title: 'Готово', text: '' };
        }
    })();

    const copy = async () => {
        if (!invite) return;
        try { await navigator.clipboard.writeText(invite); setCopied(true); setTimeout(() => setCopied(false), 2000); }
        catch { window.prompt('Скопируйте ссылку', invite); }
    };
    const share = async () => {
        if (!invite) return;
        if (navigator.share) { try { await navigator.share({ title: 'Турнир', text: 'Вступай в мою команду', url: invite }); return; } catch { /* отмена */ } }
        copy();
    };
    const need = result.size && result.members != null ? Math.max(0, result.size - result.members) : 0;

    return (
        <div className="glass rounded-[28px] p-6 flex flex-col items-center gap-5 text-center animate-scale-in" role="status">
            <div className="text-4xl" aria-hidden>{head.icon}</div>
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-black text-white text-balance">{head.title}</h2>
                {head.text && <p className="text-sm text-white/55 max-w-sm">{head.text}</p>}
            </div>

            {result.checkin_code && (
                <div className="flex flex-col items-center gap-2">
                    <QrCode value={`trn:${result.checkin_code}`} />
                    <span className="font-mono text-sm tracking-widest text-white/70">{result.checkin_code}</span>
                    <span className="text-xs text-white/35">Сохраните скриншот — это ваш пропуск на чек-ин</span>
                </div>
            )}

            {invite && (mode === 'party' || mode === 'team') && (
                <div className="w-full flex flex-col gap-3 rounded-2xl bg-white/[0.05] p-4 text-left">
                    <span className="text-sm font-semibold text-white">
                        {need > 0 ? `Позовите ещё ${need} — каждый вступает сам по ссылке` : 'Ссылка для вашей команды'}
                    </span>
                    <span className="break-all font-mono text-xs text-white/50">{invite}</span>
                    <div className="flex gap-2">
                        <button type="button" onClick={share} className="flex-1 rounded-xl py-3 text-sm font-bold text-black btn-apple" style={{ backgroundColor: brandColor }}>
                            Отправить друзьям
                        </button>
                        <button type="button" onClick={copy} className="rounded-xl px-4 py-3 text-sm font-semibold text-white bg-white/[0.08]">
                            {copied ? 'Скопировано' : 'Копировать'}
                        </button>
                    </div>
                    {result.team_name_pending && (
                        <span className="text-xs text-white/35">Название команды появится на экранах после проверки клубом</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default RegisterResultCard;
