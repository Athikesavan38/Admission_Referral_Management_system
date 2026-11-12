import { useState, useRef, useEffect, useCallback } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

// ── Markdown parser ────────────────────────────────────────────────────────────
function parseMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

// ── Role config ────────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  admin: {
    gradient:    'from-[#1e2a78] to-[#3b4fd8]',
    btnGradient: 'from-[#1e2a78] to-[#3b4fd8]',
    avatar:      '🛡️',
    name:        'CIET Admin Assistant',
    subtitle:    'Admin Support · 24/7',
    welcome:     `👋 Hello Admin! I'm your **CIET Admin Assistant**.\n\nI can help you manage referrals, understand analytics, and navigate admin features.\n\nType **help** to see all commands.`,
    quickReplies: ['How to approve?', 'How to reject?', 'Export CSV', 'View analytics', 'Pending referrals'],
    inputPlaceholder: 'Ask admin questions…',
    dotColor: 'bg-blue-400',
  },
  user: {
    gradient:    'from-indigo-600 to-purple-600',
    btnGradient: 'from-indigo-600 to-purple-600',
    avatar:      '🤖',
    name:        'CIET Referral Assistant',
    subtitle:    'User Support · 24/7',
    welcome:     `👋 Hi! I'm your **CIET Referral Assistant**.\n\nI can help you submit referrals, check status, earn credits, and more.\n\nType **help** to see all commands.`,
    quickReplies: ['How to submit?', 'Check status', 'Credits system', 'Leaderboard', 'Upload docs'],
    inputPlaceholder: 'Ask me anything…',
    dotColor: 'bg-emerald-400',
  },
};

function getRoleConfig(role) {
  return ROLE_CONFIG[role] || ROLE_CONFIG.user;
}

// ── Message bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ m, cfg }) {
  const isUser = m.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {!isUser && (
        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-0.5 shadow-sm`}>
          {cfg.avatar}
        </div>
      )}
      <div className="flex flex-col gap-0.5 max-w-[82%]">
        <div className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isUser
            ? `bg-gradient-to-br ${cfg.gradient} text-white rounded-br-sm`
            : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 rounded-bl-sm'
        }`}>
          <span dangerouslySetInnerHTML={{ __html: parseMarkdown(m.text) }} />
        </div>
        <p className={`text-[10px] text-gray-400 dark:text-gray-500 ${isUser ? 'text-right' : 'text-left'} px-1`}>
          {new Date(m.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// ── Main chatbot ───────────────────────────────────────────────────────────────
export default function AIChatbot() {
  const { token, user } = useAuth();
  const role = user?.role || 'user';
  const cfg  = getRoleConfig(role === 'admin' ? 'admin' : 'user');

  const [open, setOpen]         = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: cfg.welcome, time: new Date().toISOString() }
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [unread, setUnread]     = useState(0);
  const [history, setHistory]   = useState([]); // input history for ↑↓ nav
  const [histIdx, setHistIdx]   = useState(-1);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!open && messages.length > 1) setUnread((p) => p + 1);
  }, [messages]);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [open]);

  if (!token) return null;

  async function send(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setHistIdx(-1);
    setHistory((p) => [msg, ...p].slice(0, 20));
    setMessages((prev) => [...prev, { role: 'user', text: msg, time: new Date().toISOString() }]);
    setLoading(true);
    try {
      const { data } = await client.post('/ai/chat', { message: msg });
      setMessages((prev) => [...prev, { role: 'bot', text: data.reply, time: data.timestamp }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', text: '⚠️ Sorry, I encountered an error. Please try again.', time: new Date().toISOString() }]);
    } finally { setLoading(false); }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      setInput(history[idx] || '');
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInput(idx === -1 ? '' : history[idx]);
    }
  }

  function clearChat() {
    setMessages([{ role: 'bot', text: cfg.welcome, time: new Date().toISOString() }]);
  }

  return (
    <>
      {/* Floating button */}
      <button onClick={() => { setOpen((v) => !v); setMinimized(false); }}
        className={`fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br ${cfg.btnGradient} text-white shadow-xl hover:shadow-glow transition-all duration-300 hover:scale-110 flex items-center justify-center`}
        title={`${cfg.name} — Click to chat`}>
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-2xl">{cfg.avatar}</span>
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white animate-bounce-in">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        {!open && unread === 0 && (
          <span className={`absolute -top-1 -right-1 w-4 h-4 ${cfg.dotColor} rounded-full border-2 border-white animate-ping2`} />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className={`fixed right-4 z-50 w-80 sm:w-96 max-w-[calc(100vw-2rem)] flex flex-col bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 animate-scale-in origin-bottom-right overflow-hidden transition-all duration-300
          ${minimized ? 'bottom-36 h-14' : 'bottom-36 h-[520px]'}`}>

          {/* Header */}
          <div className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${cfg.gradient} flex-shrink-0`}>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl shadow-sm">
              {cfg.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{cfg.name}</p>
              <p className="text-white/70 text-xs flex items-center gap-1">
                <span className={`w-1.5 h-1.5 ${cfg.dotColor} rounded-full`} />
                {cfg.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {/* Clear chat */}
              {!minimized && (
                <button onClick={clearChat} title="Clear chat"
                  className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              )}
              {/* Minimize */}
              <button onClick={() => setMinimized((v) => !v)} title={minimized ? 'Expand' : 'Minimize'}
                className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {minimized
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  }
                </svg>
              </button>
              {/* Close */}
              <button onClick={() => setOpen(false)} title="Close"
                className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((m, i) => (
                  <MessageBubble key={i} m={m} cfg={cfg} />
                ))}
                {loading && (
                  <div className="flex justify-start animate-fade-in">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-sm mr-2 flex-shrink-0`}>
                      {cfg.avatar}
                    </div>
                    <div className="bg-gray-100 dark:bg-white/10 px-4 py-3 rounded-2xl rounded-bl-sm">
                      <div className="flex gap-1">
                        {[0,1,2].map((i) => (
                          <span key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick replies */}
              <div className="px-3 py-2 flex gap-1.5 overflow-x-auto border-t border-gray-100 dark:border-white/5 flex-shrink-0">
                {cfg.quickReplies.map((q) => (
                  <button key={q} onClick={() => send(q)}
                    className={`flex-shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors
                      bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800
                      hover:bg-indigo-100 dark:hover:bg-indigo-900/50`}>
                    {q}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 dark:border-white/5 flex-shrink-0">
                <input ref={inputRef} value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={cfg.inputPlaceholder}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all" />
                <button onClick={() => send()} disabled={!input.trim() || loading}
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cfg.btnGradient} text-white flex items-center justify-center disabled:opacity-40 transition-all hover:scale-105 flex-shrink-0`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>

              {/* Footer hint */}
              <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 pb-2">
                ↑↓ arrow keys for history · Enter to send
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
