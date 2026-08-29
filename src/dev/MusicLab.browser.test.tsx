import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageAudioPreferencesRepository } from '../audio/preferences';
import '../styles.css';
import { MusicLab } from './MusicLab';

describe('MusicLab in a real browser', () => {
  beforeEach(() => {
    localStorage.removeItem(LocalStorageAudioPreferencesRepository.key);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('keeps music opt-in and exposes independent listening controls', async () => {
    await render(<MusicLab />);

    await expect
      .element(page.getByRole('heading', { name: 'Number Nook Music Lab' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('checkbox', { name: 'Background music off' }))
      .not.toBeChecked();
    await expect
      .element(page.getByRole('button', { name: 'Start customized loop' }))
      .toBeDisabled();

    await page.getByRole('checkbox', { name: 'Background music off' }).click();
    await expect.element(page.getByRole('checkbox', { name: 'Background music on' })).toBeChecked();
    await expect.element(page.getByRole('button', { name: 'Start customized loop' })).toBeEnabled();
    expect(
      JSON.parse(
        localStorage.getItem(LocalStorageAudioPreferencesRepository.key) ?? '{}',
      ) as unknown,
    ).toEqual({
      effectsEnabled: true,
      effectsVolume: 0.4,
      musicEnabled: true,
      musicVolume: 0.18,
      musicTrackId: 'cozy-electric-piano-theme',
      musicCatalogVersion: 2,
    });
  });

  it('filters the listening library, switches contrasting tracks, and tunes a recipe', async () => {
    await render(<MusicLab />);
    await page.getByRole('checkbox', { name: 'Background music off' }).click();
    await page.getByRole('button', { name: 'Play Cozy Electric Piano — Theme' }).click();
    await expect
      .element(page.getByRole('button', { name: 'Playing Cozy Electric Piano — Theme' }))
      .toHaveAttribute('aria-pressed', 'true');
    await expect
      .element(page.getByRole('status', { name: 'Music Lab status' }))
      .toHaveTextContent('Playing “Cozy Electric Piano — Theme.”');

    await page.getByRole('button', { name: /^Plucked/ }).click();
    await expect
      .element(page.getByRole('button', { name: 'Play Music Box Evening' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Play Cozy Electric Piano — Theme' }))
      .not.toBeInTheDocument();
    await page.getByRole('button', { name: 'Play Music Box Evening' }).click();

    await page.getByRole('button', { name: /^References/ }).click();
    await page.getByRole('button', { name: 'Play Quiet Cove' }).click();
    await expect
      .element(page.getByRole('slider', { name: 'Music foreground presence' }))
      .toBeDisabled();
    await page.getByRole('button', { name: 'Play Moonlit Window' }).click();
    await expect
      .element(page.getByRole('button', { name: 'Playing Moonlit Window' }))
      .toBeVisible();
    await page.getByRole('slider', { name: 'Music foreground presence' }).fill('40');
    await page.getByRole('button', { name: 'Play Starlight Stream' }).click();
    await expect
      .element(page.getByRole('status', { name: 'Foreground presence 100' }))
      .toHaveTextContent('100%');
    await page.getByRole('checkbox', { name: 'Background music on' }).click();
    await expect
      .element(page.getByRole('status', { name: 'Music Lab status' }))
      .toHaveTextContent('Music is off');
    await expect
      .element(page.getByRole('button', { name: 'Play Starlight Stream' }))
      .toBeDisabled();
    await page.getByRole('checkbox', { name: 'Background music off' }).click();
    await page.getByRole('button', { name: /^Piano/ }).click();
    await page.getByRole('button', { name: 'Play Cozy Electric Piano', exact: true }).click();
    await page.getByRole('slider', { name: 'Music tempo' }).fill('115');
    await page.getByRole('slider', { name: 'Music warmth' }).fill('80');
    await page.getByRole('slider', { name: 'Music foreground presence' }).fill('130');

    await expect.element(page.getByText('115%')).toBeVisible();
    await expect.element(page.getByText('80%')).toBeVisible();
    await expect.element(page.getByText('130%')).toBeVisible();
    await page.getByRole('button', { name: 'Start customized loop' }).click();
    await expect.element(page.getByRole('button', { name: 'Stop music' })).toBeEnabled();
    await expect
      .element(page.getByRole('status', { name: 'Music Lab status' }))
      .toHaveTextContent(/Playing “Cozy Electric Piano”|Turn music on/);
    await page.getByRole('button', { name: 'Stop music' }).click();
    await expect
      .element(page.getByRole('status', { name: 'Music Lab status' }))
      .toHaveTextContent('Music stopped');
  });
});
