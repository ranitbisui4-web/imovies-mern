const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');

const localRecommend = (movies, message) => {
  const q = message.toLowerCase();
  const matched = movies.filter(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      m.language.toLowerCase().includes(q) ||
      m.genre.some((g) => q.includes(g.toLowerCase())) ||
      q.split(/\s+/).some((word) => word.length > 2 && m.description.toLowerCase().includes(word))
  );
  const picks = matched.length > 0 ? matched.slice(0, 3) : movies.slice(0, 3);
  return `Here are the best matches on IMovies right now:\n${picks
    .map((m) => `• ${m.title} (${m.language} • ${m.genre.join(', ')} • ★${m.rating})`)
    .join('\n')}`;
};

router.post('/ask', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Please enter a question' });

    const movies = await Movie.find({ isActive: true }).select(
      'title genre language duration rating description'
    );
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({ reply: localRecommend(movies, message) });
    }

    const movieContext = movies
      .map((m) => `- ${m.title} (${m.language}, ${m.genre.join('/')}, ${m.duration}m, ★${m.rating}): ${m.description}`)
      .join('\n');

    const prompt = `You are the friendly IMovies AI Assistant. Answer concisely (under 80 words) using ONLY the movies below:\n${movieContext}\n\nUser: ${message}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!response.ok || !reply) {
      console.error('Gemini API fallback triggered:', data?.error || response.status);
      return res.json({ reply: localRecommend(movies, message) });
    }

    res.json({ reply });
  } catch (err) {
    console.error('AI route error:', err.message);
    res.status(500).json({ reply: 'AI service is temporarily busy. Please try again.' });
  }
});

module.exports = router;