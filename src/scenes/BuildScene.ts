import Phaser from 'phaser';
import { RewardManager } from '../core/RewardManager';
import { BlockPosition } from '../config/structures';

const AUTO_ADVANCE_MS = 2200;

/**
 * BuildScene: Animates the newly earned block being placed on the structure.
 * Auto-returns to PuzzleScene after a delay.
 */
export class BuildScene extends Phaser.Scene {
  private rewardManager!: RewardManager;
  private blockPos!: BlockPosition;
  private isComplete = false;

  constructor() {
    super({ key: 'BuildScene' });
  }

  init(data: { blockPos: BlockPosition; rewardManager: RewardManager; isComplete: boolean }): void {
    this.blockPos = data.blockPos;
    this.rewardManager = data.rewardManager;
    this.isComplete = data.isComplete;
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#FFF9F0');
    this.cameras.main.fadeIn(200, 255, 249, 240);

    const structure = this.rewardManager.getCurrentStructure();
    const anchorX = width / 2;
    const anchorY = height * 0.62;

    // Draw all already-filled slots
    const filled = this.rewardManager.getFilledCount(); // already includes new block
    structure.slots.forEach((slot, i) => {
      if (i < filled) {
        this.add
          .image(anchorX + slot.x, anchorY + slot.y, 'block')
          .setDisplaySize(64, 64)
          .setTint(structure.color);
      }
    });

    // Animate the new block dropping in
    const newBlock = this.add
      .image(anchorX + this.blockPos.x, anchorY + this.blockPos.y - 120, 'block')
      .setDisplaySize(64, 64)
      .setTint(structure.color)
      .setAlpha(0);

    this.tweens.add({
      targets: newBlock,
      y: anchorY + this.blockPos.y,
      alpha: 1,
      duration: 350,
      ease: 'Bounce.easeOut',
    });

    // Particle burst
    this.time.delayedCall(350, () => {
      this.spawnConfetti(anchorX + this.blockPos.x, anchorY + this.blockPos.y);
    });

    if (this.isComplete) {
      this.showCompletionCelebration(anchorX, anchorY);
    } else {
      this.showNextButton();
    }

    // Auto-advance
    this.time.delayedCall(AUTO_ADVANCE_MS, () => this.advanceToNextPuzzle());
  }

  private showNextButton(): void {
    const { width, height } = this.scale;

    const btn = this.add
      .text(width / 2, height * 0.88, '▶  Next Puzzle', {
        fontSize: '28px',
        fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
        color: '#2ecc71',
        fontStyle: 'bold',
        backgroundColor: '#ffffff',
        padding: { left: 20, right: 20, top: 10, bottom: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => this.advanceToNextPuzzle());
  }

  private showCompletionCelebration(anchorX: number, anchorY: number): void {
    const { width, height } = this.scale;

    // Big celebration confetti burst
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 120, () => {
        this.spawnConfetti(
          anchorX + Phaser.Math.Between(-80, 80),
          anchorY + Phaser.Math.Between(-60, 60)
        );
      });
    }

    const name = this.rewardManager.getCurrentStructure().name;
    this.add
      .text(width / 2, height * 0.18, `🎉 ${name.toUpperCase()} BUILT! 🎉`, {
        fontSize: '32px',
        fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
        color: '#e74c3c',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: this.children.getAll().slice(-1)[0],
      alpha: 1,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    this.rewardManager.advanceStructure();

    const btn = this.add
      .text(width / 2, height * 0.88, '🚀  Next Build!', {
        fontSize: '28px',
        fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#e74c3c',
        padding: { left: 20, right: 20, top: 10, bottom: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => this.advanceToNextPuzzle());
  }

  private spawnConfetti(x: number, y: number): void {
    const colors = [0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71, 0xe67e22, 0x9b59b6];
    for (let i = 0; i < 8; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(Phaser.Utils.Array.GetRandom(colors), 1);
      particle.fillRect(-5, -5, 10, 10);
      particle.x = x;
      particle.y = y;

      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.Between(60, 140);
      const vx = Math.cos(Phaser.Math.DegToRad(angle)) * speed;
      const vy = Math.sin(Phaser.Math.DegToRad(angle)) * speed;

      this.tweens.add({
        targets: particle,
        x: particle.x + vx,
        y: particle.y + vy + 80,
        angle: Phaser.Math.Between(-360, 360),
        alpha: 0,
        duration: 700,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private advanceToNextPuzzle(): void {
    this.cameras.main.fadeOut(250, 255, 249, 240);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('PuzzleScene', { rewardManager: this.rewardManager });
    });
  }
}
