---
name: dvcubie2026-game-management
description: Guidelines and instructions for running, debugging, and maintaining the DVCubie2026 Snake Arena (.io) game in WorldNewzs. It covers the client-side Phaser implementation as well as the real-time SignalR server-authoritative and Three.js protocol reference specifications.
---

# DVCubie2026 Snake Arena (.io) Game Architecture

This document describes the mechanics, maintenance guidelines, and reference architectures for the **DVCubie2026** snake arena game in the WorldNewzs codebase.

---

## 1. Gameplay Mechanics (Current Phaser Implementation)

- **Arena Size**: Set to 2000x2000 pixels with a tileable grid.
- **Snake Model**:
  - The player and AI are chains of blocks (segments).
  - The head segment is the highest value block.
  - Tail segments trail behind, representing lower values.
- **Kinematic Segment Follow**:
  - Each tail segment follows the segment directly in front of it using kinematic distance math:
    $$\Delta x = x_{target} - x_{seg}$$
    $$\Delta y = y_{target} - y_{seg}$$
    $$Distance = \sqrt{\Delta x^2 + \Delta y^2}$$
    If $Distance > SegmentWidth$, the segment slides along the angle vector:
    $$x_{seg} = x_{target} - \cos(\theta) \times SegmentWidth$$
    $$y_{seg} = y_{target} - \sin(\theta) \times SegmentWidth$$
- **Segment Cascading Merges**:
  - An update loop checks segments in the snake from tail to head. If two adjacent segments share the same value, they merge:
    - The segment in front doubles its value.
    - The segment behind is removed.
    - If this double matches the segment in front of *it*, a cascade occurs.
- **Merge (Matching Pickups)**:
  - When the head segment overlaps a loose food cube whose value matches the head's value, the loose cube is consumed and the **head's value is doubled immediately** (and size scale scales up).
  - If the values differ, the loose cube is appended as a new trailing segment at its own value, extending the train.
- **PVP Eating & Collision Rules**:
  - Checked for all pairs of active snakes (Player vs AI, AI vs AI, AI vs Player):
    - **Head-to-Head**: If a head-to-head collision occurs, the larger head consumes/kills the smaller snake. If values are equal, the collider head doubles, and the victim snake dies.
    - **Head-to-Body**: If snake A's head overlaps any trailing segment of snake B:
      - If `A.head.value > segment.value`: That segment and all segments behind it are severed/removed from B's chain. They are converted into loose food cubes scattered near the collision point in the arena (A must collect them).
      - If `A.head.value < segment.value`: Snake A's head is smaller than the blocker segment, causing snake A to die and scatter its entire chain as loose food cubes.
      - If `A.head.value === segment.value`: Treat as a matching merge. A's head value doubles, and that matching segment of B is removed (without cutting B's entire chain).
- **Static Square Blockers**:
  - rounded gray bevel square obstacles scattered across the map. Players and bots collide and slide smoothly around them to steer or corner prey.
- **Next Cube Preview**:
  - A random power-of-two value (2, 4, 8, 16) is pre-rolled as the "next cube". For the player, when picking up food, this value dictates the segment added/merged.

---

## 2. Controls & Layout Specifications

- **Desktop**: Mouse pointer position guides the head angle. Click or press `Space` to speed boost.
- **Mobile/Tablets**:
  - Touch-drag anywhere on the canvas updates pointer target coordinates.
  - Speed boost is activated via an on-screen overlay button.
- **Unified Arcade PopUp Cabinet**:
  - The entire game is contained inside a centralized, responsive popup card container:
    - Width: `maxWidth: "540px"`, `width: "100%"`.
    - Height: `height: "min(760px, 92vh)"`.
  - Nested screens (home, tutorial, leaderboard, shop, profile, gameover) have internal card margins and borders removed, fitting cleanly within the popup card borders.
  - Shop skins list and achievements lists have `max-height` constraints and `overflow-y: auto` to prevent window overflows on any screen resolution.
- **HUD Placements**:
  - **Pause Button**: Positioned in the **top-left** of the gameplay screen.
  - **Scoreboard**: Current Score on the **left**, Best Score on the **right**.
  - **Next Cube**: Card container in the **top-right** displaying the upcoming value.
  - **In-Game Leaderboard**: Semi-transparent panel in the **top-right** listing the top 5 players/AI bots in real-time.
- **Pause Menu Modal**:
  - Overlays semi-transparent dark backdrop.
  - Displays Sound, Music, and Vibration settings switches.
  - Close button `(X)` at the top-right of the modal box.
- **Tutorial Guided Layout**:
  - Visual block merging illustration ($2 + 2 = 4$).
  - Action button label: "Got it →".
- **Leaderboard Rankings**:
  - Supports Global and mock Friends ranking list tabs.
  - Emphasizes the player's own score row with a colored glow background.
