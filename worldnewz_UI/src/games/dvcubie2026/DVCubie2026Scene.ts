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
  boosterType?: string | null;
  boosterTimer?: number;
}

export default class DVCubie2026Scene extends Phaser.Scene {
  private mapWidth = 2000;
  private mapHeight = 2000;
  private playerSnake!: Snake;
  private aiSnakes: Snake[] = [];
  private foodGroup!: Phaser.Physics.Arcade.Group;
  private blockerGroup!: Phaser.Physics.Arcade.StaticGroup;
  private boosterGroup!: Phaser.Physics.Arcade.Group;
  
  // Game state
  private isGameOver = false;
  private maxFood = 120;
  private maxBlockers = 25;
  private maxBoosters = 12;
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
    this.generateBoosterTextures();

    // Food, blocker and booster groups
    this.foodGroup = this.physics.add.group();
    this.blockerGroup = this.physics.add.staticGroup();
    this.boosterGroup = this.physics.add.group();

    // Spawn Initial map entities
    this.spawnInitialFood();
    this.spawnInitialBlockers();
    this.spawnInitialBoosters();

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

    // 5. Update booster timers for player
    if (this.playerSnake && this.playerSnake.boosterTimer !== undefined && this.playerSnake.boosterTimer > 0) {
      this.playerSnake.boosterTimer -= delta / 1000;
      this.game.events.emit("booster-tick", { type: this.playerSnake.boosterType, time: Math.max(0, this.playerSnake.boosterTimer) });
      if (this.playerSnake.boosterTimer <= 0) {
        this.playerSnake.boosterType = null;
        this.game.events.emit("booster-deactivated");
      }
    }

    // 6. Update booster timers for AI
    this.aiSnakes.forEach(ai => {
      if (ai.boosterTimer !== undefined && ai.boosterTimer > 0) {
        ai.boosterTimer -= delta / 1000;
        if (ai.boosterTimer <= 0) {
          ai.boosterType = null;
        }
      }
    });

    // 7. Spawn new food elements if count is low
    if (this.foodGroup.countActive() < this.maxFood - 10) {
      this.spawnSingleFood();
    }

