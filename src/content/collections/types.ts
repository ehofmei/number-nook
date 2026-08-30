import type { CollectibleDefinition, CollectionDefinition } from '../schema.ts';

export interface CollectionPack {
  collection: CollectionDefinition;
  collectibles: readonly CollectibleDefinition[];
}
