import Phaser from 'phaser';
import { PatternGenerator, Puzzle } from '../core/PatternGenerator';
import { RewardManager } from '../core/RewardManager';

const HINT_ATTEMPTS = 3;
const SEQUENCE_Y_RATIO = 0.42;
const OPTIONS_Y_RATIO = 0.72;
const ITEM_SIZE = 80;

/**
 * PuzzleScene: Core gameplay — shows pattern sequence and 3 answer choices.
 */
export class PuzzleScene extends Phaser.Scene {
  private generator!: PatternGenerator;
  private rewardManager!: RewardManager;
  private puzzle!: Puzzle;
  private wrongAttempts = 0;
  private optionButtons: Phaser.GameObjects.Container[] = [];
  private hintTween?: Phaser.Tweens.Tween;
  private progressText!: Phaser.GameObjects.Text;
  private structurePreview!: Phaser.GameObjects.Container;
  private locked = false; // prevent double-tap

  constructor() {
    super({ key: 'PuzzleScene' });
  }

  init(data: { rewardManager?: RewardManager }): void {
    if (data?.rewardManager) {
      this.rewardManager = data.rewardManager;
    } else {
      this.rewardManager = new RewardManager();
    }
    this.generator = new PatternGenerator();
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#FFF9F0');
    this.cameras.main.fadeIn(250, 255, 249, 240);

    this.buildProgressBar();
    this.buildStructurePreview();
    this.nextPuzzle();
  }

  // ─── Progress bar ────────────────────────────────────────────────────────

  private buildProgressBar(): void {
    const { width } = this.scale;
    this.progressText = this.add
      .text(width / 2, 28, '', {
        fontSize: '20px',
        fontFamily: 'Arial, sans-serif',
        color: '#7f8c8d',
      })
      .setOrigin(0.5);
    this.updateProgressText();
  }

  private updateProgressText(): void {
    const filled = this.rewardManager.getFilledCount();
    const total = this.rewardManager.getTotalSlots();
    const name = this.rewardManager.getCurrentStructure().name;
    this.progressText.setText(`Building: ${name}   ${filled}/${total} 🧱`);
  }

  // ─── Structure mini preview ───────────────────────────────────────────────

  private buildStructurePreview(): void {
    const { width } = this.scale;
    this.structurePreview = this.add.container(width - 60, 60);
    this.refreshStructurePreview();
  }

  private refreshStructurePreview(): void {
    this.structurePreview.removeAll(true);
    const structure = this.rewardManager.getCurrentStructure();
    const filled = this.rewardManager.getFilledCount();
    const scale = 0.18;

    structure.slots.forEach((slot, i) => {
      const block = this.add
        .image(slot.x * scale, slot.y * scale, 'block')
        .setScale(scale)
        .setTint(i < filled ? structure.color : 0xcccccc);
      this.structurePreview.add(block);
    });
  }

  // ─── Puzzle lifecycle ─────────────────────────────────────────────────────

  nextPuzzle(): void {
    this.locked = false;
    this.wrongAttempts = 0;
    this.clearPuzzleDisplay();

    this.puzzle = this.generator.generate(this.rewardManager.getStructureIndex());
    this.drawSequence();
    this.drawOptions();
    this.updateProgressText();
    this.refreshStructurePreview();
  }

  private clearPuzzleDisplay(): void {
    if (this.hintTween) {
      this.hintTween.stop();
      this.hintTween = undefined;
    }
    // Remove labelled puzzle objects
    this.children.getAll().forEach((obj) => {
      if ((obj as Phaser.GameObjects.GameObject & { puzzleItem?: boolean }).puzzleItem) {
        obj.destroy();
      }
    });
    this.optionButtons = [];
  }

  // ─── Sequence rendering ────────────────────────────────────────────────────

