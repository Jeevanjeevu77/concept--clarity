import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { conceptApi } from '../services/api';
import ExplanationCard from '../components/ExplanationCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import toast from 'react-hot-toast';

const CURATED_SUGGESTIONS = [
  'Quantum Entanglement', 'Blockchain', 'Neural Networks',
  'The Water Cycle', 'Object-Oriented Programming', 'Inflation',
  'Photosynthesis', 'The Doppler Effect', 'Machine Learning',
  'Quantum Computing', 'Black Holes', 'Gene Editing (CRISPR)',
  'Artificial Intelligence', 'Cybersecurity', 'Database Indexing'
];

export default function HomePage() {
  const location = useLocation();
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);

  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef(null);

  // Prefill when coming from "History" page or other deep links
  useEffect(() => {
    if (location.state?.prefill) {
      handleSearch(location.state.prefill);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // Click outside autocomplete dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowAutocomplete(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const filteredSuggestions = topic.trim()
    ? CURATED_SUGGESTIONS.filter(s =>
        s.toLowerCase().includes(topic.toLowerCase()) &&
        s.toLowerCase() !== topic.toLowerCase()
      )
    : [];

  async function handleSearch(searchTopic) {
    const trimmed = searchTopic.trim();
    if (!trimmed) return;

    setTopic('');
    setShowAutocomplete(false);
    inputRef.current?.blur();

    // 1. Append User Message
    const userMessageId = 'user-' + Date.now();
    const newMessages = [
      ...messages,
      { id: userMessageId, type: 'user', text: trimmed }
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      // 2. Fetch from backend, default to INTERMEDIATE and DETAILED
      const res = await conceptApi.explain(trimmed, 'INTERMEDIATE', 'DETAILED');
      
      // 3. Append AI Response
      setMessages(prev => [
        ...prev,
        {
          id: 'ai-' + Date.now(),
          type: 'ai',
          topic: trimmed,
          data: res.data,
          error: res.data.success ? null : 'The AI generated an incomplete explanation.'
        }
      ]);

      if (!res.data.success) {
        toast.error('AI had trouble generating a fully complete response.');
      }
    } catch (err) {
      const msg = err.response?.data?.errorMessage || err.response?.data?.message || err.message || 'Something went wrong';
      setMessages(prev => [
        ...prev,
        {
          id: 'ai-error-' + Date.now(),
          type: 'ai',
          topic: trimmed,
          data: null,
          error: msg
        }
      ]);
      toast.error('Failed to get explanation');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e?.preventDefault();
    handleSearch(topic);
  }

  function handleSuggestionClick(s) {
    handleSearch(s);
  }

  function handleReset() {
    setMessages([]);
    setTopic('');
    inputRef.current?.focus();
    toast.success('Started a fresh search');
  }

  const isChatActive = messages.length > 0;

  return (
    <main className={`w-full max-w-3xl mx-auto px-4 ${isChatActive ? 'pt-6 pb-32 space-y-6' : 'py-20 space-y-8'}`}>
      
      {/* ── Empty State Hero (Google / ChatGPT style) ── */}
      {!isChatActive && (
        <div className="text-center space-y-4 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
            ✦ AI-Powered Learning Assistant
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight"
            style={{ color: 'var(--text-primary)' }}>
            Understand <em>anything</em>,
            <br />instantly explained.
          </h1>
          <p className="text-base max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
            Enter any topic or concept. We'll give you a beautiful, structured deep-dive, complete with examples and analogies.
          </p>
        </div>
      )}

      {/* ── Chat Messages Feed ── */}
      {isChatActive && (
        <div className="space-y-8 animate-fade-in">
          {/* Back / Clear Chat Bar */}
          <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Conversation Thread
            </span>
            <button
              onClick={handleReset}
              className="text-xs font-medium px-2.5 py-1 rounded transition-all duration-150"
              style={{ background: 'var(--tag-bg)', color: 'var(--text-secondary)' }}
            >
              🔄 Clear Thread
            </button>
          </div>

          <div className="space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                {/* User Message */}
                {msg.type === 'user' && (
                  <div className="flex justify-end animate-fade-up">
                    <div className="max-w-[85%] rounded-2xl px-5 py-3 shadow-sm border text-white font-medium"
                      style={{ 
                        background: 'linear-gradient(135deg, var(--accent), #f0a23e)', 
                        borderColor: 'var(--accent)',
                      }}>
                      <p className="text-xs opacity-75 uppercase tracking-widest font-bold mb-1">Search Query</p>
                      <p className="text-base">{msg.text}</p>
                    </div>
                  </div>
                )}

                {/* AI Explanation Message */}
                {msg.type === 'ai' && (
                  <div className="flex justify-start animate-fade-up">
                    <div className="w-full">
                      {msg.error ? (
                        <div className="card p-5 border-red-200" style={{ borderColor: '#fecaca', background: '#fff5f5' }}>
                          <p className="font-semibold text-red-700 mb-1">⚠ Could not generate explanation for "{msg.topic}"</p>
                          <p className="text-sm text-red-600">{msg.error}</p>
                          <p className="text-xs text-red-400 mt-2">Make sure your backend server and API keys are running properly.</p>
                        </div>
                      ) : (
                        <ExplanationCard data={msg.data} onTopicClick={handleSearch} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* AI Loading State */}
            {loading && (
              <div className="space-y-3 animate-pulse">
                <div className="flex justify-start">
                  <div className="w-full">
                    <LoadingSkeleton />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>
      )}

      {/* ── Search Input Section (Google/ChatGPT Hybrid) ── */}
      <div 
        className={isChatActive 
          ? "fixed bottom-0 left-0 right-0 py-6 z-40 backdrop-blur-md border-t" 
          : "max-w-2xl mx-auto w-full relative animate-fade-up"
        }
        style={isChatActive ? { 
          background: 'rgba(var(--card-bg), 0.7)', 
          borderColor: 'var(--border)',
          backgroundColor: 'var(--page-bg)',
          opacity: 0.96
        } : {}}
      >
        <div className={isChatActive ? "max-w-3xl mx-auto px-4 w-full relative" : "w-full relative"}>
          <form onSubmit={handleSubmit} className="relative w-full shadow-md rounded-2xl" ref={autocompleteRef}>
            {/* Magnifier glass icon */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <input
              ref={inputRef}
              type="text"
              className="input-field pl-12 pr-14 py-4 w-full shadow-inner"
              placeholder={isChatActive ? "Ask about another concept..." : "What do you want to understand? (e.g. Quantum Physics...)"}
              value={topic}
              onChange={e => {
                setTopic(e.target.value);
                setShowAutocomplete(true);
              }}
              onFocus={() => setShowAutocomplete(true)}
              disabled={loading}
              autoFocus={!isChatActive}
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center"
              style={{ 
                background: topic.trim() ? 'var(--accent)' : 'var(--tag-bg)',
                color: topic.trim() ? '#fff' : 'var(--text-muted)',
                cursor: topic.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
              </svg>
            </button>

            {/* 🔎 Google-Style Autocomplete Dropdown 🔎 */}
            {showAutocomplete && filteredSuggestions.length > 0 && (
              <div 
                className="absolute left-0 right-0 bottom-full mb-2 bg-white dark:bg-slate-900 border rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in"
                style={{ borderColor: 'var(--border)', background: 'var(--card-bg)' }}
              >
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b opacity-50" style={{ borderColor: 'var(--border)' }}>
                  Suggested Searches
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSuggestionClick(s)}
                      className="w-full text-left px-5 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors flex items-center gap-3"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <span className="opacity-60 text-base">🔍</span>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/*Curated Suggestion Grid (shown only in empty state) */}
      {!isChatActive && !loading && (
        <div className="animate-fade-in space-y-3" style={{ animationDelay: '0.2s' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-center"
            style={{ color: 'var(--text-muted)' }}>
            Suggested Concepts to Start
          </p>
          <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
            {CURATED_SUGGESTIONS.slice(0, 9).map(s => (
              <button 
                key={s} 
                onClick={() => handleSuggestionClick(s)} 
                className="tag text-sm py-1.5 px-3.5 shadow-sm hover:scale-102 hover:shadow-md transition-all active:scale-100"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

    </main>
  );
}
