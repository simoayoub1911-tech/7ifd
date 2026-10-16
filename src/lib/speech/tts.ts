import { LanguageCode, SUPPORTED_LANGUAGES } from '../../types';

// In-memory cache for audio base64 clips
const audioCache = new Map<string, string>();
let currentAudio: HTMLAudioElement | null = null;

export interface TTSOptions {
  text: string;
  language: LanguageCode;
  voicePreference?: 'gemini' | 'native';
  geminiVoice?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  rate?: number;
}

/**
 * Play speech using Web Speech API (device native TTS).
 */
export function playNativeTTS(text: string, language: LanguageCode, rate = 0.95): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis is not supported on this device/browser');
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const meta = SUPPORTED_LANGUAGES[language];
    utterance.lang = meta ? meta.bcp47 : 'en-US';
    utterance.rate = rate;

    // Pick best matching voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0 && meta) {
      const matched = voices.find((v) => v.lang.toLowerCase().startsWith(meta.code.toLowerCase()));
      if (matched) utterance.voice = matched;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      console.warn('Native speech error:', e);
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Play speech using Gemini 3.8 Flash TTS via server endpoint, falling back to Web Speech API.
 */
export async function speakText(options: TTSOptions): Promise<{ source: 'gemini' | 'native'; error?: string }> {
  const { text, language, voicePreference = 'gemini', geminiVoice = 'Puck', rate = 1 } = options;
  if (!text || !text.trim()) return { source: 'native' };

  // Stop previous audio playback
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  // If user selected native voice or offline, use native directly
  if (voicePreference === 'native' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    await playNativeTTS(text, language, rate);
    return { source: 'native' };
  }

  // Check cache first
  const cacheKey = `${geminiVoice}_${language}_${text}`;
  const cachedAudio = audioCache.get(cacheKey);

  if (cachedAudio) {
    try {
      await playAudioFromBase64(cachedAudio);
      return { source: 'gemini' };
    } catch {
      // Fallback
    }
  }

  // Attempt server-side Gemini 3.8 Flash TTS
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language,
        voice: geminiVoice,
      }),
    });

    if (!res.ok) {
      throw new Error(`TTS server responded with ${res.status}`);
    }

    const data = await res.json();
    if (data.audioBase64) {
      audioCache.set(cacheKey, data.audioBase64);
      await playAudioFromBase64(data.audioBase64);
      return { source: 'gemini' };
    }
    throw new Error('No audio returned in payload');
  } catch (err: any) {
    // Seamless native fallback
    await playNativeTTS(text, language, rate);
    return { source: 'native', error: err?.message };
  }
}

function playAudioFromBase64(base64Data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audioUrl = `data:audio/wav;base64,${base64Data}`;
      const audio = new Audio(audioUrl);
      currentAudio = audio;

      audio.onended = () => {
        currentAudio = null;
        resolve();
      };

      audio.onerror = (e) => {
        currentAudio = null;
        reject(e);
      };

      audio.play().catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

export const playSpeech = (options: {
  text: string;
  lang?: LanguageCode;
  language?: LanguageCode;
  voicePreference?: 'gemini' | 'native';
  geminiVoiceName?: string;
  geminiVoice?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  rate?: number;
}) => {
  return speakText({
    text: options.text,
    language: (options.language || options.lang || 'en') as LanguageCode,
    voicePreference: options.voicePreference,
    geminiVoice: (options.geminiVoice || options.geminiVoiceName || 'Puck') as any,
    rate: options.rate,
  });
};

