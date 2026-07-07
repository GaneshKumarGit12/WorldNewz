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

  // Goalkeeper state (Enforces FIDE / FIFA line rule)
  public keeper: { x: number; y: number; vx: number; state: 'idle' | 'diving_left' | 'diving_right' | 'save'; steppedEarly: boolean } = {
    x: 0, y: 0, vx: 0, state: 'idle', steppedEarly: false
  };

  // Target Bullseyes in goal corners
  public targets = [
    { x: -160, y: 120, hit: false, points: 1000 }, // Top-left corner
    { x: 160, y: 120, hit: false, points: 1000 },  // Top-right corner
    { x: -160, y: 30, hit: false, points: 500 },   // Bottom-left corner
    { x: 160, y: 30, hit: false, points: 500 }     // Bottom-right corner
  ];

  // Official Penalty Shootout Stats & Rules
  public score: number = 0;
  public goals: number = 0;
  public shotsCount: number = 0;
  public currentRound: number = 1;
  public maxRounds: number = 5;
  public isSuddenDeath: boolean = false;
  public isShootoutOver: boolean = false;
  public streak: number = 0;
  public lastResult: string = "";
  public whistleBlown: boolean = true;
  public isRetake: boolean = false;

  // Aiming Trajectory drag parameters
  public isAiming: boolean = false;
  public aimStart: { x: number; y: number } = { x: 0, y: 0 };
  public aimEnd: { x: number; y: number } = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resetBall();
    this.setupMouseEvents();
  }

  public setCurve(val: number): void {
    this.ball.curve = val;
  }

  public reset(): void {
    this.score = 0;
    this.goals = 0;
    this.shotsCount = 0;
    this.currentRound = 1;
    this.isSuddenDeath = false;
    this.isShootoutOver = false;
    this.streak = 0;
    this.lastResult = "";
    this.whistleBlown = true;
    this.isRetake = false;
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
      curve: this.ball ? this.ball.curve : 0,
      inFlight: false
    };
    this.keeper = { x: 0, y: 0, vx: 0, state: 'idle', steppedEarly: false };
    this.isAiming = false;
    for (const t of this.targets) t.hit = false;
  }

  public triggerWhistle(): void {
    this.whistleBlown = true;
    this.lastResult = "🎷 REFEREE WHISTLE! Take your penalty kick!";
    this.playWhistleSound();
  }

  private setupMouseEvents(): void {
    let isMouseDown = false;

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const onStart = (e: MouseEvent | TouchEvent) => {
      if (this.ball.inFlight || this.isShootoutOver || !this.whistleBlown) return;
      isMouseDown = true;
      const p = getPos(e);
      this.aimStart = p;
      this.aimEnd = p;
      this.isAiming = true;
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isMouseDown || this.ball.inFlight) return;
      this.aimEnd = getPos(e);
    };

    const onEnd = () => {
      if (!isMouseDown || this.ball.inFlight || !this.whistleBlown) return;
      isMouseDown = false;
      this.isAiming = false;

      // Calculate Kick Trajectory Velocity
      const dx = this.aimEnd.x - this.aimStart.x;
      const dy = this.aimStart.y - this.aimEnd.y;

      if (dy > 20) {
        this.shootBall(dx * 0.08, dy * 0.08 + 4, dy * 0.15);
      }
    };

    this.canvas.addEventListener('mousedown', onStart);
    this.canvas.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    this.canvas.addEventListener('touchstart', onStart);
    this.canvas.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  }

  public shootBall(vx: number, vy: number, vz: number): void {
    if (this.ball.inFlight) return;
    this.ball.vx = vx;
    this.ball.vy = vy;
    this.ball.vz = vz;
    this.ball.inFlight = true;
    this.shotsCount++;

    // Goalkeeper AI Dive Decision (FIFA Rule: Must stay on line until ball struck)
    const diveChance = Math.random();
    if (diveChance < 0.45) {
      this.keeper.state = 'diving_left';
      this.keeper.vx = -4.5;
    } else if (diveChance < 0.90) {
      this.keeper.state = 'diving_right';
      this.keeper.vx = 4.5;
    } else {
      this.keeper.state = 'idle';
      this.keeper.vx = 0;
    }

    // 5% chance Goalkeeper steps forward early (Foul -> Retake Ordered)
    if (Math.random() < 0.05) {
      this.keeper.steppedEarly = true;
    }

    this.playKickSound();
  }

  public start(): void {
    if (this.animId) cancelAnimationFrame(this.animId);
    const loop = () => {
      this.update();
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  public stop(): void {
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  private update(): void {
    if (!this.ball.inFlight) return;

    // Ball Flight Physics
    this.ball.x += this.ball.vx + this.ball.curve * 0.15;
    this.ball.y += this.ball.vy;
    this.ball.z += this.ball.vz;
    this.ball.vy -= 0.25; // Gravity

    // Goalkeeper Dive movement
    if (this.keeper.state !== 'idle') {
      this.keeper.x += this.keeper.vx;
    }

    // Ball reaches Goal Line (Z >= 280)
    if (this.ball.z >= 280) {
      this.ball.inFlight = false;

      // Check Goalkeeper Foul Retake Rule (Keeper stepped forward early)
      if (this.keeper.steppedEarly) {
        this.lastResult = "🚨 GOALKEEPER FOUL! Stepped off line early. RETAKE ORDERED!";
        this.isRetake = true;
        setTimeout(() => this.resetBall(), 1800);
        return;
      }

      // Check Goalkeeper Save Block
      const ballGx = this.ball.x;
      const ballGy = this.ball.y;
      const kDist = Math.hypot(ballGx - this.keeper.x, ballGy - 30);

      if (kDist < 42) {
        // SAVED BY GOALKEEPER
        this.lastResult = "🧤 SAVED BY GOALKEEPER!";
        this.streak = 0;
        this.playSaveSound();
        this.advanceShootoutRound(false);
        setTimeout(() => this.resetBall(), 1800);
        return;
      }

      // Check Goal Frame Collision (Goal: Width 360, Height 140)
      if (Math.abs(ballGx) <= 180 && ballGy >= 0 && ballGy <= 140) {
        // GOAL SCORED!
        let pts = 1000;
        this.goals++;
        this.streak++;

        // Corner Bullseye Bonus
        for (const t of this.targets) {
          if (Math.hypot(ballGx - t.x, ballGy - t.y) < 35) {
            t.hit = true;
            pts += t.points;
            this.lastResult = `🎯 CORNER BULLSEYE GOAL! +${pts} PTS!`;
            break;
          }
        }

        if (!this.lastResult.includes("BULLSEYE")) {
          this.lastResult = `⚽ GOAL SCORED! +${pts} PTS!`;
        }

        // Streak Multiplier
        if (this.streak >= 3) pts += 500;
        this.score += pts;
        this.playGoalSound();
        this.advanceShootoutRound(true);
      } else {
        // MISSED THE TARGET
        this.lastResult = "❌ MISSED! Shot went off target!";
        this.streak = 0;
        this.advanceShootoutRound(false);
      }

      setTimeout(() => this.resetBall(), 1800);
    }
  }

  private advanceShootoutRound(_isGoal: boolean): void {
    if (this.isRetake) {
      this.isRetake = false;
      return;
    }

    if (this.currentRound < this.maxRounds) {
      this.currentRound++;
    } else {
      // 5 Kicks completed. Check for Sudden Death tie
      if (this.goals >= 3) {
        this.isShootoutOver = true;
        this.lastResult = `🏆 SHOOTOUT VICTORY! Cleared with ${this.goals}/${this.maxRounds} Goals!`;
      } else {
        // Sudden Death mode
        this.isSuddenDeath = true;
        this.currentRound++;
        this.lastResult = "⚡ SUDDEN DEATH! Next kick wins the shootout!";
      }
    }
  }

  private playWhistleSound(): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 2800; // High referee whistle pitch
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }

  private playKickSound(): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = 160;
      gain.gain.value = 0.2;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }

  private playGoalSound(): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 520;
      gain.gain.value = 0.2;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  }

  private playSaveSound(): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 200;
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  }

  private draw(): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;

    // Grass Field & Stadium Lights Background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#064e3b'); // Dark Stadium Sky
    gradient.addColorStop(0.4, '#047857');
    gradient.addColorStop(1, '#15803d'); // Vibrant Grass
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, w, h);

    // Penalty Area Pitch Lines & Spot (12 Yards)
    this.ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    this.ctx.lineWidth = 3;

    // Penalty Box
    const boxTop = h * 0.45;
    this.ctx.strokeRect(cx - 240, boxTop, 480, h - boxTop);

    // Penalty Spot (12 Yards)
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(cx, h - 60, 6, 0, Math.PI * 2);
    this.ctx.fill();

    // Goal Frame Net
    const goalLeft = cx - 180;
    const goalRight = cx + 180;
    const goalTop = boxTop - 110;
    const goalBottom = boxTop + 30;

    // Net Pattern
    this.ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    this.ctx.lineWidth = 1;

    for (let x = goalLeft; x <= goalRight; x += 15) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, goalTop);
      this.ctx.lineTo(x, goalBottom);
      this.ctx.stroke();
    }
    for (let y = goalTop; y <= goalBottom; y += 15) {
      this.ctx.beginPath();
      this.ctx.moveTo(goalLeft, y);
      this.ctx.lineTo(goalRight, y);
      this.ctx.stroke();
    }

    // Goal Posts & Crossbar
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 8;
    this.ctx.strokeRect(goalLeft, goalTop, 360, 140);

    // Corner Bullseye Targets
    for (const t of this.targets) {
      const tx = cx + t.x;
      const ty = goalBottom - t.y;
      this.ctx.fillStyle = t.hit ? '#00e676' : '#ff1744';
      this.ctx.beginPath();
      this.ctx.arc(tx, ty, 20, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(t.points.toString(), tx, ty + 4);
    }

    // Draw Goalkeeper (Enforces line positioning)
    const keeperX = cx + this.keeper.x;
    const keeperY = goalBottom - 50;
    this.ctx.fillStyle = '#f59e0b'; // Yellow Goalkeeper Jersey
    this.ctx.fillRect(keeperX - 16, keeperY - 30, 32, 40);
    this.ctx.fillStyle = '#111827'; // Shorts
    this.ctx.fillRect(keeperX - 14, keeperY + 10, 28, 20);
    // Head & Gloves
    this.ctx.fillStyle = '#fca5a5';
    this.ctx.beginPath();
    this.ctx.arc(keeperX, keeperY - 40, 14, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw Trajectory Aim Line
    if (this.isAiming) {
      this.ctx.strokeStyle = '#00e676';
      this.ctx.lineWidth = 4;
      this.ctx.setLineDash([8, 6]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.aimStart.x, this.aimStart.y);
      this.ctx.lineTo(this.aimEnd.x, this.aimEnd.y);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    // Draw Soccer Ball
    const scale = Math.max(0.3, 1 - this.ball.z / 400);
    const ballScreenX = cx + this.ball.x;
    const ballScreenY = h - 60 - this.ball.y - this.ball.z * 0.4;
    const radius = 18 * scale;

    // Shadow
    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(ballScreenX, h - 50, radius * 1.2, radius * 0.5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Ball Body
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(ballScreenX, ballScreenY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2 * scale;
    this.ctx.stroke();

    // Black Pentagons pattern
    this.ctx.fillStyle = '#111827';
    this.ctx.beginPath();
    this.ctx.arc(ballScreenX, ballScreenY, radius * 0.4, 0, Math.PI * 2);
    this.ctx.fill();
  }
}
