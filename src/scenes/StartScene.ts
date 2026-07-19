import Phaser from 'phaser';
import { RewardManager } from '../core/RewardManager';

/**
 * StartScene: Shows the game logo/title, a trophy shelf of past builds, and a big PLAY button.
 */
export class StartScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StartScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Background
    this.cameras.main.setBackgroundColor('#FFF9F0');

    // Title
    this.add
      .text(width / 2, height * 0.3, '🧩', {
        fontSize: '80px',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.48, 'Pattern Builder', {
        fontSize: '42px',
        fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
        color: '#2c3e50',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.57, 'Can you spot the pattern?', {
        fontSize: '22px',
        fontFamily: 'Arial, sans-serif',
        color: '#7f8c8d',
      })
      .setOrigin(0.5);

    // Trophy shelf — one trophy per structure built in past sessions
    const completed = new RewardManager().getCompletedCount();
    if (completed > 0) {
      const trophies = Math.min(completed, 10);
      const spacing = Math.min(40, (width - 60) / trophies);
      const startX = width / 2 - ((trophies - 1) * spacing) / 2;
      for (let i = 0; i < trophies; i++) {
        const t = this.add
          .text(startX + i * spacing, height * 0.64, '🏆', { fontSize: '28px' })
          .setOrigin(0.5)
          .setScale(0);
        this.tweens.add({
          targets: t,
          scaleX: 1,
          scaleY: 1,
          delay: 200 + i * 100,
          duration: 300,
          ease: 'Back.easeOut',
        });
      }
    }

    // Play button
    const btn = this.add
      .image(width / 2, height * 0.73, 'play_button')
      .setInteractive({ useHandCursor: true });

    this.add
      .text(width / 2, height * 0.73, '▶  PLAY', {
        fontSize: '32px',
        fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Idle pulse on the button
    this.tweens.add({
      targets: btn,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    btn.on('pointerdown', () => {
      this.tweens.killTweensOf(btn);
      this.cameras.main.fadeOut(300, 255, 249, 240);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('PuzzleScene');
      });
    });
  }
}
