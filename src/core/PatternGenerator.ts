import { PatternType, ELEMENT_POOLS, PatternConfig, getPatternConfigs } from '../config/patterns';

export interface Puzzle {
  type: PatternType;
  sequence: string[];
  correctAnswer: string;
  options: string[]; // 3 choices including correct, shuffled
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick 2 wrong options from pool, excluding every key in `exclude`. */
function pickWrongs(pool: string[], exclude: string[]): string[] {
  const candidates = pool.filter((x) => !exclude.includes(x));
  return shuffle(candidates).slice(0, 2);
}

function weightedPickType(configs: PatternConfig[]): PatternType {
  const totalWeight = configs.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * totalWeight;
  for (const config of configs) {
    r -= config.weight;
    if (r <= 0) return config.type;
  }
  return configs[0].type;
}

/** AB alternating — uses colors or shapes at random. a b a b a → answer: b */
function makeAlternating(): Puzzle {
  const pool = Math.random() < 0.5 ? ELEMENT_POOLS.colors : ELEMENT_POOLS.shapes;
  const a = pick(pool);
  const b = pick(pool.filter((x) => x !== a));
  const sequence = [a, b, a, b, a];
  const correct = b;
  // Wrongs exclude both a and b so neither pattern element appears as a distractor
  const wrongs = pickWrongs(pool, [a, b]);
  return {
    type: 'alternating',
    sequence,
    correctAnswer: correct,
    options: shuffle([correct, ...wrongs]),
  };
}

/** ABC repeating — uses shapes or objects at random. a b c a b → answer: c */
function makeRepeating(): Puzzle {
  const pool = Math.random() < 0.5 ? ELEMENT_POOLS.shapes : ELEMENT_POOLS.objects;
  const a = pick(pool);
  const remaining = pool.filter((x) => x !== a);
  const b = pick(remaining);
  const c = pick(remaining.filter((x) => x !== b));
  const sequence = [a, b, c, a, b];
  const correct = c;
  const wrongs = pickWrongs(pool, [correct]);
  return {
    type: 'repeating',
    sequence,
    correctAnswer: correct,
    options: shuffle([correct, ...wrongs]),
  };
}

/**
 * Growing sequence — randomizes start so the puzzle differs each time.
 * grow assets exist for grow_1 … grow_5.
 * start=1: [1,2,3] → 4   |   start=2: [2,3,4] → 5
 */
function makeGrowing(): Puzzle {
  const start = Math.random() < 0.5 ? 1 : 2;
  const sequence = [`grow_${start}`, `grow_${start + 1}`, `grow_${start + 2}`];
  const correct = `grow_${start + 3}`;
  const wrong1 = `grow_${start + 2}`; // last item in sequence — too small
  const wrong2 = start + 4 <= 5 ? `grow_${start + 4}` : `grow_${start + 1}`; // too big, or fallback
  return {
    type: 'growing',
    sequence,
    correctAnswer: correct,
    options: shuffle([correct, wrong1, wrong2]),
  };
}

/**
 * Size alternating — randomly starts small-big OR big-small so the
 * correct answer isn't always "small".  a b a b → answer: a
 */
function makeSizePattern(): Puzzle {
  const item = pick(ELEMENT_POOLS.shapes);
  const startSmall = Math.random() < 0.5;
  const a = `${item}_${startSmall ? 'small' : 'big'}`;
  const b = `${item}_${startSmall ? 'big' : 'small'}`;
  const sequence = [a, b, a, b];
  const correct = a;
  const altItem = pick(ELEMENT_POOLS.shapes.filter((s) => s !== item));
  // wrong1: right item, wrong size  |  wrong2: different item, right size
  const wrongs = [b, `${altItem}_${startSmall ? 'small' : 'big'}`];
  return {
    type: 'size',
    sequence,
    correctAnswer: correct,
    options: shuffle([correct, ...wrongs]),
  };
}

/**
 * ABB shape pattern — genuinely different from AB alternating.
 * a b b a b → answer: b
 */
function makeShapePattern(): Puzzle {
  const pool = ELEMENT_POOLS.shapes;
  const a = pick(pool);
  const b = pick(pool.filter((x) => x !== a));
  const sequence = [a, b, b, a, b];
  const correct = b;
  const wrongs = pickWrongs(pool, [a, b]);
  return {
    type: 'shape',
    sequence,
    correctAnswer: correct,
    options: shuffle([correct, ...wrongs]),
  };
}

export class PatternGenerator {
  /**
   * Generate a puzzle. Pass the current structureIndex as `difficulty` so
   * early sets only introduce the simplest pattern types.
   */
  generate(difficulty = 0): Puzzle {
    const configs = getPatternConfigs(difficulty);
    const type = weightedPickType(configs);
    switch (type) {
      case 'alternating':
        return makeAlternating();
      case 'repeating':
        return makeRepeating();
      case 'growing':
        return makeGrowing();
      case 'size':
        return makeSizePattern();
      case 'shape':
        return makeShapePattern();
    }
  }
}
