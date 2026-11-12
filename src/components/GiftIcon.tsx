// Значок подарка вместо эмодзи 🎁 (в «Плитке» эмодзи в интерфейсе нет, R12). Свой значок клуба
// (gift.reward_icon) по-прежнему показывается, этот — только когда клуб значок не выбрал.
const GiftIcon: React.FC<{ className?: string; color?: string }> = ({ className = 'w-1/2 h-1/2', color }) => (
    <svg className={className} style={color ? { color } : undefined} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="8" width="18" height="4" rx="1" />
        <path d="M12 8v13" />
        <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
        <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
);

export default GiftIcon;
