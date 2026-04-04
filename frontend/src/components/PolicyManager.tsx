import { useEffect, useState } from "react";

import API from "../lib/api";

export default function PolicyManager() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/policy/preview`)
      .then(r => r.json())
      .then(d => { setPreview(d.preview); setWordCount(d.word_count); });
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true); setError(""); setSuccess("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API}/policy/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setSuccess(`Policy updated — ${data.word_count.toLocaleString()} words loaded.`);
      setWordCount(data.word_count);
      setFile(null);
      // refresh preview
      const prev = await fetch(`${API}/policy/preview`).then(r => r.json());
      setPreview(prev.preview);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Upload card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-1">Upload Company Policy</h2>
        <p className="text-xs text-slate-500 mb-5">
          Replace the current policy document. Upload your company's Travel & Expense Policy as a <strong>.txt</strong> or <strong>.pdf</strong> file.
          The AI audit engine will immediately use the new policy for all future claims.
        </p>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-emerald-400 hover:bg-slate-50 transition-all cursor-pointer">
            <input type="file" accept=".txt,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-emerald-700 font-medium">{file.name}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-slate-400 hover:text-slate-600 text-xs ml-1">✕</button>
              </div>
            ) : (
              <div>
                <svg className="w-9 h-9 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-slate-500 font-medium">Click to upload policy document</p>
                <p className="text-xs text-slate-400 mt-1">Supported: .txt, .pdf</p>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">✓ {success}</p>}

          <button type="submit" disabled={!file || uploading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-md transition-colors text-sm">
            {uploading ? "Processing..." : "Upload & Activate Policy"}
          </button>
        </form>
      </div>

      {/* Current policy preview */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Current Policy</h3>
          <span className="text-xs text-slate-400">{wordCount.toLocaleString()} words</span>
        </div>
        <pre className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-4 overflow-auto max-h-64 whitespace-pre-wrap leading-relaxed">
          {preview || "No policy loaded."}
        </pre>
      </div>
    </div>
  );
}
