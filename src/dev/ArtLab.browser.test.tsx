import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import { afterEach, describe, expect, it } from 'vitest';
import '../styles.css';
import { ArtLab } from './ArtLab';

describe('ArtLab in a real browser', () => {
  afterEach(async () => {
    await cleanup();
  });

  it('compares every treatment and updates all context tests from one selection', async () => {
    await render(<ArtLab />);

    await expect.element(page.getByRole('heading', { name: 'Number Nook Art Lab' })).toBeVisible();
    await expect
      .element(page.getByRole('button', { name: /Simple SVG/ }))
      .toHaveAttribute('aria-pressed', 'true');
    const scaleSamples = page.getByRole('region', { name: 'Actual-size samples' });
    await expect.element(scaleSamples.getByText('96 px', { exact: true })).toBeVisible();
    await expect.element(scaleSamples.getByText('290 px', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /Soft storybook/ }).click();
    await expect
      .element(page.getByRole('button', { name: /Soft storybook/ }))
      .toHaveAttribute('aria-pressed', 'true');
    await expect.element(page.getByText('Soft storybook').last()).toBeVisible();
    await expect.element(page.getByText('You found Moonbeam!')).toBeVisible();
    await expect
      .element(page.getByText('All five ordinary collections have production Classic'))
      .toBeVisible();
  });

  it('shows all five complete Classic collections at full and compact sizes', async () => {
    await render(<ArtLab />);

    const roster = page.getByTestId('classic-roster');
    await expect.element(page.getByText('50 / 50 drafted')).toBeVisible();
    await expect.element(roster.getByRole('img')).toHaveLength(50);
    await expect.element(roster.getByRole('img', { name: /biscuit-beige/ })).toBeVisible();
    await expect.element(roster.getByRole('img', { name: /pearly cat/ })).toBeVisible();
    await expect.element(roster.getByRole('img', { name: /messenger satchel/ })).toBeVisible();
    await expect.element(roster.getByRole('img', { name: /large tricolor pup/ })).toBeVisible();
    await expect.element(roster.getByRole('img', { name: /steaming cup/ })).toBeVisible();
    await expect
      .element(roster.getByRole('img', { name: /arch of glowing lanterns/ }))
      .toBeVisible();
    await expect.element(roster.getByRole('img', { name: /American goldfinch/ })).toBeVisible();
    await expect
      .element(roster.getByRole('img', { name: /ruby-throated hummingbird/ }))
      .toBeVisible();
    await expect.element(roster.getByRole('img', { name: /northern cardinal/ })).toBeVisible();
    await expect.element(roster.getByRole('img', { name: /blue jay/ })).toBeVisible();
    await expect
      .element(roster.getByRole('img', { name: /white-breasted nuthatch/ }))
      .toBeVisible();
    await expect.element(roster.getByRole('img', { name: /red-bellied woodpecker/ })).toBeVisible();
    await expect.element(roster.getByRole('img', { name: /green frog/ })).toBeVisible();
    await expect.element(roster.getByRole('img', { name: /painted turtle/ })).toBeVisible();
    await expect.element(roster.getByRole('img', { name: /pond skater/ })).toBeVisible();
    await expect.element(roster.getByRole('img', { name: /pond snail/ })).toBeVisible();
    await expect.element(roster.getByRole('img', { name: /mallard duck/ })).toBeVisible();
    await expect.element(roster.getByRole('img', { name: /dragonfly/ })).toBeVisible();
    await expect.element(roster.getByRole('img', { name: /beaver/ })).toBeVisible();
    await expect.element(roster.getByRole('img', { name: /river otter/ })).toBeVisible();
    await expect.element(roster.getByRole('img', { name: /axolotl/ })).toBeVisible();
    await expect.element(roster.getByRole('img', { name: /koi/ })).toBeVisible();
    await expect.element(page.getByLabelText('Classic 96 pixel comparison')).toBeVisible();

    const lockedToggle = page.getByRole('button', { name: 'Preview locked' });
    await lockedToggle.click();
    const unlockedToggle = page.getByRole('button', { name: 'Show unlocked colors' });
    await expect.element(unlockedToggle).toHaveAttribute('aria-pressed', 'true');
    await expect.element(unlockedToggle).toBeVisible();
  });

  it('compares the Sticker companions with their Classic identities', async () => {
    await render(<ArtLab />);

    await expect
      .element(page.getByRole('heading', { name: 'Companion Sticker contact sheet' }))
      .toBeVisible();
    await expect.element(page.getByRole('img', { name: /Sticker version 1/ })).toHaveLength(11);
    await expect.element(page.getByText('31 established companions')).toBeVisible();
    await expect
      .element(page.getByRole('img', { name: 'Biscuit in the Classic style' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('img', { name: /Biscuit Sticker version 1/ }))
      .toBeVisible();
    await expect
      .element(page.getByRole('img', { name: /Biscuit Sticker version 2/ }))
      .toBeVisible();
    const biscuit = page.getByTestId('sticker-biscuit');
    await expect.element(biscuit.getByText('Sticker v1 · leading')).toBeVisible();
    await expect.element(page.getByRole('img', { name: /Cloud Sticker version 2/ })).toBeVisible();
    const cloud = page.getByTestId('sticker-cloud');
    await expect.element(cloud.getByText('Sticker v2 · leading')).toBeVisible();
    await expect
      .element(page.getByRole('img', { name: 'Aurora in the Classic style' }))
      .toBeVisible();
    await expect.element(page.getByRole('img', { name: /Aurora Sticker version 1/ })).toBeVisible();
    await expect
      .element(page.getByRole('img', { name: 'Button Bunny in the Classic style' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('img', { name: /Button Bunny Sticker version 1/ }))
      .toBeVisible();
    await expect.element(page.getByRole('img', { name: /Poppy Sticker version 2/ })).toBeVisible();
    await expect.element(page.getByRole('img', { name: /Mochi Sticker version 4/ })).toBeVisible();
    await expect.element(page.getByRole('img', { name: /Rollo Sticker version 3/ })).toBeVisible();
    await expect.element(page.getByRole('img', { name: /Velvet Sticker version 2/ })).toBeVisible();
    await expect
      .element(page.getByRole('img', { name: /Crumpet Sticker version 3/ }))
      .toBeVisible();
    await expect.element(page.getByRole('img', { name: /Tansy Sticker version 4/ })).toBeVisible();
    await expect.element(page.getByRole('img', { name: /Mosaic Sticker version 2/ })).toBeVisible();
    await expect.element(page.getByRole('img', { name: /Lumina Sticker version 3/ })).toBeVisible();
  });

  it('shows all ten selected Garden Winglets Stickers together for comparison', async () => {
    await render(<ArtLab />);

    await expect
      .element(page.getByRole('heading', { name: 'Garden Winglets Sticker contact sheet' }))
      .toBeVisible();
    const section = page.getByRole('region', { name: 'Garden Winglets Sticker contact sheet' });
    await expect.element(section.getByText('10 / 10 selected')).toBeVisible();
    const roster = page.getByTestId('winglet-sticker-roster');
    await expect.element(roster.getByRole('img')).toHaveLength(10);
    for (const bird of [
      'Tuck',
      'Marigold',
      'Bluebell',
      'Tumble',
      'Zinnia',
      'Bramble',
      'Fern',
      'Tempo',
      'Prism',
      'Solstice',
    ]) {
      await expect
        .element(roster.getByRole('img', { name: new RegExp(`${bird} the`) }))
        .toBeVisible();
    }
    await expect
      .element(roster.getByRole('img', { name: /Solstice the Painted bunting/ }))
      .toHaveAttribute('src', '/src/dev/assets/solstice-sticker-v1.png');
    await expect
      .element(roster.getByRole('img', { name: /Tuck the White-breasted nuthatch/ }))
      .toHaveAttribute('src', '/src/dev/assets/tuck-sticker-v3.png');
    await expect
      .element(roster.getByRole('img', { name: /Tempo the Red-bellied woodpecker/ }))
      .toHaveAttribute('src', '/src/dev/assets/tempo-sticker-v3.png');
    await expect.element(page.getByLabelText('Garden Winglets 96 pixel comparison')).toBeVisible();
  });

  it('shows all ten selected Pondside Pals Stickers together for comparison', async () => {
    await render(<ArtLab />);

    await expect
      .element(page.getByRole('heading', { name: 'Pondside Pals Sticker contact sheet' }))
      .toBeVisible();
    const section = page.getByRole('region', { name: 'Pondside Pals Sticker contact sheet' });
    await expect.element(section.getByText('10 / 10 selected')).toBeVisible();
    const roster = page.getByTestId('pondside-sticker-roster');
    await expect.element(roster.getByRole('img')).toHaveLength(10);
    for (const pal of [
      'Moss',
      'Pebble',
      'Skim',
      'Spiral',
      'Dabble',
      'Glint',
      'Willow',
      'Ripple',
      'Lotus',
      'Opal',
    ]) {
      await expect
        .element(roster.getByRole('img', { name: new RegExp(`${pal} the`) }))
        .toBeVisible();
    }
    await expect
      .element(roster.getByRole('img', { name: /Ripple the River otter/ }))
      .toHaveAttribute('src', '/src/dev/assets/ripple-sticker-v3.png');
    await expect
      .element(roster.getByRole('img', { name: /Lotus the Axolotl/ }))
      .toHaveAttribute('src', '/src/dev/assets/lotus-sticker-v3.png');
    await expect
      .element(roster.getByRole('img', { name: /Opal the Koi/ }))
      .toHaveAttribute('src', '/src/dev/assets/opal-sticker-v2.png');
    await expect.element(page.getByLabelText('Pondside Pals 96 pixel comparison')).toBeVisible();
  });
});
