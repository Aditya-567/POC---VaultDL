import { Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';

const STAGES = [
    { key: 'ws', label: 'Connected to server' },
    { key: 'aria2', label: 'aria2c launched' },
    { key: 'peers', label: 'Connecting to peers' },
    { key: 'download', label: 'Downloading via P2P' },
    { key: 'complete', label: 'Torrent download complete' },
    { key: 'preparing', label: 'Preparing file' },
    { key: 'ready', label: 'Browser download triggered' },
];

export default function TorrentDownloader() {
    const [magnetLink, setMagnetLink] = useState('');
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [currentStage, setCurrentStage] = useState(null);
    const [doneStages, setDoneStages] = useState([]);
    const [log, setLog] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [downloadSpeed, setDownloadSpeed] = useState('');
    const [downloadedSize, setDownloadedSize] = useState('');
    const [totalSize, setTotalSize] = useState('');
    const [seeds, setSeeds] = useState(0);
    const [peers, setPeers] = useState(0);
    const wsRef = useRef(null);
    const [focused, setFocused] = useState(false);

    const addLog = (text, type = 'info') =>
        setLog(prev => [...prev, { text, type, time: new Date().toLocaleTimeString() }]);
    const markDone = (key) =>
        setDoneStages(prev => prev.includes(key) ? prev : [...prev, key]);

    const handleDownload = async (e) => {
        e.preventDefault();
        if (!magnetLink.startsWith('magnet:')) {
            setErrorMessage('Please enter a valid magnet link starting with "magnet:?"');
            return;
        }

        // Reset state
        setStatus('active');
        setProgress(0);
        setErrorMessage('');
        setLog([]);
        setDoneStages([]);
        setCurrentStage('ws');
        setDownloadSpeed('');
        setDownloadedSize('');
        setTotalSize('');
        setSeeds(0);
        setPeers(0);
        const clientId = Date.now().toString();

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${wsProtocol}//${window.location.host}/api/ws/progress/${clientId}`);
        wsRef.current = ws;

        ws.onopen = () => {
            addLog('WebSocket connected to server', 'success');
            markDone('ws');
            setCurrentStage('aria2');

            // Fire the POST — the server will stream progress via WebSocket
            fetch('/api/download-magnet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ magnet_link: magnetLink, client_id: clientId }),
            }).catch(err => {
                setStatus('error');
                setErrorMessage(err.message);
                addLog(`Fetch error: ${err.message}`, 'error');
                ws.close();
            });
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.status === 'connecting') {
                const msg = data.message || 'Connecting to peers...';
                addLog(msg, 'info');
                markDone('aria2');
                if (msg.toLowerCase().includes('launched') || msg.toLowerCase().includes('aria2')) {
                    setCurrentStage('peers');
                } else {
                    setCurrentStage('peers');
                }

            } else if (data.status === 'downloading') {
                markDone('aria2');
                markDone('peers');
                setCurrentStage('download');
                setProgress(data.progress);
                if (data.speed !== undefined) setDownloadSpeed(data.speed);
                if (data.downloaded !== undefined) setDownloadedSize(data.downloaded);
                if (data.total !== undefined) setTotalSize(data.total);
                if (data.seeds !== undefined) setSeeds(data.seeds);
                if (data.peers !== undefined) setPeers(data.peers);
                if (data.progress % 10 === 0 && data.progress > 0) {
                    addLog(`Download progress: ${data.progress}%`, 'info');
                }

            } else if (data.status === 'processing') {
                markDone('download');
                markDone('complete');
                setCurrentStage('preparing');
                setProgress(100);
                addLog('Torrent fully downloaded! Preparing file...', 'success');

            } else if (data.status === 'ready') {
                markDone('preparing');
                setCurrentStage('ready');
                addLog(`File ready: ${data.filename}`, 'success');
                addLog('Triggering browser download...', 'info');

                // Native browser download — no blob buffering, goes straight to download bar
                const a = document.createElement('a');
                a.href = `/api/file/${data.token}`;
                a.download = data.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                markDone('ready');
                setStatus('done');
                ws.close();
            }
        };

        ws.onerror = () => {
            addLog('WebSocket connection error', 'error');
        };
    };

    const stageState = (key) => {
        if (doneStages.includes(key)) return 'done';
        if (currentStage === key) return 'active';
        return 'pending';
    };

    return (
        <div className="w-full  text-[#1a1a1a]">


            <form onSubmit={handleDownload} className="flex gap-2 ">
                <div className={`flex flex-col w-full sm:flex-row sm:items-center gap-3 border rounded-xl border-[#353935]/50 py-1.5 pr-1.5 pl-3 transition-colors duration-300 ${focused ? 'border-purple-400' : ''}`}>

                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="material-symbols-outlined text-xl sm:text-2xl text-red-500 shrink-0 select-none">link</span>

                        <input
                            type="text"
                            placeholder="magnet:?xt=urn:btih:..."
                            value={magnetLink}
                            onChange={(e) => setMagnetLink(e.target.value)}
                            className="flex-1 min-w-0 w-full border-none outline-none font-mono focus:outline-none focus:ring-0 bg-transparent text-[#666] placeholder-slate-400 text-base sm:text-lg font-medium [&:invalid]:shadow-none"
                            disabled={status === 'active'}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={status === 'active' || !magnetLink.trim()}
                        className={`w-full sm:w-auto outline-none focus:outline-none disabled:opacity-40 disabled:bg-gray-300 disabled:cursor-not-allowed border border-slate-900 text-slate-900 bg-transparent hover:bg-slate-900 hover:text-white font-extrabold text-sm sm:text-base tracking-wide px-6 sm:px-10 md:px-16 py-3 sm:py-3.5 md:py-4 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${status === 'active' ? 'bg-[#aaa] cursor-not-allowed' : 'bg-gray-200 cursor-pointer'
                            }`}
                    >
                        {status === 'active' ? <><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> Working...</> : 'Download'}
                    </button>
                </div>
            </form>

            {errorMessage && (
                <div className="text-[#c00] mb-5 p-3 bg-[#fff0f0] rounded-md border border-[#fcc]">
                    <strong>Error:</strong> {errorMessage}
                </div>
            )}
            <div className='flex flex-row mt-6 gap-4 w-full'>
                {/* Stage tracker */}
                {status !== 'idle' && (
                    <div className="border border-[#e8e8e8] rounded-lg overflow-hidden mb-5 w-[50%]">
                        {STAGES.map((stage, i) => {
                            const s = stageState(stage.key);
                            return (
                                <div key={stage.key} className={`flex items-center gap-3 px-3.5 py-2.5 ${s === 'active' ? 'bg-[#f0f7ff]' : 'bg-white'
                                    } ${i < STAGES.length - 1 ? 'border-b border-[#f0f0f0]' : ''}`}>
                                    <span className="text-base w-5 text-center shrink-0">
                                        {s === 'done' ? '✅' : s === 'active' ? '⏳' : '⬜'}
                                    </span>
                                    <span className={`text-sm flex-1 ${s === 'pending' ? 'text-[#bbb]' :
                                        s === 'active' ? 'text-[#0057b8] font-semibold' : 'text-[#222]'
                                        }`}>
                                        {stage.label}
                                    </span>
                                    {stage.key === 'download' && s === 'active' && (
                                        <span className="text-[13px] text-[#0057b8] font-bold">{progress}%</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}


                {/* Activity log */}
                {log.length > 0 && (
                    <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-3 max-h-[316px] overflow-y-auto w-[50%]">
                        <div className="text-[10px] font-bold text-[#666] mb-2 uppercase tracking-[1px]">
                            Activity Log
                        </div>
                        {log.map((entry, i) => (
                            <div key={i} className={`text-xs font-mono py-0.5 flex gap-2.5 ${entry.type === 'error' ? 'text-[#ff6b6b]' :
                                entry.type === 'success' ? 'text-[#6bcb77]' : 'text-[#aaa]'
                                }`}>
                                <span className="text-[#555] shrink-0">{entry.time}</span>
                                <span>{entry.type === 'success' ? '✓' : entry.type === 'error' ? '✗' : '›'} {entry.text}</span>
                            </div>
                        ))}
                    </div>
                )}

            </div>

            {/* Progress bar */}
            {status === 'active' && (
                <div className="mb-5 mt-4">
                    <div className="w-full bg-[#e8e8e8] rounded-lg overflow-hidden h-[22px]">
                        {currentStage !== 'download' ? (
                            <div className="indi-bar w-full h-full" />
                        ) : (
                            <div
                                style={{ width: `${progress}%` }}
                                className={`h-full flex items-center justify-center text-white text-[11px] font-bold transition-[width] duration-[400ms] ease-in-out ${progress === 100 ? 'bg-[#28a745]' : 'bg-[#007BFF]'
                                    }`}
                            >
                                {progress > 8 ? `${progress}%` : ''}
                            </div>
                        )}
                    </div>
                    {currentStage === 'download' && (downloadSpeed || downloadedSize) && (
                        <div className="flex justify-between items-center mt-1.5 text-xs font-mono text-[#555]">
                            <span>
                                {downloadedSize && totalSize
                                    ? `${downloadedSize.replace('GiB', 'GB').replace('MiB', 'MB').replace('KiB', 'KB')} / ${totalSize.replace('GiB', 'GB').replace('MiB', 'MB').replace('KiB', 'KB')}`
                                    : downloadedSize}
                            </span>
                            <span className="text-[#888]">
                                Seeds: <span className="font-semibold text-[#28a745]">{seeds}</span>
                                {' · '}
                                Peers: <span className="font-semibold text-[#e0a800]">{peers}</span>
                            </span>
                            {downloadSpeed && (
                                <span className="font-semibold text-[#007BFF]">
                                    {downloadSpeed}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}



            {status === 'done' && (
                <div className="text-[#186e00] mt-4 font-semibold text-[15px]">
                    ✅ Download complete! Check your downloads folder. If the file doesn't appear, please check your browser's download bar or settings.
                </div>
            )}

            <style>{`
                .indi-bar {
                    background: linear-gradient(90deg, #007BFF 0%, #66b2ff 40%, #007BFF 80%);
                    background-size: 300% 100%;
                    animation: indi 1.4s linear infinite;
                }
                @keyframes indi {
                    from { background-position: 200% 0 }
                    to   { background-position: -200% 0 }
                }
            `}</style>
        </div>
    );
}