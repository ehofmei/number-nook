import { COZY_CATS_PACK } from './collections/cozyCats.ts';
import { LANTERN_LANE_CATS_PACK } from './collections/lanternLaneCats.ts';
import { NOOKSIDE_PUPS_PACK } from './collections/nooksidePups.ts';
import { SPECIAL_GUESTS_PACK } from './collections/specialGuests.ts';
import type { CollectionPack } from './collections/types.ts';
import {
  catalogSchema,
  type ArtStyle,
  type CatalogData,
  type CollectibleDefinition,
  type CollectionDefinition,
} from './schema.ts';

const COLLECTION_PACKS: readonly CollectionPack[] = [
  COZY_CATS_PACK,
  NOOKSIDE_PUPS_PACK,
  LANTERN_LANE_CATS_PACK,
  SPECIAL_GUESTS_PACK,
];

const rawCatalog = {
  version: '2.6.0',
  collections: COLLECTION_PACKS.map(({ collection }) => collection),
  collectibles: COLLECTION_PACKS.flatMap(({ collectibles }) => collectibles),
} satisfies CatalogData;

export const catalog = catalogSchema.parse(rawCatalog);

export function getCollectible(id: string): CollectibleDefinition | undefined {
  return catalog.collectibles.find((collectible) => collectible.id === id);
}

export function getCollection(id: string): CollectionDefinition | undefined {
  return catalog.collections.find((collection) => collection.id === id);
}

export function getStarterCollectibles(): CollectibleDefinition[] {
  return catalog.collectibles.filter((collectible) => collectible.starterEligible);
}

export function getCollectibleImage(
  collectible: CollectibleDefinition,
  preferredStyle: ArtStyle = 'classic',
): string {
  const fallbackStyle = preferredStyle === 'classic' ? 'sticker' : 'classic';
  const image = collectible.art[preferredStyle] ?? collectible.art[fallbackStyle];
  if (!image) throw new Error(`Collectible ${collectible.id} has no usable art.`);
  return image;
}