    // 8. Spawn new boosters if count is low
    if (this.boosterGroup.countActive() < this.maxBoosters) {
      this.spawnSingleBooster();
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

      // Apply temporary booster modifiers (1X/2X speed up, /1//2 slow down)
      if (this.playerSnake.boosterType) {
        if (this.playerSnake.boosterType.startsWith("/")) {
          speed *= 0.65;
        } else {
          speed *= 1.45;
        }
      }

      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      head.setVelocity(vx, vy);
    } else {
      head.setVelocity(0, 0);
    }
  }

  private updateAIMovement(time: number, _delta: number) {
    const allSnakes = [this.playerSnake, ...this.aiSnakes].filter(s => s && s.head && s.head.active);

    this.aiSnakes.forEach(snake => {
      const head = snake.head;
      if (!head || !head.active) return;

      // Choose a target direction periodically
      if (!snake.aiActionTimer || time > snake.aiActionTimer) {
        snake.aiActionTimer = time + Phaser.Math.Between(500, 1500);

        const myVal = head.getData("value") as number;
        let targetX = Phaser.Math.Between(100, this.mapWidth - 100);
        let targetY = Phaser.Math.Between(100, this.mapHeight - 100);
        let actionChosen = false;

        // 1. Scan for closest other snake (Player or AI) to fight or flee
        let closestOtherSnake: Snake | null = null;
        let minSnakeDist = 320;

        allSnakes.forEach(other => {
          if (other === snake || !other.head || !other.head.active) return;
          const dist = Phaser.Math.Distance.Between(head.x, head.y, other.head.x, other.head.y);
          if (dist < minSnakeDist) {
            minSnakeDist = dist;
            closestOtherSnake = other;
          }
        });

        if (closestOtherSnake) {
          const otherHead = (closestOtherSnake as Snake).head;
          const otherVal = otherHead.getData("value") as number;

          if (otherVal > myVal) {
            // Flee from bigger opponent!
            const angle = Phaser.Math.Angle.Between(otherHead.x, otherHead.y, head.x, head.y);
            targetX = head.x + Math.cos(angle) * 450;
            targetY = head.y + Math.sin(angle) * 450;
            snake.boostActive = true;
          } else {
            // Chase smaller prey!
            targetX = otherHead.x;
            targetY = otherHead.y;
            snake.boostActive = Phaser.Math.Between(0, 10) > 4;
          }
          actionChosen = true;
        }

        // 2. Scan for nearby boosters to get stronger if not in combat
        if (!actionChosen) {
          let closestBooster: Phaser.Physics.Arcade.Sprite | null = null;
          let minBoosterDist = 250;

          this.boosterGroup.getChildren().forEach(b => {
            const booster = b as Phaser.Physics.Arcade.Sprite;
            const dist = Phaser.Math.Distance.Between(head.x, head.y, booster.x, booster.y);
            if (dist < minBoosterDist) {
              minBoosterDist = dist;
              closestBooster = booster;
            }
          });

          if (closestBooster) {
            targetX = (closestBooster as Phaser.Physics.Arcade.Sprite).x;
            targetY = (closestBooster as Phaser.Physics.Arcade.Sprite).y;
            snake.boostActive = false;
            actionChosen = true;
          }
        }

        // 3. Scan for closest food to grow
        if (!actionChosen) {
          let closestFood: Phaser.Physics.Arcade.Sprite | null = null;
          let minFoodDist = 500;

          this.foodGroup.getChildren().forEach(f => {
            const food = f as Phaser.Physics.Arcade.Sprite;
            const dist = Phaser.Math.Distance.Between(head.x, head.y, food.x, food.y);
            if (dist < minFoodDist) {
              minFoodDist = dist;
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

          let speed = snake.speed;
          if (snake.boostActive) speed *= 1.8;

          // Apply temporary booster modifiers
          if (snake.boosterType) {
            if (snake.boosterType.startsWith("/")) {
              speed *= 0.65;
            } else {
              speed *= 1.45;
            }
          }

          // Compute desired heading velocity towards target
          let vx = Math.cos(angle) * speed;
          let vy = Math.sin(angle) * speed;

          // Add obstacle avoidance repulsion forces directly to velocity vector
          this.blockerGroup.getChildren().forEach(b => {
            const blocker = b as Phaser.Physics.Arcade.Sprite;
            const d = Phaser.Math.Distance.Between(head.x, head.y, blocker.x, blocker.y);
            if (d < 120) {
              const repelAngle = Phaser.Math.Angle.Between(blocker.x, blocker.y, head.x, head.y);
              const force = (120 - d) * 3.5;
              vx += Math.cos(repelAngle) * force;
              vy += Math.sin(repelAngle) * force;
            }
          });

          // Compute final combined heading angle and apply velocity
          const finalAngle = Phaser.Math.Angle.Between(0, 0, vx, vy);
          head.setRotation(finalAngle);
          head.setVelocity(Math.cos(finalAngle) * speed, Math.sin(finalAngle) * speed);
        } else {
          head.setVelocity(0, 0);
          snake.aiActionTimer = 0;
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
    const allSnakes = [this.playerSnake, ...this.aiSnakes].filter(s => s && s.head && s.head.active);

    for (let i = 0; i < allSnakes.length; i++) {
      const snakeA = allSnakes[i];
      
      for (let j = 0; j < allSnakes.length; j++) {
        if (i === j) continue;
        const snakeB = allSnakes[j];
        if (!snakeB.head || !snakeB.head.active) continue;

        // 1. Head-to-Head Collision
        const distHead = Phaser.Math.Distance.Between(snakeA.head.x, snakeA.head.y, snakeB.head.x, snakeB.head.y);
        if (distHead < 40) {
          const valA = snakeA.head.getData("value");
          const valB = snakeB.head.getData("value");

          if (valA > valB) {
            this.createMergeParticles(snakeB.head.x, snakeB.head.y, valB);
            this.destroySnake(snakeB);
            return;
          } else if (valB > valA) {
            this.createMergeParticles(snakeA.head.x, snakeA.head.y, valA);
            this.destroySnake(snakeA);
            return;
          } else {
            this.updateHeadValue(snakeA, valA * 2);
            this.createMergeParticles(snakeB.head.x, snakeB.head.y, valB);
            this.destroySnake(snakeB);
            return;
          }
        }

        // 2. Head of snakeA vs trailing segments of snakeB
        for (let k = 0; k < snakeB.segments.length; k++) {
          const seg = snakeB.segments[k];
          if (!seg.sprite || !seg.sprite.active) continue;

          const distSeg = Phaser.Math.Distance.Between(snakeA.head.x, snakeA.head.y, seg.sprite.x, seg.sprite.y);
          if (distSeg < 38) {
            const valA = snakeA.head.getData("value");
            const valSeg = seg.value;

            if (valA > valSeg) {
              this.createMergeParticles(seg.sprite.x, seg.sprite.y, valSeg);
              
              // Truncate and scatter B's chain from this point onwards as loose cubes
              const cutSegments = snakeB.segments.splice(k);
              cutSegments.forEach(cutSeg => {
                if (cutSeg.sprite && cutSeg.sprite.active) {
                  this.spawnSingleFood(
                    cutSeg.sprite.x + Phaser.Math.Between(-15, 15), 
                    cutSeg.sprite.y + Phaser.Math.Between(-15, 15), 
                    cutSeg.value
                  );
                  cutSeg.sprite.destroy();
                }
              });
              
              return;
            } else if (valA < valSeg) {
              this.createMergeParticles(snakeA.head.x, snakeA.head.y, valA);
              this.destroySnake(snakeA);
              return;
            } else {
              this.updateHeadValue(snakeA, valA * 2);
              this.createMergeParticles(seg.sprite.x, seg.sprite.y, valSeg);
              
              seg.sprite.destroy();
              snakeB.segments.splice(k, 1);
              
              return;
            }
          }
        }
      }
    }
  }

  private handleFoodEating(snake: Snake, food: Phaser.Physics.Arcade.Sprite) {
    const val = food.getData("value");
    food.destroy();

    const headVal = snake.head.getData("value") as number;

    if (snake === this.playerSnake) {
      const currentNext = this.nextCubeVal;
      if (currentNext === headVal) {
        this.updateHeadValue(snake, headVal * 2);
      } else {
        this.appendTailSegment(snake, currentNext);
        this.cascadeMerge(snake);
      }
      this.rollNextCube();
    } else {
      if (val === headVal) {
        this.updateHeadValue(snake, headVal * 2);
      } else {
        this.appendTailSegment(snake, val);
        this.cascadeMerge(snake);
      }
    }
  }

  private updateHeadValue(snake: Snake, newVal: number) {
    this.ensureCubeTexture(newVal);
    snake.head.setData("value", newVal);
    snake.head.setTexture(`cube_${newVal}`);
    if (snake === this.playerSnake) {
      this.cameras.main.shake(60, 0.003);
      this.game.events.emit("score-changed", newVal);
      this.game.events.emit("cube-merged", { scoreAwarded: newVal, mergedValue: newVal });
      this.game.events.emit("coin-earned", 1);
    }
    this.updateArenaRankings();
  }

  private destroySnake(snake: Snake) {
    const headVal = snake.head.getData("value");
    if (headVal) {
      this.spawnSingleFood(snake.head.x + Phaser.Math.Between(-30, 30), snake.head.y + Phaser.Math.Between(-30, 30), headVal);
    }
    
    snake.segments.forEach(seg => {
      if (seg.sprite && seg.sprite.active) {
        this.spawnSingleFood(seg.sprite.x + Phaser.Math.Between(-20, 20), seg.sprite.y + Phaser.Math.Between(-20, 20), seg.value);
        seg.sprite.destroy();
      }
    });
    snake.segments = [];

    if (snake.head && snake.head.active) {
      snake.head.destroy();
    }

    if (snake === this.playerSnake) {
      this.triggerGameOver();
    } else {
      const idx = this.aiSnakes.indexOf(snake);
      if (idx !== -1) {
        this.aiSnakes.splice(idx, 1);
      }
      
      this.time.delayedCall(3000, () => {
        if (this.isGameOver) return;
        const rx = Phaser.Math.Between(100, this.mapWidth - 100);
        const ry = Phaser.Math.Between(100, this.mapHeight - 100);
        const ai = this.spawnSnake(snake.name, true, rx, ry, 4);
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

    this.ensureCubeTexture(val);
    const sprite = this.physics.add.sprite(spawnX, spawnY, `cube_${val}`);
    sprite.setData("value", val);
    
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCollideWorldBounds(true);

    snake.segments.push({ sprite, value: val });
  }

  private cascadeMerge(snake: Snake) {
    let hasDuplicates = true;
    let safetyCounter = 0;

    while (hasDuplicates && safetyCounter < 100) {
      safetyCounter++;
      hasDuplicates = false;

      const values: number[] = [];
      values.push(snake.head.getData("value") as number);
      snake.segments.forEach(seg => values.push(seg.value));

      let dupVal = -1;
      let firstIdx = -1;
      let secondIdx = -1;

      for (let i = 0; i < values.length; i++) {
        for (let j = i + 1; j < values.length; j++) {
          if (values[i] === values[j]) {
            dupVal = values[i];
            firstIdx = i;
            secondIdx = j;
            break;
          }
        }
        if (dupVal !== -1) break;
      }

      if (dupVal !== -1) {
        hasDuplicates = true;
        
        const segToRemoveIdx = secondIdx - 1;
        const segToRemove = snake.segments[segToRemoveIdx];
        if (segToRemove && segToRemove.sprite) {
          this.createMergeParticles(segToRemove.sprite.x, segToRemove.sprite.y, dupVal);
          segToRemove.sprite.destroy();
        }
        snake.segments.splice(segToRemoveIdx, 1);

        const newVal = dupVal * 2;
        if (firstIdx === 0) {
          this.updateHeadValue(snake, newVal);
        } else {
          const segToDoubleIdx = firstIdx - 1;
          const segToDouble = snake.segments[segToDoubleIdx];
          if (segToDouble) {
            segToDouble.value = newVal;
            segToDouble.sprite.setData("value", newVal);
            this.ensureCubeTexture(newVal);
            segToDouble.sprite.setTexture(`cube_${newVal}`);
            this.createMergeParticles(segToDouble.sprite.x, segToDouble.sprite.y, newVal);
          }
        }
      }
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
    this.ensureCubeTexture(startVal);
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

    this.physics.add.overlap(head, this.boosterGroup, (_head, booster) => {
      this.handleBoosterEating(snake, booster as Phaser.Physics.Arcade.Sprite);
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

  private spawnSingleFood(x?: number, y?: number, value?: number) {
    const rx = x !== undefined ? x : Phaser.Math.Between(50, this.mapWidth - 50);
    const ry = y !== undefined ? y : Phaser.Math.Between(50, this.mapHeight - 50);
    const val = value !== undefined ? value : Phaser.Math.RND.pick([2, 2, 2, 4, 4, 8, 16]);

    this.ensureCubeTexture(val);
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

  private formatValue(val: number): string {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(0) + "M";
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(0) + "K";
    }
    return val.toString();
  }

  private ensureCubeTexture(val: number) {
    const key = `cube_${val}`;
    if (this.textures.exists(key)) {
      return;
    }
    const { size, colors } = this.getCubeProperties(val);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.46;

    const vCenter = { x: cx, y: cy + r * 0.1 };
    const vTop = { x: cx, y: cy - r * 0.9 };
    const vBottom = { x: cx, y: cy + r * 1.0 };
    const vLeftTop = { x: cx - r * 0.866, y: cy - r * 0.4 };
    const vRightTop = { x: cx + r * 0.866, y: cy - r * 0.4 };
    const vLeftBottom = { x: cx - r * 0.866, y: cy + r * 0.5 };
    const vRightBottom = { x: cx + r * 0.866, y: cy + r * 0.5 };

    const adjustColor = (hexColor: string, percent: number) => {
      let hex = hexColor.replace("#", "");
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      let rHexVal = Math.max(0, Math.min(255, Math.floor(parseInt(hex.substring(0, 2), 16) * percent)));
      let gHexVal = Math.max(0, Math.min(255, Math.floor(parseInt(hex.substring(2, 4), 16) * percent)));
      let bHexVal = Math.max(0, Math.min(255, Math.floor(parseInt(hex.substring(4, 6), 16) * percent)));

      return `#${rHexVal.toString(16).padStart(2, "0")}${gHexVal.toString(16).padStart(2, "0")}${bHexVal.toString(16).padStart(2, "0")}`;
    };

    const topColor = adjustColor(colors.bg, 1.25);
    const leftColor = adjustColor(colors.bg, 0.95);
    const rightColor = adjustColor(colors.bg, 0.70);

    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineWidth = 1.0;

    // Top Face
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(vCenter.x, vCenter.y);
    ctx.lineTo(vLeftTop.x, vLeftTop.y);
    ctx.lineTo(vTop.x, vTop.y);
    ctx.lineTo(vRightTop.x, vRightTop.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Left Face
    ctx.fillStyle = leftColor;
    ctx.beginPath();
    ctx.moveTo(vCenter.x, vCenter.y);
    ctx.lineTo(vLeftTop.x, vLeftTop.y);
    ctx.lineTo(vLeftBottom.x, vLeftBottom.y);
    ctx.lineTo(vBottom.x, vBottom.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Face
    ctx.fillStyle = rightColor;
    ctx.beginPath();
    ctx.moveTo(vCenter.x, vCenter.y);
    ctx.lineTo(vRightTop.x, vRightTop.y);
    ctx.lineTo(vRightBottom.x, vRightBottom.y);
    ctx.lineTo(vBottom.x, vBottom.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glossy Highlight outline for Top Face
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(vCenter.x, vCenter.y - 1);
    ctx.lineTo(vLeftTop.x + 1, vLeftTop.y + 1);
    ctx.lineTo(vTop.x, vTop.y + 1);
    ctx.lineTo(vRightTop.x - 1, vRightTop.y + 1);
    ctx.closePath();
    ctx.stroke();

    // Text on Top Face
    ctx.fillStyle = colors.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const formattedText = this.formatValue(val);
    const textLen = formattedText.length;
    const textX = cx;
    const textY = cy - r * 0.35;
    const fontSize = size * (textLen > 3 ? 0.22 : 0.28);
    ctx.font = `bold ${fontSize}px "Outfit", "Inter", sans-serif`;
    ctx.fillText(formattedText, textX, textY);

    this.textures.addCanvas(key, canvas);
  }

  private generateCubeTextures() {
    const values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
    values.forEach((val) => {
      this.ensureCubeTexture(val);
    });
  }

  private generateObstacleTextures() {
    if (this.textures.exists("blocker")) {
      this.textures.remove("blocker");
    }

    const canvas = document.createElement("canvas");
    canvas.width = 80;
    canvas.height = 80;
    const ctx = canvas.getContext("2d")!;

    const size = 80;
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.46;

    const vCenter = { x: cx, y: cy + r * 0.1 };
    const vTop = { x: cx, y: cy - r * 0.9 };
    const vBottom = { x: cx, y: cy + r * 1.0 };
    const vLeftTop = { x: cx - r * 0.866, y: cy - r * 0.4 };
    const vRightTop = { x: cx + r * 0.866, y: cy - r * 0.4 };
    const vLeftBottom = { x: cx - r * 0.866, y: cy + r * 0.5 };
    const vRightBottom = { x: cx + r * 0.866, y: cy + r * 0.5 };

    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 1.5;

    // Top Face (Lighter Slate)
    ctx.fillStyle = "#64748b";
    ctx.beginPath();
    ctx.moveTo(vCenter.x, vCenter.y);
    ctx.lineTo(vLeftTop.x, vLeftTop.y);
    ctx.lineTo(vTop.x, vTop.y);
    ctx.lineTo(vRightTop.x, vRightTop.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Left Face (Medium Slate)
    ctx.fillStyle = "#475569";
    ctx.beginPath();
    ctx.moveTo(vCenter.x, vCenter.y);
    ctx.lineTo(vLeftTop.x, vLeftTop.y);
    ctx.lineTo(vLeftBottom.x, vLeftBottom.y);
    ctx.lineTo(vBottom.x, vBottom.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Face (Dark Slate)
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.moveTo(vCenter.x, vCenter.y);
    ctx.lineTo(vRightTop.x, vRightTop.y);
    ctx.lineTo(vRightBottom.x, vRightBottom.y);
    ctx.lineTo(vBottom.x, vBottom.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    this.textures.addCanvas("blocker", canvas);
  }

  private triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Freeze player movements
    if (this.playerSnake.head && this.playerSnake.head.active) {
      this.playerSnake.head.setVelocity(0, 0);
      this.playerSnake.head.setTint(0xef4444);
    }
    this.playerSnake.segments.forEach(seg => {
      if (seg.sprite && seg.sprite.active) {
        seg.sprite.setTint(0x555555);
      }
    });

    const score = this.getSnakeScore(this.playerSnake);
    this.game.events.emit("game-over", score);
  }

  private rollNextCube() {
    this.nextCubeVal = Phaser.Math.RND.pick([2, 4, 8, 16]);
    this.game.events.emit("next-cube-changed", this.nextCubeVal);
  }

  private generateBoosterTextures() {
    const boosters = [
      { key: "booster_1x", text: "1X", bg: "#f59e0b", textCol: "#ffffff" },
      { key: "booster_2x", text: "2X", bg: "#ea580c", textCol: "#ffffff" },
      { key: "booster_div1", text: "/1", bg: "#2563eb", textCol: "#ffffff" },
      { key: "booster_div2", text: "/2", bg: "#dc2626", textCol: "#ffffff" }
    ];

    boosters.forEach(b => {
      if (this.textures.exists(b.key)) {
        this.textures.remove(b.key);
      }

      const size = 50;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      const grad = ctx.createRadialGradient(size/2 - 5, size/2 - 5, 2, size/2, size/2, size/2);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.3, b.bg);
      grad.addColorStop(1, "#09090b");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(size/2, size/2, size/2 - 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = b.textCol;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = 'bold 20px "Outfit", sans-serif';
      ctx.fillText(b.text, size/2, size/2);

      this.textures.addCanvas(b.key, canvas);
    });
  }

  private spawnInitialBoosters() {
    for (let i = 0; i < 8; i++) {
      this.spawnSingleBooster();
    }
  }

  private spawnSingleBooster() {
    const rx = Phaser.Math.Between(100, this.mapWidth - 100);
    const ry = Phaser.Math.Between(100, this.mapHeight - 100);

    if (Phaser.Math.Distance.Between(rx, ry, 1000, 1000) < 250) {
      return;
    }

    const type = Phaser.Math.RND.pick(["1X", "2X", "/1", "/2"]);
    const key = type === "1X" ? "booster_1x" : type === "2X" ? "booster_2x" : type === "/1" ? "booster_div1" : "booster_div2";

    const booster = this.boosterGroup.create(rx, ry, key);
    booster.setData("type", type);
    const body = booster.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
  }

  private handleBoosterEating(snake: Snake, booster: Phaser.Physics.Arcade.Sprite) {
    const type = booster.getData("type") as string;
    booster.destroy();

    const headVal = snake.head.getData("value") as number;
    let newVal = headVal;

    if (type === "1X") {
      newVal = headVal * 2;
    } else if (type === "2X") {
      newVal = headVal * 4;
    } else if (type === "/1") {
      newVal = Math.max(2, Math.floor(headVal / 2));
    } else if (type === "/2") {
      newVal = Math.max(2, Math.floor(headVal / 4));
    }

    this.updateHeadValue(snake, newVal);
    this.createMergeParticles(snake.head.x, snake.head.y, newVal);

    snake.boosterType = type;
    snake.boosterTimer = type.startsWith("/") ? 8 : 10;

    if (snake === this.playerSnake) {
      this.cameras.main.flash(150, type.startsWith("/") ? 220 : 245, type.startsWith("/") ? 38 : 158, type.startsWith("/") ? 38 : 11);
      this.game.events.emit("booster-activated", { type, duration: snake.boosterTimer });
    }
  }
}
