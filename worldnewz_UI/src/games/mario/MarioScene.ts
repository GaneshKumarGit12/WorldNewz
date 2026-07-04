export interface MarioGameState {
  score: number;
  coins: number;
  lives: number;
  isGameOver: boolean;
  isGameWon: boolean;
  level: number;
}

export class MarioCanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;

  // Mario physics state
  public x: number = 50;
  public y: number = 300;
  public vx: number = 0;
  public vy: number = 0;
  public width: number = 32;
  public height: number = 44;
  public isGrounded: boolean = false;
  public facing: 'right' | 'left' = 'right';

  // Game stats
  public score: number = 0;
  public coins: number = 0;
  public lives: number = 3;
  public isGameOver: boolean = false;
  public isGameWon: boolean = false;
  public level: number = 1;

  // Key states
  public keys: Record<string, boolean> = {};

  // Level Entities
  private platforms: { x: number; y: number; w: number; h: number; type?: string }[] = [];
  private coinsList: { x: number; y: number; collected: boolean }[] = [];
  private enemies: { x: number; y: number; w: number; h: number; vx: number; alive: boolean }[] = [];
  private questionBlocks: { x: number; y: number; w: number; h: number; hit: boolean }[] = [];
  private flagPole: { x: number; y: number; w: number; h: number } = { x: 2200, y: 120, w: 20, h: 260 };

  // World Camera offset
  public cameraX: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.initLevel();
  }

  public initLevel(): void {
    this.x = 60;
    this.y = 280;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = false;
    this.cameraX = 0;
    this.score = 0;
    this.coins = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.isGameWon = false;

    // Ground platforms
    this.platforms = [
      { x: 0, y: 380, w: 800, h: 60 },
      { x: 880, y: 380, w: 600, h: 60 },
      { x: 1550, y: 380, w: 900, h: 60 },
      // Raised ledges
      { x: 250, y: 280, w: 120, h: 24 },
      { x: 450, y: 220, w: 140, h: 24 },
      { x: 1000, y: 260, w: 160, h: 24 },
      { x: 1250, y: 200, w: 140, h: 24 },
      { x: 1750, y: 270, w: 180, h: 24 }
    ];

    // Coins
    this.coinsList = [
      { x: 280, y: 240, collected: false },
      { x: 320, y: 240, collected: false },
      { x: 480, y: 180, collected: false },
      { x: 520, y: 180, collected: false },
      { x: 1040, y: 220, collected: false },
      { x: 1080, y: 220, collected: false },
      { x: 1300, y: 160, collected: false },
      { x: 1800, y: 230, collected: false }
    ];

    // Question Blocks
    this.questionBlocks = [
      { x: 180, y: 260, w: 32, h: 32, hit: false },
      { x: 600, y: 240, w: 32, h: 32, hit: false },
      { x: 1150, y: 220, w: 32, h: 32, hit: false }
    ];

    // Goomba Enemies
    this.enemies = [
      { x: 400, y: 348, w: 32, h: 32, vx: -1.5, alive: true },
      { x: 700, y: 348, w: 32, h: 32, vx: -1.5, alive: true },
      { x: 1100, y: 348, w: 32, h: 32, vx: -1.8, alive: true },
      { x: 1400, y: 348, w: 32, h: 32, vx: -2.0, alive: true },
      { x: 1850, y: 348, w: 32, h: 32, vx: -2.2, alive: true }
    ];
  }

  public start(): void {
    const loop = () => {
      this.update();
      this.render();
      if (!this.isGameOver && !this.isGameWon) {
        this.animationFrameId = requestAnimationFrame(loop);
      }
    };
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stop(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
  }

  public update(): void {
    if (this.isGameOver || this.isGameWon) return;

    // Movement Physics
    const accel = 0.6;
    const maxSpeed = 5.5;
    const gravity = 0.7;

    if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.keys['TouchRight']) {
      this.vx = Math.min(this.vx + accel, maxSpeed);
      this.facing = 'right';
    } else if (this.keys['ArrowLeft'] || this.keys['KeyA'] || this.keys['TouchLeft']) {
      this.vx = Math.max(this.vx - accel, -maxSpeed);
      this.facing = 'left';
    } else {
      this.vx *= 0.82; // Friction
    }

    // Jump
    if ((this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['Space'] || this.keys['TouchJump']) && this.isGrounded) {
      this.vy = -13.5;
      this.isGrounded = false;
    }

    // Apply gravity
    this.vy += gravity;

    // Proposed new pos
    let nextX = this.x + this.vx;
    let nextY = this.y + this.vy;

    // Platform Collision Detection
    this.isGrounded = false;
    for (const plat of this.platforms) {
      // Landing on top
      if (
        this.x + this.width > plat.x &&
        this.x < plat.x + plat.w &&
        this.y + this.height <= plat.y &&
        nextY + this.height >= plat.y
      ) {
        nextY = plat.y - this.height;
        this.vy = 0;
        this.isGrounded = true;
      }
    }

    // Question Blocks Collision
    for (const qb of this.questionBlocks) {
      if (
        nextX + this.width > qb.x &&
        nextX < qb.x + qb.w &&
        nextY + this.height > qb.y &&
        nextY < qb.y + qb.h
      ) {
        // Hitting from bottom
        if (this.vy < 0 && this.y >= qb.y + qb.h - 8) {
          this.vy = 2;
          if (!qb.hit) {
            qb.hit = true;
            this.coins += 1;
            this.score += 200;
          }
        }
      }
    }

    this.x = nextX;
    this.y = nextY;

    // Pitfall Death
    if (this.y > 450) {
      this.lives -= 1;
      if (this.lives <= 0) {
        this.isGameOver = true;
      } else {
        this.x = Math.max(60, this.x - 200);
        this.y = 200;
        this.vy = 0;
      }
    }

    // Update Camera
    this.cameraX = Math.max(0, this.x - 200);

    // Collect Coins
    for (const c of this.coinsList) {
      if (!c.collected && Math.hypot(this.x + 16 - c.x, this.y + 22 - c.y) < 28) {
        c.collected = true;
        this.coins += 1;
        this.score += 100;
      }
    }

    // Update Enemies
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.x += e.vx;
      if (e.x < 100 || e.x > 2100) e.vx *= -1;

      // Player Collision
      if (
        this.x + this.width > e.x &&
        this.x < e.x + e.w &&
        this.y + this.height > e.y &&
        this.y < e.y + e.h
      ) {
        // Jumped on Goomba head
        if (this.vy > 0 && this.y + this.height - this.vy <= e.y + 12) {
          e.alive = false;
          this.vy = -8; // Bounce
          this.score += 300;
        } else {
          // Hurt by enemy
          this.lives -= 1;
          if (this.lives <= 0) {
            this.isGameOver = true;
          } else {
            this.x -= 80;
            this.vy = -6;
          }
        }
      }
    }

    // Flagpole Win Condition
    if (this.x >= this.flagPole.x - 20) {
      this.isGameWon = true;
      this.score += 2000;
    }
  }

  public render(): void {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Sky Background Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#5c94fc');
    skyGrad.addColorStop(1, '#94b0f9');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // Draw Parallax Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(300, 80, 40, 0, Math.PI * 2);
    ctx.arc(340, 70, 50, 0, Math.PI * 2);
    ctx.arc(380, 80, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(1100, 90, 45, 0, Math.PI * 2);
    ctx.arc(1140, 80, 55, 0, Math.PI * 2);
    ctx.arc(1180, 90, 45, 0, Math.PI * 2);
    ctx.fill();

    // Draw Platforms (Bricks/Ground)
    for (const plat of this.platforms) {
      ctx.fillStyle = '#c84c0c';
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.fillStyle = '#00a800'; // Green top
      ctx.fillRect(plat.x, plat.y, plat.w, 6);
    }

    // Draw Question Blocks
    for (const qb of this.questionBlocks) {
      ctx.fillStyle = qb.hit ? '#887000' : '#fc9838';
      ctx.fillRect(qb.x, qb.y, qb.w, qb.h);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(qb.x, qb.y, qb.w, qb.h);
      if (!qb.hit) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('?', qb.x + 10, qb.y + 24);
      }
    }

    // Draw Coins
    for (const c of this.coinsList) {
      if (c.collected) continue;
      ctx.fillStyle = '#fce000';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e69d00';
      ctx.stroke();
    }

    // Draw Goomba Enemies
    for (const e of this.enemies) {
      if (!e.alive) continue;
      ctx.fillStyle = '#a84000';
      ctx.beginPath();
      ctx.arc(e.x + 16, e.y + 16, 16, Math.PI, 0); // Mushroom cap
      ctx.fillRect(e.x + 4, e.y + 16, 24, 16);
      ctx.fill();
      // White eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(e.x + 8, e.y + 12, 4, 8);
      ctx.fillRect(e.x + 20, e.y + 12, 4, 8);
    }

    // Draw Flagpole
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.flagPole.x, this.flagPole.y, this.flagPole.w, this.flagPole.h);
    ctx.fillStyle = '#fc1500'; // Red Flag
    ctx.beginPath();
    ctx.moveTo(this.flagPole.x, this.flagPole.y);
    ctx.lineTo(this.flagPole.x - 50, this.flagPole.y + 25);
    ctx.lineTo(this.flagPole.x, this.flagPole.y + 50);
    ctx.fill();

    // Draw Mario Sprite
    ctx.fillStyle = '#fc1500'; // Red Hat/Shirt
    ctx.fillRect(this.x, this.y, this.width, 16);
    ctx.fillStyle = '#0028fc'; // Blue Overalls
    ctx.fillRect(this.x + 2, this.y + 16, this.width - 4, 20);
    ctx.fillStyle = '#fc9838'; // Face
    ctx.fillRect(this.facing === 'right' ? this.x + 16 : this.x, this.y + 4, 16, 12);
    // Shoes
    ctx.fillStyle = '#703800';
    ctx.fillRect(this.x, this.y + 36, 14, 8);
    ctx.fillRect(this.x + 18, this.y + 36, 14, 8);

    ctx.restore();
  }
}
