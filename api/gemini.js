export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
  }

  try {
    const body = req.body;
    const prompt = body.prompt || '';
    const imageBase64 = body.imageBase64 || null;
    const mimeType = body.mimeType || 'image/jpeg';

    const parts = [];

    if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: imageBase64,
        },
      });
    }

    parts.push({ text: prompt });

    const geminiBody = {
      contents: [{ parts: parts }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || JSON.stringify(data);
      return res.status(response.status).json({ error: errMsg });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({ text: text });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
