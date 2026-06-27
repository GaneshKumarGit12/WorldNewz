import Phaser from "phaser";

interface SnakeSegment {
  sprite: Phaser.Physics.Arcade.Sprite;
  value: number;
}

interface Snake {
  id: string;
  name: string;
  isAI: boolean;
  head: Phaser.Physics.Arcade.Sprite;
  segments: SnakeSegment[];
  speed: number;
  boostActive: boolean;
  boostCooldown: number; // 0 to 100
  aiTargetX?: number;
  aiTargetY?: number;
  aiActionTimer?: number;
}

export default class DVCubie2026Scene extends Phaser.Scene {
  private mapWidth = 2000;
  private mapHeight = 2000;
  private playerSnake!: Snake;
  private aiSnakes: Snake[] = [];
  private foodGroup!: Phaser.Physics.Arcade.Group;
  private blockerGroup!: Phaser.Physics.Arcade.StaticGroup;
  
  // Game state
  private isGameOver = false;
  private maxFood = 120;
  private maxBlockers = 25;
  private nextCubeVal = 2;

  constructor() {
    super("DVCubie2026Scene");
  }

  create() {
    this.isGameOver = false;
    this.aiSnakes = [];
    this.rollNextCube();

    // Set world physics bounds
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);

    // Draw grid background
    const gridGfx = this.add.graphics();
    gridGfx.lineStyle(1, 0x1e1b4b, 0.4);
    for (let x = 0; x < this.mapWidth; x += 80) {
      gridGfx.lineBetween(x, 0, x, this.mapHeight);
    }
    for (let y = 0; y < this.mapHeight; y += 80) {
      gridGfx.lineBetween(0, y, this.mapWidth, y);
    }

    // Dynamic texture creation
    this.generateCubeTextures();
    this.generateObstacleTextures();

    // Food and blocker groups
    this.foodGroup = this.physics.add.group();
    this.blockerGroup = this.physics.add.staticGroup();

    // Spawn Initial map entities
    this.spawnInitialFood();
    this.spawnInitialBlockers();

    // Spawn Player
    this.playerSnake = this.spawnSnake("Player (You)", false, 1000, 1000, 4);

    // Camera follow player
    this.cameras.main.startFollow(this.playerSnake.head, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.0);

    // Spawn AI Opponents
    const names = ["ShadowCube", "Matrix99", "AlphaNull", "Vortex2026", "BlitzCube", "NullPoint", "DeltaV"];
    for (let i = 0; i < names.length; i++) {
      const rx = Phaser.Math.Between(100, this.mapWidth - 100);
      const ry = Phaser.Math.Between(100, this.mapHeight - 100);
      // Avoid player spawn zone
      if (Phaser.Math.Distance.Between(rx, ry, 1000, 1000) > 300) {
        const startVal = Phaser.Math.RND.pick([2, 4, 8, 16]);
        this.aiSnakes.push(this.spawnSnake(names[i], true, rx, ry, startVal));
      }
    }

