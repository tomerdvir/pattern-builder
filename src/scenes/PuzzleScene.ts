import Phaser from 'phaser';
import { PatternGenerator, Puzzle } from '../core/PatternGenerator';
import { RewardManager } from '../core/RewardManager';

const HINT_ATTEMPTS = 3;
const SEQUENCE_Y_RATIO = 0.42;
const OPTIONS_Y_RATIO = 0.72;
const ITEM_SIZE = 80;

const EMOJI_LABELS = ['👀', '🤔', '🧐', '🔍'];
const ODD_ONE_LABEL = '🕵️';
const STREAK_EMOJIS = ['⭐', '🔥', '🎉', '💪', '✨'];

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
  private progressBar!: Phaser.GameObjects.Container;
  private streakText!: Phaser.GameObjects.Text;
  private structurePreview!: Phaser.GameObjects.Container;
  private previewPulseTween?: Phaser.Tweens.Tween;
  private locked = false; // prevent double-tap
  private streak = 0;
  private questionSlot: { x: number; y: number } = { x: 0, y: 0 };
  private questionOverlays: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'PuzzleScene' });
  }

  init(data: { rewardManager?: RewardManager; streak?: number }): void {
    if (data?.rewardManager) {
      this.rewardManager = data.rewardManager;
    } else {
      this.rewardManager = new RewardManager();
    }
    this.streak = data?.streak ?? 0;
    this.generator = new PatternGenerator();
  }

  create(): void {
    // Themed background based on current structure
    const structure = this.rewardManager.getCurrentStructure();
    const bg = structure.pastelBg;
    this.cameras.main.setBackgroundColor(bg);
    const bgRgb = Phaser.Display.Color.HexStringToColor(bg);
    this.cameras.main.fadeIn(250, bgRgb.red, bgRgb.green, bgRgb.blue);

    this.buildProgressBar();
    this.buildStructurePreview();
    this.nextPuzzle();
  }

  // ─── Progress bar (visual, no text — one small block per slot) ───────────

  private buildProgressBar(): void {
    const { width } = this.scale;
    this.progressBar = this.add.container(width / 2, 30);
    this.streakText = this.add
      .text(20, 30, '', { fontSize: '22px' })
      .setOrigin(0, 0.5);
    this.updateProgressBar();
  }

  private updateProgressBar(): void {
    this.progressBar.removeAll(true);
    const structure = this.rewardManager.getCurrentStructure();
    const filled = this.rewardManager.getFilledCount();
    const total = this.rewardManager.getTotalSlots();

    const size = 22;
    const gap = 6;
    const totalWidth = total * size + (total - 1) * gap;
    const startX = -totalWidth / 2 + size / 2;

    for (let i = 0; i < total; i++) {
      const block = this.add
        .image(startX + i * (size + gap), 0, 'block')
        .setDisplaySize(size, size);
      if (i < filled) {
        block.setTint(structure.color);
      } else {
        block.setTint(0xd5d8dc).setAlpha(0.6);
      }
      this.progressBar.add(block);
    }

    this.streakText.setText(this.streak >= 3 ? `🔥${this.streak}` : '');
  }

  // ─── Structure mini preview (goal picture with pulsing next slot) ────────

  private buildStructurePreview(): void {
    const { width } = this.scale;
    this.structurePreview = this.add.container(width - 70, 80);
    this.refreshStructurePreview();
  }

  private refreshStructurePreview(): void {
    if (this.previewPulseTween) {
      this.previewPulseTween.stop();
      this.previewPulseTween = undefined;
    }
    this.structurePreview.removeAll(true);
    const structure = this.rewardManager.getCurrentStructure();
    const filled = this.rewardManager.getFilledCount();
    const scale = 0.2;

    structure.slots.forEach((slot, i) => {
      const block = this.add
        .image(slot.x * scale, slot.y * scale, 'block')
        .setScale(scale);
      if (i < filled) {
        block.setTint(structure.color);
      } else if (i === filled) {
        // The slot the next correct answer will fill — pulse it in the structure color
        block.setTint(structure.color).setAlpha(0.45);
        this.previewPulseTween = this.tweens.add({
          targets: block,
          alpha: 0.9,
          scaleX: scale * 1.25,
          scaleY: scale * 1.25,
          duration: 550,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      } else {
        // Ghost outline of the rest of the goal shape
        block.setTint(0xb2bec3).setAlpha(0.35);
      }
      this.structurePreview.add(block);
    });
  }

  // ─── Puzzle lifecycle ─────────────────────────────────────────────────────

  nextPuzzle(): void {
    this.locked = false;
    this.wrongAttempts = 0;
    this.clearPuzzleDisplay();

    this.puzzle = this.generator.generate(this.rewardManager.getStructureIndex());
    if (this.puzzle.mode === 'odd') {
      this.drawOddOneOut();
    } else if (this.puzzle.mode === 'math') {
      this.drawMathPuzzle();
      this.drawMathOptions();
    } else {
      this.drawSequence();
      this.drawOptions();
    }
    this.updateProgressBar();
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
    const items = this.puzzle.sequence.map((key, i) =>
      i === this.puzzle.gapIndex ? 'question' : key
    );
    const spacing = Math.min(90, (width - 40) / items.length);
    const totalWidth = spacing * (items.length - 1);
    const startX = width / 2 - totalWidth / 2;
    const y = height * SEQUENCE_Y_RATIO;

    items.forEach((key, i) => {
      const x = startX + i * spacing;
      const img = this.add.image(x, y, key).setDisplaySize(ITEM_SIZE, ITEM_SIZE);
      this.tagPuzzleItem(img);

      // Stagger-animate each item bouncing in
      img.setScale(0);
      this.tweens.add({
        targets: img,
        scaleX: ITEM_SIZE / img.width,
        scaleY: ITEM_SIZE / img.height,
        delay: i * 100,
        duration: 250,
        ease: 'Back.easeOut',
      });

      if (key === 'question') {
        this.questionSlot = { x, y };
        this.questionOverlays = [img];

        const qText = this.add
          .text(x, y, '?', {
            fontSize: '40px',
            fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
            color: '#7f8c8d',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setScale(0);
        this.tagPuzzleItem(qText);
        this.questionOverlays.push(qText);

        // Appear with the image, then pulse forever
        this.tweens.add({
          targets: qText,
          scaleX: 1,
          scaleY: 1,
          delay: i * 100,
          duration: 250,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: qText,
              scaleX: 1.2,
              scaleY: 1.2,
              duration: 600,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });
          },
        });

        // Pulse the question image too
        this.time.delayedCall(i * 100 + 250, () => {
          this.tweens.add({
            targets: img,
            scaleX: (ITEM_SIZE / img.width) * 1.15,
            scaleY: (ITEM_SIZE / img.height) * 1.15,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        });
      }
    });

    // Emoji label instead of text — pick a random emoji pair
    const emoji = Phaser.Utils.Array.GetRandom(EMOJI_LABELS);
    const label = this.add
      .text(width / 2, height * SEQUENCE_Y_RATIO - 68, emoji, {
        fontSize: '44px',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tagPuzzleItem(label);

    this.tweens.add({
      targets: label,
      alpha: 1,
      y: height * SEQUENCE_Y_RATIO - 72,
      duration: 400,
      delay: items.length * 100,
      ease: 'Quad.easeOut',
    });
  }

  // ─── Odd-one-out rendering ─────────────────────────────────────────────

  /** Draw 4 tappable items in a row — the child taps the one that doesn't belong. */
  private drawOddOneOut(): void {
    const { width, height } = this.scale;
    const y = height * 0.52;
    const spacing = 110;
    const startX = width / 2 - (spacing * (this.puzzle.sequence.length - 1)) / 2;

    this.puzzle.sequence.forEach((key, i) => {
      const x = startX + i * spacing;
      const container = this.buildOptionButton(x, y, key);
      container.setScale(0);
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        delay: i * 100,
        duration: 250,
        ease: 'Back.easeOut',
      });
      this.optionButtons.push(container);
      this.tagPuzzleItem(container);
    });

    // Detective emoji label — signals "find the different one"
    const label = this.add
      .text(width / 2, y - 110, ODD_ONE_LABEL, { fontSize: '44px' })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tagPuzzleItem(label);
    this.tweens.add({
      targets: label,
      alpha: 1,
      duration: 400,
      delay: this.puzzle.sequence.length * 100,
      ease: 'Quad.easeOut',
    });
  }

  // ─── Math rendering ───────────────────────────────────────────────────────

  /** Draw a countable equation: [group of items] + [group of items] = ? */
  private drawMathPuzzle(): void {
    const { width, height } = this.scale;
    const math = this.puzzle.math!;
    const y = height * SEQUENCE_Y_RATIO;

    const opWidth = 36;
    const qWidth = 64;
    const gapX = 8;
    const groupAW = this.mathGroupWidth(math.a);
    const groupBW = this.mathGroupWidth(math.b);
    const totalW = groupAW + opWidth + groupBW + opWidth + qWidth + gapX * 4;
    let cursor = width / 2 - totalW / 2;

    // Group A
    this.drawMathGroup(cursor + groupAW / 2, y, math.a, math.item);
    cursor += groupAW + gapX;

    // Operator
    this.addMathSymbol(cursor + opWidth / 2, y, math.op === '+' ? '+' : '−');
    cursor += opWidth + gapX;

    // Group B
    this.drawMathGroup(cursor + groupBW / 2, y, math.b, math.item);
    cursor += groupBW + gapX;

    // Equals
    this.addMathSymbol(cursor + opWidth / 2, y, '=');
    cursor += opWidth + gapX;

    // Question slot (same pulsing '?' treatment as fill puzzles)
    const qx = cursor + qWidth / 2;
    const qImg = this.add.image(qx, y, 'question').setDisplaySize(qWidth, qWidth);
    this.tagPuzzleItem(qImg);
    const qText = this.add
      .text(qx, y, '?', {
        fontSize: '36px',
        fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
        color: '#7f8c8d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.tagPuzzleItem(qText);
    this.questionSlot = { x: qx, y };
    this.questionOverlays = [qImg, qText];
    this.tweens.add({
      targets: [qImg, qText],
      scaleX: { from: 1, to: 1.15 },
      scaleY: { from: 1, to: 1.15 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Operator emoji label above the equation
    const label = this.add
      .text(width / 2, y - 130, math.op === '+' ? '➕' : '➖', { fontSize: '40px' })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tagPuzzleItem(label);
    this.tweens.add({ targets: label, alpha: 1, duration: 400, delay: 300 });
  }

  private mathGroupCols(n: number): number {
    return Math.min(n, Math.ceil(Math.sqrt(n)) + (n > 6 ? 1 : 0));
  }

  private mathGroupWidth(n: number): number {
    return this.mathGroupCols(n) * 32;
  }

  /** Draw n copies of an item sprite in a compact grid centered at (cx, cy). */
  private drawMathGroup(cx: number, cy: number, n: number, item: string): void {
    const cols = this.mathGroupCols(n);
    const rows = Math.ceil(n / cols);
    const cell = 32;
    const size = 28;
    for (let i = 0; i < n; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const inRow = Math.min(cols, n - row * cols); // center the last, shorter row
      const x = cx + (col - (inRow - 1) / 2) * cell;
      const yy = cy + (row - (rows - 1) / 2) * cell;
      const img = this.add.image(x, yy, item).setDisplaySize(size, size).setScale(0);
      this.tagPuzzleItem(img);
      this.tweens.add({
        targets: img,
        scaleX: size / img.width,
        scaleY: size / img.height,
        delay: i * 60,
        duration: 200,
        ease: 'Back.easeOut',
      });
    }
  }

  private addMathSymbol(x: number, y: number, symbol: string): void {
    const t = this.add
      .text(x, y, symbol, {
        fontSize: '40px',
        fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
        color: '#2c3e50',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.tagPuzzleItem(t);
  }

  /** Answer buttons for math: big numeral with counting dots underneath. */
  private drawMathOptions(): void {
    const { width, height } = this.scale;
    const count = this.puzzle.options.length;
    const spacing = width / (count + 1);
    const y = height * OPTIONS_Y_RATIO;

    this.puzzle.options.forEach((optionKey, i) => {
      const x = spacing + i * spacing;
      const container = this.buildMathOptionButton(x, y, optionKey);
      this.optionButtons.push(container);
      this.tagPuzzleItem(container);
    });
  }

  private buildMathOptionButton(x: number, y: number, key: string): Phaser.GameObjects.Container {
    const n = parseInt(key.split('_')[1]);
    const bg = this.add.graphics();
    this.drawOptionBg(bg, false);

    const numeral = this.add
      .text(0, -14, `${n}`, {
        fontSize: '44px',
        fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
        color: '#2c3e50',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Counting dots (rows of 5) so pre-readers can verify by counting
    const dots = this.add.graphics();
    dots.fillStyle(0x3498db, 1);
    for (let i = 0; i < n; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const inRow = Math.min(5, n - row * 5);
      const dx = (col - (inRow - 1) / 2) * 15;
      const dy = 24 + row * 13;
      dots.fillCircle(dx, dy, 5);
    }

    const container = this.add.container(x, y, [bg, numeral, dots]);
    container.setSize(104, 104);
    container.setData('key', key);
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
    container.setData('key', key);
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
      this.streak++;
      this.handleCorrect(container);
    } else {
      this.streak = 0;
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

    // Streak celebration (before flying away)
    if (this.streak >= 3) {
      this.playStreakCelebration();
    }

    // Odd mode: fade out the matching items so the odd one stands alone, then fly off
    if (this.puzzle.mode === 'odd') {
      this.optionButtons.forEach((btn) => {
        if (btn !== container) {
          this.tweens.add({ targets: btn, alpha: 0.25, duration: 300 });
        }
      });
      this.tweens.add({
        targets: container,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.time.delayedCall(400, () => this.flyToStructure(container));
        },
      });
      return;
    }

    // Scale up, then fly to the question slot to complete the pattern
    this.tweens.add({
      targets: container,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 150,
      yoyo: true,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.flyToPatternSlot(container);
      },
    });
  }

  /** Animate the selected option flying to the question slot to complete the pattern. */
  private flyToPatternSlot(container: Phaser.GameObjects.Container): void {
    const { x: slotX, y: slotY } = this.questionSlot;

    // Fade out the question-mark overlays (the "?" image and text)
    this.questionOverlays.forEach((obj) => {
      this.tweens.add({ targets: obj, alpha: 0, duration: 200 });
    });

    // Math buttons hold a Text numeral, not an Image — just shrink the whole button
    const slotScale =
      this.puzzle.mode === 'math'
        ? 0.65
        : ITEM_SIZE / (container.getAt(1) as Phaser.GameObjects.Image).width;

    this.tweens.add({
      targets: container,
      x: slotX,
      y: slotY,
      scaleX: slotScale,
      scaleY: slotScale,
      duration: 350,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Brief pause so the child sees the completed pattern
        this.time.delayedCall(600, () => {
          this.flyToStructure(container);
        });
      },
    });
  }

  /** Animate from the pattern slot to the structure preview, then transition. */
  private flyToStructure(container: Phaser.GameObjects.Container): void {
    const { width } = this.scale;
    const targetX = width - 70;
    const targetY = 80;

    this.tweens.add({
      targets: container,
      x: targetX,
      y: targetY,
      scaleX: 0.3,
      scaleY: 0.3,
      duration: 400,
      ease: 'Quad.easeIn',
      onComplete: () => {
        const blockPos = this.rewardManager.addBlock();
        this.scene.start('BuildScene', {
          blockPos,
          rewardManager: this.rewardManager,
          isComplete: this.rewardManager.isStructureComplete(),
          streak: this.streak,
        });
      },
    });
  }

  /** Big confetti + flying emoji for 3+ streak */
  private playStreakCelebration(): void {
    const { width, height } = this.scale;
    const emoji = Phaser.Utils.Array.GetRandom(STREAK_EMOJIS);
    const streakText = this.add
      .text(width / 2, height * 0.55, `${emoji} ${this.streak}x ${emoji}`, {
        fontSize: '48px',
        fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
      })
      .setOrigin(0.5)
      .setScale(0);
    this.tagPuzzleItem(streakText);

    this.tweens.add({
      targets: streakText,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 900,
      ease: 'Quad.easeOut',
      onStart: () => streakText.setScale(0.3).setAlpha(1),
    });

    // Confetti burst from center
    this.spawnConfetti(width / 2, height * 0.55, 12);
  }

  /** Spawn confetti particles */
  private spawnConfetti(x: number, y: number, count = 8): void {
    const colors = [0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71, 0xe67e22, 0x9b59b6];
    for (let i = 0; i < count; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(Phaser.Utils.Array.GetRandom(colors), 1);
      particle.fillRect(-4, -4, 8, 8);
      particle.x = x;
      particle.y = y;
      this.tagPuzzleItem(particle);

      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.Between(60, 160);
      const vx = Math.cos(Phaser.Math.DegToRad(angle)) * speed;
      const vy = Math.sin(Phaser.Math.DegToRad(angle)) * speed;

      this.tweens.add({
        targets: particle,
        x: particle.x + vx,
        y: particle.y + vy + 60,
        angle: Phaser.Math.Between(-360, 360),
        alpha: 0,
        duration: 600,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
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
      (c) => c.getData('key') === this.puzzle.correctAnswer
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
