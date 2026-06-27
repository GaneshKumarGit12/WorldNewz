import Phaser from "phaser";

export default class Cubie2048Scene extends Phaser.Scene {
  private score: number = 0;
  private nextValue: number = 2;
  private previewCube: Phaser.Physics.Arcade.Sprite | null = null;
  private cubesGroup: Phaser.Physics.Arcade.Group | null = null;
  private wallLeft: Phaser.GameObjects.Rectangle | null = null;
  private wallRight: Phaser.GameObjects.Rectangle | null = null;
  private ground: Phaser.GameObjects.Rectangle | null = null;
  private limitLine: Phaser.GameObjects.Graphics | null = null;
  private canDrop: boolean = true;
  private isGameOver: boolean = false;
  private topTimeCounter: number = 0;
  private limitY: number = 130;

  // Dimensions
  private gameWidth: number = 400;
  private gameHeight: number = 600;
  private wallWidth: number = 16;

  // Cooldown in ms
  private dropCooldown: number = 500;

  constructor() {
    super("Cubie2048Scene");
  }

  preload() {
    // Generate textures dynamically during preload or create
  }

  create() {
    this.score = 0;
    this.isGameOver = false;
    this.canDrop = true;
    this.topTimeCounter = 0;
    this.nextValue = this.getRandomNextValue();

    // Create background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e1b4b, 0x311042, 1);
    bg.fillRect(0, 0, this.gameWidth, this.gameHeight);

    // Wall physics and graphics
    this.ground = this.add.rectangle(
      this.gameWidth / 2,
      this.gameHeight - 10,
      this.gameWidth,
      20,
      0x475569
    );
    this.physics.add.existing(this.ground, true);

    this.wallLeft = this.add.rectangle(
      this.wallWidth / 2,
      this.gameHeight / 2 + 50,
      this.wallWidth,
      this.gameHeight - 100,
      0x475569
    );
    this.physics.add.existing(this.wallLeft, true);

    this.wallRight = this.add.rectangle(
      this.gameWidth - this.wallWidth / 2,
      this.gameHeight / 2 + 50,
      this.wallWidth,
      this.gameHeight - 100,
      0x475569
    );
    this.physics.add.existing(this.wallRight, true);

    // Draw neon border around walls
    const borderGfx = this.add.graphics();
    borderGfx.lineStyle(2, 0xa855f7, 0.6);
    borderGfx.strokeRect(
      this.wallWidth,
      100,
      this.gameWidth - this.wallWidth * 2,
      this.gameHeight - 110
    );

    // Limit Line (dotted red)
    this.limitLine = this.add.graphics();
    this.drawLimitLine();

    // Cubes group
    this.cubesGroup = this.physics.add.group({
      allowGravity: true,
      bounceX: 0.2,
      bounceY: 0.2,
    });

    // Create dynamic textures
    this.generateCubeTextures();

    // Spawn first preview cube
    this.spawnPreviewCube();

    // Physics Colliders
    this.physics.add.collider(this.cubesGroup, this.ground);
    this.physics.add.collider(this.cubesGroup, this.wallLeft);
    this.physics.add.collider(this.cubesGroup, this.wallRight);
    this.physics.add.collider(this.cubesGroup, this.cubesGroup, (obj1, obj2) => {
      this.handleCubeCollision(obj1 as Phaser.Physics.Arcade.Sprite, obj2 as Phaser.Physics.Arcade.Sprite);
    });

    // Input handlers
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.handlePointerMove(pointer);
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer);
    });
  }

  update(time: number, delta: number) {
    if (this.isGameOver) return;

    // Check if any cube is resting above the limit line (y < limitY)
    let anyAboveLine = false;
    const cubes = this.cubesGroup?.getChildren() as Phaser.Physics.Arcade.Sprite[];
    if (cubes) {
      for (const cube of cubes) {
        // Skip if this is the active preview cube (not dropped yet)
        if (cube === this.previewCube || cube.getData("dropped") === false) {
          continue;
        }

        // Check if the top of the cube is above the limit line
        const cubeTop = cube.y - (cube.body ? cube.body.halfHeight : 0);

        // If the cube is above the limit line and moving very slowly or resting
        if (cubeTop < this.limitY) {
          const body = cube.body as Phaser.Physics.Arcade.Body;
          if (body && Math.abs(body.velocity.y) < 5) {
            anyAboveLine = true;
          }
        }
      }
    }

    if (anyAboveLine) {
      this.topTimeCounter += delta;
      // Change color of limit line to bright red blinking
      const blink = Math.floor(time / 200) % 2 === 0;
      this.limitLine?.clear();
      this.limitLine?.lineStyle(3, blink ? 0xef4444 : 0xfca5a5, 0.9);
      this.limitLine?.lineBetween(this.wallWidth, this.limitY, this.gameWidth - this.wallWidth, this.limitY);

      if (this.topTimeCounter >= 3000) {
        this.triggerGameOver();
      }
    } else {
      this.topTimeCounter = 0;
      this.drawLimitLine();
    }
  }

  private drawLimitLine() {
    this.limitLine?.clear();
    this.limitLine?.lineStyle(2, 0xef4444, 0.4);
    // Draw dashed red line
    const startX = this.wallWidth;
    const endX = this.gameWidth - this.wallWidth;
    const dashLength = 8;
    const gapLength = 6;
    let currentX = startX;

    while (currentX < endX) {
      this.limitLine?.lineBetween(currentX, this.limitY, Math.min(currentX + dashLength, endX), this.limitY);
      currentX += dashLength + gapLength;
    }
  }

  private getRandomNextValue(): number {
    // 2, 4, 8, 16 (Weighted: 2 has 50%, 4 has 30%, 8 has 15%, 16 has 5%)
    const rand = Math.random();
    if (rand < 0.5) return 2;
    if (rand < 0.8) return 4;
    if (rand < 0.95) return 8;
    return 16;
  }

  private getCubeProperties(value: number) {
    const sizeMap: Record<number, number> = {
      2: 46,
      4: 50,
      8: 54,
      16: 58,
      32: 62,
      64: 66,
      128: 70,
      256: 74,
      512: 78,
      1024: 82,
      2048: 86,
      4096: 90,
      8192: 94,
    };

    const colorMap: Record<number, { bg: string; text: string }> = {
      2: { bg: "#e2e8f0", text: "#334155" }, // Slate 200
      4: { bg: "#fde68a", text: "#92400e" }, // Amber 200
      8: { bg: "#fed7aa", text: "#ea580c" }, // Orange 200
      16: { bg: "#fecaca", text: "#dc2626" }, // Red 200
      32: { bg: "#fbcfe8", text: "#db2777" }, // Pink 200
      64: { bg: "#e9d5ff", text: "#9333ea" }, // Purple 200
      128: { bg: "#bfdbfe", text: "#2563eb" }, // Blue 200
      256: { bg: "#99f6e4", text: "#0d9488" }, // Teal 200
      512: { bg: "#bae6fd", text: "#0284c7" }, // Sky 200
      1024: { bg: "#bbf7d0", text: "#16a34a" }, // Green 200
      2048: { bg: "#fef08a", text: "#ca8a04" }, // Yellow 200 (Gold)
      4096: { bg: "#475569", text: "#f8fafc" }, // Slate 600
      8192: { bg: "#1e293b", text: "#f8fafc" }, // Slate 800
    };

    const size = sizeMap[value] || 94;
    const colors = colorMap[value] || { bg: "#0f172a", text: "#ffffff" };

    return { size, colors };
  }

  private generateCubeTextures() {
    const values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192];
    values.forEach((val) => {
      const key = `cube_${val}`;
      if (this.textures.exists(key)) return;

      const { size, colors } = this.getCubeProperties(val);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      // Rounded background rectangle
      ctx.fillStyle = colors.bg;
      const radius = size * 0.18;
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, radius);
      ctx.fill();

      // Border glow
      ctx.strokeStyle = val === 2048 ? "rgba(234, 179, 8, 0.8)" : "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = val === 2048 ? 4 : 2;
      ctx.stroke();

      // Inner lighting effect
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.beginPath();
      ctx.roundRect(2, 2, size - 4, size / 2.5, [radius, radius, 0, 0]);
      ctx.fill();

      // Value text
      ctx.fillStyle = colors.text;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const textLen = val.toString().length;
      const fontSize = size * (textLen > 3 ? 0.28 : 0.36);
      ctx.font = `bold ${fontSize}px "Outfit", "Inter", "Segoe UI", sans-serif`;
      ctx.fillText(val.toString(), size / 2, size / 2 + 1);

      this.textures.addCanvas(key, canvas);
    });
  }

  private spawnPreviewCube() {
    if (this.isGameOver) return;

    const value = this.nextValue;
    this.nextValue = this.getRandomNextValue();

    // Trigger update in React (via game event emitter)
    this.game.events.emit("next-cube-changed", this.nextValue);

    const x = this.input.activePointer.x;
    const clampedX = this.clampCubeX(x, value);
    const y = 60;

    const key = `cube_${value}`;
    this.previewCube = this.physics.add.sprite(clampedX, y, key);
    this.previewCube.setData("value", value);
    this.previewCube.setData("dropped", false);
    this.previewCube.setData("merging", false);

    // Disable physics body gravity initially
    const body = this.previewCube.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCollideWorldBounds(true);
  }

  private clampCubeX(x: number, value: number): number {
    const { size } = this.getCubeProperties(value);
    const halfWidth = size / 2;
    const minX = this.wallWidth + halfWidth;
    const maxX = this.gameWidth - this.wallWidth - halfWidth;
    return Phaser.Math.Clamp(x, minX, maxX);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (this.isGameOver || !this.previewCube || this.previewCube.getData("dropped") === true) return;

    const value = this.previewCube.getData("value");
    const clampedX = this.clampCubeX(pointer.x, value);
    this.previewCube.setX(clampedX);
  }

  private handlePointerDown(_pointer: Phaser.Input.Pointer) {
    if (this.isGameOver || !this.canDrop || !this.previewCube || this.previewCube.getData("dropped") === true) return;

    // Drop current cube
    this.canDrop = false;
    const cube = this.previewCube;
    cube.setData("dropped", true);

    const body = cube.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    // Add to active collision group
    this.cubesGroup?.add(cube);

    // Cooldown before next drop
    this.time.delayedCall(this.dropCooldown, () => {
      this.canDrop = true;
      this.spawnPreviewCube();
    }, [], this);
  }

  private handleCubeCollision(c1: Phaser.Physics.Arcade.Sprite, c2: Phaser.Physics.Arcade.Sprite) {
    const val1 = c1.getData("value");
    const val2 = c2.getData("value");
    const isDropped1 = c1.getData("dropped");
    const isDropped2 = c2.getData("dropped");

    // Only merge if they are both active in play, have the same value, and are not already merging
    if (val1 === val2 && isDropped1 && isDropped2 && !c1.getData("merging") && !c2.getData("merging")) {
      c1.setData("merging", true);
      c2.setData("merging", true);

      this.mergeCubes(c1, c2);
    }
  }

  private mergeCubes(c1: Phaser.Physics.Arcade.Sprite, c2: Phaser.Physics.Arcade.Sprite) {
    const val = c1.getData("value");
    const newVal = val * 2;
    const scoreAwarded = newVal;

    // Calculate merge position (midpoint)
    const midX = (c1.x + c2.x) / 2;
    const midY = (c1.y + c2.y) / 2;

    // Exploding visual particles
    this.createMergeParticles(midX, midY, val);

    // Shake camera subtly
    this.cameras.main.shake(80, 0.004);

    // Increment score
    this.score += scoreAwarded;
    this.game.events.emit("score-changed", this.score);
    this.game.events.emit("cube-merged", { scoreAwarded, mergedValue: newVal });

    // Destroy parents
    c1.destroy();
    c2.destroy();

    // Spawn combined cube
    const maxSupported = 8192;
    const finalVal = Math.min(newVal, maxSupported);
    const combined = this.physics.add.sprite(midX, midY, `cube_${finalVal}`);
    combined.setData("value", finalVal);
    combined.setData("dropped", true);
    combined.setData("merging", false);

    const body = combined.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setCollideWorldBounds(true);
    body.setBounce(0.2, 0.2);
    body.setVelocityY(-120); // Small pop up animation velocity

    this.cubesGroup?.add(combined);
  }

  private createMergeParticles(x: number, y: number, value: number) {
    const { colors } = this.getCubeProperties(value);
    const hexColor = Phaser.Display.Color.HexStringToColor(colors.bg).color;

    // We can create a simple particle emitter or custom temporary circles
    for (let i = 0; i < 12; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(50, 150);
      const circle = this.add.circle(x, y, Phaser.Math.Between(4, 8), hexColor);

      this.physics.add.existing(circle);
      const body = circle.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

      // Fade out and destroy
      this.tweens.add({
        targets: circle,
        alpha: 0,
        scale: 0.1,
        duration: 400,
        onComplete: () => circle.destroy(),
      });
    }
  }

  private triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Darken all cubes and freeze them
    const cubes = this.cubesGroup?.getChildren() as Phaser.Physics.Arcade.Sprite[];
    if (cubes) {
      cubes.forEach((cube) => {
        cube.setTint(0x555555);
        if (cube.body) {
          const body = cube.body as Phaser.Physics.Arcade.Body;
          body.setEnable(false);
        }
      });
    }

    if (this.previewCube) {
      this.previewCube.destroy();
    }

    // Trigger update in React (via game event emitter)
    this.game.events.emit("game-over", this.score);
  }
}
