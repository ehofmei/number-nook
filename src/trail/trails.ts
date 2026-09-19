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

export interface TrailCollectible {
  name: string;
  src: string;
}

export interface TrailDefinition {
  id: string;
  name: string;
  destination: string;
  landscapeBoard: string;
  portraitBoard: string;
  landscapeRoute: readonly TrailPoint[];
  portraitRoute: readonly TrailPoint[];
  collectibles: readonly TrailCollectible[];
}

export const TRAIL_COLLECTIBLE_LIBRARY = [
  { name: 'golden leaf', src: goldenLeaf },
  { name: 'woodland mushroom', src: mushroom },
  { name: 'pinecone', src: pinecone },
  { name: 'blue feather', src: blueFeather },
  { name: 'honeycomb', src: honeycomb },
  { name: 'rainbow pebble', src: rainbowPebble },
  { name: 'brass key', src: brassKey },
  { name: 'moon crystal', src: moonCrystal },
  { name: 'seashell', src: seashell },
  { name: 'ladybug', src: ladybug },
  { name: 'butterfly', src: butterfly },
  { name: 'trail compass', src: compass },
] as const satisfies readonly TrailCollectible[];

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
  [43, 49],
  [47, 46],
  [50, 43],
  [50, 40],
  [52, 37],
  [57, 34],
  [62, 30],
  [68, 26],
  [74, 22],
  [80, 18],
  [85, 14],
] as const satisfies readonly TrailPoint[];

export const TRAIL_QUEST_LENGTH = 10;

export const MEADOW_TRAIL = {
  id: 'sunny-meadow',
  name: 'Sunny Meadow',
  destination: 'picnic nook',
  landscapeBoard,
  portraitBoard,
  landscapeRoute: LANDSCAPE_ROUTE,
  portraitRoute: PORTRAIT_ROUTE,
  collectibles: TRAIL_COLLECTIBLE_LIBRARY.slice(0, TRAIL_QUEST_LENGTH),
} as const satisfies TrailDefinition;