- **Global Header Badge**:
  - Promoted `DVCubie2026` to `primaryNavLinks` as a purple/pink highlighted nav badge:
    ```javascript
    { label: "DVCubie2026 🐍", path: "/games/dvcubie2026", highlight: true, highlightColor: "linear-gradient(135deg, #a855f7, #ec4899)", badge: "NEW" }
    ```
  - Directly opens the game screen in one click and is highly visible on the top main navigation bar.

---

## 3. Audio, Music & Haptics

- **Ambient Music Synthesizer**:
  - When music is enabled, a periodic oscillator timer plays soft synth chords via Web Audio API.
- **Mobile Haptics**:
  - Merging segments triggers haptic vibration on compatible touch screens:
    ```javascript
    if (vibrateEnabled && navigator.vibrate) {
      navigator.vibrate(40);
    }
    ```
- **Sound Effects**:
  - Sine/sawtooth wave oscillators play audio sweeps for merges and game-overs.

---

## 4. Multi-Player Real-Time Backend & Three.js Specifications (Reference Architecture)

If transitioning to a server-authoritative multiplayer configuration using React Three Fiber (Three.js) and ASP.NET Core SignalR, follow these specifications:

### Network Protocol (SignalR)
- **Client → Server**:
  - `JoinArena` (Payload: `{ name: string }`) - Join/spawn into the current arena.
  - `Move` (Payload: `{ x: number, y: number }`) - Normalized heading vector.
  - `Dash` (Payload: `{ active: boolean }`) - Start/stop dashing.
- **Server → Client**:
  - `Snapshot` (Payload: `ArenaStateDelta`) - Periodic delta state containing updated players, removed players, and loose cubes.
  - `PlayerSpawned` (Payload: `{ playerId: string }`) - Assigns local player ID.
  - `PlayerDied` (Payload: `{ playerId: string, killerId?: string }`) - Triggers death screens.

### State Delta Data Model
```ts
interface ArenaStateDelta {
  tick: number;
  updatedPlayers: PlayerState[];
  removedPlayerIds: string[];
  newLooseCubes: LooseCube[];
  removedLooseCubeIds: string[];
}
```

### Three.js (React Three Fiber) Performance Checklist
- **Instancing**: Render all loose cubes and trailing player segments using `<Instances>` and `<Instance>` components to reduce draw calls.
- **Antialiasing**: Disable antialiasing on mobile viewports to prevent GPU throttling.
- **DPR Limit**: Cap device pixel ratio: `Math.min(window.devicePixelRatio, 2)`.
- **Orthographic Camera**: Align perspective using an orthographic camera at `position={[40, 50, 40]}` and `zoom={14}` for isometric projection.

---

## 5. Gameplay & Graphic Enhancements (3D isometric rendering & AI steering)

- **3D Isometric Cubes**:
  - Dynamically draws cubes on 2D HTML canvas using isometric projections. Each cube comprises three distinct faces:
    - **Top Face**: Bright base color with glossy outline and centered value text.
    - **Left Face**: Slightly darkened shading.
    - **Right Face**: Darkened side panel shading.
  - This simulates a 3D block projection that spins and turns along the snake's path.
- **3D Isometric Blockers**:
  - Static square blockers are rendered as massive slate-gray 3D blocks with detailed face highlights.
- **Active AI Steering & Combat-Aware behavior**:
  - **Obstacle Avoidance**: AI snakes scan distances to nearby blockers. If a blocker is within 120 pixels, a repulsion force vector is added directly to their desired velocity vector. This ensures smooth steering around obstacles and resolves distance-based freezing bugs.
  - **Combat Actions**: AI snakes evaluate all nearby active snakes (including both the player and other bots). If an opponent is within 320 pixels:
    - If the opponent is smaller, the bot actively pursues them to consume their tail blocks.
    - If the opponent is larger, the bot flees in the opposite direction, utilizing speed boost.
  - **Booster & Food Harvesting**: If not in combat, bots prioritize steering towards nearby booster spheres to double their values or speed up, and seek out the closest food blocks. This ensures all bots actively participate in growth and merges.
- **Back to Game Main Menu**:
  - Pause Screen "Main Menu" and Game Over "Home" buttons are bound to return the user to the **Game's Main Menu** (home screen state) rather than routing them out of the game page.
- **M-Suffix Formatting**:
  - Number values $\ge 1,000,000$ are automatically formatted to the `M` suffix (e.g. `500M`).
- **550M End-Score Victory Completion**:
  - The victory condition/end-score is set to exactly $550\text{M}$ ($550,000,000$).
  - When any player or bot reaches this threshold (by obtaining a double block value $\ge 500\text{M}$), the game loop freezes and triggers a special victory event.
  - A premium Victory Overlay screen is displayed celebrating the Champion's achievement.
  - Allows the winner to type their name and submit their Champion score of `550M` directly to the global database rankings.
  - Users with scores $\ge 500\text{M}$ are marked with a `🥇 Gold Medal` badge on the leaderboards.
