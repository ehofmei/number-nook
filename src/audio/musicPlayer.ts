import {
  getMusicTrack,
  musicTrackDuration,
  type MusicInstrumentId,
  type MusicNoteSpec,
  type MusicTrackDefinition,
  type MusicTrackId,
} from './music';
import type { AudioPreferences } from './preferences';

export interface MusicBackend {
  readonly state: AudioContextState;
  resume(): Promise<void>;
  start(track: MusicTrackDefinition, volume: number): void;
  setVolume(volume: number): void;
  stop(): void;
  close(): Promise<void>;
}

export type MusicBackendFactory = () => MusicBackend;

interface InstrumentPartial {
  ratio: number;
  level: number;
  wave?: OscillatorType;
  detune?: number;
}

interface InstrumentProfile {
  partials: readonly InstrumentPartial[];
  attackSeconds: number;
  decaySeconds: number;
  sustainRatio: number;
  releaseSeconds: number;
}

const INSTRUMENT_PROFILES: Record<MusicInstrumentId, InstrumentProfile> = {
  pad: {
    partials: [{ ratio: 1, level: 1 }],
    attackSeconds: 0.08,
    decaySeconds: 1.8,
    sustainRatio: 0.9,
    releaseSeconds: 0.2,
  },
  'soft-piano': {
    partials: [
      { ratio: 1, level: 0.82, wave: 'sine' },
      { ratio: 1, level: 0.2, wave: 'triangle', detune: 2 },
      { ratio: 2, level: 0.14, wave: 'sine' },
      { ratio: 3, level: 0.055, wave: 'sine' },
    ],
    attackSeconds: 0.012,
    decaySeconds: 0.62,
    sustainRatio: 0.12,
    releaseSeconds: 0.16,
  },
  'electric-piano': {
    partials: [
      { ratio: 1, level: 0.92, wave: 'sine' },
      { ratio: 2, level: 0.22, wave: 'sine' },
      { ratio: 3, level: 0.075, wave: 'sine', detune: -3 },
    ],
    attackSeconds: 0.018,
    decaySeconds: 1.05,
    sustainRatio: 0.28,
    releaseSeconds: 0.24,
  },
  'music-box': {
    partials: [
      { ratio: 1, level: 0.78, wave: 'sine' },
      { ratio: 3, level: 0.2, wave: 'sine' },
      { ratio: 4, level: 0.08, wave: 'sine' },
    ],
    attackSeconds: 0.006,
    decaySeconds: 0.38,
    sustainRatio: 0.025,
    releaseSeconds: 0.08,
  },
  'soft-guitar': {
    partials: [
      { ratio: 1, level: 0.72, wave: 'triangle' },
      { ratio: 2, level: 0.15, wave: 'sine' },
      { ratio: 3, level: 0.045, wave: 'sine' },
    ],
    attackSeconds: 0.009,
    decaySeconds: 0.72,
    sustainRatio: 0.07,
    releaseSeconds: 0.12,
  },
  harp: {
    partials: [
      { ratio: 1, level: 0.85, wave: 'sine' },
      { ratio: 2, level: 0.18, wave: 'triangle' },
      { ratio: 4, level: 0.045, wave: 'sine' },
    ],
    attackSeconds: 0.008,
    decaySeconds: 0.88,
    sustainRatio: 0.08,
    releaseSeconds: 0.16,
  },
  kalimba: {
    partials: [
      { ratio: 1, level: 0.8, wave: 'sine' },
      { ratio: 2, level: 0.16, wave: 'triangle' },
      { ratio: 5, level: 0.045, wave: 'sine' },
    ],
    attackSeconds: 0.006,
    decaySeconds: 0.48,
    sustainRatio: 0.04,
    releaseSeconds: 0.09,
  },
  organ: {
    partials: [
      { ratio: 1, level: 0.72, wave: 'sine' },
      { ratio: 2, level: 0.2, wave: 'sine' },
      { ratio: 3, level: 0.07, wave: 'sine' },
    ],
    attackSeconds: 0.12,
    decaySeconds: 0.7,
    sustainRatio: 0.82,
    releaseSeconds: 0.32,
  },
  strings: {
    partials: [
      { ratio: 1, level: 0.62, wave: 'triangle' },
      { ratio: 2, level: 0.11, wave: 'sine', detune: 4 },
    ],
    attackSeconds: 0.34,
    decaySeconds: 0.9,
    sustainRatio: 0.74,
    releaseSeconds: 0.42,
  },
  mallet: {
    partials: [
      { ratio: 1, level: 0.76, wave: 'sine' },
      { ratio: 3, level: 0.13, wave: 'sine' },
    ],
    attackSeconds: 0.006,
    decaySeconds: 0.42,
    sustainRatio: 0.035,
    releaseSeconds: 0.08,
  },
  bell: {
    partials: [
      { ratio: 1, level: 0.7, wave: 'sine' },
      { ratio: 2.4, level: 0.14, wave: 'sine' },
      { ratio: 3.8, level: 0.07, wave: 'sine' },
    ],
    attackSeconds: 0.005,
    decaySeconds: 0.72,
    sustainRatio: 0.03,
    releaseSeconds: 0.14,
  },
};

