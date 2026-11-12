import { useState, useRef, useCallback } from 'react';

/**
 * SpeechInput — wraps any text input with a microphone button.
 * Uses the Web Speech API (SpeechRecognition).
 *
 * Props:
 *   value, onChange — controlled input props
 *   name, placeholder, className — passed to the input
 *   onTranscript(text) — called with the recognised text (appended to current value)
 */
export default function SpeechInput({
  value,
  onChange,
  name,
  placeholder,
  className = '',
  onTranscript,
  inputMode,
  maxLength,
  type = 'text',
}) {
  const [listening, setListening] = useState(false);
  const [error, setError]         = useState('');
  const recogRef = useRef(null);

  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(() => {
    if (!supported) { setError('Speech recognition not supported in this browser.'); return; }
    setError('');

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SR();
    recog.lang = 'en-IN';
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recogRef.current = recog;

    recog.onstart  = () => setListening(true);
    recog.onend    = () => setListening(false);
    recog.onerror  = (e) => { setListening(false); setError(`Speech error: ${e.error}`); };
    recog.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      const syntheticEvent = { target: { name, value: (value ? value + ' ' : '') + transcript } };
      onChange?.(syntheticEvent);
      onTranscript?.(transcript);
    };

    recog.start();
  }, [supported, name, value, onChange, onTranscript]);

  const stopListening = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
  }, []);

  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
          className={`${className} pr-10`}
        />
        {supported && (
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            title={listening ? 'Stop listening' : 'Speak to fill this field'}
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200
              ${listening
                ? 'bg-red-500 text-white animate-pulse2 shadow-md'
                : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
              }`}
          >
            {listening ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {listening && (
        <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 animate-fade-in">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping2 inline-block" />
          Listening… speak now
        </p>
      )}
      {error && <p className="text-xs text-red-500 animate-fade-in">{error}</p>}
    </div>
  );
}
