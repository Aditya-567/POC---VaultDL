import { AlertCircle, CheckCircle, Download, Loader2, Menu, PlaySquare, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Contact from './components/Contact';
import Marquee from './components/Marquee';
import { downloadVideo, fetchVideoInfo } from './services/api';

function Logo({ className = 'size-7' }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" />
        </svg>

    );
}

function UrlInputForm({ url, setUrl, status, onSubmit }) {
    const [focused, setFocused] = useState(false);
    return (
        <form onSubmit={onSubmit} className="w-full mx-auto">
            <div className="bg-white transition-all duration-300 flex flex-col gap-4 sm:gap-6">
                <h2 className="text-sm sm:text-md text-start font-normal text-[#888] tracking-tight select-none">
                    Paste The Link Here **
                </h2>

                {/* On mobile: stack input + button vertically; sm+: horizontal row */}
                <div className={`flex flex-col sm:flex-row sm:items-center gap-3 border rounded-xl border-[#353935]/50 py-3 px-3 transition-colors duration-300 ${focused ? 'border-purple-400' : ''}`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="material-symbols-outlined text-xl sm:text-2xl text-red-500 shrink-0 select-none">link</span>
                        <input
                            type="url"
                            required
                            placeholder="enter the link"
                            className="flex-1 min-w-0 border-none outline-none font-mono focus:outline-none focus:ring-0 bg-transparent text-[#666] placeholder-slate-400 text-base sm:text-lg font-medium [&:invalid]:shadow-none"
                            value={url}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={status === 'fetching'}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={status === 'fetching' || !url}
                        className="w-full sm:w-auto outline-none focus:outline-none disabled:opacity-40 disabled:bg-gray-300 border border-slate-900 text-slate-900 bg-transparent hover:bg-slate-900 hover:text-white font-extrabold text-sm sm:text-base tracking-wide px-6 sm:px-10 md:px-16 py-3 sm:py-3.5 md:py-4 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {status === 'fetching' ? (
                            <><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> Analyzing...</>
                        ) : 'Analyze'}
                    </button>
                </div>
            </div>
        </form>
    );
}

