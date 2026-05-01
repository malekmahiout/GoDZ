import { Injectable } from '@angular/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

@Injectable({ providedIn: 'root' })
export class AudioGuideService {
  private _isPlaying = false;

  get isActive(): boolean { return this._isPlaying; }

  async speak(text: string, language = 'fr'): Promise<void> {
    await this.stop();
    this._isPlaying = true;
    try {
      await TextToSpeech.speak({
        text,
        lang: this.mapLang(language),
        rate: 0.92,
        pitch: 0.95,
        volume: 1.0,
        category: 'ambient',
      });
    } catch (e) {
      console.warn('TTS error', e);
    } finally {
      this._isPlaying = false;
    }
  }

  async stop(): Promise<void> {
    try { await TextToSpeech.stop(); } catch (_) {}
    this._isPlaying = false;
  }

  isSupported(): boolean { return true; }

  private mapLang(lang: string): string {
    const m: Record<string, string> = { fr: 'fr-FR', ar: 'ar-SA', en: 'en-US' };
    return m[lang] || 'fr-FR';
  }
}
