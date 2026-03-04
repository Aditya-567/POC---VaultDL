import { AlertCircle, CheckCircle, Download, Loader2, PlaySquare, Search } from 'lucide-react';
import { useState } from 'react';

export default function App() {
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState('idle'); // idle, fetching, selecting, downloading, success, error
    const [videoInfo, setVideoInfo] = useState(null);
    const [selectedFormat, setSelectedFormat] = useState('');
    const [message, setMessage] = useState('');

    // When deployed behind a reverse proxy, this will just be '/api'
    const API_BASE = 'http://localhost:8000/api';

    // --- STEP 1: Fetch Video Info & Formats ---
    const handleFetchInfo = async (e) => {
        e.preventDefault();
        if (!url) return;

        setStatus('fetching');
        setMessage('Analyzing video links securely...');

        try {
            const response = await fetch(`${API_BASE}/info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Failed to fetch video info');

            setVideoInfo(data);
            // Auto-select the first format (Best Audio MP3) by default
            if (data.formats && data.formats.length > 0) {
                setSelectedFormat(data.formats[0].format_id);
            }
            setStatus('selecting');

        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Could not connect to the backend server.');
        }
    };

    // --- STEP 2: Download file and trigger browser save dialog ---
    const handleDownload = async () => {
        setStatus('downloading');
        setMessage('Downloading... please wait, large files may take a moment.');

        try {
            const response = await fetch(`${API_BASE}/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, format_id: selectedFormat }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Download failed on server.');
            }

            // Read filename from the Content-Disposition header
            const disposition = response.headers.get('Content-Disposition');
            let filename = 'download';
            if (disposition) {
                const match = disposition.match(/filename="([^"]+)"/);
                if (match) filename = match[1];
            }

            // Convert response to a blob and trigger browser's save dialog
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);

            setStatus('success');
            setMessage(`"${filename}" downloaded successfully! Check your Downloads folder.`);

        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Download request failed.');
        }
    };

    // --- UI RESET ---
    const resetForm = () => {
        setUrl('');
        setVideoInfo(null);
        setStatus('idle');
        setMessage('');
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-200">
            <div className="max-w-xl w-full bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">

                {/* Header */}
                <div className="bg-slate-800 p-6 border-b border-slate-700 text-center relative">
                    <div className="mx-auto bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Download className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Secure Downloader Node</h1>
                    <p className="text-slate-400 text-sm mt-1">Encrypted Backend Link</p>
                </div>

                <div className="p-6">

                    {/* STEP 1 UI: URL Input Form */}
                    {(status === 'idle' || status === 'fetching' || status === 'error') && (
                        <form onSubmit={handleFetchInfo} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Target URL</label>
                                <input
                                    type="url"
                                    required
                                    placeholder="Paste link here..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    disabled={status === 'fetching'}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'fetching' || !url}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {status === 'fetching' ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Bypassing & Analyzing...</>
                                ) : (
                                    <><Search className="w-5 h-5" /> Analyze Formats</>
                                )}
                            </button>
                        </form>
                    )}

                    {/* STEP 2 UI: Video Info & Format Selection */}
                    {(status === 'selecting' || status === 'downloading' || status === 'success') && videoInfo && (
                        <div className="space-y-6">

                            {/* Video Preview Card */}
                            <div className="flex gap-4 bg-slate-900 p-4 rounded-xl border border-slate-700">
                                {videoInfo.thumbnail ? (
                                    <img src={videoInfo.thumbnail} alt="Thumbnail" className="w-32 h-20 object-cover rounded-lg" />
                                ) : (
                                    <div className="w-32 h-20 bg-slate-800 rounded-lg flex items-center justify-center">
                                        <PlaySquare className="w-8 h-8 text-slate-600" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white truncate text-lg" title={videoInfo.title}>
                                        {videoInfo.title || "Unknown Title"}
                                    </h3>
                                    <p className="text-slate-400 text-sm mt-1">Duration: {videoInfo.duration}</p>
                                </div>
                            </div>

                            {/* Format Dropdown */}
                            {status === 'selecting' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Select Target Format</label>
                                    <select
                                        value={selectedFormat}
                                        onChange={(e) => setSelectedFormat(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                    >
                                        {videoInfo.formats.map((fmt, idx) => (
                                            <option key={`${fmt.format_id}-${idx}`} value={fmt.format_id}>
                                                {fmt.resolution !== 'Audio' ? `[${fmt.resolution}] ` : ''}
                                                {fmt.type} • {fmt.ext.toUpperCase()} • {fmt.filesize_mb} MB
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                {status === 'selecting' && (
                                    <button
                                        onClick={resetForm}
                                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}

                                {status !== 'success' && (
                                    <button
                                        onClick={handleDownload}
                                        disabled={status === 'downloading'}
                                        className="flex-[2] bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {status === 'downloading' ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Starting Download...</>
                                        ) : (
                                            <><Download className="w-5 h-5" /> Download Now</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Status Messages */}
                    {status === 'success' && (
                        <div className="mt-6 space-y-4">
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-sm leading-relaxed">{message}</p>
                            </div>
                            <button
                                onClick={resetForm}
                                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-all"
                            >
                                Download Another
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="mt-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-sm leading-relaxed">{message}</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}