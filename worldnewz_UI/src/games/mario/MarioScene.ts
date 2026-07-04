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

export class MarioCanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private timerInterval: number | null = null;

  // Mario physics & power-up state
  public x: number = 60;
  public y: number = 280;
  public vx: number = 0;
  public vy: number = 0;
  public width: number = 32;
  public height: number = 44;
  public isGrounded: boolean = false;
  public facing: 'right' | 'left' = 'right';

  // Power-Ups
  public isBig: boolean = false;
  public hasFire: boolean = false;
  public isInvincible: boolean = false;
  public invincibleTimer: number = 0;

  // Game stats
  public score: number = 0;
  public coins: number = 0;
  public lives: number = 3;
  public timeLeft: number = 300;
  public isGameOver: boolean = false;
  public isGameWon: boolean = false;
  public level: number = 1;

  // Key states
  public keys: Record<string, boolean> = {};

  // Projectiles
  public fireballs: Fireball[] = [];

  // Entities
  private platforms: { x: number; y: number; w: number; h: number; type?: string }[] = [];
  private coinsList: { x: number; y: number; collected: boolean }[] = [];
  private enemies: { x: number; y: number; w: number; h: number; vx: number; alive: boolean; type?: string }[] = [];
  private powerUpItems: { x: number; y: number; type: 'mushroom' | 'flower' | 'star'; collected: boolean }[] = [];
  private questionBlocks: { x: number; y: number; w: number; h: number; hit: boolean; type: 'coin' | 'mushroom' | 'flower' | 'star' }[] = [];

  // Goal & Boss
  public flagPole = { x: 2100, y: 120, w: 20, h: 260 };
  public castle = { x: 2250, y: 160, w: 220, h: 220 };
  public bowser: BowserBoss = { x: 2320, y: 300, w: 64, h: 64, hp: 5, maxHp: 5, vx: -1.5, fireCooldown: 0, alive: true };
  public peach = { x: 2420, y: 310, w: 32, h: 48, rescued: false };

  // World Camera offset
  public cameraX: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.initLevel();
  }

  public reset(): void {
    this.lives = 3;
    this.score = 0;
    this.coins = 0;
    this.isGameOver = false;
    this.isGameWon = false;
    this.initLevel();
  }

  public initLevel(): void {
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
    this.fireballs = [];

    // Reset Boss & Peach
    this.bowser = { x: 2320, y: 310, w: 64, h: 64, hp: 5, maxHp: 5, vx: -1.5, fireCooldown: 0, alive: true };
    this.peach = { x: 2420, y: 310, w: 32, h: 48, rescued: false };

    // Platforms (Ground & Elevated)
    this.platforms = [
      { x: 0, y: 380, w: 1000, h: 100 },
      { x: 1080, y: 380, w: 800, h: 100 },
      { x: 1940, y: 380, w: 700, h: 100 },
      // Elevated Brick Platforms
      { x: 300, y: 260, w: 120, h: 30, type: 'brick' },
      { x: 600, y: 220, w: 160, h: 30, type: 'brick' },
      { x: 1200, y: 240, w: 200, h: 30, type: 'brick' },
      { x: 1600, y: 200, w: 180, h: 30, type: 'brick' }
    ];

    // Coins
    this.coinsList = [
      { x: 320, y: 220, collected: false },
      { x: 350, y: 220, collected: false },
      { x: 380, y: 220, collected: false },
      { x: 620, y: 180, collected: false },
      { x: 660, y: 180, collected: false },
      { x: 1220, y: 200, collected: false },
      { x: 1260, y: 200, collected: false },
      { x: 1300, y: 200, collected: false },
      { x: 1620, y: 160, collected: false },
      { x: 1660, y: 160, collected: false }
    ];

    // Question Blocks with Power-Ups
    this.questionBlocks = [
      { x: 220, y: 260, w: 32, h: 32, hit: false, type: 'mushroom' },
      { x: 640, y: 220, w: 32, h: 32, hit: false, type: 'flower' },
      { x: 1240, y: 240, w: 32, h: 32, hit: false, type: 'star' },
      { x: 1640, y: 200, w: 32, h: 32, hit: false, type: 'coin' }
    ];

    this.powerUpItems = [];

    // Enemies (Goombas & Koopas)
    this.enemies = [
      { x: 450, y: 348, w: 32, h: 32, vx: -1.2, alive: true, type: 'goomba' },
      { x: 800, y: 348, w: 32, h: 32, vx: -1.5, alive: true, type: 'goomba' },
      { x: 1350, y: 348, w: 32, h: 32, vx: -1.8, alive: true, type: 'koopa' },
      { x: 1750, y: 348, w: 32, h: 32, vx: -2.0, alive: true, type: 'goomba' }
    ];
  }

  public start(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.timerInterval) clearInterval(this.timerInterval);

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // 1-second countdown timer for stage
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
    if (e.key === 'Shift' || e.key === 'f' || e.key === 'F') {
      this.shootFireball();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key] = false;
  };

  public handleMobileInput(action: 'left' | 'right' | 'jump' | 'fire' | 'stop'): void {
    if (action === 'left') { this.keys['ArrowLeft'] = true; this.keys['ArrowRight'] = false; this.facing = 'left'; }
    else if (action === 'right') { this.keys['ArrowRight'] = true; this.keys['ArrowLeft'] = false; this.facing = 'right'; }
    else if (action === 'jump') { if (this.isGrounded) this.vy = -13; }
    else if (action === 'fire') { this.shootFireball(); }
    else if (action === 'stop') { this.keys['ArrowLeft'] = false; this.keys['ArrowRight'] = false; }
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

    // Boundary check (Don't run off left side)
    if (this.x < 0) this.x = 0;

    // Camera follow Mario
    this.cameraX = Math.max(0, this.x - 200);

    // Platform Collisions
    this.isGrounded = false;
    const mHeight = this.isBig ? 54 : 44;

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

    // Question Blocks Collisions (Head Bonk)
    for (const q of this.questionBlocks) {
      if (
        this.x + this.width > q.x &&
        this.x < q.x + q.w &&
        this.y <= q.y + q.h &&
        this.y >= q.y &&
        this.vy < 0
      ) {
        this.vy = 2; // Bounce off block
        if (!q.hit) {
          q.hit = true;
          this.score += 200;
          if (q.type === 'coin') {
            this.addCoin();
          } else {
            // Spawn Power-Up item
            this.powerUpItems.push({ x: q.x, y: q.y - 32, type: q.type, collected: false });
          }
        }
      }
    }

    // Power-Up Item Collection
    for (const item of this.powerUpItems) {
      if (!item.collected && this.checkCollision({ x: this.x, y: this.y, w: this.width, h: mHeight }, { x: item.x, y: item.y, w: 28, h: 28 })) {
        item.collected = true;
        this.score += 1000;
        if (item.type === 'mushroom') {
          this.isBig = true;
        } else if (item.type === 'flower') {
          this.hasFire = true;
        } else if (item.type === 'star') {
          this.isInvincible = true;
          this.invincibleTimer = 10;
        }
      }
    }

    // Coins Collection
    for (const c of this.coinsList) {
      if (!c.collected && Math.hypot(this.x + 16 - c.x, this.y + 22 - c.y) < 28) {
        c.collected = true;
        this.addCoin();
      }
    }

    // Update Fireballs Physics
    for (const f of this.fireballs) {
      if (!f.active) continue;
      f.x += f.vx;
      f.y += f.vy;
      if (f.y >= 360) { f.vy = -4; } // Bounce off ground
      else { f.vy += 0.5; }

      // Fireball hitting Enemies
      for (const e of this.enemies) {
        if (e.alive && this.checkCollision({ x: f.x, y: f.y, w: 12, h: 12 }, e)) {
          e.alive = false;
          f.active = false;
          this.score += 500;
        }
      }

      // Fireball hitting Bowser Boss
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

    // Update Enemies (Goombas & Koopas)
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.x += e.vx;
      if (e.x < 300 || e.x > 1900) e.vx *= -1;

      // Player Collision with Enemy
      if (this.checkCollision({ x: this.x, y: this.y, w: this.width, h: mHeight }, e)) {
        if (this.isInvincible) {
          e.alive = false;
          this.score += 300;
        } else if (this.vy > 0 && this.y + mHeight - this.vy <= e.y + 12) {
          // Stomp Enemy from above
          e.alive = false;
          this.vy = -8; // Bounce off enemy
          this.score += 300;
        } else {
          // Got hit by enemy!
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

    // Update Bowser Boss
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

    // Flagpole / Castle Victory
    if (this.x >= this.flagPole.x && !this.isGameWon) {
      if (!this.bowser.alive || this.x >= this.peach.x) {
        this.isGameWon = true;
        this.score += this.timeLeft * 50;
      }
    }

    // Fall into pit
    if (this.y > 450) {
      this.loseLife("Mario fell into a pit!");
    }
  }

  private addCoin(): void {
    this.coins++;
    this.score += 200;
    if (this.coins >= 100) {
      this.coins -= 100;
      this.lives++; // 100 Coins = 1 Extra Life
    }
  }

  private loseLife(_reason: string): void {
    this.lives--;
    if (this.lives <= 0) {
      this.isGameOver = true;
    } else {
      // Respawn at beginning of section
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

    // Sky Background
    this.ctx.fillStyle = '#60a5fa';
    this.ctx.fillRect(0, 0, w, h);

    // Save Context for Camera Translation
    this.ctx.save();
    this.ctx.translate(-this.cameraX, 0);

    // Draw Clouds & Sun
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(200, 80, 30, 0, Math.PI * 2);
    this.ctx.arc(230, 70, 40, 0, Math.PI * 2);
    this.ctx.arc(260, 80, 30, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw Platforms
    for (const p of this.platforms) {
      if (p.type === 'brick') {
        this.ctx.fillStyle = '#b45309';
        this.ctx.fillRect(p.x, p.y, p.w, p.h);
        this.ctx.strokeStyle = '#78350f';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(p.x, p.y, p.w, p.h);
      } else {
        // Green Grass Ground
        this.ctx.fillStyle = '#15803d';
        this.ctx.fillRect(p.x, p.y, p.w, 16);
        this.ctx.fillStyle = '#78350f';
        this.ctx.fillRect(p.x, p.y + 16, p.w, p.h - 16);
      }
    }

    // Draw Question Blocks
    for (const q of this.questionBlocks) {
      this.ctx.fillStyle = q.hit ? '#94a3b8' : '#f59e0b';
      this.ctx.fillRect(q.x, q.y, q.w, q.h);
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(q.x, q.y, q.w, q.h);
      if (!q.hit) {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.fillText('?', q.x + 10, q.y + 24);
      }
    }

    // Draw Power-Up Items
    for (const item of this.powerUpItems) {
      if (!item.collected) {
        if (item.type === 'mushroom') {
          this.ctx.fillStyle = '#ef4444'; // Red Mushroom
          this.ctx.beginPath();
          this.ctx.arc(item.x + 14, item.y + 14, 14, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (item.type === 'flower') {
          this.ctx.fillStyle = '#f97316'; // Orange Fire Flower
          this.ctx.beginPath();
          this.ctx.arc(item.x + 14, item.y + 14, 14, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (item.type === 'star') {
          this.ctx.fillStyle = '#eab308'; // Yellow Invincible Star
          this.ctx.beginPath();
          this.ctx.arc(item.x + 14, item.y + 14, 14, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    // Draw Coins
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

    // Draw Fireballs
    this.ctx.fillStyle = '#ef4444';
    for (const f of this.fireballs) {
      if (f.active) {
        this.ctx.beginPath();
        this.ctx.arc(f.x, f.y, 6, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Draw Enemies (Goombas & Koopas)
    for (const e of this.enemies) {
      if (e.alive) {
        this.ctx.fillStyle = e.type === 'koopa' ? '#16a34a' : '#78350f';
        this.ctx.fillRect(e.x, e.y, e.w, e.h);
        // Eyes
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(e.x + 6, e.y + 6, 6, 8);
        this.ctx.fillRect(e.x + 20, e.y + 6, 6, 8);
      }
    }

    // Draw Bowser Boss
    if (this.bowser.alive) {
      this.ctx.fillStyle = '#15803d'; // Green Monster Body
      this.ctx.fillRect(this.bowser.x, this.bowser.y, this.bowser.w, this.bowser.h);
      // Red Spikes & Horns
      this.ctx.fillStyle = '#dc2626';
      this.ctx.fillRect(this.bowser.x + 10, this.bowser.y - 12, 12, 12);
      this.ctx.fillRect(this.bowser.x + 40, this.bowser.y - 12, 12, 12);

      // Boss Health Bar
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.fillRect(this.bowser.x, this.bowser.y - 24, 64, 8);
      this.ctx.fillStyle = '#dc2626';
      this.ctx.fillRect(this.bowser.x, this.bowser.y - 24, (this.bowser.hp / this.bowser.maxHp) * 64, 8);
    }

    // Draw Castle & Princess Peach
    this.ctx.fillStyle = '#475569';
    this.ctx.fillRect(this.castle.x, this.castle.y, this.castle.w, this.castle.h);
    this.ctx.fillStyle = '#0f172a'; // Doorway
    this.ctx.fillRect(this.castle.x + 80, this.castle.y + 140, 60, 80);

    // Princess Peach
    this.ctx.fillStyle = '#ec4899'; // Pink Dress
    this.ctx.fillRect(this.peach.x, this.peach.y, this.peach.w, this.peach.h);
    this.ctx.fillStyle = '#eab308'; // Gold Crown
    this.ctx.fillRect(this.peach.x + 8, this.peach.y - 10, 16, 10);

    // Draw Flagpole
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.fillRect(this.flagPole.x, this.flagPole.y, this.flagPole.w, this.flagPole.h);
    this.ctx.fillStyle = '#dc2626'; // Red Flag
    this.ctx.fillRect(this.flagPole.x + 20, this.flagPole.y + 10, 40, 24);

    // Draw Mario Character
    const mHeight = this.isBig ? 54 : 44;
    const mY = this.isBig ? this.y - 10 : this.y;

    if (this.isInvincible) {
      // Glowing rainbow aura when Star Invincible!
      this.ctx.fillStyle = `hsl(${(Date.now() / 4) % 360}, 100%, 50%)`;
    } else if (this.hasFire) {
      this.ctx.fillStyle = '#ffffff'; // White Fire Suit
    } else {
      this.ctx.fillStyle = '#dc2626'; // Classic Red Shirt
    }
    this.ctx.fillRect(this.x, mY, this.width, mHeight);

    // Blue Overalls
    this.ctx.fillStyle = '#2563eb';
    this.ctx.fillRect(this.x + 4, mY + 20, 24, mHeight - 20);

    // Cap & Mustache
    this.ctx.fillStyle = '#dc2626';
    this.ctx.fillRect(this.x + (this.facing === 'right' ? 8 : 0), mY, 24, 10);

    this.ctx.restore();
  }
}
