# Agents

## Project Overview

Pattern Builder is an educational pattern recognition game for children aged 4–5. It is a single-page Phaser 3 game written in TypeScript, bundled with Vite, and deployed as a static site.

## Tech Stack

- **Phaser 3** (v3.80) — game framework, Canvas rendering
- **TypeScript** (strict mode) — all source in `src/`
- **Vite** (v5) — dev server and production bundler
- No backend, no database, no server-side code

## Build & Run

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server
npm run build        # tsc + vite build → dist/
npm run preview      # preview production build
```

The site is served under base path `/pattern-builder/`.

## Architecture

### Scene Flow

```
BootScene → StartScene → PuzzleScene ⇄ BuildScene
```

- **BootScene** — Loads and programmatically generates all assets (shapes, objects, blocks).
- **StartScene** — Single play button, no menus.
- **PuzzleScene** — Displays a pattern sequence with a missing element; child picks from 3 choices. Correct answer triggers block reward and transitions to BuildScene.
- **BuildScene** — Animates block placement on the current structure, then returns to PuzzleScene.

### Key Modules

| Module | Purpose |
|--------|---------|
| `src/core/PatternGenerator.ts` | Generates random puzzles (5 pattern types) with sequences, correct answer, and distractors |
| `src/core/RewardManager.ts` | Tracks earned blocks, manages structure progress, determines next placement position |
| `src/config/patterns.ts` | Element pools (colors, shapes, objects) and pattern type configs |
| `src/config/structures.ts` | Building templates — slot positions for tower, house, car, robot |
| `src/main.ts` | Phaser game config and entry point |

### Data Types

```typescript
interface Puzzle {
  type: 'alternating' | 'repeating' | 'growing' | 'size' | 'shape';
  sequence: string[];
  correctAnswer: string;
  options: string[];       // 3 choices including correct
}

interface Structure {
  name: string;
  slots: { x: number; y: number }[];
  filledCount: number;
}
```

## Conventions

- Game canvas is 480×800, scaled with `Phaser.Scale.FIT`.
- Target audience is pre-literate children: no text in-game, large touch targets (≥80×80px), calm UX (no timers, no fail states).
- All game objects are rendered programmatically or from simple sprites — no complex asset pipeline.
- Sound effects are optional and soft; no background music.

## Design Reference

Full game design document: `DESIGN.md`
