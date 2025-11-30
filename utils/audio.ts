
// A simple sound player using the Web Audio API to avoid needing audio files.
let audioCtx: AudioContext | null = null;

const initializeAudio = () => {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch(e) {
      console.error("Web Audio API is not supported in this browser");
    }
  }
};

type SoundType = 'dice' | 'hit' | 'defend' | 'flee-success' | 'flee-fail' | 'encounter' | 'interact' | 'heal' | 'artifact' | 'levelup' | 'shoot' | 'reload';

interface SoundConfig {
    frequency: number;
    type: OscillatorType;
    duration: number;
    volume: number;
}

const soundMap: Record<SoundType, SoundConfig> = {
    'dice': { frequency: 440, type: 'square', duration: 0.05, volume: 0.1 },
    'hit': { frequency: 150, type: 'sawtooth', duration: 0.1, volume: 0.3 },
    'defend': { frequency: 660, type: 'sine', duration: 0.15, volume: 0.2 },
    'flee-success': { frequency: 880, type: 'triangle', duration: 0.3, volume: 0.2 },
    'flee-fail': { frequency: 110, type: 'square', duration: 0.4, volume: 0.3 },
    'encounter': { frequency: 330, type: 'sawtooth', duration: 0.5, volume: 0.3 },
    'interact': { frequency: 523.25, type: 'sine', duration: 0.1, volume: 0.15 },
    'heal': { frequency: 783.99, type: 'sine', duration: 0.4, volume: 0.25 },
    'artifact': { frequency: 1046.50, type: 'triangle', duration: 0.5, volume: 0.2 },
    'levelup': { frequency: 600, type: 'square', duration: 0.6, volume: 0.3 }, 
    'shoot': { frequency: 880, type: 'sawtooth', duration: 0.1, volume: 0.2 }, // Pew pew
    'reload': { frequency: 300, type: 'square', duration: 0.15, volume: 0.2 }, // Click
};

export const playSound = (sound: SoundType) => {
  initializeAudio();
  if (!audioCtx) return;

  // Create an oscillator
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  const { frequency, type, duration, volume } = soundMap[sound];

  // Set oscillator properties
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

  if (sound === 'levelup') {
       // Simple arpeggio effect
       oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
       oscillator.frequency.setValueAtTime(554, audioCtx.currentTime + 0.1);
       oscillator.frequency.setValueAtTime(659, audioCtx.currentTime + 0.2);
       oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.3);
  }
  
  if (sound === 'shoot') {
       oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
       oscillator.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.1);
  }
  
  if (sound === 'reload') {
       oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
       oscillator.frequency.setValueAtTime(400, audioCtx.currentTime + 0.05);
  }

  // Set volume
  gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

  // Connect nodes and play
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
};
