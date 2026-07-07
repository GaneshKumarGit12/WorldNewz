export interface Fireball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

export interface BowserBoss {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  vx: number;
  fireCooldown: number;
  alive: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

export interface WarpPipe {
  x: number;
  y: number;
  w: number;
  h: number;
  isEnterable?: boolean;
  warpTarget?: 'underground' | 'overworld';
  returnX?: number;
  returnY?: number;
}

export type MarioTheme =
  | 'Overworld'
  | 'Underground'
  | 'Desert'
  | 'Snow'
  | 'Beach'
  | 'Jungle'
  | 'Mountain'
  | 'Autumn'
  | 'Volcano'
  | 'Castle'
  | 'Underwater'
  | 'Skyland'
  | 'Space'
  | 'Pipeland';

export type TimeOfDay = 'Day' | 'Night';

export class MarioCanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private timerInterval: number | null = null;

  // Mario physics & state
  public x: number = 60;
  public y: number = 280;
  public vx: number = 0;
  public vy: number = 0;
  public width: number = 32;
  public height: number = 44;
  public isGrounded: boolean = false;
  public facing: 'right' | 'left' = 'right';
  public animFrame: number = 0;

  // Power-Ups & Transformations
  public isBig: boolean = false;
  public hasFire: boolean = false;
  public isInvincible: boolean = false;
  public invincibleTimer: number = 0;
  public isGrowingTimer: number = 0; // Small -> Big Growth Animation Timer
  public isFireTransformTimer: number = 0; // Fire Suit Animation Timer

  // Themes & Environment
  public currentTheme: MarioTheme = 'Overworld';
  public timeOfDay: TimeOfDay = 'Day';
  public particlesType: number = 0;
  public particlesList: Particle[] = [];

  // Level & World State
  public worldNum: number = 1;
  public levelNum: number = 1;
  public isUnderground: boolean = false;
  public canWarpDown: boolean = false;
  public transformMsg: string = '';

  // Game Stats
  public score: number = 0;
  public coins: number = 0;
  public lives: number = 3;
  public timeLeft: number = 300;
  public isGameOver: boolean = false;
  public isGameWon: boolean = false;

  // Key States
  public keys: Record<string, boolean> = {};

  // Projectiles & Entities
  public fireballs: Fireball[] = [];
  public platforms: { x: number; y: number; w: number; h: number; type?: string }[] = [];
  public pipesList: WarpPipe[] = [];
  public coinsList: { x: number; y: number; collected: boolean }[] = [];
  public enemies: { x: number; y: number; w: number; h: number; vx: number; alive: boolean; type?: string }[] = [];
  public powerUpItems: { x: number; y: number; type: 'mushroom' | 'flower' | 'star'; collected: boolean }[] = [];
  public questionBlocks: { x: number; y: number; w: number; h: number; hit: boolean; type: 'coin' | 'mushroom' | 'flower' | 'star' }[] = [];
  public hillsList: { x: number; y: number; w: number; h: number }[] = [];
  public cloudsList: { x: number; y: number; scale: number }[] = [];

  // Underground Bonus Room Entities
  public undergroundCoins: { x: number; y: number; collected: boolean }[] = [];
  public undergroundExitPipe: WarpPipe = { x: 450, y: 280, w: 56, h: 100, isEnterable: true, warpTarget: 'overworld' };

  // Goal & Boss
  public flagPole = { x: 2150, y: 120, w: 20, h: 260 };
  public castle = { x: 2280, y: 160, w: 220, h: 220 };
  public bowser: BowserBoss = { x: 2360, y: 310, w: 64, h: 64, hp: 5, maxHp: 5, vx: -1.5, fireCooldown: 0, alive: true };
  public peach = { x: 2460, y: 310, w: 32, h: 48, rescued: false };

