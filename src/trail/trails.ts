import type { RandomSource } from '../domain/random';
import blueFeather from './assets/trail-collectible-blue-feather-v1.webp';
import brassKey from './assets/trail-collectible-brass-key-v1.webp';
import butterfly from './assets/trail-collectible-butterfly-v1.webp';
import compass from './assets/trail-collectible-compass-v1.webp';
import goldenLeaf from './assets/trail-collectible-golden-leaf-v1.webp';
import honeycomb from './assets/trail-collectible-honeycomb-v1.webp';
import ladybug from './assets/trail-collectible-ladybug-v1.webp';
import moonCrystal from './assets/trail-collectible-moon-crystal-v1.webp';
import mushroom from './assets/trail-collectible-mushroom-v1.webp';
import pinecone from './assets/trail-collectible-pinecone-v1.webp';
import rainbowPebble from './assets/trail-collectible-rainbow-pebble-v1.webp';
import seashell from './assets/trail-collectible-seashell-v1.webp';
import landscapeBoard from './assets/trail-quest-meadow-v1.webp';
import portraitBoard from './assets/trail-quest-meadow-portrait-v1.webp';

export type TrailPoint = readonly [x: number, y: number];
export type TrailItemKind = 'treasure' | 'bonus' | 'challenge';

export interface TrailItemDefinition {
  id: string;
  kind: TrailItemKind;
  name: string;
  src: string;
}

export interface TrailLevelDefinition {
  id: string;
  name: string;
  destination: string;
  landscapeBoard: string;
  portraitBoard: string;
  landscapeRoute: readonly TrailPoint[];
  portraitRoute: readonly TrailPoint[];
  itemIds: readonly string[];
}

export interface TrailRunDefinition extends Omit<TrailLevelDefinition, 'itemIds'> {
  itemPool: readonly TrailItemDefinition[];
  items: readonly TrailItemDefinition[];
}

export const TRAIL_ITEM_LIBRARY = [
  { id: 'golden-leaf', kind: 'treasure', name: 'golden leaf', src: goldenLeaf },
  { id: 'woodland-mushroom', kind: 'treasure', name: 'woodland mushroom', src: mushroom },
  { id: 'pinecone', kind: 'treasure', name: 'pinecone', src: pinecone },
  { id: 'blue-feather', kind: 'treasure', name: 'blue feather', src: blueFeather },
  { id: 'honeycomb', kind: 'treasure', name: 'honeycomb', src: honeycomb },
  { id: 'rainbow-pebble', kind: 'treasure', name: 'rainbow pebble', src: rainbowPebble },
  { id: 'brass-key', kind: 'treasure', name: 'brass key', src: brassKey },
  { id: 'moon-crystal', kind: 'treasure', name: 'moon crystal', src: moonCrystal },
  { id: 'seashell', kind: 'treasure', name: 'seashell', src: seashell },
  { id: 'ladybug', kind: 'treasure', name: 'ladybug', src: ladybug },
  { id: 'butterfly', kind: 'treasure', name: 'butterfly', src: butterfly },
  { id: 'trail-compass', kind: 'treasure', name: 'trail compass', src: compass },
] as const satisfies readonly TrailItemDefinition[];

const LANDSCAPE_ROUTE = [
  [8, 68],
  [17, 67],
  [27, 63],
  [38, 64],
  [48, 61],
  [56, 55],
  [64, 49],
  [72, 43],
  [80, 37],
  [87, 30],
  [92, 20],
] as const satisfies readonly TrailPoint[];

const PORTRAIT_ROUTE = [
  [43, 54],
  [42, 51],
  [40, 48],
  [40, 45],
  [45, 42],
  [54, 39],
  [63, 37],
  [68, 33],
  [73, 29],
  [80, 24],
  [85, 18],
] as const satisfies readonly TrailPoint[];

export const TRAIL_QUEST_LENGTH = 10;

export const MEADOW_LEVEL = {
  id: 'sunny-meadow',
  name: 'Sunny Meadow',
  destination: 'picnic nook',
  landscapeBoard,
  portraitBoard,
  landscapeRoute: LANDSCAPE_ROUTE,
  portraitRoute: PORTRAIT_ROUTE,
  itemIds: TRAIL_ITEM_LIBRARY.map(({ id }) => id),
} as const satisfies TrailLevelDefinition;

export const TRAIL_LEVELS = [MEADOW_LEVEL] as const satisfies readonly TrailLevelDefinition[];

const ITEM_BY_ID = new Map<string, TrailItemDefinition>(
  TRAIL_ITEM_LIBRARY.map((item) => [item.id, item]),
);

export function createRandomTrailRun(
  random: RandomSource,
  levels: readonly TrailLevelDefinition[] = TRAIL_LEVELS,
): TrailRunDefinition {
  if (levels.length === 0) throw new Error('Trail Quest needs at least one level.');
  const level = random.pick(levels);
  const uniqueItemIds = new Set(level.itemIds);
  if (uniqueItemIds.size !== level.itemIds.length) {
    throw new Error(`Trail level ${level.id} contains duplicate item IDs.`);
  }
  const itemPool = level.itemIds.map((id) => {
    const item = ITEM_BY_ID.get(id);
    if (!item) throw new Error(`Trail level ${level.id} references unknown item ${id}.`);
    return item;
  });
  const availableTreasures = itemPool.filter(({ kind }) => kind === 'treasure');
  if (availableTreasures.length < TRAIL_QUEST_LENGTH) {
    throw new Error(
      `Trail level ${level.id} needs at least ${TRAIL_QUEST_LENGTH} playable treasures.`,
    );
  }
  return {
    id: level.id,
    name: level.name,
    destination: level.destination,
    landscapeBoard: level.landscapeBoard,
    portraitBoard: level.portraitBoard,
    landscapeRoute: level.landscapeRoute,
    portraitRoute: level.portraitRoute,
    itemPool,
    items: random.shuffle(availableTreasures).slice(0, TRAIL_QUEST_LENGTH),
  };
}
