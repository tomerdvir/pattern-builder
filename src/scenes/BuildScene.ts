import Phaser from 'phaser';
import { RewardManager } from '../core/RewardManager';
import { BlockPosition } from '../config/structures';

const AUTO_ADVANCE_MS = 3500;
const AUTO_ADVANCE_COMPLETE_MS = 4500;

const REACTION_EMOJIS = ['⭐', '👏', '💎', '🌟', '🎯'];

/**
 * BuildScene: Animates the newly earned block being placed on the structure.
 * Auto-returns to PuzzleScene after a delay.
 */
export class BuildScene extends Phaser.Scene {
  private rewardManager!: RewardManager;
  private blockPos!: BlockPosition;
  private isComplete = false;
  private streak = 0;
  private advanced = false;

  constructor() {
    super({ key: 'BuildScene' });
  }

  init(data: { blockPos: BlockPosition; rewardManager: RewardManager; isComplete: boolean; streak?: number }): void {
    this.blockPos = data.blockPos;
    this.rewardManager = data.rewardManager;
    this.isComplete = data.isComplete;
    this.streak = data.streak ?? 0;
    this.advanced = false;
  }

  create(): void {
    const { width, height } = this.scale;

    // Themed background
    const structure = this.rewardManager.getCurrentStructure();
    const bg = structure.pastelBg;
    this.cameras.main.setBackgroundColor(bg);
    const bgRgb = Phaser.Display.Color.HexStringToColor(bg);
    this.cameras.main.fadeIn(200, bgRgb.red, bgRgb.green, bgRgb.blue);

    const anchorX = width / 2;
    const anchorY = height * 0.62;

    // Draw all already-filled slots (storing refs for ripple)
    const filled = this.rewardManager.getFilledCount(); // already includes new block
    const existingBlocks: Phaser.GameObjects.Image[] = [];
    structure.slots.forEach((slot, i) => {
      if (i < filled - 1) {
        const block = this.add
          .image(anchorX + slot.x, anchorY + slot.y, 'block')
          .setDisplaySize(64, 64)
          .setTint(structure.color);
        existingBlocks.push(block);
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
      onComplete: () => {
        // Ripple wave on all existing blocks when the new block lands
        existingBlocks.forEach((block, i) => {
          this.tweens.add({
            targets: block,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 150,
            delay: i * 40,
            yoyo: true,
            ease: 'Sine.easeInOut',
          });
        });
      },
    });

    // Particle burst when block lands
    this.time.delayedCall(350, () => {
      this.spawnConfetti(anchorX + this.blockPos.x, anchorY + this.blockPos.y);
    });

    // Big emoji reaction after landing
    this.time.delayedCall(400, () => {
      this.showEmojiReaction(anchorX + this.blockPos.x, anchorY + this.blockPos.y - 60);
    });

    if (this.isComplete) {
      this.showCompletionCelebration(anchorX, anchorY);
    } else {
      this.showNextButton();
    }

    // Auto-advance
    const delay = this.isComplete ? AUTO_ADVANCE_COMPLETE_MS : AUTO_ADVANCE_MS;
    this.time.delayedCall(delay, () => this.advanceToNextPuzzle());
  }

  /** Show a big emoji that scales in and fades out */
  private showEmojiReaction(x: number, y: number): void {
    const emoji = Phaser.Utils.Array.GetRandom(REACTION_EMOJIS);
    const reaction = this.add
      .text(x, y, emoji, { fontSize: '56px' })
      .setOrigin(0.5)
      .setScale(0);

    this.tweens.add({
      targets: reaction,
      scaleX: 1.3,
      scaleY: 1.3,
      y: y - 40,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: reaction,
          alpha: 0,
          y: y - 70,
          duration: 400,
          delay: 300,
          ease: 'Quad.easeIn',
          onComplete: () => reaction.destroy(),
        });
      },
    });
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
    const celebrationText = this.add
      .text(width / 2, height * 0.18, `🎉 ${name.toUpperCase()} BUILT! 🎉`, {
        fontSize: '32px',
        fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
        color: '#e74c3c',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: celebrationText,
      alpha: 1,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Bounce the whole structure container
        this.tweens.add({
          targets: celebrationText,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 300,
          yoyo: true,
          repeat: 2,
          ease: 'Sine.easeInOut',
        });
      },
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
    if (this.advanced) return;
    this.advanced = true;

    const structure = this.rewardManager.getCurrentStructure();
    const bg = structure.pastelBg;
    const bgRgb = Phaser.Display.Color.HexStringToColor(bg);
    this.cameras.main.fadeOut(250, bgRgb.red, bgRgb.green, bgRgb.blue);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('PuzzleScene', { rewardManager: this.rewardManager, streak: this.streak });
    });
  }
}
