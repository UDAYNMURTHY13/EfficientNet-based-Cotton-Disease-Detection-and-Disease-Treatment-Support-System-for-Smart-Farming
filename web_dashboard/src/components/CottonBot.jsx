/**
 * CottonBot – Floating AI Chatbot with Voice Assistant
 * Powered by Ollama (gemma3:4b) – restricted to agriculture topics only
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/cottonbot.css';

// ── Ollama Configuration ──────────────────────────────────────────────────────
const OLLAMA_URL   = '/ollama/api/chat';  // proxied via Vite to localhost:11434
const OLLAMA_MODEL = 'gemma3:4b';

const WELCOME_MSG = "\U0001F331 Hi! I'm **CottonBot**, your AI cotton farming assistant.\n\nAsk me about:\n\u2022 Cotton diseases & symptoms\n\u2022 Pest identification & control\n\u2022 Farming practices & fertilizers\n\u2022 Variety selection & IPM\n\nYou can ask in **any language** \u2014 I'll reply in the same language. \U0001F33F";

const QUICK_REPLIES = ['Leaf curl symptoms', 'Bacterial blight treatment', 'Bollworm control', 'Fusarium wilt prevention', 'Whitefly management', 'Cotton sowing tips', 'Nutrient deficiency signs', 'IPM for cotton'];

const PLACEHOLDER = 'Ask about cotton diseases, pests, farming…';

const SYSTEM_PROMPT = `You are CottonBot, an expert AI agricultural assistant embedded in CottonCare AI — a cotton disease detection platform used by farmers in India and South Asia.

LANGUAGE RULE: Detect the language of the user's message and always reply in that same language. If unsure, reply in English.

YOUR STRICT SCOPE — Only answer questions about:
- Cotton plant diseases: bacterial blight, leaf curl (CLCuD), fusarium wilt, alternaria leaf spot, anthracnose, cercospora grey mildew, root rot, and other fungal/bacterial/viral diseases
- Cotton pests: bollworm (Helicoverpa), pink bollworm, whitefly, aphids, thrips, jassids, mealybug, spider mites, and their integrated management
- Cotton crop management: land preparation, sowing time, seed rate, irrigation scheduling, fertilizer doses (NPK), weed management, harvesting, ginning, lint quality
- Cotton varieties: Bt cotton, hybrid varieties, open-pollinated varieties, seed selection by region
- Soil health for cotton: pH, organic matter, micronutrients, soil testing
- Weather and climate impacts on cotton crops
- IPM (Integrated Pest Management) for cotton
- Organic and sustainable cotton farming
- Government schemes, crop insurance, MSP, and support for cotton farmers in India
- General agronomy and crop science relevant to cotton-growing regions

RESPONSE RULES:
- Be practical, concise, and farmer-friendly. Use simple language.
- For disease/pest queries always include: (1) Symptoms (2) Causes (3) Prevention (4) Treatment with specific chemical/biological names and doses
- Prioritize IPM and biological controls before chemical recommendations
- When recommending chemicals, always mention safety precautions
- Use bullet points for clarity. Keep responses under 350 words unless asked for detail.

OUT OF SCOPE — If user asks about anything NOT related to agriculture or cotton farming, reply:\n\"I'm specialized in cotton farming and agriculture. I can't help with that topic.\"

Never answer questions about technology, coding, entertainment, politics, general finance, or non-agricultural science.`;

// ── Markdown-lite renderer ────────────────────────────────────────────────────
function renderMessage(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const html = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:#f0fdf4;padding:1px 4px;border-radius:4px;font-size:12px">$1</code>');
    const isBullet = /^[\s]*[•\-\*]\s/.test(line) || /^[\s]*\d+\.\s/.test(line);
    return (
      <span
        key={i}
        className={isBullet ? 'cb-bullet' : 'cb-line'}
        dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }}
      />
    );
  });
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CottonBot() {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState(() => [{
    id: 1, from: 'bot', time: new Date(),
    text: WELCOME_MSG,
  }]);
  const [input, setInput]         = useState('');
  const [typing, setTyping]       = useState(false);   // waiting for API
  const [streaming, setStreaming] = useState(false);   // token-by-token output

  // Voice
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking,  setIsSpeaking]  = useState(false);
  const [voiceError,  setVoiceError]  = useState('');
  const [voiceSupported] = useState(
    () => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  );
  const voiceErrTimerRef = useRef(null);

  // Refs
  const recognitionRef     = useRef(null);
  const synthRef           = useRef(window.speechSynthesis);
  const messagesEndRef     = useRef(null);
  const inputRef           = useRef(null);
  const conversationRef    = useRef([]);   // Ollama-format turn history
  const abortRef           = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      synthRef.current?.cancel();
      setIsSpeaking(false);
      recognitionRef.current?.stop();
      setIsListening(false);
      abortRef.current?.abort();
    }
  }, [open]);

  // ── TTS ──────────────────────────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const plain = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/[•\-\*#]/g, '')
      .replace(/\n+/g, '. ')
      .substring(0, 700);
    const utt   = new SpeechSynthesisUtterance(plain);
    utt.rate    = 0.93;
    utt.pitch   = 1;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend   = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utt);
  }, []);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  // ── Ollama streaming call ─────────────────────────────────────────────────
  const callOllama = useCallback(async (userText, botMsgId) => {
    conversationRef.current = [
      ...conversationRef.current,
      { role: 'user', content: userText },
    ].slice(-16);

    abortRef.current = new AbortController();

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationRef.current,
    ];

    const res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: abortRef.current.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: true,
        options: { temperature: 0.65, num_predict: 900 },
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(err || `Ollama error ${res.status}`);
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText  = '';
    let buffer    = '';

    setTyping(false);
    setStreaming(true);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            const chunk  = parsed.message?.content ?? '';
            if (chunk) {
              fullText += chunk;
              setMessages(prev =>
                prev.map(m => m.id === botMsgId ? { ...m, text: fullText } : m)
              );
            }
            if (parsed.done) break;
          } catch { /* skip malformed lines */ }
        }
      }
    } finally {
      setStreaming(false);
    }

    if (fullText) {
      conversationRef.current = [
        ...conversationRef.current,
        { role: 'assistant', content: fullText },
      ];
      speak(fullText);
    }

    return fullText;
  }, [speak]);

  // ── Send ─────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || typing || streaming) return;
    setInput('');

    const now = Date.now();
    const userMsgId = now;
    const botMsgId  = now + 1000;   // guaranteed different — gap is 1 second apart
    setMessages(prev => [
      ...prev,
      { id: userMsgId, from: 'user', text: msg, time: new Date() },
      { id: botMsgId,  from: 'bot',  text: '',  time: new Date() },
    ]);
    setTyping(true);

    try {
      await callOllama(msg, botMsgId);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setTyping(false);
      setStreaming(false);
      setMessages(prev =>
        prev.map(m => m.id === botMsgId
          ? { ...m, text: `⚠️ AI assistant is unavailable. Please try again later.\n\n_(${err.message})_` }
          : m
        )
      );
    }
  }, [input, typing, streaming, callOllama]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Voice input ──────────────────────────────────────────────────────────
  const showVoiceError = useCallback((msg) => {
    setVoiceError(msg);
    clearTimeout(voiceErrTimerRef.current);
    voiceErrTimerRef.current = setTimeout(() => setVoiceError(''), 4000);
  }, []);

  const startListening = useCallback(() => {
    if (!voiceSupported) return;
    setVoiceError('');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    // Use a valid BCP-47 tag; navigator.language is usually fine ('en-US', 'hi-IN' etc.)
    const lang = navigator.language || 'en-IN';
    recognition.lang           = lang;
    recognition.continuous     = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onerror = (e) => {
      setIsListening(false);
      switch (e.error) {
        case 'not-allowed':
        case 'permission-denied':
          showVoiceError('🚫 Microphone access denied. Allow mic in browser settings.');
          break;
        case 'no-speech':
          showVoiceError('🔇 No speech detected. Try speaking closer to the mic.');
          break;
        case 'network':
          showVoiceError('🌐 Voice needs internet. Check your connection.');
          break;
        case 'audio-capture':
          showVoiceError('🎤 No microphone found. Please connect a mic.');
          break;
        case 'aborted':
          break; // user stopped manually — no message needed
        default:
          showVoiceError(`⚠️ Voice error: ${e.error || 'unknown'}. Try again.`);
      }
    };

    recognition.onend = () => setIsListening(false);

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript.trim();
      if (!transcript) {
        showVoiceError('🔇 Could not understand. Please try again.');
        return;
      }
      setInput(transcript);
      setIsListening(false);
      // Small delay to let state settle before sending
      setTimeout(() => handleSend(transcript), 150);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      setIsListening(false);
      showVoiceError('⚠️ Could not start voice input. Try again.');
    }
  }, [voiceSupported, handleSend, showVoiceError]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // ── Clear chat ───────────────────────────────────────────────────────────
  const clearChat = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
    conversationRef.current = [];
    setMessages([{ id: Date.now(), from: 'bot', time: new Date(), text: WELCOME_MSG }]);
  };

  const formatTime = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const isBusy = typing || streaming;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Floating toggle */}
      <button
        className={`cb-toggle ${open ? 'cb-toggle--open' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label="Toggle CottonBot"
        title="CottonBot AI – Cotton Farming Assistant"
      >
        {open ? (
          <span className="cb-toggle-icon">✕</span>
        ) : (
          <>
            <span className="cb-toggle-icon">🌿</span>
            <span className="cb-toggle-label">CottonBot AI</span>
            <span className="cb-toggle-pulse" />
          </>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="cb-window" role="dialog" aria-label="CottonBot Chat">

          {/* Header */}
          <div className="cb-header">
            <div className="cb-header-info">
              <div className="cb-avatar">🌿</div>
              <div>
                <div className="cb-header-title">CottonBot AI</div>
                <div className="cb-header-subtitle">
                  {streaming
                    ? <span className="cb-status-stream">✨ Generating…</span>
                    : typing
                    ? <span className="cb-status-think">💭 Thinking…</span>
                    : <span>CottonCare AI</span>}
                </div>
              </div>
            </div>
            <div className="cb-header-actions">
              {isSpeaking && (
                <button className="cb-icon-btn cb-speaking-btn" onClick={stopSpeaking} title="Stop speaking">🔇</button>
              )}
                            <button className="cb-icon-btn" onClick={clearChat} title="Clear chat">🗑️</button>
              <button className="cb-icon-btn" onClick={() => setOpen(false)} title="Close">✕</button>
            </div>
          </div>

          {/* Model badge */}
          <div className="cb-gemini-badge">
            <span className="cb-gemini-dot" />
            Agriculture-only AI
          </div>

          {/* Messages */}
          <div className="cb-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`cb-msg-row ${msg.from === 'user' ? 'cb-msg-row--user' : 'cb-msg-row--bot'}`}>
                {msg.from === 'bot' && <div className="cb-msg-avatar">🌿</div>}
                <div className={`cb-bubble ${msg.from === 'user' ? 'cb-bubble--user' : 'cb-bubble--bot'} ${msg.from === 'bot' && !msg.text ? 'cb-bubble--typing' : ''}`}>
                  {msg.from === 'bot' && !msg.text ? (
                    <><span /><span /><span /></>
                  ) : (
                    <>
                      <div className="cb-bubble-text">
                        {renderMessage(msg.text)}
                        {msg.from === 'bot' && streaming && msg.id === messages[messages.length - 1]?.id && (
                          <span className="cb-cursor">▋</span>
                        )}
                      </div>
                      <div className="cb-bubble-meta">
                        <span className="cb-bubble-time">{formatTime(msg.time)}</span>
                        {msg.from === 'bot' && msg.text && !streaming && (
                          <button className="cb-speak-msg-btn" onClick={() => speak(msg.text)} title="Read aloud">🔊</button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          <div className="cb-quick-replies">
            {QUICK_REPLIES.map(qr => (
              <button key={qr} className="cb-quick-chip" onClick={() => handleSend(qr)} disabled={isBusy}>{qr}</button>
            ))}
          </div>

          {/* Input */}
          <div className="cb-input-area">
            <textarea
              ref={inputRef}
              className="cb-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? '🎙️ Listening… speak now' : PLACEHOLDER}
              rows={1}
              disabled={isListening || streaming}
            />
            {voiceSupported && (
              <button
                className={`cb-voice-btn ${isListening ? 'cb-voice-btn--active' : ''}`}
                onClick={isListening ? stopListening : startListening}
                title={isListening ? 'Tap to stop' : 'Voice input (tap to speak)'}
                disabled={typing}
              >
                {isListening ? <span className="cb-mic-wave">🎙️</span> : '🎤'}
              </button>
            )}
            <button className="cb-send-btn" onClick={() => handleSend()} disabled={!input.trim() || isBusy} title="Send">➤</button>
          </div>

          {isListening && (
            <div className="cb-listening-banner">🎙️ Listening… speak now — tap 🎤 to stop</div>
          )}
          {voiceError && (
            <div className="cb-voice-error">{voiceError}</div>
          )}
        </div>
      )}
    </>
  );
}