export class WebMusicBackend implements MusicBackend {
  private readonly context = new AudioContext();
  private master: GainNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private outputNodes: AudioNode[] = [];
  private scheduler: number | null = null;
  private nextLoopStart = 0;
  private activeOscillators = new Set<OscillatorNode>();

  get state(): AudioContextState {
    return this.context.state;
  }

  resume(): Promise<void> {
    return this.context.resume();
  }

  start(track: MusicTrackDefinition, volume: number): void {
    this.stop();
    const now = this.context.currentTime;
    const master = this.context.createGain();
    const highpass = this.context.createBiquadFilter();
    const lowpass = this.context.createBiquadFilter();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(this.safeVolume(volume), now + 0.45);
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(track.lowCutFrequency ?? 90, now);
    highpass.Q.setValueAtTime(0.7, now);
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(track.filterFrequency, now);
    master.connect(highpass).connect(lowpass);
    const dry = this.context.createGain();
    const ambience = track.ambience;
    dry.gain.setValueAtTime(1 - (ambience?.mix ?? 0) * 0.3, now);
    lowpass.connect(dry).connect(this.context.destination);
    this.outputNodes = [dry];
    if (ambience && ambience.mix > 0) {
      const delay = this.context.createDelay(1);
      const feedback = this.context.createGain();
      const wet = this.context.createGain();
      delay.delayTime.setValueAtTime(ambience.delaySeconds, now);
      feedback.gain.setValueAtTime(ambience.feedback, now);
      wet.gain.setValueAtTime(ambience.mix, now);
      lowpass.connect(delay);
      delay.connect(feedback).connect(delay);
      delay.connect(wet).connect(this.context.destination);
      this.outputNodes.push(delay, feedback, wet);
    }
    this.master = master;
    this.filters = [highpass, lowpass];
    this.nextLoopStart = now + 0.05;
    this.schedule(track, master);
    this.scheduler = window.setInterval(() => this.schedule(track, master), 1_000);
  }

  setVolume(volume: number): void {
    if (!this.master) return;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(this.safeVolume(volume), now, 0.08);
  }

  stop(): void {
    if (this.scheduler !== null) {
      window.clearInterval(this.scheduler);
      this.scheduler = null;
    }
    for (const oscillator of this.activeOscillators) {
      try {
        oscillator.stop();
      } catch {
        // A note may already have ended while the stop request was being processed.
      }
    }
    this.activeOscillators.clear();
    const master = this.master;
    const filters = this.filters;
    const outputNodes = this.outputNodes;
    this.master = null;
    this.filters = [];
    this.outputNodes = [];
    if (!master) return;
    const now = this.context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    window.setTimeout(() => {
      master.disconnect();
      for (const filter of filters) filter.disconnect();
      for (const node of outputNodes) node.disconnect();
    }, 320);
  }

  async close(): Promise<void> {
    this.stop();
    if (this.context.state !== 'closed') await this.context.close();
  }

