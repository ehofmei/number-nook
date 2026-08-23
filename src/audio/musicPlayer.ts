import {
  getMusicTrack,
  musicTrackDuration,
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

export class WebMusicBackend implements MusicBackend {
  private readonly context = new AudioContext();
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
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
    const filter = this.context.createBiquadFilter();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(this.safeVolume(volume), now + 0.45);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(track.filterFrequency, now);
    master.connect(filter);
    const dry = this.context.createGain();
    const ambience = track.ambience;
    dry.gain.setValueAtTime(1 - (ambience?.mix ?? 0) * 0.3, now);
    filter.connect(dry).connect(this.context.destination);
    this.outputNodes = [dry];
    if (ambience && ambience.mix > 0) {
      const delay = this.context.createDelay(1);
      const feedback = this.context.createGain();
      const wet = this.context.createGain();
      delay.delayTime.setValueAtTime(ambience.delaySeconds, now);
      feedback.gain.setValueAtTime(ambience.feedback, now);
      wet.gain.setValueAtTime(ambience.mix, now);
      filter.connect(delay);
      delay.connect(feedback).connect(delay);
      delay.connect(wet).connect(this.context.destination);
      this.outputNodes.push(delay, feedback, wet);
    }
    this.master = master;
    this.filter = filter;
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
    const filter = this.filter;
    const outputNodes = this.outputNodes;
    this.master = null;
    this.filter = null;
    this.outputNodes = [];
    if (!master) return;
    const now = this.context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    window.setTimeout(() => {
      master.disconnect();
      filter?.disconnect();
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
        const attack = Math.min(note.attackSeconds ?? 0.08, duration * 0.4);
        const release = Math.min(note.releaseSeconds ?? 0.18, duration * 0.4);
        const sustainGain = Math.max(0.0001, note.gain);
        const oscillator = this.context.createOscillator();
        const envelope = this.context.createGain();
        oscillator.type = note.wave;
        oscillator.frequency.setValueAtTime(note.frequency, start);
        envelope.gain.setValueAtTime(0.0001, start);
        envelope.gain.exponentialRampToValueAtTime(sustainGain, start + attack);
        envelope.gain.setValueAtTime(sustainGain, Math.max(start + attack, end - release));
        envelope.gain.exponentialRampToValueAtTime(0.0001, end);
        oscillator.connect(envelope).connect(master);
        oscillator.addEventListener('ended', () => {
          this.activeOscillators.delete(oscillator);
          oscillator.disconnect();
          envelope.disconnect();
        });
        this.activeOscillators.add(oscillator);
        oscillator.start(start);
        oscillator.stop(end + 0.01);
      }
      this.nextLoopStart += loopSeconds;
    }
  }
}

export class MusicPlayer {
  private backend: MusicBackend | null = null;
  private activeTrackId: MusicTrackId | null = null;

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
