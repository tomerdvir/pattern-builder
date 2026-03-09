# Pattern Builder

An educational pattern recognition game for children aged 4–5, built with Phaser 3 and TypeScript.

Kids solve visual pattern puzzles to earn colorful blocks, which are used to build simple structures like towers, houses, cars, and robots. The experience is calm, pressure-free, and requires no reading.

**Core loop:** Solve puzzle → Earn block → Build structure → Repeat

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Install & Run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173/pattern-builder/`).

### Build for Production

```bash
npm run build
npm run preview
```

Output goes to `dist/`.

## How It Works

- **Pattern puzzles** — Five types: alternating (AB), repeating groups (ABC), growing sequences, size patterns, and shape patterns (ABB). All dynamically generated with randomized elements.
- **No fail states** — Wrong answers get a gentle shake; after 3 misses the correct answer pulses as a hint.
- **Block rewards** — Each correct answer earns a Lego-style block placed onto a 2D structure.
- **Progressive difficulty** — New pattern types unlock as structures are completed.

## Project Structure

```
src/
  main.ts                  # Phaser config & entry point
  scenes/
    BootScene.ts           # Asset loading & generation
    StartScene.ts          # Start screen
    PuzzleScene.ts         # Pattern puzzle gameplay
    BuildScene.ts          # Block placement & structure view
  core/
    PatternGenerator.ts    # Puzzle generation logic
    RewardManager.ts       # Block tracking & structure progress
  config/
    patterns.ts            # Element pools & pattern configs
    structures.ts          # Building templates (tower, house, etc.)
assets/
  images/                  # Shape, object & UI sprites
  audio/                   # Sound effects
```

## Tech Stack

- **Phaser 3** — Game framework (Canvas rendering)
- **TypeScript** — Language
- **Vite** — Dev server & bundler

## Design

See [DESIGN.md](DESIGN.md) for the full game design document.
