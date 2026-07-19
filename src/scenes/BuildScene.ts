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

    // Ghost outline of the full goal shape so the child sees what they're building
    const filled = this.rewardManager.getFilledCount(); // already includes new block
    structure.slots.forEach((slot, i) => {
      if (i >= filled) {
        this.add
          .image(anchorX + slot.x, anchorY + slot.y, 'block')
          .setDisplaySize(64, 64)
          .setTint(0xb2bec3)
          .setAlpha(0.25);
      }
    });

    // Draw all already-filled slots (storing refs for ripple)
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

    // Googly eyes on the finished structure — it comes alive!
    // (Compute the top slot now, before advanceStructure() switches templates.)
    const structure = this.rewardManager.getCurrentStructure();
    const top = [...structure.slots].sort((a, b) => a.y - b.y || Math.abs(a.x) - Math.abs(b.x))[0];
    this.time.delayedCall(500, () => {
      this.addGooglyEyes(anchorX + top.x, anchorY + top.y);
    });

    // Trophy shelf: one trophy per structure built so far (including this one)
    const trophies = Math.min(this.rewardManager.getCompletedCount() + 1, 10);
    const trophyRow = this.add.container(width / 2, height * 0.27);
    const spacing = Math.min(40, (width - 60) / trophies);
    const startX = -((trophies - 1) * spacing) / 2;
    for (let i = 0; i < trophies; i++) {
      const t = this.add
        .text(startX + i * spacing, 0, '🏆', { fontSize: '30px' })
        .setOrigin(0.5)
        .setScale(0);
      trophyRow.add(t);
      this.tweens.add({
        targets: t,
        scaleX: 1,
        scaleY: 1,
        delay: 600 + i * 120,
        duration: 300,
        ease: 'Back.easeOut',
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

  /** Put a pair of blinking googly eyes at the given position (top block of the structure). */
  private addGooglyEyes(cx: number, cy: number): void {
    const eyes = this.add.container(cx, cy);
    for (const dx of [-13, 13]) {
      const white = this.add.graphics();
      white.fillStyle(0xffffff, 1);
      white.fillCircle(dx, -4, 10);
      white.lineStyle(2, 0x2c3e50, 0.6);
      white.strokeCircle(dx, -4, 10);
      const pupil = this.add.graphics();
      pupil.fillStyle(0x2c3e50, 1);
      pupil.fillCircle(dx, -2, 4.5);
      eyes.add([white, pupil]);
    }

    eyes.setScale(0);
    this.tweens.add({
      targets: eyes,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Blink every couple of seconds
    this.time.addEvent({
      delay: 1800,
      loop: true,
      callback: () => {
        this.tweens.add({
          targets: eyes,
          scaleY: 0.1,
          duration: 90,
          yoyo: true,
          ease: 'Quad.easeInOut',
        });
      },
    });
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
