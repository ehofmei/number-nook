import { describe, expect, it } from 'vitest';
import { PONDSIDE_PALS_PERSONALITIES } from '../../companions/personalities/pondsidePals.ts';
import { PONDSIDE_PALS_SIGNATURE_PHRASES } from '../../companions/signatures/pondsidePals.ts';
import { catalog, getCollectibleImage } from '../catalog.ts';
import { collectionSchema, companionThemeSchema } from '../schema.ts';
import { PONDSIDE_PALS_PACK } from './pondsidePals.ts';

describe('Pondside Pals collection pack', () => {
  it('defines ten unique ordinary companions with the standard rarity distribution', () => {
    const { collection, collectibles } = PONDSIDE_PALS_PACK;
    const rarityCounts = collectibles.reduce<Record<string, number>>((counts, companion) => {
      counts[companion.rarity] = (counts[companion.rarity] ?? 0) + 1;
      return counts;
    }, {});

    expect(collectionSchema.safeParse(collection).success).toBe(true);
    expect(collectibles).toHaveLength(10);
    expect(new Set(collectibles.map(({ id }) => id)).size).toBe(10);
    expect(new Set(collectibles.map(({ name }) => name)).size).toBe(10);
    expect(new Set(collectibles.map(({ sortOrder }) => sortOrder)).size).toBe(10);
    expect(rarityCounts).toEqual({ common: 4, uncommon: 3, rare: 2, legendary: 1 });
    expect(
      collectibles.every(
        ({ id, collectionId, specialGuest, starterEligible }) =>
          id.startsWith(`${collectionId}:`) && !specialGuest && !starterEligible,
      ),
    ).toBe(true);
    expect(
      collectibles.every(
        ({ id, name, species, description, artDirection }) =>
          /^pondside-pals:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) &&
          name.length >= 1 &&
          name.length <= 40 &&
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(species) &&
          description.length >= 1 &&
          description.length <= 160 &&
          Object.values(artDirection).every((value) => value.length > 0),
      ),
    ).toBe(true);
  });

  it('uses the standard economy, valid themes, and complete dual-style art', () => {
    for (const companion of PONDSIDE_PALS_PACK.collectibles) {
      expect(companionThemeSchema.safeParse(companion.theme).success).toBe(true);
      expect({ common: 60, uncommon: 25, rare: 10, legendary: 4 }[companion.rarity]).toBe(
        companion.capsuleWeight,
      );
      expect({ common: 120, uncommon: 240, rare: 480, legendary: 840 }[companion.rarity]).toBe(
        companion.shopPrice,
      );
      expect(companion.art.sticker).toBe(
        `collectibles/${companion.name.toLowerCase()}-sticker.webp`,
      );
      expect(getCollectibleImage(companion, 'classic')).toBe(companion.art.classic);
      expect(getCollectibleImage(companion, 'sticker')).toBe(companion.art.sticker);
    }
  });

  it('publishes the complete pack with personalities and signature dialogue', () => {
    const ids = new Set(PONDSIDE_PALS_PACK.collectibles.map(({ id }) => id));

    expect(catalog.collections.some(({ id }) => id === PONDSIDE_PALS_PACK.collection.id)).toBe(
      true,
    );
    expect(
      catalog.collectibles.filter(({ collectionId }) => collectionId === 'pondside-pals'),
    ).toHaveLength(10);
    expect(PONDSIDE_PALS_PERSONALITIES).toHaveLength(10);
    expect(PONDSIDE_PALS_PERSONALITIES.every(({ companionId }) => ids.has(companionId))).toBe(true);
    expect(PONDSIDE_PALS_SIGNATURE_PHRASES).toHaveLength(30);
    expect(
      PONDSIDE_PALS_SIGNATURE_PHRASES.every(({ companionIds }) =>
        companionIds?.every((id) => ids.has(id)),
      ),
    ).toBe(true);
  });
});
