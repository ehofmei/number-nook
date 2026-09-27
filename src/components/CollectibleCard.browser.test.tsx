import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { getCollectible } from '../content/catalog';
import { CollectibleCard } from './CollectibleCard';
import '../styles.css';

describe('CollectibleCard in a real browser', () => {
  it('renders the selected production art style', async () => {
    const sunny = getCollectible('cozy-cats:sunny')!;
    await render(<CollectibleCard collectible={sunny} owned artStyle="sticker" />);

    const portrait = page.getByRole('img', { name: sunny.altText });
    await expect.element(portrait).toHaveAttribute('src', '/collectibles/sunny-sticker.webp');
  });

  it('falls back when a companion does not have the selected style', async () => {
    const guest = getCollectible('special-guests:button-bunny')!;
    const classicOnlyGuest = {
      ...guest,
      art: { classic: 'collectibles/button-bunny.svg' },
    };
    await render(<CollectibleCard collectible={classicOnlyGuest} owned artStyle="sticker" />);

    const portrait = page.getByRole('img', { name: guest.altText });
    await expect.element(portrait).toHaveAttribute('src', '/collectibles/button-bunny.svg');
  });

  it('renders the Special Guest Sticker portrait', async () => {
    const guest = getCollectible('special-guests:button-bunny')!;
    await render(<CollectibleCard collectible={guest} owned artStyle="sticker" />);

    const portrait = page.getByRole('img', { name: guest.altText });
    await expect
      .element(portrait)
      .toHaveAttribute('src', '/collectibles/button-bunny-sticker.webp');
  });

  it('renders a Nookside Pup Sticker portrait', async () => {
    const pup = getCollectible('nookside-pups:poppy')!;
    await render(<CollectibleCard collectible={pup} owned artStyle="sticker" />);

    const portrait = page.getByRole('img', { name: pup.altText });
    await expect.element(portrait).toHaveAttribute('src', '/collectibles/poppy-sticker.webp');
  });

  it('does not expose locked art as a long-pressable image', async () => {
    const sunny = getCollectible('cozy-cats:sunny')!;
    await render(<CollectibleCard collectible={sunny} owned={false} artStyle="sticker" />);

    const lockedArt = document.querySelector<HTMLElement>('.collectible-art--locked');
    const portrait = document.querySelector<HTMLElement>('.collectible-art-image');
    const contextMenu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });

    expect(lockedArt).not.toBeNull();
    expect(lockedArt?.querySelector('img')).toBeNull();
    expect(portrait?.tagName).toBe('SPAN');
    expect(portrait?.style.backgroundImage).toContain('/collectibles/sunny-sticker.webp');
    expect(lockedArt?.dispatchEvent(contextMenu)).toBe(false);
    expect(contextMenu.defaultPrevented).toBe(true);
  });
});
