import Phaser from 'phaser';

/**
 * BootScene: Generates all game assets programmatically using Phaser Graphics,
 * then starts StartScene. No external image files required.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Nothing to load from disk — all assets are generated in create()
  }

  create(): void {
    this.generateColorCircles();
    this.generateShapes();
    this.generateSizeVariants();
    this.generateBlockSprite();
    this.generateQuestionMark();
    this.generatePlayButton();
    this.generateGrowAssets();
    this.generateObjectSprites();
    this.generateComboSprites();
    this.generateArrowSprites();

    this.scene.start('StartScene');
  }

  private makeG(): Phaser.GameObjects.Graphics {
    return this.add.graphics();
  }

  private generateColorCircles(): void {
    const colors: Record<string, number> = {
      red: 0xe74c3c,
      blue: 0x3498db,
      yellow: 0xf1c40f,
      green: 0x2ecc71,
      orange: 0xe67e22,
      purple: 0x9b59b6,
    };

    for (const [name, hex] of Object.entries(colors)) {
      const g = this.makeG();
      g.fillStyle(hex, 1);
      g.fillCircle(40, 40, 38);
      g.lineStyle(3, 0x000000, 0.2);
      g.strokeCircle(40, 40, 38);
      g.generateTexture(name, 80, 80);
      g.destroy();
    }
  }

  private generateShapes(): void {
    const shapeDrawers: Record<string, (g: Phaser.GameObjects.Graphics) => void> = {
      circle: (g) => {
        g.fillStyle(0x5dade2, 1);
        g.fillCircle(40, 40, 36);
      },
      square: (g) => {
        g.fillStyle(0x58d68d, 1);
        g.fillRect(4, 4, 72, 72);
      },
      triangle: (g) => {
        g.fillStyle(0xf39c12, 1);
        g.fillTriangle(40, 4, 76, 76, 4, 76);
      },
      star: (g) => {
        g.fillStyle(0xf1c40f, 1);
        this.drawStar(g, 40, 40, 5, 36, 16);
      },
      heart: (g) => {
        g.fillStyle(0xe74c3c, 1);
        this.drawHeart(g, 40, 40, 32);
      },
    };

    for (const [name, draw] of Object.entries(shapeDrawers)) {
      const g = this.makeG();
      draw(g);
      g.generateTexture(name, 80, 80);
      g.destroy();
    }
  }

  /** Generate _big (same as base) and _small versions of each shape. */
  private generateSizeVariants(): void {
    const bigDrawers: Record<string, (g: Phaser.GameObjects.Graphics) => void> = {
      circle: (g) => { g.fillStyle(0x5dade2, 1); g.fillCircle(40, 40, 36); },
      square: (g) => { g.fillStyle(0x58d68d, 1); g.fillRect(4, 4, 72, 72); },
      triangle: (g) => { g.fillStyle(0xf39c12, 1); g.fillTriangle(40, 4, 76, 76, 4, 76); },
      star: (g) => { g.fillStyle(0xf1c40f, 1); this.drawStar(g, 40, 40, 5, 36, 16); },
      heart: (g) => { g.fillStyle(0xe74c3c, 1); this.drawHeart(g, 40, 40, 32); },
    };

    const smallDrawers: Record<string, (g: Phaser.GameObjects.Graphics) => void> = {
      circle: (g) => { g.fillStyle(0x5dade2, 1); g.fillCircle(40, 40, 20); },
      square: (g) => { g.fillStyle(0x58d68d, 1); g.fillRect(20, 20, 40, 40); },
      triangle: (g) => { g.fillStyle(0xf39c12, 1); g.fillTriangle(40, 20, 60, 60, 20, 60); },
      star: (g) => { g.fillStyle(0xf1c40f, 1); this.drawStar(g, 40, 40, 5, 20, 10); },
      heart: (g) => { g.fillStyle(0xe74c3c, 1); this.drawHeart(g, 40, 40, 16); },
    };

    for (const shape of Object.keys(bigDrawers)) {
      const gb = this.makeG();
      bigDrawers[shape](gb);
      gb.generateTexture(`${shape}_big`, 80, 80);
      gb.destroy();

      const gs = this.makeG();
      smallDrawers[shape](gs);
      gs.generateTexture(`${shape}_small`, 80, 80);
      gs.destroy();
    }
  }

  private generateBlockSprite(): void {
    const g = this.makeG();
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(2, 2, 60, 60, 8);
    g.lineStyle(3, 0x000000, 0.3);
    g.strokeRoundedRect(2, 2, 60, 60, 8);
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(32, 32, 14);
    g.generateTexture('block', 64, 64);
    g.destroy();
  }

  private generateQuestionMark(): void {
    const g = this.makeG();
    g.fillStyle(0xbdc3c7, 1);
    g.fillCircle(40, 40, 38);
    g.generateTexture('question', 80, 80);
    g.destroy();
  }

  private generatePlayButton(): void {
    const g = this.makeG();
    g.fillStyle(0x2ecc71, 1);
    g.fillRoundedRect(0, 0, 200, 80, 20);
    g.generateTexture('play_button', 200, 80);
    g.destroy();
  }

  private generateGrowAssets(): void {
    const BLOCK_W = 28;
    const BLOCK_H = 14;
    const colors = [0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71, 0xe67e22];

    for (let count = 1; count <= 5; count++) {
      const g = this.makeG();
      for (let i = 0; i < count; i++) {
        const y = 80 - (i + 1) * (BLOCK_H + 2);
        g.fillStyle(colors[i % colors.length], 1);
        g.fillRect(26, y, BLOCK_W, BLOCK_H);
        g.lineStyle(1, 0x000000, 0.2);
        g.strokeRect(26, y, BLOCK_W, BLOCK_H);
      }
      g.generateTexture(`grow_${count}`, 80, 80);
      g.destroy();
    }
  }

  /** Generate simple iconic sprites for object tokens (dog, cat, car, tree, sun, flower). */
  private generateObjectSprites(): void {
    // Dog: tan circle body + two triangle ears
    {
      const g = this.makeG();
      g.fillStyle(0xc8a567, 1);
      g.fillCircle(40, 46, 28);
      g.fillTriangle(16, 26, 10, 50, 30, 40); // left ear
      g.fillTriangle(64, 26, 70, 50, 50, 40); // right ear
      g.generateTexture('dog', 80, 80);
      g.destroy();
    }
    // Cat: orange circle + pointy triangle ears
    {
      const g = this.makeG();
      g.fillStyle(0xe67e22, 1);
      g.fillCircle(40, 46, 26);
      g.fillTriangle(18, 16, 28, 38, 10, 38); // left ear
      g.fillTriangle(62, 16, 70, 38, 52, 38); // right ear
      g.generateTexture('cat', 80, 80);
      g.destroy();
    }
    // Car: red body + roof + dark wheels
    {
      const g = this.makeG();
      g.fillStyle(0xe74c3c, 1);
      g.fillRoundedRect(8, 38, 64, 26, 5);   // body
      g.fillStyle(0xc0392b, 1);
      g.fillRoundedRect(20, 20, 40, 22, 5);  // roof
      g.fillStyle(0x2c3e50, 1);
      g.fillCircle(22, 66, 9);               // left wheel
      g.fillCircle(58, 66, 9);               // right wheel
      g.generateTexture('car', 80, 80);
      g.destroy();
    }
    // Tree: green triangle crown + brown trunk
    {
      const g = this.makeG();
      g.fillStyle(0x27ae60, 1);
      g.fillTriangle(40, 4, 72, 54, 8, 54);  // crown
      g.fillStyle(0x795548, 1);
      g.fillRect(32, 54, 16, 22);            // trunk
      g.generateTexture('tree', 80, 80);
      g.destroy();
    }
    // Sun: yellow circle + 8 rays
    {
      const g = this.makeG();
      g.lineStyle(5, 0xf39c12, 1);
      for (let i = 0; i < 8; i++) {
        const rad = (i * Math.PI) / 4;
        g.lineBetween(
          40 + 24 * Math.cos(rad), 40 + 24 * Math.sin(rad),
          40 + 36 * Math.cos(rad), 40 + 36 * Math.sin(rad),
        );
      }
      g.fillStyle(0xf1c40f, 1);
      g.fillCircle(40, 40, 20);
      g.generateTexture('sun', 80, 80);
      g.destroy();
    }
    // Flower: 6 pink petals + yellow centre
    {
      const g = this.makeG();
      g.fillStyle(0xff69b4, 1);
      for (let i = 0; i < 6; i++) {
        const rad = (i * Math.PI) / 3;
        g.fillCircle(40 + 18 * Math.cos(rad), 40 + 18 * Math.sin(rad), 11);
      }
      g.fillStyle(0xf1c40f, 1);
      g.fillCircle(40, 40, 13);
      g.generateTexture('flower', 80, 80);
      g.destroy();
    }
  }

  /** Generate color+shape combo sprites (e.g. red_circle, blue_star) for combo patterns. */
  private generateComboSprites(): void {
    const colors: Record<string, number> = {
      red: 0xe74c3c,
      blue: 0x3498db,
      yellow: 0xf1c40f,
      green: 0x2ecc71,
      orange: 0xe67e22,
      purple: 0x9b59b6,
    };

    for (const [colorName, hex] of Object.entries(colors)) {
      for (const shape of ['circle', 'square', 'triangle', 'star', 'heart']) {
        const g = this.makeG();
        g.fillStyle(hex, 1);
        switch (shape) {
          case 'circle':
            g.fillCircle(40, 40, 36);
            break;
          case 'square':
            g.fillRect(4, 4, 72, 72);
            break;
          case 'triangle':
            g.fillTriangle(40, 4, 76, 76, 4, 76);
            break;
          case 'star':
            this.drawStar(g, 40, 40, 5, 36, 16);
            break;
          case 'heart':
            this.drawHeart(g, 40, 40, 32);
            break;
        }
        g.generateTexture(`${colorName}_${shape}`, 80, 80);
        g.destroy();
      }
    }
  }

  /** Generate arrow_up / arrow_right / arrow_down / arrow_left for rotation patterns. */
  private generateArrowSprites(): void {
    // Points of an up-pointing arrow (head triangle + shaft), centered in 80x80
    const upPoints: [number, number][] = [
      [40, 6],   // tip
      [66, 36],  // head right
      [50, 36],  // shaft top-right
      [50, 74],  // shaft bottom-right
      [30, 74],  // shaft bottom-left
      [30, 36],  // shaft top-left
      [14, 36],  // head left
    ];

    const rotations: Record<string, number> = {
      arrow_up: 0,
      arrow_right: Math.PI / 2,
      arrow_down: Math.PI,
      arrow_left: (3 * Math.PI) / 2,
    };

    for (const [name, angle] of Object.entries(rotations)) {
      const g = this.makeG();
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const pts = upPoints.map(([x, y]) => ({
        x: 40 + (x - 40) * cos - (y - 40) * sin,
        y: 40 + (x - 40) * sin + (y - 40) * cos,
      }));
      g.fillStyle(0x8e44ad, 1);
      g.fillPoints(pts, true);
      g.lineStyle(3, 0x000000, 0.15);
      g.strokePoints([...pts, pts[0]], false);
      g.generateTexture(name, 80, 80);
      g.destroy();
    }
  }

  private drawStar(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    points: number,
    outerR: number,
    innerR: number
  ): void {
    const step = Math.PI / points;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      pts.push({
        x: cx + r * Math.cos(i * step - Math.PI / 2),
        y: cy + r * Math.sin(i * step - Math.PI / 2),
      });
    }
    g.fillPoints(pts, true);
  }

  private drawHeart(g: Phaser.GameObjects.Graphics, cx: number, cy: number, size: number): void {
    // Approximate heart with two circles + triangle
    const r = size * 0.38;
    g.fillCircle(cx - r, cy - r * 0.2, r);
    g.fillCircle(cx + r, cy - r * 0.2, r);
    g.fillTriangle(cx - size * 0.72, cy + r * 0.6, cx + size * 0.72, cy + r * 0.6, cx, cy + size * 0.9);
  }
}
