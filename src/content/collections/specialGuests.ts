import type { CollectionPack } from './types.ts';

export const SPECIAL_GUESTS_PACK = {
  collection: {
    id: 'special-guests',
    name: 'Special Guests',
    description: 'One-of-a-kind friends visiting Number Nook.',
    sortOrder: 100,
  },
  collectibles: [
    {
      id: 'special-guests:button-bunny',
      collectionId: 'special-guests',
      name: 'Button Bunny',
      species: 'rabbit',
      specialGuest: true,
      rarity: 'special',
      description: 'A well-loved plush guest with a talent for lucky answers.',
      art: {
        classic: 'collectibles/button-bunny.svg',
        sticker: 'collectibles/button-bunny-sticker.webp',
      },
      theme: {
        accent: '#157A6E',
        accentStrong: '#0C554E',
        accentSoft: '#DDF5EF',
        pageTint: '#FFF9EE',
        glowPrimary: '#D2F0E8',
        glowSecondary: '#FFE4A8',
      },
      altText: 'A cozy teal plush bunny with a yellow button.',
      capsuleEligible: true,
      capsuleWeight: 1,
      shopEligible: true,
      shopPrice: 1200,
      starterEligible: false,
      sortOrder: 200,
    },
  ],
} as const satisfies CollectionPack;
