
import { Github, Twitter, Youtube } from 'lucide-react';

// --- MAIN EXPORT ---
export default function Contact() {
    const socials = [
        { icon: Github, label: 'GitHub', href: 'https://github.com/Aditya-567' },
        { icon: Twitter, label: 'Twitter', href: '#' },
        { icon: Youtube, label: 'YouTube', href: '#' },
    ];

    return (
        <div className="w-full bg-[#0f0f0f] border-t-[3px] border-black">
            <div className="w-[92%] sm:w-[86%] md:w-[80%] mx-auto py-10 sm:py-14 md:pt-24 md:pb-16">

                {/* Top row: headline + subtitle */}
                <div className="mb-8 md:mb-10">
                    <div>
                        <h2
                            className="font-[1000] tracking-tighter leading-[0.82]  text-white"
                            style={{ fontSize: 'clamp(2.2rem, 8.5vw, 7.5rem)' }}
                        >
                            Support & Community
                        </h2>
                        <div className="mt-3 md:mt-4 h-1.5 w-24 sm:w-36 bg-red-600 rounded-full" />
                    </div>
                    <p className="mt-4 md:mt-6 text-xs sm:text-sm text-white/40 font-mono leading-relaxed max-w-xl">
                        Have a question, found a bug, or want to contribute?
                        SecureDL is open-source — reach out or open an issue on GitHub.
                    </p>
                </div>

                {/* Social buttons */}
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    {socials.map(({ icon: Icon, label, href }) => (
                        <a
                            key={label}
                            href={href}
                            aria-label={label}
                            className="  rounded-2xl px-6 py-3 gap-3 border border-white/35 flex flex-row items-center justify-center text-white hover:bg-red-600 hover:text-white hover:scale-110 hover:border-red-600 transition-all duration-200 shadow-none hover:translate-x-0.5 hover:translate-y-0.5 group"
                        >
                            <Icon size={16} className="sm:hidden" />
                            <Icon size={20} className="hidden sm:block" />
                            <h1 className="text-[14px] sm:text-[14px] font-black uppercase mt-0.5">{label}</h1>
                        </a>
                    ))}
                </div>
            </div>

            {/* Footer strip */}
            <div className="w-full border-t border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">© 2026 SecureDL. All rights reserved.</span>
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">Built with React + Python</span>
            </div>
        </div>
    );
}


