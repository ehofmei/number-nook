import { describe, expect, it, vi } from 'vitest';
import type { MusicTrackDefinition } from './music';
import { MusicPlayer, type MusicBackend } from './musicPlayer';
import type { AudioPreferences } from './preferences';

class FakeMusicBackend implements MusicBackend {
  state: AudioContextState = 'suspended';
  readonly resume = vi.fn(() => {
    this.state = 'running';
    return Promise.resolve();
  });
  readonly start = vi.fn<(track: MusicTrackDefinition, volume: number) => void>();
  readonly setVolume = vi.fn<(volume: number) => void>();
  readonly stop = vi.fn();
  readonly close = vi.fn(() => {
    this.state = 'closed';
    return Promise.resolve();
  });
}

const audiblePreferences: AudioPreferences = {
  effectsEnabled: true,
  effectsVolume: 0.4,
  musicEnabled: true,
  musicVolume: 0.18,
  musicTrackId: 'starlight-stream',
};

describe('MusicPlayer', () => {
  it('does not create audio resources while music is disabled', async () => {
    const factory = vi.fn(() => new FakeMusicBackend());
    const player = new MusicPlayer(factory);
    await expect(
      player.start('cozy-nook', { ...audiblePreferences, musicEnabled: false }),
    ).resolves.toBe(false);
    expect(factory).not.toHaveBeenCalled();
  });

  it('unlocks once, starts one loop, and updates its volume without restarting', async () => {
    const backend = new FakeMusicBackend();
    const player = new MusicPlayer(() => backend);
    await expect(player.start('cozy-nook', audiblePreferences)).resolves.toBe(true);
    await expect(
      player.start('cozy-nook', { ...audiblePreferences, musicVolume: 0.25 }),
    ).resolves.toBe(true);
    expect(backend.resume).toHaveBeenCalledOnce();
    expect(backend.start).toHaveBeenCalledOnce();
    expect(backend.start).toHaveBeenCalledWith(expect.objectContaining({ id: 'cozy-nook' }), 0.18);
    expect(backend.setVolume).toHaveBeenCalledWith(0.25);
  });

  it('restarts the backend when the selected soundtrack changes', async () => {
    const backend = new FakeMusicBackend();
    const player = new MusicPlayer(() => backend);
    await player.start('cozy-nook', audiblePreferences);
    await player.start('quiet-cove', audiblePreferences);
    expect(backend.start).toHaveBeenCalledTimes(2);
    expect(backend.start).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'quiet-cove' }),
      0.18,
    );
  });

  it('stops cleanly and contains browser failures', async () => {
    const backend = new FakeMusicBackend();
    const player = new MusicPlayer(() => backend);
    await player.start('cozy-nook', audiblePreferences);
    player.stop();
    expect(backend.stop).toHaveBeenCalledOnce();
    await player.close();
    expect(backend.close).toHaveBeenCalledOnce();

    const unavailable = new MusicPlayer(() => {
      throw new Error('Music is unavailable');
    });
    await expect(unavailable.start('cozy-nook', audiblePreferences)).resolves.toBe(false);
  });
});
