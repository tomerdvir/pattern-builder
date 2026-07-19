import { STRUCTURE_TEMPLATES, StructureTemplate, BlockPosition } from '../config/structures';

const STORAGE_KEY = 'pattern-builder-progress';

interface SavedProgress {
  blockCount: number;
  structureIndex: number;
  filledCount: number;
}

export class RewardManager {
  private blockCount: number = 0;
  private structureIndex: number = 0;
  private filledCount: number = 0;

  constructor() {
    this.load();
  }

  /** Total blocks earned across all structures */
  getTotalBlocks(): number {
    return this.blockCount;
  }

  getCurrentStructure(): StructureTemplate {
    return STRUCTURE_TEMPLATES[this.structureIndex % STRUCTURE_TEMPLATES.length];
  }

  /**
   * Call when the child answers correctly.
   * Returns the position of the newly placed block.
   */
  addBlock(): BlockPosition {
    const structure = this.getCurrentStructure();
    const pos = structure.slots[this.filledCount];
    this.blockCount++;
    this.filledCount++;
    this.save();
    return pos;
  }

  /** Returns the next position that would be filled (for preview). */
  getNextSlot(): BlockPosition {
    const structure = this.getCurrentStructure();
    return structure.slots[this.filledCount];
  }

  isStructureComplete(): boolean {
    return this.filledCount >= this.getCurrentStructure().slots.length;
  }

  /** Advance to next structure template after completion. */
  advanceStructure(): void {
    this.structureIndex++;
    this.filledCount = 0;
    this.save();
  }

  /** Current structure index — used as difficulty tier for puzzle selection. */
  getStructureIndex(): number {
    return this.structureIndex;
  }

  /** Number of structures fully built so far (each completion bumps structureIndex). */
  getCompletedCount(): number {
    return this.structureIndex;
  }

  /** How many slots of the current structure are filled. */
  getFilledCount(): number {
    return this.filledCount;
  }

  /** Total slots in current structure. */
  getTotalSlots(): number {
    return this.getCurrentStructure().slots.length;
  }

  // ─── Persistence ──────────────────────────────────────────────────────────

  private save(): void {
    try {
      const data: SavedProgress = {
        blockCount: this.blockCount,
        structureIndex: this.structureIndex,
        filledCount: this.filledCount,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage unavailable (private mode etc.) — progress just won't persist
    }
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as SavedProgress;
      this.blockCount = data.blockCount ?? 0;
      this.structureIndex = data.structureIndex ?? 0;
      this.filledCount = data.filledCount ?? 0;
      // Guard against saved state pointing past the current structure's slots
      if (this.filledCount >= this.getCurrentStructure().slots.length) {
        this.filledCount = 0;
      }
    } catch {
      // Corrupt or unavailable storage — start fresh
    }
  }
}
