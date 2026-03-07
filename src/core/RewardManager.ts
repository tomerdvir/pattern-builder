import { STRUCTURE_TEMPLATES, StructureTemplate, BlockPosition } from '../config/structures';

export class RewardManager {
  private blockCount: number = 0;
  private structureIndex: number = 0;
  private filledCount: number = 0;

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
  }

  /** Current structure index — used as difficulty tier for puzzle selection. */
  getStructureIndex(): number {
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
}
