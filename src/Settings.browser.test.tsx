import { useState } from 'react';
import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_AUDIO_PREFERENCES, type AudioPreferences } from './audio/preferences';
import { Settings } from './App';
import './styles.css';

function SettingsHarness({ onBack = () => undefined }: { onBack?: () => void }) {
  const [preferences, setPreferences] = useState<AudioPreferences>(DEFAULT_AUDIO_PREFERENCES);
  return (
    <Settings
      preferences={preferences}
      onChange={setPreferences}
      onReset={() => setPreferences(DEFAULT_AUDIO_PREFERENCES)}
      onBack={onBack}
    />
  );
}

describe('Settings in a real browser', () => {
  afterEach(async () => {
    await cleanup();
  });

  it('controls effects and music independently and resets audio defaults', async () => {
    await render(<SettingsHarness />);

    await expect.element(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect.element(page.getByRole('checkbox', { name: 'Sound effects on' })).toBeChecked();
    await expect
      .element(page.getByRole('checkbox', { name: 'Background music off' }))
      .not.toBeChecked();
    await expect
      .element(page.getByRole('button', { name: /Cozy Electric Piano/ }))
      .toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('checkbox', { name: 'Sound effects on' }).click();
    await expect
      .element(page.getByRole('checkbox', { name: 'Sound effects off' }))
      .not.toBeChecked();

    await page.getByRole('checkbox', { name: 'Background music off' }).click();
    await page.getByRole('slider', { name: 'Music volume' }).fill('0.32');
    await page.getByRole('button', { name: /Moonlit Window/ }).click();
    await expect
      .element(page.getByRole('button', { name: /Moonlit Window/ }))
      .toHaveAttribute('aria-pressed', 'true');
    await expect.element(page.getByRole('slider', { name: 'Music volume' })).toHaveValue('0.32');

    await page.getByRole('button', { name: 'Reset audio defaults' }).click();
    await expect.element(page.getByRole('checkbox', { name: 'Sound effects on' })).toBeChecked();
    await expect
      .element(page.getByRole('checkbox', { name: 'Background music off' }))
      .not.toBeChecked();
    await expect.element(page.getByRole('slider', { name: 'Music volume' })).toHaveValue('0.18');
    await expect
      .element(page.getByRole('button', { name: /Cozy Electric Piano/ }))
      .toHaveAttribute('aria-pressed', 'true');
  });

  it('returns to the previous screen', async () => {
    const onBack = vi.fn();
    await render(<SettingsHarness onBack={onBack} />);
    await page.getByRole('button', { name: 'Back' }).click();
    expect(onBack).toHaveBeenCalledOnce();
  });
});
