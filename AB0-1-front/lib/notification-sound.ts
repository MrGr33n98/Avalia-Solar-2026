const SOUND_PREFERENCE_KEY = 'inbox_sound_enabled';

export function getInboxSoundPreference(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(SOUND_PREFERENCE_KEY) !== 'false';
}

export function setInboxSoundPreference(enabled: boolean): void {
  window.localStorage.setItem(SOUND_PREFERENCE_KEY, String(enabled));
}

export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;
  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 440;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.06, context.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.2);
  oscillator.addEventListener('ended', () => void context.close(), { once: true });
}
