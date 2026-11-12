import { useState, useRef, useCallback } from 'react';

/**
 * Drag & Drop file upload zone.
 * Props:
 *   onFiles(files: File[]) — called when files are dropped or selected
 *   accept — MIME types string e.g. "image/*,.pdf"
 *   maxSizeMB — max file size in MB (default 5)
 *   label — zone label text
 */
export default function DragDropUpload({
  onFiles,
  accept = 'image/*,.pdf,.doc,.docx',
  maxSizeMB = 5,
  label = 'Drop files here or click to browse',
}) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles]       = useState([]);
  const [error, setError]       = useState('');
  const inputRef = useRef(null);

  const validate = useCallback((fileList) => {
    const valid = [];
    const maxBytes = maxSizeMB * 1024 * 1024;
    for (const f of fileList) {
      if (f.size > maxBytes) {
        setError(`"${f.name}" exceeds ${maxSizeMB}MB limit.`);
        return [];
      }
      valid.push(f);
    }
    setError('');
    return valid;
  }, [maxSizeMB]);

  const handleFiles = useCallback((fileList) => {
    const valid = validate(Array.from(fileList));
    if (!valid.length) return;
    setFiles(valid);
    onFiles?.(valid);
  }, [validate, onFiles]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  function removeFile(name) {
    const updated = files.filter((f) => f.name !== name);
    setFiles(updated);
    onFiles?.(updated);
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200
          ${dragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.01]'
            : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Upload icon */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
          ${dragging ? 'bg-indigo-100 dark:bg-indigo-800 scale-110' : 'bg-gray-100 dark:bg-white/10'}`}>
          <svg className={`w-7 h-7 transition-colors ${dragging ? 'text-indigo-600' : 'text-gray-400'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        <div className="text-center">
          <p className={`text-sm font-semibold transition-colors ${dragging ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300'}`}>
            {dragging ? '📂 Release to upload' : label}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {accept.replace(/,/g, ', ')} · Max {maxSizeMB}MB per file
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 animate-fade-in">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li key={f.name}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1a1d2e] border border-gray-100 dark:border-white/10 shadow-sm animate-slide-up">
              <span className="text-lg">{f.type.startsWith('image') ? '🖼️' : f.type.includes('pdf') ? '📄' : '📎'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{f.name}</p>
                <p className="text-xs text-gray-400">{(f.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
