import React, { useState } from 'react';
import api from '../services/api';

const AiAssistant = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hi! Ask me for movie recommendations by genre, mood, or language.' }
  ]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/ask', { message: userText });
      setMessages((prev) => [...prev, { sender: 'ai', text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Could not reach AI right now. Try again in a moment!' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1040 }}>
      {open ? (
        <div className="card bg-black text-light border-secondary shadow-lg" style={{ width: '320px' }}>
          <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center py-2">
            <span className="fw-bold">✨ IMovies AI Assistant</span>
            <button onClick={() => setOpen(false)} className="btn btn-sm btn-outline-light py-0">
              ✕
            </button>
          </div>
          <div className="card-body p-2" style={{ height: '260px', overflowY: 'auto' }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`mb-2 p-2 rounded small ${
                  m.sender === 'user' ? 'bg-danger text-white ms-4' : 'bg-dark border border-secondary me-4'
                }`}
                style={{ whiteSpace: 'pre-line' }}
              >
                {m.text}
              </div>
            ))}
            {loading && <div className="small text-secondary">Thinking...</div>}
          </div>
          <form onSubmit={sendMessage} className="card-footer border-secondary p-2 d-flex gap-1">
            <input
              type="text"
              className="form-control form-control-sm bg-dark text-light border-secondary"
              placeholder="Ask for a movie..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="btn btn-danger btn-sm fw-bold">
              Send
            </button>
          </form>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="btn btn-danger rounded-pill px-3 py-2 shadow-lg fw-bold">
          ✨ Ask IMovies AI
        </button>
      )}
    </div>
  );
};

export default AiAssistant;