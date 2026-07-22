import {
  getInboxSoundPreference,
  playNotificationSound,
  setInboxSoundPreference,
} from '@/lib/notification-sound';

describe('notification-sound', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to enabled and persists the agent preference', () => {
    expect(getInboxSoundPreference()).toBe(true);

    setInboxSoundPreference(false);
    expect(getInboxSoundPreference()).toBe(false);

    setInboxSoundPreference(true);
    expect(getInboxSoundPreference()).toBe(true);
  });

  it('plays a short 440Hz notification without loading an external asset', () => {
    const addEventListener = jest.fn((event: string, callback: () => void) => {
      if (event === 'ended') callback();
    });
    const oscillator = {
      frequency: { value: 0 },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      addEventListener,
    };
    const gain = {
      gain: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
    };
    const close = jest.fn();
    const AudioContextMock = jest.fn(() => ({
      currentTime: 1,
      destination: {},
      createOscillator: () => oscillator,
      createGain: () => gain,
      close,
    }));

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: AudioContextMock,
    });

    playNotificationSound();

    expect(oscillator.frequency.value).toBe(440);
    expect(oscillator.start).toHaveBeenCalledTimes(1);
    expect(oscillator.stop).toHaveBeenCalledWith(1.2);
    expect(close).toHaveBeenCalledTimes(1);
  });
});