    // Setup input listeners
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // In mobile, we check if it is not clicking boost
      if (!pointer.wasTouch) {
        this.playerSnake.boostActive = true;
      }
    });

    this.input.on("pointerup", () => {
      this.playerSnake.boostActive = false;
    });

    // Share player score and rankings updates
    this.time.addEvent({
      delay: 500,
      callback: () => {
        if (!this.isGameOver) {
          const score = this.getSnakeScore(this.playerSnake);
          this.game.events.emit("score-changed", score);
          this.updateArenaRankings();
        }
      },
      loop: true
    });

    // Overlap rules (collisions are auto-registered in spawnSnake)
  }

  update(time: number, delta: number) {
    if (this.isGameOver) return;

    // 1. Move Player Snake
    this.updatePlayerMovement();

    // 2. Move AI Snakes
    this.updateAIMovement(time, delta);

    // 3. Update all trails (kinematic distance follow)
    this.updateSnakeTrail(this.playerSnake);
    this.aiSnakes.forEach(snake => this.updateSnakeTrail(snake));

    // 4. Combat / Collision checks between snakes
    this.checkSnakeCollisions();

    // 5. Spawn new food elements if count is low
    if (this.foodGroup.countActive() < this.maxFood - 10) {
      this.spawnSingleFood();
    }
  }

  // Mobile API called by React Button
  public setMobileBoost(active: boolean) {
    if (this.playerSnake) {
      this.playerSnake.boostActive = active;
    }
  }

  private updatePlayerMovement() {
    const head = this.playerSnake.head;
    let targetX = this.input.activePointer.worldX;
    let targetY = this.input.activePointer.worldY;

    // Handle touch/dragging
    if (this.input.activePointer.isDown) {
      targetX = this.input.activePointer.worldX;
      targetY = this.input.activePointer.worldY;
    }

    const dist = Phaser.Math.Distance.Between(head.x, head.y, targetX, targetY);
    if (dist > 15) {
      const angle = Phaser.Math.Angle.Between(head.x, head.y, targetX, targetY);
      head.setRotation(angle);

      // Boost calculation
      let speed = this.playerSnake.speed;
      if (this.playerSnake.boostActive && this.playerSnake.boostCooldown > 0) {
        speed *= 1.8;
        this.playerSnake.boostCooldown = Math.max(0, this.playerSnake.boostCooldown - 0.8);
        this.game.events.emit("boost-cooldown-changed", this.playerSnake.boostCooldown);
      } else {
        this.playerSnake.boostCooldown = Math.min(100, this.playerSnake.boostCooldown + 0.3);
        this.game.events.emit("boost-cooldown-changed", this.playerSnake.boostCooldown);
      }

      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      head.setVelocity(vx, vy);
    } else {
      head.setVelocity(0, 0);
    }
  }

  private updateAIMovement(time: number, _delta: number) {
    this.aiSnakes.forEach(snake => {
      const head = snake.head;

      // Choose a target direction periodically
      if (!snake.aiActionTimer || time > snake.aiActionTimer) {
        snake.aiActionTimer = time + Phaser.Math.Between(800, 2000);

        // Simple decisions: Hunt smaller snake or wander to food
        let targetX = Phaser.Math.Between(100, this.mapWidth - 100);
        let targetY = Phaser.Math.Between(100, this.mapHeight - 100);

        const myVal = head.getData("value");

        // Flee from player if player is bigger
        const distToPlayer = Phaser.Math.Distance.Between(head.x, head.y, this.playerSnake.head.x, this.playerSnake.head.y);
        const playerVal = this.playerSnake.head.getData("value");

        if (distToPlayer < 250) {
          if (playerVal > myVal) {
            // Run in opposite direction
            const angle = Phaser.Math.Angle.Between(this.playerSnake.head.x, this.playerSnake.head.y, head.x, head.y);
            targetX = head.x + Math.cos(angle) * 400;
            targetY = head.y + Math.sin(angle) * 400;
            snake.boostActive = true;
          } else {
            // Chase player
            targetX = this.playerSnake.head.x;
            targetY = this.playerSnake.head.y;
            snake.boostActive = Phaser.Math.Between(0, 10) > 7;
          }
        } else {
          // Steer towards closest food
          let closestFood: Phaser.Physics.Arcade.Sprite | null = null;
          let minDist = 400;
          this.foodGroup.getChildren().forEach(f => {
            const food = f as Phaser.Physics.Arcade.Sprite;
            const d = Phaser.Math.Distance.Between(head.x, head.y, food.x, food.y);
            if (d < minDist) {
              minDist = d;
              closestFood = food;
            }
          });

          if (closestFood) {
            targetX = (closestFood as Phaser.Physics.Arcade.Sprite).x;
            targetY = (closestFood as Phaser.Physics.Arcade.Sprite).y;
          }
          snake.boostActive = false;
        }

        snake.aiTargetX = Phaser.Math.Clamp(targetX, 50, this.mapWidth - 50);
        snake.aiTargetY = Phaser.Math.Clamp(targetY, 50, this.mapHeight - 50);
      }

      if (snake.aiTargetX !== undefined && snake.aiTargetY !== undefined) {
        const dist = Phaser.Math.Distance.Between(head.x, head.y, snake.aiTargetX, snake.aiTargetY);
        if (dist > 15) {
          const angle = Phaser.Math.Angle.Between(head.x, head.y, snake.aiTargetX, snake.aiTargetY);
          head.setRotation(angle);

          let speed = snake.speed;
          if (snake.boostActive) speed *= 1.8;

          head.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        } else {
          head.setVelocity(0, 0);
          snake.aiActionTimer = 0; // Trigger new path decision
        }
      }
    });
  }

  private updateSnakeTrail(snake: Snake) {
    const segments = [snake.head, ...snake.segments.map(s => s.sprite)];

    for (let i = 1; i < segments.length; i++) {
      const seg = segments[i];
      const target = segments[i - 1];
      const val = seg.getData("value") || 2;
      const { size } = this.getCubeProperties(val);

      const followDist = size * 0.70; // Maintain block overlap
      const dist = Phaser.Math.Distance.Between(seg.x, seg.y, target.x, target.y);

      if (dist > followDist) {
        const angle = Phaser.Math.Angle.Between(seg.x, seg.y, target.x, target.y);
        seg.x = target.x - Math.cos(angle) * followDist;
        seg.y = target.y - Math.sin(angle) * followDist;
        seg.setRotation(angle);
      }
    }
  }

  private checkSnakeCollisions() {
    // Check player head vs AI segments
    this.aiSnakes.forEach((aiSnake, aiIdx) => {
      // Player head vs AI head
      const distHead = Phaser.Math.Distance.Between(this.playerSnake.head.x, this.playerSnake.head.y, aiSnake.head.x, aiSnake.head.y);
      if (distHead < 40) {
        const playerVal = this.playerSnake.head.getData("value");
        const aiVal = aiSnake.head.getData("value");

        if (playerVal > aiVal) {
          // Player eats AI
          this.absorbSnake(this.playerSnake, aiSnake);
          this.aiSnakes.splice(aiIdx, 1);
          this.createMergeParticles(aiSnake.head.x, aiSnake.head.y, aiVal);
        } else if (aiVal > playerVal) {
          // Player dies
          this.triggerGameOver();
        }
        return;
      }

      // Player head vs AI trailing segments
      aiSnake.segments.forEach((seg, segIdx) => {
        const dist = Phaser.Math.Distance.Between(this.playerSnake.head.x, this.playerSnake.head.y, seg.sprite.x, seg.sprite.y);
        if (dist < 38) {
          const playerVal = this.playerSnake.head.getData("value");
          if (playerVal > seg.value) {
            // Player eats tail segment
            this.appendTailSegment(this.playerSnake, seg.value);
            this.createMergeParticles(seg.sprite.x, seg.sprite.y, seg.value);
            seg.sprite.destroy();
            aiSnake.segments.splice(segIdx, 1);
            this.cascadeMerge(this.playerSnake);
          }
        }
      });
    });

    // Check AI head vs player segments
    this.aiSnakes.forEach((aiSnake) => {
      this.playerSnake.segments.forEach((seg, segIdx) => {
        const dist = Phaser.Math.Distance.Between(aiSnake.head.x, aiSnake.head.y, seg.sprite.x, seg.sprite.y);
        if (dist < 38) {
          const aiVal = aiSnake.head.getData("value");
          if (aiVal > seg.value) {
            // AI eats player segment
            this.appendTailSegment(aiSnake, seg.value);
            this.createMergeParticles(seg.sprite.x, seg.sprite.y, seg.value);
            seg.sprite.destroy();
            this.playerSnake.segments.splice(segIdx, 1);
            this.cascadeMerge(aiSnake);
          }
        }
      });
    });
  }

  private handleFoodEating(snake: Snake, food: Phaser.Physics.Arcade.Sprite) {
    const val = food.getData("value");
    food.destroy();

    if (snake === this.playerSnake) {
      this.appendTailSegment(snake, this.nextCubeVal);
      this.rollNextCube();
    } else {
      this.appendTailSegment(snake, val);
    }
    this.cascadeMerge(snake);
  }

  // division sign logic removed

  private absorbSnake(hunter: Snake, prey: Snake) {
    // Add prey's head value as segment
    const headVal = prey.head.getData("value");
    this.appendTailSegment(hunter, headVal);
    
    // Add all trailing segments
    prey.segments.forEach(seg => {
      this.appendTailSegment(hunter, seg.value);
      seg.sprite.destroy();
    });

    prey.head.destroy();
    this.cascadeMerge(hunter);

    if (hunter === this.playerSnake) {
      this.cameras.main.flash(200, 168, 85, 247);
      this.game.events.emit("toast-alert", `🔥 You completely consumed ${prey.name}!`);
    }

    // Respawn AI snake
    if (prey.isAI) {
      this.time.delayedCall(3000, () => {
        const rx = Phaser.Math.Between(100, this.mapWidth - 100);
        const ry = Phaser.Math.Between(100, this.mapHeight - 100);
        const ai = this.spawnSnake(prey.name, true, rx, ry, 4);
        this.aiSnakes.push(ai);
      });
    }
  }

  private appendTailSegment(snake: Snake, val: number) {
    let lastX = snake.head.x;
    let lastY = snake.head.y;
    let lastRotation = snake.head.rotation;

    if (snake.segments.length > 0) {
      const lastSeg = snake.segments[snake.segments.length - 1].sprite;
      lastX = lastSeg.x;
      lastY = lastSeg.y;
      lastRotation = lastSeg.rotation;
    }

    // Offset segment slightly behind
    const { size } = this.getCubeProperties(val);
    const spawnX = lastX - Math.cos(lastRotation) * size;
    const spawnY = lastY - Math.sin(lastRotation) * size;

    const sprite = this.physics.add.sprite(spawnX, spawnY, `cube_${val}`);
    sprite.setData("value", val);
    
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCollideWorldBounds(true);

    snake.segments.push({ sprite, value: val });
  }

  private cascadeMerge(snake: Snake) {
    let merged = false;

    // 1. Scan tail list for matching pairs
    for (let i = snake.segments.length - 1; i > 0; i--) {
      const segCurrent = snake.segments[i];
      const segPrev = snake.segments[i - 1];

      if (segCurrent.value === segPrev.value) {
        const newVal = segCurrent.value * 2;

        segPrev.value = newVal;
        segPrev.sprite.setData("value", newVal);
        segPrev.sprite.setTexture(`cube_${newVal}`);

        this.createMergeParticles(segPrev.sprite.x, segPrev.sprite.y, newVal);

        // Remove and destroy current
        snake.segments.splice(i, 1);
        segCurrent.sprite.destroy();

        merged = true;
        break;
      }
    }

    // 2. Compare first segment in tail list with head
    if (snake.segments.length > 0) {
      const firstSeg = snake.segments[0];
      const headVal = snake.head.getData("value");

      if (firstSeg.value === headVal) {
        const newVal = headVal * 2;

        snake.head.setData("value", newVal);
        snake.head.setTexture(`cube_${newVal}`);

        this.createMergeParticles(snake.head.x, snake.head.y, newVal);

        // Remove and destroy first
        snake.segments.splice(0, 1);
        firstSeg.sprite.destroy();

        merged = true;
      }
    }

    if (merged) {
      if (snake === this.playerSnake) {
        this.cameras.main.shake(60, 0.003);
        const headVal = snake.head.getData("value");
        this.game.events.emit("cube-merged", { scoreAwarded: headVal, mergedValue: headVal });
        // Emit virtual coin earned
        this.game.events.emit("coin-earned", 1);
        this.game.events.emit("score-changed", headVal);
      }
      this.updateArenaRankings();
      // Recursive call for cascading chains
      this.cascadeMerge(snake);
    }
  }

  private getSnakeScore(snake: Snake): number {
    return (snake.head.getData("value") as number) || 2;
  }

  private updateArenaRankings() {
    if (this.isGameOver || !this.playerSnake) return;
    const rankings = [
      { name: this.playerSnake.name, score: this.getSnakeScore(this.playerSnake), isPlayer: true },
      ...this.aiSnakes.map(ai => ({ name: ai.name, score: this.getSnakeScore(ai), isPlayer: false }))
    ].sort((a, b) => b.score - a.score);

    this.game.events.emit("arena-rankings-updated", rankings);
  }

  private spawnSnake(name: string, isAI: boolean, x: number, y: number, startVal: number): Snake {
    const head = this.physics.add.sprite(x, y, `cube_${startVal}`);
    head.setData("value", startVal);
    head.setData("name", name);

    const body = head.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCollideWorldBounds(true);

    const snake: Snake = {
      id: isAI ? `ai_${Phaser.Math.RND.uuid()}` : "player",
      name,
      isAI,
      head,
      segments: [],
      speed: 130,
      boostActive: false,
      boostCooldown: 100
    };

    // Add a text tag above head for player names
    const textTag = this.add.text(x, y - 40, name, {
      fontSize: "12px",
      color: isAI ? "#94a3b8" : "#a855f7",
      fontStyle: "bold",
      fontFamily: "Outfit"
    }).setOrigin(0.5);

    // Make the text tag follow the head
    this.time.addEvent({
      delay: 16,
      callback: () => {
        if (head.active) {
          textTag.setPosition(head.x, head.y - 45);
        } else {
          textTag.destroy();
        }
      },
      loop: true
    });

    // Auto-register physics colliders and overlaps
    this.physics.add.overlap(head, this.foodGroup, (_head, food) => {
      this.handleFoodEating(snake, food as Phaser.Physics.Arcade.Sprite);
    });

    this.physics.add.collider(head, this.blockerGroup);

    return snake;
  }

  // --- Map Spawners ---

  private spawnInitialFood() {
    for (let i = 0; i < this.maxFood; i++) {
      this.spawnSingleFood();
    }
  }

  private spawnSingleFood() {
    const rx = Phaser.Math.Between(50, this.mapWidth - 50);
    const ry = Phaser.Math.Between(50, this.mapHeight - 50);
    const val = Phaser.Math.RND.pick([2, 2, 2, 4, 4, 8, 16]); // Weighted towards small values

    const food = this.foodGroup.create(rx, ry, `cube_${val}`);
    food.setData("value", val);
    const body = food.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
  }

  private spawnInitialBlockers() {
    for (let i = 0; i < this.maxBlockers; i++) {
      this.spawnSingleBlocker();
    }
  }

  private spawnSingleBlocker() {
    const rx = Phaser.Math.Between(100, this.mapWidth - 100);
    const ry = Phaser.Math.Between(100, this.mapHeight - 100);

    // Avoid player start zone
    if (Phaser.Math.Distance.Between(rx, ry, 1000, 1000) < 250) {
      this.spawnSingleBlocker();
      return;
    }

    const blocker = this.blockerGroup.create(rx, ry, "blocker");
    blocker.refreshBody();
  }

  private createMergeParticles(x: number, y: number, value: number) {
    const { colors } = this.getCubeProperties(value);
    const hexColor = Phaser.Display.Color.HexStringToColor(colors.bg).color;

    for (let i = 0; i < 8; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(40, 100);
      const circle = this.add.circle(x, y, Phaser.Math.Between(3, 6), hexColor);

      this.physics.add.existing(circle);
      const body = circle.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

      this.tweens.add({
        targets: circle,
        alpha: 0,
        scale: 0.1,
        duration: 350,
        onComplete: () => circle.destroy()
      });
    }
  }

  // --- Texture Generators ---

  private getCubeProperties(value: number) {
    const sizeMap: Record<number, number> = {
      2: 44,
      4: 48,
      8: 52,
      16: 56,
      32: 60,
      64: 64,
      128: 68,
      256: 72,
      512: 76,
      1024: 80,
      2048: 84,
      4096: 88,
      8192: 92
    };
    const size = sizeMap[value] || 92;

    const skin = localStorage.getItem("dvcubie_equipped_skin") || "default";

    // Dynamic Skin mappings
    if (skin === "neon") {
      const neonColors: Record<number, { bg: string; text: string }> = {
        2: { bg: "#06b6d4", text: "#ffffff" },
        4: { bg: "#ec4899", text: "#ffffff" },
        8: { bg: "#eab308", text: "#ffffff" },
        16: { bg: "#22c55e", text: "#ffffff" },
        32: { bg: "#a855f7", text: "#ffffff" },
        64: { bg: "#ef4444", text: "#ffffff" },
        128: { bg: "#3b82f6", text: "#ffffff" },
        256: { bg: "#f97316", text: "#ffffff" },
        512: { bg: "#10b981", text: "#ffffff" },
        1024: { bg: "#d946ef", text: "#ffffff" },
        2048: { bg: "#f43f5e", text: "#ffffff" }
      };
      const colors = neonColors[value] || { bg: "#0f172a", text: "#00ffff" };
      return { size, colors };
    }

    if (skin === "gold") {
      const colors = { bg: "#eab308", text: "#1e1b4b" };
      if (value >= 128) {
        colors.bg = "#d97706";
        colors.text = "#ffffff";
      }
      if (value >= 1024) {
        colors.bg = "#f59e0b";
        colors.text = "#1e1b4b";
      }
      return { size, colors };
    }

    if (skin === "magma") {
      const magmaColors: Record<number, { bg: string; text: string }> = {
        2: { bg: "#7f1d1d", text: "#fca5a5" },
        4: { bg: "#991b1b", text: "#fca5a5" },
        8: { bg: "#b91c1c", text: "#fecaca" },
        16: { bg: "#dc2626", text: "#fee2e2" },
        32: { bg: "#ea580c", text: "#ffedd5" },
        64: { bg: "#f97316", text: "#ffedd5" },
        128: { bg: "#fdba74", text: "#7c2d12" },
        256: { bg: "#facc15", text: "#713f12" },
        512: { bg: "#fef08a", text: "#713f12" },
        1024: { bg: "#ffffff", text: "#7f1d1d" }
      };
      const colors = magmaColors[value] || { bg: "#450a0a", text: "#ffffff" };
      return { size, colors };
    }

    if (skin === "matrix") {
      const colors = { bg: "#022c22", text: "#10b981" };
      if (value >= 256) colors.bg = "#064e3b";
      if (value >= 1024) {
        colors.bg = "#10b981";
        colors.text = "#022c22";
      }
      return { size, colors };
    }

    // Default skin
    const colorMap: Record<number, { bg: string; text: string }> = {
      2: { bg: "#e2e8f0", text: "#334155" },
      4: { bg: "#fde68a", text: "#92400e" },
      8: { bg: "#fed7aa", text: "#ea580c" },
      16: { bg: "#fecaca", text: "#dc2626" },
      32: { bg: "#fbcfe8", text: "#db2777" },
      64: { bg: "#e9d5ff", text: "#9333ea" },
      128: { bg: "#bfdbfe", text: "#2563eb" },
      256: { bg: "#99f6e4", text: "#0d9488" },
      512: { bg: "#bae6fd", text: "#0284c7" },
      1024: { bg: "#bbf7d0", text: "#16a34a" },
      2048: { bg: "#fef08a", text: "#ca8a04" },
      4096: { bg: "#475569", text: "#f8fafc" },
      8192: { bg: "#1e293b", text: "#f8fafc" }
    };
    const colors = colorMap[value] || { bg: "#0f172a", text: "#ffffff" };
    return { size, colors };
  }

  private generateCubeTextures() {
    const values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192];
    values.forEach((val) => {
      const key = `cube_${val}`;
      if (this.textures.exists(key)) {
        this.textures.remove(key);
      }

      const { size, colors } = this.getCubeProperties(val);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = colors.bg;
      const radius = size * 0.16;
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, radius);
      ctx.fill();

      ctx.strokeStyle = val === 2048 ? "rgba(234, 179, 8, 0.8)" : "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = val === 2048 ? 3.5 : 2;
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      ctx.beginPath();
      ctx.roundRect(1.5, 1.5, size - 3, size / 2.7, [radius, radius, 0, 0]);
      ctx.fill();

      // Draw value text
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

  private generateObstacleTextures() {
    // 1. Static Square Blocker (Gray 3D Bevel Box)
    if (!this.textures.exists("blocker")) {
      const canvas = document.createElement("canvas");
      canvas.width = 120;
      canvas.height = 120;
      const ctx = canvas.getContext("2d")!;

      // Background Bevel / Shadow Frame
      ctx.fillStyle = "#374151"; // Slate Gray Shadow
      ctx.beginPath();
      ctx.roundRect(0, 0, 120, 120, 16);
      ctx.fill();

      // Top Face slightly shifted
      ctx.fillStyle = "#6b7280"; // Medium Slate Gray
      ctx.beginPath();
      ctx.roundRect(4, 4, 112, 112, 12);
      ctx.fill();

      // Reflective glass reflection highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.beginPath();
      ctx.roundRect(8, 8, 104, 52, [8, 8, 0, 0]);
      ctx.fill();

      this.textures.addCanvas("blocker", canvas);
    }
  }

  private triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Freeze player movements
    this.playerSnake.head.setVelocity(0, 0);
    this.playerSnake.head.setTint(0xef4444);
    this.playerSnake.segments.forEach(seg => {
      seg.sprite.setTint(0x555555);
    });

    const score = this.getSnakeScore(this.playerSnake);
    this.game.events.emit("game-over", score);
  }

  private rollNextCube() {
    this.nextCubeVal = Phaser.Math.RND.pick([2, 4, 8, 16]);
    this.game.events.emit("next-cube-changed", this.nextCubeVal);
  }
}
