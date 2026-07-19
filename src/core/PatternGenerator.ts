import { PatternType, ELEMENT_POOLS, PatternConfig, getPatternConfigs } from '../config/patterns';

export interface MathProblem {
  a: number;
  b: number;
  op: '+' | '-';
  item: string; // sprite key used to draw countable objects
}

export interface Puzzle {
  type: PatternType;
  /**
   * 'fill' — complete the gap from 3 options.
   * 'odd' — tap the item that doesn't belong.
   * 'math' — count objects and pick the right number.
   */
  mode: 'fill' | 'odd' | 'math';
  sequence: string[];
  correctAnswer: string;
  options: string[];
  gapIndex: number; // index in sequence where the '?' appears (fill mode)
  oddIndex: number; // index of the odd item (odd mode)
  math?: MathProblem; // math mode only
}

/** Puzzle shape returned by fill-the-gap makers; mode/oddIndex are added in generate(). */
type FillPuzzle = Omit<Puzzle, 'mode' | 'oddIndex'>;

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

/** Pick a gap position. If mid-gap is allowed, choose uniformly from validMin..end; otherwise always end. */
function pickGapIndex(seqLength: number, validMin: number, allowMidGap: boolean): number {
  const endIndex = seqLength - 1;
  if (!allowMidGap) return endIndex;
  const positions: number[] = [];
  for (let i = validMin; i <= endIndex; i++) positions.push(i);
  return pick(positions);
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

/** AB alternating — uses colors or shapes at random. Gap can appear mid-sequence. */
function makeAlternating(allowMidGap: boolean): FillPuzzle {
  const pool = Math.random() < 0.5 ? ELEMENT_POOLS.colors : ELEMENT_POOLS.shapes;
  const a = pick(pool);
  const b = pick(pool.filter((x) => x !== a));
  const sequence = [a, b, a, b, a, b];
  const gapIndex = pickGapIndex(sequence.length, 1, allowMidGap);
  const correct = sequence[gapIndex];
  const wrongs = pickWrongs(pool, [a, b]);
  return {
    type: 'alternating',
    sequence,
    correctAnswer: correct,
    options: shuffle([correct, ...wrongs]),
    gapIndex,
  };
}

/** ABC repeating — uses shapes or objects at random. Gap can appear mid-sequence. */
function makeRepeating(allowMidGap: boolean): FillPuzzle {
  const pool = Math.random() < 0.5 ? ELEMENT_POOLS.shapes : ELEMENT_POOLS.objects;
  const a = pick(pool);
  const remaining = pool.filter((x) => x !== a);
  const b = pick(remaining);
  const c = pick(remaining.filter((x) => x !== b));
  const sequence = [a, b, c, a, b, c];
  const gapIndex = pickGapIndex(sequence.length, 2, allowMidGap);
  const correct = sequence[gapIndex];
  const wrongs = pickWrongs(pool, [correct]);
  return {
    type: 'repeating',
    sequence,
    correctAnswer: correct,
    options: shuffle([correct, ...wrongs]),
    gapIndex,
  };
}

/**
 * Growing sequence — randomizes start. Gap can appear mid-sequence.
 * grow assets exist for grow_1 … grow_5.
 */
function makeGrowing(allowMidGap: boolean): FillPuzzle {
  const start = Math.random() < 0.5 ? 1 : 2;
  const sequence = [`grow_${start}`, `grow_${start + 1}`, `grow_${start + 2}`, `grow_${start + 3}`];
  const gapIndex = pickGapIndex(sequence.length, 1, allowMidGap);
  const correct = sequence[gapIndex];
  const correctNum = start + gapIndex;
  // Pick the 2 closest grow values as distractors
  const pool: string[] = [];
  for (let n = 1; n <= 5; n++) {
    if (n !== correctNum) pool.push(`grow_${n}`);
  }
  pool.sort((x, y) => {
    const xn = parseInt(x.split('_')[1]);
    const yn = parseInt(y.split('_')[1]);
    return Math.abs(xn - correctNum) - Math.abs(yn - correctNum);
  });
  const wrongs = pool.slice(0, 2);
  return {
    type: 'growing',
    sequence,
    correctAnswer: correct,
    options: shuffle([correct, ...wrongs]),
    gapIndex,
  };
}

/**
 * Size alternating — randomly starts small-big OR big-small.
 * Gap can appear mid-sequence.
 */
function makeSizePattern(allowMidGap: boolean): FillPuzzle {
  const item = pick(ELEMENT_POOLS.shapes);
  const startSmall = Math.random() < 0.5;
  const a = `${item}_${startSmall ? 'small' : 'big'}`;
  const b = `${item}_${startSmall ? 'big' : 'small'}`;
  const sequence = [a, b, a, b, a];
  const gapIndex = pickGapIndex(sequence.length, 2, allowMidGap);
  const correct = sequence[gapIndex];
  const altItem = pick(ELEMENT_POOLS.shapes.filter((s) => s !== item));
  const oppositeSize = correct === a ? b : a;
  const sameSize = correct === a
    ? `${altItem}_${startSmall ? 'small' : 'big'}`
    : `${altItem}_${startSmall ? 'big' : 'small'}`;
  const wrongs = [oppositeSize, sameSize];
  return {
    type: 'size',
    sequence,
    correctAnswer: correct,
    options: shuffle([correct, ...wrongs]),
    gapIndex,
  };
}

/**
 * ABB shape pattern — genuinely different from AB alternating.
 * Gap can appear mid-sequence.
 */
function makeShapePattern(allowMidGap: boolean): FillPuzzle {
  const pool = ELEMENT_POOLS.shapes;
  const a = pick(pool);
  const b = pick(pool.filter((x) => x !== a));
  const sequence = [a, b, b, a, b, b];
  const gapIndex = pickGapIndex(sequence.length, 1, allowMidGap);
  const correct = sequence[gapIndex];
  const wrongs = pickWrongs(pool, [a, b]);
  return {
    type: 'shape',
    sequence,
    correctAnswer: correct,
    options: shuffle([correct, ...wrongs]),
    gapIndex,
  };
}

/** Mirror/palindrome pattern — a b c b a. Gap avoids the center since it doesn't test symmetry. */
function makeMirror(): FillPuzzle {
  const pool = Math.random() < 0.5 ? ELEMENT_POOLS.colors : ELEMENT_POOLS.shapes;
  const a = pick(pool);
  const remaining = pool.filter((x) => x !== a);
  const b = pick(remaining);
  const c = pick(remaining.filter((x) => x !== b));
  const sequence = [a, b, c, b, a];
  const gapIndex = pick([0, 1, 3, 4]); // skip center — doesn't test symmetry
  const correct = sequence[gapIndex];
  const wrongs = pickWrongs(pool, [a, b, c]);
  return {
    type: 'mirror',
    sequence,
    correctAnswer: correct,
    options: shuffle([correct, ...wrongs]),
    gapIndex,
  };
}

/** Color+Shape combo — child must match both attributes. Distractors swap one attribute. */
function makeCombo(allowMidGap: boolean): FillPuzzle {
  const colors = ELEMENT_POOLS.colors;
  const shapes = ELEMENT_POOLS.shapes;
  const c1 = pick(colors);
  const s1 = pick(shapes);
  const c2 = pick(colors.filter((c) => c !== c1));
  const s2 = pick(shapes.filter((s) => s !== s1));
  const a = `${c1}_${s1}`;
  const b = `${c2}_${s2}`;
  const sequence = [a, b, a, b, a, b];
  const gapIndex = pickGapIndex(sequence.length, 2, allowMidGap);
  const correct = sequence[gapIndex];
  const [correctColor, correctShape] = correct.split('_');
  const wrongShape = pick(shapes.filter((s) => s !== correctShape));
  const wrongColor = pick(colors.filter((c) => c !== correctColor));
  const wrongs = [
    `${correctColor}_${wrongShape}`, // right color, wrong shape
    `${wrongColor}_${correctShape}`, // wrong color, right shape
  ];
  return {
    type: 'combo',
    sequence,
    correctAnswer: correct,
    options: shuffle([correct, ...wrongs]),
    gapIndex,
  };
}

/** AAB rhythm pattern — a a b a a b. A different beat than plain alternating. */
function makeAAB(allowMidGap: boolean): FillPuzzle {
  const pool = Math.random() < 0.5 ? ELEMENT_POOLS.colors : ELEMENT_POOLS.objects;
  const a = pick(pool);
  const b = pick(pool.filter((x) => x !== a));
  const sequence = [a, a, b, a, a, b];
  const gapIndex = pickGapIndex(sequence.length, 2, allowMidGap);
  const correct = sequence[gapIndex];
  const wrongs = pickWrongs(pool, [a, b]);
  return {
    type: 'aab',
    sequence,
    correctAnswer: correct,
    options: shuffle([correct, ...wrongs]),
    gapIndex,
  };
}

/** Shrinking sequence — the reverse of growing: 5, 4, 3, 2 blocks. */
function makeShrinking(allowMidGap: boolean): FillPuzzle {
  const start = Math.random() < 0.5 ? 5 : 4;
  const sequence = [`grow_${start}`, `grow_${start - 1}`, `grow_${start - 2}`, `grow_${start - 3}`];
  const gapIndex = pickGapIndex(sequence.length, 1, allowMidGap);
  const correct = sequence[gapIndex];
  const correctNum = start - gapIndex;
  const pool: string[] = [];
  for (let n = 1; n <= 5; n++) {
    if (n !== correctNum) pool.push(`grow_${n}`);
  }
  pool.sort((x, y) => {
    const xn = parseInt(x.split('_')[1]);
    const yn = parseInt(y.split('_')[1]);
    return Math.abs(xn - correctNum) - Math.abs(yn - correctNum);
  });
  const wrongs = pool.slice(0, 2);
  return {
    type: 'shrinking',
    sequence,
    correctAnswer: correct,
    options: shuffle([correct, ...wrongs]),
    gapIndex,
  };
}

const ARROW_DIRS = ['arrow_up', 'arrow_right', 'arrow_down', 'arrow_left'];

/** Rotation pattern — an arrow turning clockwise (or counter-clockwise) each step. */
function makeRotation(allowMidGap: boolean): FillPuzzle {
  const clockwise = Math.random() < 0.5;
  const startDir = Math.floor(Math.random() * 4);
  const sequence: string[] = [];
  for (let i = 0; i < 6; i++) {
    const idx = ((startDir + (clockwise ? i : -i)) % 4 + 4) % 4;
    sequence.push(ARROW_DIRS[idx]);
  }
  const gapIndex = pickGapIndex(sequence.length, 2, allowMidGap);
  const correct = sequence[gapIndex];
  const wrongs = pickWrongs(ARROW_DIRS, [correct]);
  return {
    type: 'rotation',
    sequence,
    correctAnswer: correct,
    options: shuffle([correct, ...wrongs]),
    gapIndex,
  };
}

/**
 * Odd-one-out — a different question format: 4 items, one doesn't belong.
 * The child taps the odd item directly (no separate answer row).
 */
function makeOddOne(): Puzzle {
  const pool = pick([ELEMENT_POOLS.colors, ELEMENT_POOLS.shapes, ELEMENT_POOLS.objects]);
  const base = pick(pool);
  const odd = pick(pool.filter((x) => x !== base));
  const oddIndex = Math.floor(Math.random() * 4);
  const sequence = [base, base, base, base];
  sequence[oddIndex] = odd;
  return {
    type: 'oddone',
    mode: 'odd',
    sequence,
    correctAnswer: odd,
    options: [],
    gapIndex: -1,
    oddIndex,
  };
}

/**
 * Simple math — count objects and pick the right number.
 * Addition or subtraction, all values within 0..10, result at least 1.
 */
function makeMath(): Puzzle {
  const op: '+' | '-' = Math.random() < 0.5 ? '+' : '-';
  let a: number;
  let b: number;
  if (op === '+') {
    a = 1 + Math.floor(Math.random() * 8); // 1..8
    b = 1 + Math.floor(Math.random() * Math.min(10 - a, 5)); // keep sum ≤ 10
  } else {
    a = 3 + Math.floor(Math.random() * 8); // 3..10
    b = 1 + Math.floor(Math.random() * (a - 1)); // result ≥ 1
  }
  const result = op === '+' ? a + b : a - b;

  // Distractors: numbers close to the answer, clamped to 0..10
  const candidates: number[] = [];
  for (let d = 1; d <= 3; d++) {
    if (result - d >= 0) candidates.push(result - d);
    if (result + d <= 10) candidates.push(result + d);
  }
  const wrongs = shuffle(candidates).slice(0, 2);

  return {
    type: 'math',
    mode: 'math',
    sequence: [],
    correctAnswer: `num_${result}`,
    options: shuffle([`num_${result}`, ...wrongs.map((n) => `num_${n}`)]),
    gapIndex: -1,
    oddIndex: -1,
    math: { a, b, op, item: pick(ELEMENT_POOLS.objects) },
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
    const allowMidGap = difficulty >= 1 && Math.random() < (difficulty >= 2 ? 0.6 : 0.4);
    if (type === 'oddone') return makeOddOne();
    if (type === 'math') return makeMath();
    return { mode: 'fill', oddIndex: -1, ...this.makeFill(type, allowMidGap) };
  }

  private makeFill(type: PatternType, allowMidGap: boolean): FillPuzzle {
    switch (type) {
      case 'alternating':
        return makeAlternating(allowMidGap);
      case 'repeating':
        return makeRepeating(allowMidGap);
      case 'growing':
        return makeGrowing(allowMidGap);
      case 'size':
        return makeSizePattern(allowMidGap);
      case 'shape':
        return makeShapePattern(allowMidGap);
      case 'mirror':
        return makeMirror();
      case 'combo':
        return makeCombo(allowMidGap);
      case 'aab':
        return makeAAB(allowMidGap);
      case 'shrinking':
        return makeShrinking(allowMidGap);
      case 'rotation':
        return makeRotation(allowMidGap);
      default:
        return makeAlternating(allowMidGap);
    }
  }
}
