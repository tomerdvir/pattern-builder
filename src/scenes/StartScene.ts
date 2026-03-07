import Phaser from 'phaser';

/**
 * StartScene: Shows the game logo/title and a big PLAY button.
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
