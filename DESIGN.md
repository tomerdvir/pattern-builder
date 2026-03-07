# Pattern Builder

An educational pattern recognition game for children aged 4–5.

---

## Game Concept

Pattern Builder helps young children practice pattern recognition through quick visual challenges. Correct answers reward Lego-style blocks used to build simple structures. The experience feels like play, not testing.

**Core Promise:** Solve puzzles → Earn blocks → Build things → Repeat

---

## Target Audience

**Age:** 4–5 years old

**Key Constraints:**
- Cannot read (or very limited)
- Short attention span (~5–10 second interactions)
- Touch-only input
- Needs large, clear visuals

---

## UX Principles

| Principle | Implementation |
|-----------|----------------|
| **Simple Screen** | 3–5 interactive elements max, large touch targets (min 80×80px) |
| **Calm Experience** | No timers, no fail states, no pressure |
| **Quiet Interaction** | No background music; optional soft sound effects on actions |
| **Fast Loop** | Each puzzle cycle: ~5–10 seconds |
| **Minimal Text** | Icons, shapes, and colors only; no reading required |

---

## Core Game Loop

```
┌─────────────────────────────────────────────┐
│                                             │
│   1. Puzzle appears                         │
│            ↓                                │
│   2. Child taps answer (3 choices)          │
│            ↓                                │
│   3. Correct → Block reward animation       │
│            ↓                                │
│   4. Block auto-places on structure         │
│            ↓                                │
│   5. Next puzzle                            │
│                                             │
└─────────────────────────────────────────────┘
```

**Timing:** ~5 seconds puzzle + ~3 seconds reward = ~8 seconds per cycle

**Wrong Answer Handling:** Gentle shake animation, try again (no punishment)

**Hint System:** After 3 incorrect attempts, the correct answer gently pulses to guide the child without making them feel stuck

---

## Pattern Types

Five pattern types, all dynamically generated with randomised elements:

### 1. Alternating — AB (a b a b a → b)
- Uses **colors** _or_ **shapes** at random, so the same type feels different each time
- e.g. 🔴 🔵 🔴 🔵 🔴 → 🔵

### 2. Repeating Groups — ABC (a b c a b → c)
- Uses **shapes** _or_ **objects** (dog, cat, car, tree, sun, flower) at random
- e.g. 🐶 🚗 ⭐ 🐶 🚗 → ⭐

### 3. Growing Sequence
- Randomised start (1 or 2) so two distinct sequences exist: [1,2,3]→4 or [2,3,4]→5
- Wrong options are meaningfully too-small / too-large
- e.g. ■ ■■ ■■■ → ■■■■

### 4. Size Pattern — a b a b → a
- **Randomly starts small-big _or_ big-small**, so the correct answer is not always "small"
- e.g. 🔴(small) 🔴(big) 🔴(small) 🔴(big) → 🔴(small)

### 5. Shape — ABB (a b b a b → b)
- A genuinely distinct rhythm from Alternating (ABB vs AB)
- Introduces the idea that the "odd" element can repeat
- e.g. △ □ □ △ □ → □

---

## Difficulty Progression

Puzzle type variety unlocks gradually as each new structure begins:

| Structure | Types available |
|-----------|----------------|
| 1st (Tower) | Alternating, Size, Growing |
| 2nd (House) | + ABB Shape |
| 3rd+ (Car, Robot…) | + ABC Repeating with objects |

---

## Pattern Generation

**Approach:** Simple random selection, not a rule engine.

```
PatternGenerator:
  1. Pick random pattern type
  2. Pick random elements (colors, shapes, or objects)
  3. Generate sequence of 4–6 items
  4. Remove last item as the answer
  5. Generate 2 wrong options (same category, different value)
  6. Return: { sequence, correctAnswer, options }
```

**Element Pools:**
- Colors: red, blue, yellow, green, orange, purple
- Shapes: circle, square, triangle, star, heart
- Objects: dog, cat, car, tree, sun, flower ← all rendered programmatically in BootScene
- Sizes: small, big

---

## Reward System

### Blocks
- Every correct answer = 1 block
- Blocks are colorful, Lego-style
- Color matches the puzzle theme when possible

### Building
- Simple 2D grid placement
- Pre-defined structure templates:
  - **Tower** (5 blocks, vertical stack)
  - **House** (8 blocks, simple shape)
  - **Car** (6 blocks)
  - **Robot** (10 blocks)

