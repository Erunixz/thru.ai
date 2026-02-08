/**
 * Sound Effects Utility
 * Generates minimal sound effects using Web Audio API
 */

class SoundEffects {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.volume = 0.3; // 30% volume for subtle effects
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  init() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported:', e);
        this.enabled = false;
      }
    }
  }

  /**
   * Play a tone with given frequency and duration
   */
  playTone(frequency, duration, type = 'sine') {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn('Failed to play tone:', e);
    }
  }

  /**
   * Play a two-tone sequence
   */
  playTwoTone(freq1, freq2, duration1, duration2, gap = 0.05) {
    this.playTone(freq1, duration1);
    setTimeout(() => this.playTone(freq2, duration2), (duration1 + gap) * 1000);
  }

  /**
   * Welcome sound - person detected / conversation starts
   * Upward sweep for welcoming feeling
   */
  welcome() {
    this.init();
    this.playTwoTone(600, 800, 0.12, 0.15);
  }

  /**
   * Item added sound - quick confirmation beep
   * Short high tone for acknowledgment
   */
  itemAdded() {
    this.init();
    this.playTone(1000, 0.08, 'sine');
  }

  /**
   * Order complete sound - success chime
   * Three-tone ascending for completion
   */
  orderComplete() {
    this.init();
    this.playTone(600, 0.1);
    setTimeout(() => this.playTone(800, 0.1), 100);
    setTimeout(() => this.playTone(1000, 0.2), 200);
  }

  /**
   * Goodbye sound - conversation ends
   * Downward tone for farewell
   */
  goodbye() {
    this.init();
    this.playTwoTone(800, 600, 0.12, 0.15);
  }

  /**
   * Enable/disable sound effects
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}

// Export singleton instance
export const soundEffects = new SoundEffects();

// Convenience functions
export const playSoundWelcome = () => soundEffects.welcome();
export const playSoundItemAdded = () => soundEffects.itemAdded();
export const playSoundOrderComplete = () => soundEffects.orderComplete();
export const playSoundGoodbye = () => soundEffects.goodbye();
export const setSoundEnabled = (enabled) => soundEffects.setEnabled(enabled);
export const setSoundVolume = (volume) => soundEffects.setVolume(volume);
