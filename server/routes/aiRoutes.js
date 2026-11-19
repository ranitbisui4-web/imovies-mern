const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');

router.post('/ask', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Please enter a question' });
    }

    const movies = await Movie.find({ isActive: true }).select('title genre language duration rating description');
    const movieContext = movies
      .map((m) => `- ${m.title} (${m.language}, ${m.genre.join('/')}, ${m.duration}m, ★${m.rating}): ${m.description}`)
      .join('\n');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Smart fallback if GEMINI_API_KEY is not configured yet
      const q = message.toLowerCase();
      const matched = movies.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.language.toLowerCase().includes(q) ||
          m.genre.some((g) => q.includes(g.toLowerCase()))
      );
      const picks = matched.length > 0 ? matched : movies.slice(0, 2);
      return res.json({
        reply: `Here are my top picks from IMovies right now:\n${picks
          .map((m) => `• ${m.title} (${m.language}, ★${m.rating})`)
          .join('\n')}`
      });
    }

    const prompt = `You are the friendly IMovies AI Assistant. Answer the user's question concisely (under 80 words) using ONLY the movies currently showing below:\n${movieContext}\n\nUser: ${message}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Sorry, I could not generate a recommendation right now.';

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ reply: 'AI service is temporarily busy. Please try again.' });
  }
});

module.exports = router;