  // Camera Offset
  public cameraX: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.loadLevel(1, 1);
  }

  public setWorldTheme(theme: MarioTheme, time: TimeOfDay = 'Day', particles: number = 0): void {
    this.currentTheme = theme;
    this.timeOfDay = time;
    this.particlesType = particles;
    this.initParticles();
  }

  private initParticles(): void {
    this.particlesList = [];
    if (this.particlesType === 0) return;

    for (let i = 0; i < 40; i++) {
      let pColor = '#ffffff';
      let vy = 1;
      let vx = 0;

      if (this.particlesType === 1) {
        pColor = '#ffffff';
        vy = Math.random() * 1.5 + 0.8;
        vx = (Math.random() - 0.5) * 0.6;
      } else if (this.particlesType === 2) {
        pColor = this.currentTheme === 'Autumn' ? '#f97316' : '#22c55e';
        vy = Math.random() * 1.2 + 0.5;
        vx = (Math.random() - 0.5) * 1.2;
      } else if (this.particlesType === 3) {
        pColor = '#ef4444';
        vy = -(Math.random() * 2 + 1);
        vx = (Math.random() - 0.5) * 0.8;
      }

      this.particlesList.push({
        x: Math.random() * 2800,
        y: Math.random() * 450,
        vx,
        vy,
        size: Math.random() * 4 + 2,
        color: pColor
      });
    }
  }

  public reset(): void {
    this.lives = 3;
    this.score = 0;
    this.coins = 0;
    this.isGameOver = false;
    this.isGameWon = false;
    this.loadLevel(this.worldNum, this.levelNum);
  }

  public loadLevel(world: number, level: number): void {
    this.worldNum = world;
    this.levelNum = level;
    this.isUnderground = false;
    this.x = 60;
    this.y = 280;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = false;
    this.cameraX = 0;
    this.timeLeft = 300;
    this.isBig = false;
    this.hasFire = false;
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.isGrowingTimer = 0;
    this.isFireTransformTimer = 0;
    this.fireballs = [];

    if (level === 2) {
      this.setWorldTheme('Underground', 'Day', 0);
    } else if (level === 3) {
      this.setWorldTheme('Skyland', 'Day', 0);
    } else if (level === 4) {
      this.setWorldTheme('Castle', 'Day', 3);
    } else {
      this.setWorldTheme('Overworld', 'Day', 0);
    }

    this.bowser = { x: 2360, y: 310, w: 64, h: 64, hp: 5, maxHp: 5, vx: -1.5, fireCooldown: 0, alive: true };
    this.peach = { x: 2460, y: 310, w: 32, h: 48, rescued: false };

    this.hillsList = [
      { x: 50, y: 280, w: 160, h: 100 },
      { x: 480, y: 260, w: 220, h: 120 },
      { x: 920, y: 280, w: 160, h: 100 },
      { x: 1400, y: 250, w: 240, h: 130 },
      { x: 1950, y: 260, w: 200, h: 120 }
    ];

    this.cloudsList = [
      { x: 120, y: 60, scale: 1 },
      { x: 340, y: 80, scale: 0.8 },
      { x: 620, y: 50, scale: 1.2 },
      { x: 980, y: 70, scale: 0.9 },
      { x: 1350, y: 60, scale: 1.1 },
      { x: 1720, y: 80, scale: 1 }
    ];

    this.platforms = [
      { x: 0, y: 380, w: 900, h: 100 },
      { x: 980, y: 380, w: 650, h: 100 },
      { x: 1700, y: 380, w: 1100, h: 100 },
      { x: 260, y: 260, w: 120, h: 30, type: 'brick' },
      { x: 620, y: 220, w: 160, h: 30, type: 'brick' },
      { x: 1180, y: 240, w: 200, h: 30, type: 'brick' },
      { x: 1550, y: 200, w: 180, h: 30, type: 'brick' }
    ];

    this.createStaircase(1820, 380, 5, 'up');
    this.createStaircase(1980, 380, 5, 'down');

    this.pipesList = [
      { x: 380, y: 320, w: 56, h: 60 },
      { x: 580, y: 290, w: 56, h: 90, isEnterable: true, warpTarget: 'underground', returnX: 1750, returnY: 330 },
      { x: 840, y: 310, w: 56, h: 70 },
      { x: 1450, y: 290, w: 56, h: 90 }
    ];

    this.undergroundCoins = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        this.undergroundCoins.push({ x: 200 + col * 40, y: 160 + row * 40, collected: false });
      }
    }
    this.undergroundExitPipe = { x: 500, y: 280, w: 56, h: 100, isEnterable: true, warpTarget: 'overworld', returnX: 1750, returnY: 330 };

    this.coinsList = [
      { x: 280, y: 220, collected: false },
      { x: 310, y: 220, collected: false },
      { x: 340, y: 220, collected: false },
      { x: 640, y: 180, collected: false },
      { x: 680, y: 180, collected: false },
      { x: 1200, y: 200, collected: false },
      { x: 1240, y: 200, collected: false },
      { x: 1280, y: 200, collected: false }
    ];

    this.questionBlocks = [
      { x: 200, y: 260, w: 32, h: 32, hit: false, type: 'mushroom' },
      { x: 660, y: 220, w: 32, h: 32, hit: false, type: 'flower' },
      { x: 1220, y: 240, w: 32, h: 32, hit: false, type: 'star' },
      { x: 1580, y: 200, w: 32, h: 32, hit: false, type: 'coin' }
    ];

    this.powerUpItems = [];

    this.enemies = [
      { x: 460, y: 348, w: 32, h: 32, vx: -1.2, alive: true, type: 'goomba' },
      { x: 740, y: 348, w: 32, h: 32, vx: -1.5, alive: true, type: 'goomba' },
      { x: 1100, y: 348, w: 32, h: 32, vx: -1.8, alive: true, type: 'koopa' },
      { x: 1650, y: 348, w: 32, h: 32, vx: -2.0, alive: true, type: 'goomba' }
    ];
  }

  private createStaircase(startX: number, groundY: number, steps: number, dir: 'up' | 'down'): void {
    const size = 30;
    for (let col = 0; col < steps; col++) {
      const colHeight = dir === 'up' ? col + 1 : steps - col;
      for (let row = 0; row < colHeight; row++) {
        this.platforms.push({
          x: startX + col * size,
          y: groundY - (row + 1) * size,
          w: size,
          h: size,
          type: 'brick'
        });
      }
    }
  }

  public start(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.timerInterval) clearInterval(this.timerInterval);

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    this.timerInterval = window.setInterval(() => {
      if (!this.isGameOver && !this.isGameWon) {
        this.timeLeft--;
        if (this.invincibleTimer > 0) {
          this.invincibleTimer--;
          if (this.invincibleTimer <= 0) this.isInvincible = false;
        }
        if (this.timeLeft <= 0) {
          this.loseLife("Time Expiry! Mario ran out of time!");
        }
      }
    }, 1000);

    const gameLoop = () => {
      this.update();
      this.draw();
      this.animationFrameId = requestAnimationFrame(gameLoop);
    };
    this.animationFrameId = requestAnimationFrame(gameLoop);
  }

  public stop(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.timerInterval) clearInterval(this.timerInterval);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key] = true;
    if (e.key === 'Control' || e.code === 'ControlLeft' || e.key === 'ControlLeft' || e.key === 'f' || e.key === 'F') {
      this.shootFireball();
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      this.tryEnterWarpPipe();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key] = false;
  };

  public handleMobileInput(action: 'left' | 'right' | 'jump' | 'fire' | 'down' | 'stop'): void {
    if (action === 'left') { this.keys['ArrowLeft'] = true; this.keys['ArrowRight'] = false; this.facing = 'left'; }
    else if (action === 'right') { this.keys['ArrowRight'] = true; this.keys['ArrowLeft'] = false; this.facing = 'right'; }
    else if (action === 'jump') { if (this.isGrounded) this.vy = -13.5; }
    else if (action === 'fire') { this.shootFireball(); }
    else if (action === 'down') { this.tryEnterWarpPipe(); }
    else if (action === 'stop') { this.keys['ArrowLeft'] = false; this.keys['ArrowRight'] = false; }
  }

  public tryEnterWarpPipe(): void {
    if (this.isUnderground) {
      if (Math.abs(this.x - (this.undergroundExitPipe.x + 12)) < 30) {
        this.isUnderground = false;
        this.x = 1750;
        this.y = 280;
        this.cameraX = 1550;
      }
    } else {
      for (const p of this.pipesList) {
        if (p.isEnterable && this.x + 16 > p.x && this.x + 16 < p.x + p.w && Math.abs(this.y + 44 - p.y) < 10) {
          this.isUnderground = true;
          this.x = 100;
          this.y = 280;
          this.cameraX = 0;
          break;
        }
      }
    }
  }

  public shootFireball(): void {
    if (this.hasFire && !this.isGameOver) {
      const fVx = this.facing === 'right' ? 8 : -8;
      this.fireballs.push({
        x: this.x + (this.facing === 'right' ? this.width : -10),
        y: this.y + 16,
        vx: fVx,
        vy: 2,
        active: true
      });
    }
  }

  private update(): void {
    if (this.isGameOver || this.isGameWon) return;

    this.animFrame++;

    // Decrement Growth & Fire Transformation Timers
    if (this.isGrowingTimer > 0) this.isGrowingTimer--;
    if (this.isFireTransformTimer > 0) this.isFireTransformTimer--;

    // Movement Physics
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.vx = 4.5;
      this.facing = 'right';
    } else if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      this.vx = -4.5;
      this.facing = 'left';
    } else {
      this.vx *= 0.8;
    }

    // Jump
    if ((this.keys['ArrowUp'] || this.keys['w'] || this.keys['W'] || this.keys[' ']) && this.isGrounded) {
      this.vy = -13.5;
      this.isGrounded = false;
    }

    // Gravity
    this.vy += 0.65;
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0) this.x = 0;
    this.cameraX = Math.max(0, this.x - 200);

    const mHeight = (this.isBig || this.hasFire) ? 54 : 44;

    if (this.isUnderground) {
      this.isGrounded = false;

      if (this.y + mHeight >= 380) {
        this.y = 380 - mHeight;
        this.vy = 0;
        this.isGrounded = true;
      }

      for (const c of this.undergroundCoins) {
        if (!c.collected && Math.hypot(this.x + 16 - c.x, this.y + 22 - c.y) < 28) {
          c.collected = true;
          this.coins++;
          this.score += 200;
        }
      }
      return;
    }

    this.canWarpDown = false;
    for (const p of this.pipesList) {
      if (p.isEnterable && this.x + 16 > p.x && this.x + 16 < p.x + p.w && Math.abs(this.y + mHeight - p.y) < 12) {
        this.canWarpDown = true;
      }
    }

    this.isGrounded = false;

    for (const p of this.platforms) {
      if (
        this.x + this.width > p.x &&
        this.x < p.x + p.w &&
        this.y + mHeight >= p.y &&
        this.y + mHeight <= p.y + p.h + this.vy
      ) {
        this.y = p.y - mHeight;
        this.vy = 0;
        this.isGrounded = true;
      }
    }

    for (const pipe of this.pipesList) {
      if (
        this.x + this.width > pipe.x &&
        this.x < pipe.x + pipe.w &&
        this.y + mHeight >= pipe.y &&
        this.y + mHeight <= pipe.y + pipe.h + this.vy
      ) {
        this.y = pipe.y - mHeight;
        this.vy = 0;
        this.isGrounded = true;
      }
    }

    // Question Blocks Collisions
    for (const q of this.questionBlocks) {
      if (
        this.x + this.width > q.x &&
        this.x < q.x + q.w &&
        this.y <= q.y + q.h &&
        this.y >= q.y &&
        this.vy < 0
      ) {
        this.vy = 2;
        if (!q.hit) {
          q.hit = true;
          this.score += 200;
          if (q.type === 'coin') {
            this.addCoin();
          } else {
            this.powerUpItems.push({ x: q.x, y: q.y - 32, type: q.type, collected: false });
          }
        }
      }
    }

    // Power-Up Item Collection & Growth Transformation
    for (const item of this.powerUpItems) {
      if (!item.collected && this.checkCollision({ x: this.x, y: this.y, w: this.width, h: mHeight }, { x: item.x, y: item.y, w: 28, h: 28 })) {
        item.collected = true;
        this.score += 1000;
        if (item.type === 'mushroom') {
          this.isGrowingTimer = 30; // 0.5-second growing animation sequence
          this.isBig = true;
          this.transformMsg = '🍄 Small Mario grew into Big Mario!';
        } else if (item.type === 'flower') {
          this.isFireTransformTimer = 20;
          this.hasFire = true;
          this.isBig = true;
          this.transformMsg = '🔥 Equipped Fire Mario Suit!';
        } else if (item.type === 'star') {
          this.isInvincible = true;
          this.invincibleTimer = 10;
          this.transformMsg = '⭐ Invincibility Star Activated!';
        }
        setTimeout(() => { this.transformMsg = ''; }, 3000);
      }
    }

    for (const c of this.coinsList) {
      if (!c.collected && Math.hypot(this.x + 16 - c.x, this.y + 22 - c.y) < 28) {
        c.collected = true;
        this.addCoin();
      }
    }

    for (const f of this.fireballs) {
      if (!f.active) continue;
      f.x += f.vx;
      f.y += f.vy;
      if (f.y >= 360) { f.vy = -4; }
      else { f.vy += 0.5; }

      for (const e of this.enemies) {
        if (e.alive && this.checkCollision({ x: f.x, y: f.y, w: 12, h: 12 }, e)) {
          e.alive = false;
          f.active = false;
          this.score += 500;
        }
      }

      if (this.bowser.alive && this.checkCollision({ x: f.x, y: f.y, w: 12, h: 12 }, this.bowser)) {
        this.bowser.hp--;
        f.active = false;
        if (this.bowser.hp <= 0) {
          this.bowser.alive = false;
          this.score += 5000;
          this.peach.rescued = true;
          this.isGameWon = true;
        }
      }

      if (f.x > this.cameraX + 850 || f.x < this.cameraX - 100) f.active = false;
    }

    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.x += e.vx;
      if (e.x < 300 || e.x > 1900) e.vx *= -1;

      if (this.checkCollision({ x: this.x, y: this.y, w: this.width, h: mHeight }, e)) {
        if (this.isInvincible) {
          e.alive = false;
          this.score += 300;
        } else if (this.vy > 0 && this.y + mHeight - this.vy <= e.y + 12) {
          e.alive = false;
          this.vy = -8;
          this.score += 300;
        } else {
          if (this.isBig || this.hasFire) {
            this.isBig = false;
            this.hasFire = false;
            this.y -= 10;
          } else {
            this.loseLife("Mario got hit by an enemy!");
          }
        }
      }
    }

    if (this.bowser.alive) {
      this.bowser.x += this.bowser.vx;
      if (this.bowser.x < 2250 || this.bowser.x > 2400) this.bowser.vx *= -1;

      if (this.checkCollision({ x: this.x, y: this.y, w: this.width, h: mHeight }, this.bowser)) {
        if (this.isInvincible) {
          this.bowser.hp -= 2;
          if (this.bowser.hp <= 0) {
            this.bowser.alive = false;
            this.peach.rescued = true;
            this.isGameWon = true;
          }
        } else {
          this.loseLife("Bowser defeated Mario!");
        }
      }
    }

    if (this.x >= this.flagPole.x && !this.isGameWon) {
      if (!this.bowser.alive || this.x >= this.peach.x) {
        this.isGameWon = true;
        this.score += this.timeLeft * 50;
      }
    }

    if (this.y > 450) {
      this.loseLife("Mario fell into a pit!");
    }
  }

  private addCoin(): void {
    this.coins++;
    this.score += 200;
    if (this.coins >= 100) {
      this.coins -= 100;
      this.lives++;
    }
  }

  private loseLife(_reason: string): void {
    this.lives--;
    if (this.lives <= 0) {
      this.isGameOver = true;
    } else {
      this.x = Math.max(60, this.cameraX - 100);
      this.y = 280;
      this.vx = 0;
      this.vy = 0;
      this.isBig = false;
      this.hasFire = false;
    }
  }

  private checkCollision(r1: { x: number; y: number; w: number; h: number }, r2: { x: number; y: number; w: number; h: number }): boolean {
    return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
  }

  private draw(): void {
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (this.isUnderground) {
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(0, 0, w, h);

      this.ctx.fillStyle = '#38bdf8';
      this.ctx.font = 'bold 16px sans-serif';
      this.ctx.fillText('🪙 UNDERGROUND COIN HEAVEN BONUS ROOM', 200, 40);
      this.ctx.fillText('Press [DOWN] at Exit Pipe to return!', 230, 70);

      this.ctx.fillStyle = '#1e293b';
      this.ctx.fillRect(0, 380, w, 100);
      this.ctx.fillRect(0, 0, 40, 400);

      for (const c of this.undergroundCoins) {
        if (!c.collected) {
          this.ctx.beginPath();
          this.ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }

      this.drawWarpPipe(this.undergroundExitPipe.x, this.undergroundExitPipe.y, this.undergroundExitPipe.w, this.undergroundExitPipe.h, true);

      this.drawMarioCharacter(this.x, this.y);
      return;
    }

    let skyColor = '#60a5fa';
    let groundColor = '#15803d';
    let dirtColor = '#78350f';

    if (this.timeOfDay === 'Night') {
      skyColor = '#090d16';
      groundColor = '#1e3a1e';
      dirtColor = '#332211';
    }

    switch (this.currentTheme) {
      case 'Desert':
        skyColor = this.timeOfDay === 'Night' ? '#1e1b4b' : '#fef08a';
        groundColor = '#eab308';
        dirtColor = '#a16207';
        break;
      case 'Snow':
        skyColor = this.timeOfDay === 'Night' ? '#0c4a6e' : '#e0f2fe';
        groundColor = '#f8fafc';
        dirtColor = '#38bdf8';
        break;
      case 'Underground':
        skyColor = '#0f172a';
        groundColor = '#1e293b';
        dirtColor = '#090d16';
        break;
      case 'Castle':
        skyColor = '#18181b';
        groundColor = '#3f3f46';
        dirtColor = '#27272a';
        break;
    }

    this.ctx.fillStyle = skyColor;
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.save();
    this.ctx.translate(-this.cameraX, 0);

    this.ctx.fillStyle = '#ffffff';
    for (const c of this.cloudsList) {
      this.drawCloud(c.x, c.y, c.scale);
    }

    for (const hill of this.hillsList) {
      this.drawGreenHill(hill.x, hill.y, hill.w, hill.h);
    }

    for (const p of this.platforms) {
      if (p.type === 'brick') {
        this.ctx.fillStyle = '#b45309';
        this.ctx.fillRect(p.x, p.y, p.w, p.h);
        this.ctx.strokeStyle = '#78350f';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(p.x, p.y, p.w, p.h);
      } else {
        this.ctx.fillStyle = groundColor;
        this.ctx.fillRect(p.x, p.y, p.w, 16);
        this.ctx.fillStyle = dirtColor;
        this.ctx.fillRect(p.x, p.y + 16, p.w, p.h - 16);
      }
    }

    for (const pipe of this.pipesList) {
      this.drawWarpPipe(pipe.x, pipe.y, pipe.w, pipe.h, pipe.isEnterable);
    }

    for (const q of this.questionBlocks) {
      this.drawQuestionBlock(q.x, q.y, q.hit);
    }

    for (const item of this.powerUpItems) {
      if (!item.collected) {
        if (item.type === 'mushroom') this.drawSuperMushroom(item.x, item.y);
        else if (item.type === 'flower') this.drawFireFlower(item.x, item.y);
        else if (item.type === 'star') this.drawSuperStar(item.x, item.y);
      }
    }

    this.ctx.fillStyle = '#eab308';
    for (const c of this.coinsList) {
      if (!c.collected) {
        this.ctx.beginPath();
        this.ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#ca8a04';
        this.ctx.stroke();
      }
    }

    this.ctx.fillStyle = '#ef4444';
    for (const f of this.fireballs) {
      if (f.active) {
        this.ctx.beginPath();
        this.ctx.arc(f.x, f.y, 6, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    for (const e of this.enemies) {
      if (e.alive) {
        if (e.type === 'koopa') this.drawKoopa(e.x, e.y);
        else this.drawGoomba(e.x, e.y);
      }
    }

    if (this.bowser.alive) {
      this.ctx.fillStyle = '#15803d';
      this.ctx.fillRect(this.bowser.x, this.bowser.y, this.bowser.w, this.bowser.h);
      this.ctx.fillStyle = '#dc2626';
      this.ctx.fillRect(this.bowser.x + 10, this.bowser.y - 12, 12, 12);
      this.ctx.fillRect(this.bowser.x + 40, this.bowser.y - 12, 12, 12);

      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.fillRect(this.bowser.x, this.bowser.y - 24, 64, 8);
      this.ctx.fillStyle = '#dc2626';
      this.ctx.fillRect(this.bowser.x, this.bowser.y - 24, (this.bowser.hp / this.bowser.maxHp) * 64, 8);
    }

    this.ctx.fillStyle = '#475569';
    this.ctx.fillRect(this.castle.x, this.castle.y, this.castle.w, this.castle.h);
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(this.castle.x + 80, this.castle.y + 140, 60, 80);

    this.ctx.fillStyle = '#ec4899';
    this.ctx.fillRect(this.peach.x, this.peach.y, this.peach.w, this.peach.h);
    this.ctx.fillStyle = '#eab308';
    this.ctx.fillRect(this.peach.x + 8, this.peach.y - 10, 16, 10);

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.fillRect(this.flagPole.x, this.flagPole.y, this.flagPole.w, this.flagPole.h);
    this.ctx.fillStyle = '#22c55e';
    this.ctx.beginPath();
    this.ctx.arc(this.flagPole.x + 10, this.flagPole.y - 10, 12, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#dc2626';
    this.ctx.fillRect(this.flagPole.x + 20, this.flagPole.y + 10, 40, 24);

    if (this.canWarpDown) {
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.font = 'bold 16px sans-serif';
      this.ctx.fillText('⬇️ Press DOWN to Enter Warp Pipe!', this.x - 60, this.y - 20);
    }

    // DRAW MARIO CHARACTER WITH GROWING TRANSFORMATION ANIMATION
    this.drawMarioCharacter(this.x, this.y);

    this.ctx.restore();
  }

  private drawMarioCharacter(mx: number, my: number): void {
    // Check if Mario is currently in Growing Transformation (Small -> Big)
    let mHeight = (this.isBig || this.hasFire) ? 54 : 44;

    if (this.isGrowingTimer > 0) {
      // Rapid height pulsation (44px <-> 54px) for authentic NES growth sequence!
      const isPulseBig = Math.floor(this.isGrowingTimer / 4) % 2 === 0;
      mHeight = isPulseBig ? 54 : 44;

      // Draw Glowing Transformation Aura
      this.ctx.fillStyle = `rgba(251, 191, 36, ${0.4 + (this.isGrowingTimer % 5) * 0.1})`;
      this.ctx.fillRect(mx - 8, my - (mHeight - 44) - 4, this.width + 16, mHeight + 8);
    }

    const renderY = my - (mHeight - 44);

    // Color Palettes
    let capColor = '#dc2626';
    let shirtColor = '#dc2626';
    let overallsColor = '#2563eb';

    if (this.isInvincible) {
      capColor = `hsl(${(Date.now() / 3) % 360}, 100%, 50%)`;
      shirtColor = capColor;
      overallsColor = `hsl(${(Date.now() / 3 + 120) % 360}, 100%, 50%)`;
    } else if (this.hasFire) {
      capColor = '#ffffff';
      shirtColor = '#ffffff';
      overallsColor = '#dc2626';
    }

    // Cap
    this.ctx.fillStyle = capColor;
    this.ctx.fillRect(mx + (this.facing === 'right' ? 6 : 0), renderY, 22, 10);
    this.ctx.fillRect(mx + (this.facing === 'right' ? 12 : 2), renderY + 4, 18, 6);

    // Face / Skin
    this.ctx.fillStyle = '#fed7aa';
    this.ctx.fillRect(mx + 6, renderY + 10, 18, 12);

    // Mustache & Eye
    this.ctx.fillStyle = '#451a03';
    this.ctx.fillRect(mx + (this.facing === 'right' ? 16 : 4), renderY + 12, 4, 4); // Eye
    this.ctx.fillRect(mx + (this.facing === 'right' ? 14 : 2), renderY + 18, 12, 4); // Mustache

    // Shirt & Torso
    this.ctx.fillStyle = shirtColor;
    this.ctx.fillRect(mx + 4, renderY + 22, 24, 14);

    // Blue Overalls & Straps
    this.ctx.fillStyle = overallsColor;
    this.ctx.fillRect(mx + 6, renderY + 28, 20, mHeight - 34);

    // Yellow Overall Buttons
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fillRect(mx + 8, renderY + 30, 3, 3);
    this.ctx.fillRect(mx + 19, renderY + 30, 3, 3);

    // Boots / Feet with Walking Motion
    const isMoving = Math.abs(this.vx) > 0.5;
    const legOffset = isMoving ? Math.sin(this.animFrame * 0.4) * 4 : 0;

    this.ctx.fillStyle = '#78350f';
    this.ctx.fillRect(mx + 2 + legOffset, renderY + mHeight - 8, 12, 8);
    this.ctx.fillRect(mx + 16 - legOffset, renderY + mHeight - 8, 12, 8);
  }

  private drawQuestionBlock(x: number, y: number, hit: boolean): void {
    this.ctx.fillStyle = hit ? '#94a3b8' : '#f59e0b';
    this.ctx.fillRect(x, y, 32, 32);
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, 32, 32);
    if (!hit) {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 20px sans-serif';
      this.ctx.fillText('?', x + 10, y + 24);
    }
  }

  private drawSuperMushroom(x: number, y: number): void {
    // Red Cap
    this.ctx.fillStyle = '#ef4444';
    this.ctx.beginPath();
    this.ctx.arc(x + 14, y + 12, 14, Math.PI, 0);
    this.ctx.fill();

    // White Spots
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(x + 14, y + 6, 4, 0, Math.PI * 2);
    this.ctx.arc(x + 6, y + 10, 3, 0, Math.PI * 2);
    this.ctx.arc(x + 22, y + 10, 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Stem & Eyes
    this.ctx.fillStyle = '#fde047';
    this.ctx.fillRect(x + 6, y + 12, 16, 14);
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(x + 9, y + 14, 2, 6);
    this.ctx.fillRect(x + 17, y + 14, 2, 6);
  }

  private drawFireFlower(x: number, y: number): void {
    // Green Stem & Leaves
    this.ctx.fillStyle = '#22c55e';
    this.ctx.fillRect(x + 12, y + 14, 4, 14);
    this.ctx.fillRect(x + 6, y + 20, 16, 4);

    // Orange Petals
    this.ctx.fillStyle = '#f97316';
    this.ctx.beginPath();
    this.ctx.arc(x + 14, y + 10, 10, 0, Math.PI * 2);
    this.ctx.fill();

    // Yellow Center & Eyes
    this.ctx.fillStyle = '#fef08a';
    this.ctx.beginPath();
    this.ctx.arc(x + 14, y + 10, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x + 12, y + 9, 1.5, 3);
    this.ctx.fillRect(x + 15, y + 9, 1.5, 3);
  }

  private drawSuperStar(x: number, y: number): void {
    this.ctx.fillStyle = '#eab308';
    this.ctx.beginPath();
    this.ctx.arc(x + 14, y + 14, 12, 0, Math.PI * 2);
    this.ctx.fill();

    // Star Eyes
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(x + 10, y + 10, 2, 6);
    this.ctx.fillRect(x + 16, y + 10, 2, 6);
  }

  private drawGoomba(x: number, y: number): void {
    const walkFrame = Math.floor(this.animFrame / 10) % 2;

    // Head
    this.ctx.fillStyle = '#78350f';
    this.ctx.beginPath();
    this.ctx.arc(x + 16, y + 14, 14, Math.PI, 0);
    this.ctx.fillRect(x + 2, y + 14, 28, 10);
    this.ctx.fill();

    // Eyes & Pupils
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(x + 8, y + 10, 5, 8);
    this.ctx.fillRect(x + 19, y + 10, 5, 8);
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(x + 10, y + 12, 3, 4);
    this.ctx.fillRect(x + 19, y + 12, 3, 4);

    // Walking Feet
    this.ctx.fillStyle = '#000000';
    if (walkFrame === 0) {
      this.ctx.fillRect(x + 2, y + 24, 10, 8);
      this.ctx.fillRect(x + 20, y + 24, 10, 8);
    } else {
      this.ctx.fillRect(x + 4, y + 24, 10, 8);
      this.ctx.fillRect(x + 18, y + 24, 10, 8);
    }
  }

  private drawKoopa(x: number, y: number): void {
    const walkFrame = Math.floor(this.animFrame / 10) % 2;

    // Green Shell
    this.ctx.fillStyle = '#16a34a';
    this.ctx.beginPath();
    this.ctx.arc(x + 16, y + 16, 12, 0, Math.PI * 2);
    this.ctx.fill();

    // Yellow Head & Feet
    this.ctx.fillStyle = '#fde047';
    this.ctx.fillRect(x + 20, y + 4, 10, 10);
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x + 26, y + 6, 2, 4);

    this.ctx.fillStyle = '#ea580c';
    if (walkFrame === 0) {
      this.ctx.fillRect(x + 4, y + 24, 10, 8);
      this.ctx.fillRect(x + 18, y + 24, 10, 8);
    } else {
      this.ctx.fillRect(x + 8, y + 24, 10, 8);
      this.ctx.fillRect(x + 14, y + 24, 10, 8);
    }
  }

  private drawWarpPipe(x: number, y: number, w: number, h: number, isEnterable?: boolean): void {
    this.ctx.fillStyle = '#22c55e';
    this.ctx.fillRect(x - 4, y, w + 8, 20);
    this.ctx.fillStyle = '#15803d';
    this.ctx.fillRect(x - 4, y + 16, w + 8, 4);

    this.ctx.fillStyle = '#4ade80';
    this.ctx.fillRect(x, y + 2, 8, 14);

    this.ctx.fillStyle = '#166534';
    this.ctx.fillRect(x, y + 20, w, h - 20);
    this.ctx.fillStyle = '#22c55e';
    this.ctx.fillRect(x + 4, y + 20, w - 8, h - 20);

    this.ctx.fillStyle = '#4ade80';
    this.ctx.fillRect(x + 4, y + 20, 8, h - 20);

    if (isEnterable) {
      this.ctx.fillStyle = '#fef08a';
      this.ctx.font = 'bold 16px sans-serif';
      this.ctx.fillText('⬇️', x + 16, y - 6);
    }
  }

  private drawGreenHill(x: number, y: number, w: number, h: number): void {
    this.ctx.fillStyle = '#15803d';
    this.ctx.beginPath();
    this.ctx.ellipse(x + w / 2, y + h, w / 2, h, 0, Math.PI, 0);
    this.ctx.fill();

    this.ctx.fillStyle = '#22c55e';
    this.ctx.beginPath();
    this.ctx.ellipse(x + w / 2, y + h, w / 2.4, h / 1.2, 0, Math.PI, 0);
    this.ctx.fill();

    this.ctx.fillStyle = '#052e16';
    this.ctx.fillRect(x + w / 2 - 12, y + h / 2, 4, 12);
    this.ctx.fillRect(x + w / 2 + 8, y + h / 2, 4, 12);
  }

  private drawCloud(x: number, y: number, scale: number): void {
    const baseW = 40 * scale;
    this.ctx.beginPath();
    this.ctx.arc(x, y, baseW / 2, 0, Math.PI * 2);
    this.ctx.arc(x + baseW * 0.4, y - baseW * 0.2, baseW * 0.4, 0, Math.PI * 2);
    this.ctx.arc(x + baseW * 0.8, y, baseW * 0.35, 0, Math.PI * 2);
    this.ctx.fill();
  }
}
