import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Text-To-Speech with gemini-3.8-flash-tts
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, language = 'en', voice = 'Puck' } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text string is required for TTS' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not set on the server. Falling back to native device speech.',
          offlineFallback: true,
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Select voice: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
      const selectedVoice = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].includes(voice)
        ? voice
        : 'Puck';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.slice(0, 300),
                speechMetadata: {
                  style: `Clear, natural pronunciation for language learning in ${language}. Friendly and articulate.`,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res.status(502).json({
          error: 'No audio returned from Gemini model',
          offlineFallback: true,
        });
      }

      return res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
        model: 'gemini-3.8-flash-tts',
        voice: selectedVoice,
      });
    } catch (err: any) {
      console.warn('Gemini 3.8 Flash TTS error, falling back to Web Speech API:', err?.message || err);
      return res.status(500).json({
        error: err?.message || 'Gemini TTS generation error',
        offlineFallback: true,
      });
    }
  });

  // Health and info check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      ttsModel: 'gemini-3.8-flash-tts',
    });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`7ifd App running on http://localhost:${port}`);
  });
}

startServer();
