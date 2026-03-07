export type PatternType = 'alternating' | 'repeating' | 'growing' | 'size' | 'shape';

export interface ElementPool {
  colors: string[];
  shapes: string[];
  sizes: string[];
  objects: string[];
}

export const ELEMENT_POOLS: ElementPool = {
  colors: ['red', 'blue', 'yellow', 'green', 'orange', 'purple'],
  shapes: ['circle', 'square', 'triangle', 'star', 'heart'],
  sizes: ['small', 'big'],
  objects: ['dog', 'cat', 'car', 'tree', 'sun', 'flower'],
};

export interface PatternConfig {
  type: PatternType;
  weight: number; // relative frequency
}

/**
 * Returns weighted pattern configs for the given difficulty tier (= structureIndex).
 *
 * 0 (1st structure) — easy:   AB alternating, size, growing only
 * 1 (2nd structure) — medium: + ABB shape pattern
 * 2+ (3rd structure+) — full: + 3-element repeating with objects
 */
export function getPatternConfigs(difficulty: number): PatternConfig[] {
  if (difficulty <= 0) {
    return [
      { type: 'alternating', weight: 4 },
      { type: 'size', weight: 3 },
      { type: 'growing', weight: 2 },
    ];
  }
  if (difficulty === 1) {
    return [
      { type: 'alternating', weight: 3 },
      { type: 'size', weight: 3 },
      { type: 'growing', weight: 2 },
      { type: 'shape', weight: 2 },
    ];
  }
  return [
    { type: 'alternating', weight: 2 },
    { type: 'size', weight: 2 },
    { type: 'growing', weight: 2 },
    { type: 'shape', weight: 2 },
    { type: 'repeating', weight: 2 },
  ];
}
