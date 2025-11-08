// lib/initialPrices.ts
export type AreaType = 'bathroom' | 'backsplash' | 'floor';
export type MaterialType = 'tile' | 'porcelain';
export type Complexity = 'normal' | 'diagonal' | 'largeFormat' | 'mosaic';
export type TileSize = 'small' | 'medium' | 'large60x120' | 'xl120plus';

export interface Prices {
  base: {
    bathroom: { tile: number; porcelain: number };
    backsplash: { tile: number; porcelain: number };
    floor: { tile: number; porcelain: number };
  };
  coefficients: {
    normal: number;
    diagonal: number;
    largeFormat: number;
    mosaic: number;
  };
  sizeMultipliers: {
    small: number;
    medium: number;
    large60x120: number;
    xl120plus: number;
  };
  extras: {
    demolitionPerM2: number;
    prepPerM2: number;
    adhesivePerM2: number;
    groutPerM2: number;
    waterproofingPerM2: number;

    miterPerLm: number;
    siliconePerLm: number;
    holePerEach: number;
    gklBoxPerEach: number;

    packageDiscountPct: number;
    minJob: number;
  };
}

export const initialPrices: Prices = {
  base: {
    bathroom:  { tile: 1200, porcelain: 1400 },
    backsplash:{ tile:  900, porcelain: 1100 },
    floor:     { tile: 1100, porcelain: 1300 },
  },
  coefficients: {
    normal: 1.00,
    diagonal: 1.10,
    largeFormat: 1.15,
    mosaic: 1.30,
  },
  sizeMultipliers: {
    small: 0.95,
    medium: 1.00,
    large60x120: 1.08,
    xl120plus: 1.15,
  },
  extras: {
    demolitionPerM2: 500,
    prepPerM2: 450,
    adhesivePerM2: 250,
    groutPerM2: 200,
    waterproofingPerM2: 350,

    miterPerLm: 650,
    siliconePerLm: 120,
    holePerEach: 250,
    gklBoxPerEach: 1500,

    packageDiscountPct: 5,
    minJob: 12000,
  }
};