  private drawSequence(): void {
    const { width, height } = this.scale;
    const items = [...this.puzzle.sequence, 'question'];
    const spacing = Math.min(90, (width - 40) / items.length);
    const totalWidth = spacing * (items.length - 1);
    const startX = width / 2 - totalWidth / 2;
    const y = height * SEQUENCE_Y_RATIO;

    items.forEach((key, i) => {
      const x = startX + i * spacing;
      const img = this.add.image(x, y, key).setDisplaySize(ITEM_SIZE, ITEM_SIZE);
      this.tagPuzzleItem(img);

      if (key === 'question') {
        const qText = this.add
          .text(x, y, '?', {
            fontSize: '40px',
            fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
            color: '#7f8c8d',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        this.tagPuzzleItem(qText);
      }
    });

    // Label at top
    const label = this.add
      .text(width / 2, height * SEQUENCE_Y_RATIO - 68, "What comes next?", {
        fontSize: '28px',
        fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
        color: '#2c3e50',
      })
      .setOrigin(0.5);
    this.tagPuzzleItem(label);
  }

  // ─── Options ─────────────────────────────────────────────────────────────

  private drawOptions(): void {
    const { width, height } = this.scale;
    const count = this.puzzle.options.length;
    const spacing = width / (count + 1);
    const y = height * OPTIONS_Y_RATIO;

    this.puzzle.options.forEach((optionKey, i) => {
      const x = spacing + i * spacing;
      const container = this.buildOptionButton(x, y, optionKey);
      this.optionButtons.push(container);
      this.tagPuzzleItem(container);
    });
  }

  private buildOptionButton(x: number, y: number, key: string): Phaser.GameObjects.Container {
    const bg = this.add.graphics();
    this.drawOptionBg(bg, false);

    const img = this.add.image(0, 0, key).setDisplaySize(ITEM_SIZE, ITEM_SIZE);
    const container = this.add.container(x, y, [bg, img]);
    container.setSize(104, 104);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      if (this.locked) return;
      this.drawOptionBg(bg, true);
    });
    container.on('pointerout', () => {
      this.drawOptionBg(bg, false);
    });
    container.on('pointerdown', () => {
      if (this.locked) return;
      this.onOptionTapped(key, container);
    });

    return container;
  }

  private drawOptionBg(g: Phaser.GameObjects.Graphics, hover: boolean): void {
    g.clear();
    g.fillStyle(hover ? 0xe8f4fd : 0xffffff, 1);
    g.lineStyle(3, hover ? 0x3498db : 0xbdc3c7, 1);
    g.fillRoundedRect(-54, -54, 108, 108, 16);
    g.strokeRoundedRect(-54, -54, 108, 108, 16);
  }

  // ─── Answer handling ────────────────────────────────────────────────────

  private onOptionTapped(key: string, container: Phaser.GameObjects.Container): void {
    this.locked = true;

    if (key === this.puzzle.correctAnswer) {
      this.handleCorrect(container);
    } else {
      this.wrongAttempts++;
      this.handleWrong(container);
    }
  }

  private handleCorrect(container: Phaser.GameObjects.Container): void {
    // Flash green
    const bg = container.getAt(0) as Phaser.GameObjects.Graphics;
    bg.clear();
    bg.fillStyle(0x2ecc71, 1);
    bg.fillRoundedRect(-54, -54, 108, 108, 16);

    this.tweens.add({
      targets: container,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 150,
      yoyo: true,
      ease: 'Back.easeOut',
      onComplete: () => {
        const blockPos = this.rewardManager.addBlock();
        this.scene.start('BuildScene', {
          blockPos,
          rewardManager: this.rewardManager,
          isComplete: this.rewardManager.isStructureComplete(),
        });
      },
    });
  }

  private handleWrong(container: Phaser.GameObjects.Container): void {
    // Shake
    const startX = container.x;
    this.tweens.add({
      targets: container,
      x: startX - 10,
      duration: 40,
      yoyo: true,
      repeat: 3,
      ease: 'Linear',
      onComplete: () => {
        container.x = startX;
        this.locked = false;

        if (this.wrongAttempts >= HINT_ATTEMPTS) {
          this.showHint();
        }
      },
    });

    const bg = container.getAt(0) as Phaser.GameObjects.Graphics;
    bg.clear();
    bg.fillStyle(0xe74c3c, 0.3);
    bg.lineStyle(3, 0xe74c3c, 1);
    bg.fillRoundedRect(-54, -54, 108, 108, 16);
    bg.strokeRoundedRect(-54, -54, 108, 108, 16);

    // Reset bg color after shake
    this.time.delayedCall(300, () => {
      this.drawOptionBg(bg, false);
    });
  }

  private showHint(): void {
    const correctContainer = this.optionButtons.find(
      (c) => (c.getAt(1) as Phaser.GameObjects.Image).texture.key === this.puzzle.correctAnswer
    );
    if (!correctContainer) return;

    this.hintTween = this.tweens.add({
      targets: correctContainer,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private tagPuzzleItem(obj: Phaser.GameObjects.GameObject): void {
    (obj as Phaser.GameObjects.GameObject & { puzzleItem: boolean }).puzzleItem = true;
  }
}
