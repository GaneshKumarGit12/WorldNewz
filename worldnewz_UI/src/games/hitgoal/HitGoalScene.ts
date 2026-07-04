export interface BallState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  curve: number;
  inFlight: boolean;
}

export class HitGoalSoccerEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number | null = null;

  // Ball position & physics
  public ball: BallState = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, curve: 0, inFlight: false };

  // Goalkeeper state
  public keeper: { x: number; y: number; vx: number; state: 'idle' | 'diving_left' | 'diving_right' | 'save' } = {
    x: 0, y: 0, vx: 0, state: 'idle'
  };

  // Target Bullseyes in goal corners
  public targets = [
    { x: -160, y: 120, hit: false, points: 1000 }, // Top-left corner
    { x: 160, y: 120, hit: false, points: 1000 },  // Top-right corner
    { x: -160, y: 30, hit: false, points: 500 },   // Bottom-left corner
    { x: 160, y: 30, hit: false, points: 500 }     // Bottom-right corner
  ];

  // Stats
  public score: number = 0;
  public goals: number = 0;
  public shotsCount: number = 0;
  public streak: number = 0;
  public lastResult: string = "";

  // Aiming Trajectory drag parameters
  public isAiming: boolean = false;
  public aimStart: { x: number; y: number } = { x: 0, y: 0 };
  public aimEnd: { x: number; y: number } = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resetBall();
  }

  public resetBall(): void {
    this.ball = {
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      curve: 0,
      inFlight: false
    };
    this.keeper = { x: 0, y: 0, vx: 0, state: 'idle' };
  }

  public startKick(dx: number, dy: number, curveVal: number): void {
    if (this.ball.inFlight) return;

    this.shotsCount += 1;
    this.ball.inFlight = true;
    this.ball.vx = dx * 0.08;
    this.ball.vy = Math.max(2, -dy * 0.08);
    this.ball.vz = Math.max(12, -dy * 0.22);
    this.ball.curve = curveVal * 0.05;

    // Trigger Goalkeeper Dive AI
    setTimeout(() => {
      const chance = Math.random();
      if (chance < 0.4) {
        this.keeper.state = 'diving_left';
        this.keeper.vx = -4.5;
      } else if (chance < 0.8) {
        this.keeper.state = 'diving_right';
        this.keeper.vx = 4.5;
      }
    }, 150);
  }

  public start(): void {
    const loop = () => {
      this.update();
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    if (this.animId) cancelAnimationFrame(this.animId);
    this.animId = requestAnimationFrame(loop);
  }

  public stop(): void {
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  public update(): void {
    if (!this.ball.inFlight) return;

    // Apply Spin & Physics trajectory
    this.ball.x += this.ball.vx + this.ball.curve;
    this.ball.y += this.ball.vy;
    this.ball.z += this.ball.vz;
    this.ball.vy -= 0.15; // Gravity

    // Update Goalkeeper position
    if (this.keeper.state !== 'idle') {
      this.keeper.x += this.keeper.vx;
    }

    // Goal Plane Reach (z >= 300)
    if (this.ball.z >= 300) {
      this.evaluateShot();
    }
  }

  private evaluateShot(): void {
    const bX = this.ball.x;
    const bY = this.ball.y;

    // Check Goalkeeper Save
    const keeperDist = Math.hypot(bX - this.keeper.x, bY - (this.keeper.y + 40));
    if (keeperDist < 45) {
      this.lastResult = "🧤 SAVED BY GOALKEEPER!";
      this.streak = 0;
      this.resetBall();
      return;
    }

    // Check Goal Frame Bounds (-200 to +200 width, 0 to 150 height)
    if (bX >= -200 && bX <= 200 && bY >= 0 && bY <= 150) {
      let bonus = 0;
      // Check Target Bullseyes
      for (const t of this.targets) {
        if (Math.hypot(bX - t.x, bY - t.y) < 35) {
          t.hit = true;
          bonus += t.points;
        }
      }

      this.goals += 1;
      this.streak += 1;
      const pts = (500 + bonus) * this.streak;
      this.score += pts;
      this.lastResult = `GOAL! ⚽ +${pts} pts ${bonus > 0 ? "🎯 BULLSEYE!" : ""}`;
    } else {
      this.lastResult = "❌ SHOT MISSED OUTSIDE GOAL!";
      this.streak = 0;
    }

    this.resetBall();
  }

  public render(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Grass Field Gradient
    const fieldGrad = ctx.createLinearGradient(0, 0, 0, h);
    fieldGrad.addColorStop(0, '#15803d');
    fieldGrad.addColorStop(1, '#166534');
    ctx.fillStyle = fieldGrad;
    ctx.fillRect(0, 0, w, h);

    // Stadium Crowd Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, 140);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 200; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * 120, 2, 2);
    }

    // Center Perspective Projection Offset
    const cx = w / 2;
    const cy = h / 2 + 60;

    // Goal Posts Perspective Coordinates
    const goalLeft = cx - 180;
    const goalRight = cx + 180;
    const goalTop = cy - 140;
    const goalBottom = cy;

    // Draw Net Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for (let x = goalLeft; x <= goalRight; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, goalTop);
      ctx.lineTo(x, goalBottom);
      ctx.stroke();
    }
    for (let y = goalTop; y <= goalBottom; y += 20) {
      ctx.beginPath();
      ctx.moveTo(goalLeft, y);
      ctx.lineTo(goalRight, y);
      ctx.stroke();
    }

    // Goal Frame Posts
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(goalLeft, goalTop, 360, 140);

    // Draw Targets in Goal Corners
    for (const t of this.targets) {
      const tx = cx + t.x;
      const ty = goalBottom - t.y;
      ctx.fillStyle = t.hit ? '#00e676' : '#ff1744';
      ctx.beginPath();
      ctx.arc(tx, ty, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.points.toString(), tx, ty + 4);
    }

    // Draw Goalkeeper
    const keeperX = cx + this.keeper.x;
    const keeperY = goalBottom - 50;
    ctx.fillStyle = '#f59e0b'; // Yellow Jersey
    ctx.fillRect(keeperX - 16, keeperY - 30, 32, 40);
    ctx.fillStyle = '#111827'; // Shorts
    ctx.fillRect(keeperX - 14, keeperY + 10, 28, 20);
    // Head
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(keeperX, keeperY - 40, 14, 0, Math.PI * 2);
    ctx.fill();

    // Draw Trajectory Aim Line
    if (this.isAiming) {
      ctx.strokeStyle = '#00e676';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(this.aimStart.x, this.aimStart.y);
      ctx.lineTo(this.aimEnd.x, this.aimEnd.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Soccer Ball
    const scale = Math.max(0.3, 1 - this.ball.z / 400);
    const ballScreenX = cx + this.ball.x;
    const ballScreenY = h - 60 - this.ball.y - this.ball.z * 0.4;
    const radius = 18 * scale;

    // Ball Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(ballScreenX, h - 50, radius * 1.2, radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball Body
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ballScreenX, ballScreenY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    // Black Pentagons pattern
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(ballScreenX, ballScreenY, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}