### Structure Completion
- When structure complete → celebration animation
- New empty structure begins
- No complex inventory management

---

## Screens

### 1. Start Screen
```
┌─────────────────────────┐
│                         │
│     [Pattern Builder    │
│         Logo]           │
│                         │
│       [ ▶ PLAY ]        │
│                         │
└─────────────────────────┘
```
- One large play button
- No settings, no menus

### 2. Puzzle Screen
```
┌─────────────────────────┐
│  [Mini Structure View]  │
│                         │
│   🔴  🔵  🔴  🔵  ❓     │
│                         │
│  [🔴]   [🔵]   [🟢]     │
│                         │
└─────────────────────────┘
```
- Pattern sequence at center
- 3 answer buttons at bottom
- Small structure preview (motivation)

### 3. Build Screen
```
┌─────────────────────────┐
│                         │
│      ┌───┐              │
│      │   │  ← structure │
│    ┌─┴───┴─┐            │
│    │       │            │
│    └───────┘            │
│                         │
│      [▶ Next Puzzle]    │
└─────────────────────────┘
```
- Shows block being placed (animated)
- Auto-returns to puzzle after ~2 seconds
- Optional "Next" button for impatient players

---

## Technical Architecture

### Stack
- **Framework:** Phaser 3
- **Language:** TypeScript
- **Rendering:** HTML5 Canvas
- **Target:** Mobile web (responsive)

### Project Structure
```
/src
  /scenes
    BootScene.ts       # Asset loading
    StartScene.ts      # Start button
    PuzzleScene.ts     # Main gameplay
    BuildScene.ts      # Block placement
  /core
    PatternGenerator.ts  # Creates puzzles
    RewardManager.ts     # Tracks blocks, structures
  /config
    patterns.ts        # Element pools, pattern configs
    structures.ts      # Building templates
  main.ts              # Phaser config, entry point
/assets
  /images              # Shapes, objects, blocks
  /audio               # Optional sound effects
index.html
```

### Scene Flow
```
BootScene → StartScene → PuzzleScene ⇄ BuildScene
                              ↑______________|
```

### Key Classes

**PatternGenerator**
- `generate(): Puzzle` — Returns random puzzle
- Uses simple arrays and `Math.random()`

**RewardManager**
- `addBlock()` — Increment block count
- `getCurrentStructure()` — Return active template
- `placeBlock(): Position` — Return next placement position
- `isStructureComplete(): boolean`

**PuzzleScene**
- Renders pattern sequence
- Handles answer tap
- Triggers reward on correct

**BuildScene**
- Animates block placement
- Shows structure progress
- Auto-transitions back

---

## Data Structures

### Puzzle
```typescript
interface Puzzle {
  type: 'alternating' | 'repeating' | 'growing' | 'size' | 'shape';
  sequence: string[];      // Asset keys
  correctAnswer: string;
  options: string[];       // 3 choices including correct
}
```

### Structure
```typescript
interface Structure {
  name: string;
  slots: { x: number; y: number }[];  // Block positions
  filledCount: number;
}
```

---

## Asset Requirements

### Images (PNG, simple flat style)
- 6 color circles
- 5 basic shapes
- 6 simple objects
- Block sprite (tintable)
- Structure backgrounds (4)
- Play button
- Question mark placeholder

### Audio (Optional)
- `tap.mp3` — Button press
- `correct.mp3` — Success chime
- `place.mp3` — Block placement
- `complete.mp3` — Structure finished

**Total assets:** ~25 images, 4 sounds

---

## Scope Boundaries

### In Scope
- Single-player, single-device
- 5 pattern types
- 4 structure templates
- Infinite procedural puzzles
- Mobile web (portrait orientation)

### Out of Scope
- Accounts / save progress (localStorage only)
- Parent dashboard
- Achievements / badges
- Multiplayer
- Native app wrapper

---

## Development Estimate

| Phase | Time |
|-------|------|
| Setup & structure | 2 hours |
| Pattern generator | 3 hours |
| Puzzle scene | 4 hours |
| Build scene | 3 hours |
| Polish & sounds | 2 hours |
| **Total** | **~14 hours** |

Feasible for one developer in 2–3 days.

---

## Success Criteria

1. Child can complete 10 puzzles without adult help
2. No reading required during gameplay
3. Game runs smoothly on mobile browser
4. New pattern types can be added in <30 minutes
5. No frustration triggers (timers, fail screens, complex nav)