  private safeVolume(volume: number): number {
    return Math.max(0.0001, Math.min(1, volume));
  }

  private schedule(track: MusicTrackDefinition, master: GainNode): void {
    const scheduleThrough = this.context.currentTime + 4;
    const loopSeconds = musicTrackDuration(track);
    while (this.nextLoopStart < scheduleThrough) {
      const secondsPerBeat = 60 / track.bpm;
      for (const note of track.notes) {
        const start = this.nextLoopStart + note.startBeat * secondsPerBeat;
        const end = start + note.durationBeats * secondsPerBeat;
        const duration = end - start;
        const profile = INSTRUMENT_PROFILES[note.instrument ?? 'pad'];
        const attack = Math.min(note.attackSeconds ?? profile.attackSeconds, duration * 0.4);
        const release = Math.min(note.releaseSeconds ?? profile.releaseSeconds, duration * 0.4);
        const sustainGain = Math.max(0.0001, note.gain);
        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.0001, start);
        envelope.gain.exponentialRampToValueAtTime(sustainGain, start + attack);
        const releaseStart = Math.max(start + attack, end - release);
        const decayEnd = Math.min(releaseStart, start + attack + profile.decaySeconds);
        const decayedGain = Math.max(0.0001, sustainGain * profile.sustainRatio);
        if (decayEnd > start + attack) {
          envelope.gain.exponentialRampToValueAtTime(decayedGain, decayEnd);
        }
        envelope.gain.setValueAtTime(decayedGain, releaseStart);
        envelope.gain.exponentialRampToValueAtTime(0.0001, end);
        envelope.connect(master);
        this.scheduleVoice(note, profile, envelope, start, end);
      }
      this.nextLoopStart += loopSeconds;
    }
  }

  private scheduleVoice(
    note: MusicNoteSpec,
    profile: InstrumentProfile,
    envelope: GainNode,
    start: number,
    end: number,
  ): void {
    let remaining = profile.partials.length;
    for (const partial of profile.partials) {
      const oscillator = this.context.createOscillator();
      const partialGain = this.context.createGain();
      oscillator.type = partial.wave ?? note.wave;
      oscillator.frequency.setValueAtTime(note.frequency * partial.ratio, start);
      oscillator.detune.setValueAtTime(partial.detune ?? 0, start);
      partialGain.gain.setValueAtTime(partial.level, start);
      oscillator.connect(partialGain).connect(envelope);
      oscillator.addEventListener('ended', () => {
        this.activeOscillators.delete(oscillator);
        oscillator.disconnect();
        partialGain.disconnect();
        remaining -= 1;
        if (remaining === 0) envelope.disconnect();
      });
      this.activeOscillators.add(oscillator);
      oscillator.start(start);
      oscillator.stop(end + 0.01);
    }
  }
}

export class MusicPlayer {
  private backend: MusicBackend | null = null;
  private activeTrackId: string | null = null;

  constructor(private readonly createBackend: MusicBackendFactory = () => new WebMusicBackend()) {}

  async start(trackId: MusicTrackId, preferences: AudioPreferences): Promise<boolean> {
    return this.startDefinition(getMusicTrack(trackId), preferences);
  }

  async startDefinition(
    track: MusicTrackDefinition,
    preferences: AudioPreferences,
  ): Promise<boolean> {
    if (!preferences.musicEnabled || preferences.musicVolume <= 0) {
      this.stop();
      return false;
    }
    try {
      this.backend ??= this.createBackend();
      if (this.backend.state === 'suspended') await this.backend.resume();
      if (this.backend.state !== 'running') return false;
      if (this.activeTrackId === track.id) this.backend.setVolume(preferences.musicVolume);
      else {
        this.backend.start(track, preferences.musicVolume);
        this.activeTrackId = track.id;
      }
      return true;
    } catch {
      return false;
    }
  }

  stop(): void {
    this.backend?.stop();
    this.activeTrackId = null;
  }

  async close(): Promise<void> {
    if (!this.backend) return;
    const backend = this.backend;
    this.backend = null;
    this.activeTrackId = null;
    if (backend.state !== 'closed') await backend.close();
  }
}
