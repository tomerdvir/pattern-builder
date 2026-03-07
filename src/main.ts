import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { StartScene } from './scenes/StartScene';
import { PuzzleScene } from './scenes/PuzzleScene';
import { BuildScene } from './scenes/BuildScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 480,
  height: 800,
  backgroundColor: '#FFF9F0',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, StartScene, PuzzleScene, BuildScene],
};

new Phaser.Game(config);
