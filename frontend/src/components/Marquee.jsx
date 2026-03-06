const ITEMS = [
    { icon: '🎬', label: 'YouTube Downloads' },
    { icon: '🎵', label: 'Audio Only (MP3)' },
    { icon: '📹', label: 'HD & 4K Quality' },
    { icon: '⚡', label: 'Fast & Private' },
    { icon: '🔒', label: 'Secure Backend' },
    { icon: '🌍', label: 'Works Worldwide' },
    { icon: '💾', label: 'Any Format' },
    { icon: '🚀', label: 'No Sign-up Needed' },
];

const TRACK = [...ITEMS, ...ITEMS];

export default function Marquee({ speed = 30 }) {
    const singleSetWidth = ITEMS.length * (180 + 16);

    return (
        <div className="relative w-full overflow-hidden ">
            <style>{`
                @keyframes marquee-scroll {
                    from { transform: translateX(0); }
                    to   { transform: translateX(-${singleSetWidth}px); }
                }
                .marquee-track {
                    animation: marquee-scroll ${speed}s linear infinite;
                }
            `}</style>

            {/* Left fade */}
            <div className="absolute left-0 top-0 h-full w-24 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
            {/* Right fade */}
            <div className="absolute right-0 top-0 h-full w-24 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />

            <div className="marquee-track flex gap-4 w-max">
                {TRACK.map((item, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-2.5 px-5 py-2 bg-white border border-slate-200 rounded-xl shadow-sm whitespace-nowrap select-none"
                        style={{ minWidth: 180 }}
                    >
                        <span className="text-lg leading-none">{item.icon}</span>
                        <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