function VideoPreviewCard({ videoInfo }) {
    return (
        <div className="rounded-2xl border border-slate-300 overflow-hidden bg-slate-50 shadow-md flex flex-col h-full">
            {videoInfo.thumbnail ? (
                <div className="relative w-full aspect-video">
                    <img src={videoInfo.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                            <PlaySquare className="w-8 h-8 text-white" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full aspect-video bg-slate-200 flex items-center justify-center">
                    <PlaySquare className="w-16 h-16 text-slate-400" />
                </div>
            )}
            <div className="p-4 flex flex-col gap-1 grow justify-center">
                <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2" title={videoInfo.title}>
                    {videoInfo.title || 'Unknown Title'}
                </h3>
                <div className="flex items-center gap-1.5 text-[#666] text-xs mt-1">
                    <span className="material-symbols-outlined text-base leading-none">schedule</span>
                    {videoInfo.duration}
                </div>
            </div>
        </div>
    );
}

function FormatSelector({ formats, selectedFormat, onChange }) {
    return (
        <div className="flex flex-col gap-3 h-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto max-h-[550px] pr-3 custom-scrollbar">
                {formats.map((fmt, idx) => {
                    const isSelected = selectedFormat === fmt.format_id;
                    return (
                        <button
                            key={`${fmt.format_id}-${idx}`}
                            onClick={() => onChange(fmt.format_id)}
                            className={`rounded-xl border shadow-md px-3 py-2.5 text-left transition-all text-xs font-semibold flex flex-col gap-0.5 active:scale-95 ${isSelected
                                ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300 hover:bg-purple-50/50'
                                }`}
                        >
                            <span className="font-black text-sm">{fmt.resolution !== 'Audio' ? fmt.resolution : 'Audio'}</span>
                            <span className="opacity-70">{fmt.ext.toUpperCase()} · {fmt.filesize_mb} MB</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function DownloadProgress({ progress = 0, speed = '0.0', eta = 'Calculating...', totalMb = '?', downloadedMb = '0.0' }) {

    const SIZE = typeof window !== 'undefined' && window.innerWidth < 400 ? 220 : 280;
    const CX = SIZE / 2, CY = SIZE / 2;
    const R = Math.round(SIZE * 0.4);
    const STROKE = Math.round(SIZE * 0.078);
    const circumference = 2 * Math.PI * R;
    const dashOffset = circumference * (1 - progress / 100);

    const R1 = Math.round(R * 0.69);
    const R2 = Math.round(R * 0.85);
    const DOT = 6;

    const mask1 = `radial-gradient(circle, transparent ${((R1 - 7) / R1) * 100}%, black ${((R1 - 6) / R1) * 100}%, black 100%)`;
    const mask2 = `radial-gradient(circle, transparent ${((R2 - 7) / R2) * 100}%, black ${((R2 - 6) / R2) * 100}%, black 100%)`;

    return (
        <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl h-full w-full border border-slate-200 bg-white shadow-md">

            <div className="relative" style={{ width: SIZE, height: SIZE }}>

                {/* ── Comet Ring 1: Cyan, clockwise ─────────────────── */}
                <div style={{
                    position: 'absolute',
                    top: CY - R1, left: CX - R1,
                    width: R1 * 2, height: R1 * 2,
                    borderRadius: '50%',
                    background: '#fca5a5 ',
                    WebkitMaskImage: mask1,
                    maskImage: mask1,
                    animation: 'dl-spin-cw 3s linear infinite',
                }}>
                    <div style={{
                        position: 'absolute',
                        width: DOT, height: DOT,
                        background: '#fca5a5',
                        top: R1 - DOT / 2,
                        right: -DOT / 2,
                    }} />
                </div>

                {/* ── Comet Ring 2: Fuchsia, counter-clockwise ──────── */}
                <div style={{
                    position: 'absolute',
                    top: CY - R2, left: CX - R2,
                    width: R2 * 2, height: R2 * 2,
                    background: '#b91c1c',
                    WebkitMaskImage: mask2,
                    maskImage: mask2,
                    animation: 'dl-spin-ccw 4s linear infinite',
                }}>
                    <div style={{
                        position: 'absolute',
                        width: DOT, height: DOT,
                        background: '#b91c1c',
                        top: R2 - DOT / 2,
                        right: -DOT / 2,
                    }} />
                </div>

                {/* ── Main SVG progress ring ─────────────────────────── */}
                <svg width={SIZE} height={SIZE}
                    style={{ position: 'absolute', top: 0, left: 0 }}>
                    <defs>
                        <linearGradient id="dlGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#fca5a5" />
                            <stop offset="100%" stopColor="#b91c1c" />
                        </linearGradient>
                        <filter id="dlGlow" x="-25%" y="-25%" width="150%" height="150%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    {/* Background track */}
                    <circle cx={CX} cy={CY} r={R}
                        fill="none" stroke="#fecaca" strokeWidth={STROKE} />
                    {/* Progress arc */}
                    <circle cx={CX} cy={CY} r={R}
                        fill="none"
                        stroke="url(#dlGrad)"
                        strokeWidth={STROKE}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        transform={`rotate(-90 ${CX} ${CY})`}
                        style={{ transition: 'stroke-dashoffset 0.08s linear' }}
                    />
                </svg>

                {/* ── Center content ─────────────────────────────────── */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    textAlign: 'center', pointerEvents: 'none', width: '75%',
                }}>
                    <div className="flex flex-col items-center gap-0.5 justify-center">
                        <span style={{ fontSize: 'clamp(1.5rem, 8vw, 3rem)', fontWeight: 900, lineHeight: 1, color: '#b91c1c' }}>
                            {downloadedMb}
                        </span>
                        <span style={{ color: '#111111', fontWeight: 900, fontSize: 'clamp(0.65rem, 3vw, 1.1rem)' }}>/ {totalMb} MB</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-2 sm:mt-3">
                        <Download className="w-3 h-3 sm:w-4 sm:h-4 text-red-900 animate-bounce" />
                        <span style={{ color: '#111111', fontSize: 'clamp(0.6rem, 2.5vw, 0.875rem)', fontWeight: 600 }}>{speed} MB/s</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between w-full px-1 sm:px-2">
                <span className="text-gray-700 text-[11px] sm:text-xs">ETA: {eta}</span>
                <span className="text-gray-700 text-[11px] sm:text-xs">{progress}% Complete</span>
            </div>
        </div>
    );
}

function StatusMessage({ status, message }) {
    if (status === 'success') return (
        <div className="bg-emerald-50 border  border-emerald-200 text-emerald-700 p-6 rounded-2xl flex items-start gap-3">
            <CheckCircle className="w-8 h-8 shrink-0 mt-0.5" />

            <p className="text-sm font-medium break-all min-w-0">
                {message}
            </p>
        </div>
    );
    if (status === 'error') return (
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-8 h-8 shrink-0 mt-0.5" />
            <p className="text-sm font-medium break-all min-w-0">{message}</p>
        </div>
    );
    return null;
}

function StepCard({ step, index }) {
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rotateY = ((x - cx) / cx) * 12;
        const rotateX = -((y - cy) / cy) * 12;
        setTilt({ x: rotateX, y: rotateY });
        setSpotlight({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 1 });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
        setSpotlight(s => ({ ...s, opacity: 0 }));
    };

    return (
        <div
            key={index}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative p-5 sm:p-6 h-[32vh] sm:h-[36vh] md:h-[40vh] bg-white shadow-md rounded-2xl border border-gray-200 flex flex-col items-center justify-center text-center transition-shadow hover:shadow-xl overflow-hidden"
            style={{
                transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.03)`,
                transition: 'transform 0.15s ease, box-shadow 0.3s ease',
            }}
        >
            {/* Red spotlight overlay */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, rgba(220,38,38,0.18) 0%, transparent 65%)`,
                    opacity: spotlight.opacity,
                    transition: 'opacity 0.25s ease',
                    pointerEvents: 'none',
                    borderRadius: 'inherit',
                }}
            />
            <img src={step.Image} alt={`Step ${step.number}`} className="w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 relative z-10" />
            <h3 className="font-extrabold text-base sm:text-lg text-gray-700 cursor-default relative z-10">
                {step.title}
            </h3>
            <p className="text-[12px] sm:text-[13px] text-gray-600 mt-1 cursor-default relative z-10">
                {step.description}
            </p>
        </div>
    );
}

export default function App() {
    const navigate = useNavigate();
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState('idle');
    const [videoInfo, setVideoInfo] = useState(null);
    const [selectedFormat, setSelectedFormat] = useState('');
    const [message, setMessage] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [downloadStats, setDownloadStats] = useState({ progress: 0, speed: '0.0', eta: 'Calculating...', totalMb: '?', downloadedMb: '0.0' });
    useEffect(() => {
        document.documentElement.classList.remove('dark');
    }, []);


    //ui
    const steps = [
        {
            number: '1',
            Image: 'upload-h.svg',
            title: 'Paste the URL',
            description: 'Copy any YouTube video link and paste it into the input field above.',
        },
        {
            number: '2',
            Image: 'edit-h.svg',
            title: 'Choose Format',
            description: 'Pick your preferred quality — from audio-only MP3 to full HD MP4.',
        },
        {
            number: '3',
            Image: 'download-h.svg',
            title: 'Download',
            description: 'Hit Download and the file saves directly to your device instantly.',
        },
    ];

    const handleFetchInfo = async (e) => {
        e.preventDefault();
        if (!url) return;
        setStatus('fetching');
        try {
            const data = await fetchVideoInfo(url);
            setVideoInfo(data);
            if (data.formats?.length > 0) setSelectedFormat(data.formats[0].format_id);
            setStatus('selecting');
        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Could not connect to the backend server.');
        }
    };

    const handleDownload = async () => {
        setStatus('downloading');
        const selectedFmt = videoInfo?.formats?.find(f => f.format_id === selectedFormat);
        const rawSize = parseFloat(selectedFmt?.filesize_mb);
        const numericTotalMb = !isNaN(rawSize) && rawSize > 0 ? rawSize : null;
        const totalMbLabel = numericTotalMb ? numericTotalMb.toFixed(1) : '?';
        setDownloadStats({ progress: 0, speed: '0.0', eta: 'Calculating...', totalMb: totalMbLabel, downloadedMb: '0.0' });

        let simProgress = 0;
        const simInterval = setInterval(() => {
            simProgress = Math.min(simProgress + Math.random() * 4 + 0.5, 99);
            const spd = (1.5 + Math.random() * 7).toFixed(1);
            const remainingSecs = Math.round(((100 - simProgress) / parseFloat(spd)) * 10);
            const mins = Math.floor(remainingSecs / 60);
            const secs = remainingSecs % 60;
            const eta = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
            const downloadedMb = numericTotalMb
                ? (simProgress / 100 * numericTotalMb).toFixed(1)
                : (simProgress / 10).toFixed(1);
            setDownloadStats({ progress: Math.round(simProgress), speed: spd, eta, totalMb: totalMbLabel, downloadedMb });
        }, 500);

        try {
            const response = await downloadVideo(url, selectedFormat);
            clearInterval(simInterval);
            setDownloadStats({ progress: 100, speed: '0.0', eta: '0s', totalMb: totalMbLabel, downloadedMb: totalMbLabel });
            const disposition = response.headers.get('Content-Disposition');
            let filename = 'download';
            const match = disposition?.match(/filename="([^"]+)"/);
            if (match) filename = match[1];
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl; a.download = filename;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
            setStatus('success');
            setMessage(`"${filename}" saved to your Downloads folder.`);
        } catch (err) {
            clearInterval(simInterval);
            setStatus('error');
            setMessage(err.message || 'Download request failed.');
        }
    };

    const resetForm = () => { setUrl(''); setVideoInfo(null); setStatus('idle'); setMessage(''); setDownloadStats({ progress: 0, speed: '0.0', eta: 'Calculating...', totalMb: '?', downloadedMb: '0.0' }); };

    const showStep1 = ['idle', 'fetching', 'error'].includes(status);
    const showStep2 = ['selecting', 'downloading', 'success'].includes(status) && videoInfo;

    return (
        <div className="min-h-screen flex flex-col bg-white text-slate-900 font-display">

            {/* ── Sticky Top Nav ───────────────────────────────────── */}
            <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Brand */}
                    <div className="flex items-center gap-2 sm:gap-2.5 text-text-main">
                        <span className="text-primary"><Logo className="size-6 sm:size-7" /></span>
                        <span className="text-lg sm:text-xl font-extrabold tracking-tight">SecureDL</span>
                    </div>

                    {/* Desktop Nav + CTA */}
                    <div className="hidden md:flex items-center gap-6">
                        <nav className="flex items-center gap-8">
                            {[
                                { label: 'How It Works', href: '#how-to-use' },
                                { label: '🌟 GitHub', href: 'https://github.com/Aditya-567' },
                            ].map(({ label, href }) => (
                                <a key={label} href={href}
                                    className="text-text-sub hover:text-primary text-sm font-semibold transition-colors">
                                    {label}
                                </a>
                            ))}
                        </nav>
                        <button className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2.5 px-6 rounded transition-all shadow-md hover:shadow-lg">
                            Get Started
                        </button>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        onClick={() => setMobileMenuOpen(o => !o)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-100 mt-3 pt-3 pb-2 flex flex-col gap-1 px-4">
                        {[
                            { label: 'How It Works', href: '#how-to-use' },
                            { label: '🌟 GitHub', href: 'https://github.com/Aditya-567' },
                        ].map(({ label, href }) => (
                            <a key={label} href={href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-text-sub hover:text-primary text-sm font-semibold py-2 transition-colors">
                                {label}
                            </a>
                        ))}
                        <button className="mt-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2.5 px-6 rounded transition-all w-full">
                            Get Started
                        </button>
                    </div>
                )}
            </header>


            {/* Hero */}
            <section className="flex-1 flex flex-col items-center justify-start pt-10 sm:pt-16 md:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 w-full mx-auto">

                <div className="flex flex-col items-center justify-center w-full text-center relative max-w-5xl">
                    <h1
                        className="font-extrabold leading-[1.1] tracking-tighter text-[#353935] mb-4"
                        style={{
                            fontSize: 'clamp(2.2rem, 10vw, 5rem)',
                            WebkitTextStroke: 'clamp(1px, 0.5vw, 5px) currentColor',
                            paintOrder: 'stroke fill',
                            letterSpacing: '0.01em',
                        }}>
                        Extract Any{' '}
                        <span
                            className="text-white px-3 sm:px-6 py-1 bg-red-600 shadow-xl inline-block relative overflow-hidden"
                            style={{
                                WebkitTextStroke: 'clamp(1px, 0.4vw, 4px) currentColor',
                                paintOrder: 'stroke fill',
                            }}
                        >
                            Stream!
                            <span className="shine-sweep" aria-hidden="true" />
                        </span>
                        {' '}Instantly.
                    </h1>

                </div>



                {/* Step 1 — Nested Gradient Border Card */}
                {showStep1 && (
                    <div className="w-full flex flex-col items-center justify-center  ">
                        <div className="mt-8 w-full  md:w-[85%] lg:w-[75%]  rounded-t-[40px] md:rounded-t-[80px] px-[4px] md:px-[6px] pt-[4px] md:pt-[6px] bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600  animate-in slide-in-from-bottom-8 duration-700">
                            <div className="rounded-t-[36px] md:rounded-t-[74px] px-[4px] md:px-[6px] pt-[4px] md:pt-[6px] bg-gradient-to-r from-purple-500 via-pink-300 to-purple-500">
                                <div className="rounded-t-[32px] md:rounded-t-[68px] px-[4px] md:px-[6px] pt-[4px] md:pt-[6px] bg-gradient-to-r from-purple-400 via-orange-200 to-purple-400">
                                    <div className="rounded-t-[28px] md:rounded-t-[62px] px-[4px] md:px-[6px] pt-[4px] md:pt-[6px] bg-gradient-to-r from-purple-300 via-pink-200 to-purple-300">
                                        <div className="rounded-t-[24px] md:rounded-t-[56px] px-[4px] md:px-[6px] pt-[4px] md:pt-[6px] bg-gradient-to-r from-purple-200 via-pink-100 to-purple-200">
                                            <div className="rounded-t-[20px] md:rounded-t-[50px] bg-white p-6 md:p-10  border-b-0 min-h-[200px] flex items-center justify-center">
                                                <div className="w-full flex flex-col gap-6 text-center items-center ">
                                                    <div className="w-full flex flex-col gap-5">
                                                        <UrlInputForm url={url} setUrl={setUrl} status={status} onSubmit={handleFetchInfo} />
                                                        {status === 'error' && (
                                                            <div className="w-full max-w-3xl mx-auto mt-2 animate-in fade-in duration-300">
                                                                <StatusMessage status={status} message={message} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Marquee */}

                        <Marquee speed={28} />

                    </div>
                )}

                {/* Step 2 — Download Configuration Screen */}
                {showStep2 && (
                    <div className="mt-8 w-full  lg:w-[85%] flex flex-col gap-6 text-left animate-in fade-in zoom-in-95 duration-500">

                        <div className="flex items-center justify-center">
                            <p className="text-sm tracking-wide text-[#353935] leading-8 text-center mb-2">
                                Here you can view the video information and all available download formats.
                                Both <strong>audio-only</strong> and <strong>video + audio</strong> options are provided,
                                including multiple resolutions.
                                <br />
                                The video preview is displayed on the right side.
                                <span className="text-white px-4 py-1 font-bold bg-red-500 ml-1">
                                    Select your preferred option and click Download!
                                </span>
                            </p>
                        </div>
                        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-stretch">



                            {/* Left: Video Preview & Actions */}
                            <div className="flex-1 lg:flex-[3] flex flex-col gap-4 min-w-0">
                                <VideoPreviewCard videoInfo={videoInfo} />

                                {status === 'selecting' && (
                                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                                        <button
                                            onClick={resetForm}
                                            className="w-full sm:w-auto sm:flex-1 bg-white border border-slate-300 shadow-md text-slate-700 font-bold py-3.5 px-4 rounded-xl text-sm hover:border-slate-400 transition-colors"
                                        >
                                            ← Back
                                        </button>
                                        <button
                                            onClick={handleDownload}
                                            className="w-full sm:flex-[2] active:scale-95 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(124,58,237,0.39)] transition-all hover:shadow-[0_6px_20px_rgba(124,58,237,0.23)] hover:opacity-90"
                                            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}
                                        >
                                            <Download className="w-4 h-4" /> Download Now
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Right: Format Options Grid / Progress */}
                            <div className="flex-1 lg:flex-[2] min-w-0 flex flex-col">
                                {status === 'selecting' && (
                                    <FormatSelector
                                        formats={videoInfo.formats}
                                        selectedFormat={selectedFormat}
                                        onChange={setSelectedFormat}
                                    />
                                )}
                                {status === 'downloading' && (
                                    <div className="h-full flex items-center">
                                        <DownloadProgress
                                            progress={downloadStats.progress}
                                            speed={downloadStats.speed}
                                            eta={downloadStats.eta}
                                            totalMb={downloadStats.totalMb}
                                            downloadedMb={downloadStats.downloadedMb}
                                        />
                                    </div>
                                )}
                                {status === 'success' && (
                                    <div className="flex flex-col gap-4 h-full justify-start animate-in fade-in duration-500">
                                        <StatusMessage status={status} message={message} />
                                        <button
                                            onClick={resetForm}
                                            className="w-full bg-purple-50 border border-slate-500 shadow-mdtext-purple-700 font-bold py-3.5 rounded-xl text-sm hover:bg-purple-100 transition-colors"
                                        >
                                            Download Another File
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </section>

            <div id="how-to-use" className="w-[92%] sm:w-[86%] md:w-[80%] mx-auto mt-16 sm:mt-24 md:mt-[100px] mb-8 sm:mb-[50px] border border-gray-300 p-4 sm:p-6 md:p-8 pb-10 sm:pb-14 md:pb-16 rounded-2xl">
                <div className="text-center mb-4 mt-3 sm:mt-6 cursor-default">
                    <h2
                        className="w-full mx-auto text-center font-extrabold tracking-tight leading-tight text-[#444]"
                        style={{
                            fontSize: 'clamp(1.5rem, 5vw, 3rem)',
                            WebkitTextStroke: 'clamp(1px, 0.3vw, 2.5px) currentColor',
                            paintOrder: 'stroke fill',
                            letterSpacing: '0.01em',
                        }}>
                        Download Videos in{' '}
                        <span className="text-white bg-red-600 px-3 sm:px-5 py-1 sm:py-2 inline-block">3 Simple Steps ...</span>
                    </h2>
                </div>

                {/* Progress dots — hidden on very small screens */}
                <div className="hidden sm:flex justify-between mx-8 md:mx-24 lg:mx-52 relative mt-6 mb-12 sm:mb-16 md:mb-20">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="text-xl flex items-center justify-center font-extrabold text-white bg-purple-700 w-5 h-5 sm:w-7 sm:h-7 rounded-full z-10">
                            <div className="w-2.5 h-2.5 sm:w-4 sm:h-4 bg-white rounded-full"></div>
                        </div>
                    ))}
                    <div className="py-[2.5px] rounded-full bg-purple-700 w-full absolute z-0 top-2 sm:top-3"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-10 justify-items-center max-w-4xl mx-auto w-full">

                    {steps.map((step, index) => (
                        <StepCard key={index} step={step} index={index} />
                    ))}
                </div>
            </div>


            <Contact />


            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.3); border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(156, 163, 175, 0.5); }
                .shine-sweep {
                    position: absolute;
                    top: 0;
                    left: -75%;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%);
                    transform: skewX(-20deg);
                    animation: shine-sweep 2.2s ease-in-out infinite;
                }
                @keyframes shine-sweep {
                    0%   { left: -75%; }
                    60%  { left: 125%; }
                    100% { left: 125%; }
                }
                @keyframes dl-spin-cw  { to { transform: rotate( 360deg); } }
                @keyframes dl-spin-ccw { to { transform: rotate(-360deg); } }
            `}} />
        </div>
    );
}