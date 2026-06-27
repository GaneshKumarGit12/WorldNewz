---
name: dvcubie2026-game-management
description: Guidelines and instructions for running, debugging, and maintaining the DVCubie2026 Snake Arena (.io) game in WorldNewzs.
---

# DVCubie2026 Snake Arena (.io) Game Architecture

This document describes the mechanics and maintenance guidelines for the **DVCubie2026** snake arena game in the WorldNewzs codebase.

## 1. Gameplay Mechanics

- **Arena Size**: Set to 2000x2000 pixels with a tileable grid.
- **Snake Model**:
  - The player and AI are chains of blocks (segments).
  - The head segment is the highest value block.
  - Tail segments trail behind, representing lower values.
- **Kinematic Segment Follow**:
  - To simulate a fluid trailing effect, each tail segment follows the segment directly in front of it using kinematic distance math:
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
- **Eating and Combat**:
  - A snake consumes body segments of another snake if its head value is strictly greater than the collided segment's value.
  - Head-to-head collisions result in the larger head consuming the entire smaller snake.
- **Static Square Blockers**:
  - Replaces old division sign hazards with solid 3D gray bevel obstacles.
  - Players and bots collide and slide around these blockers to navigate, cut off opponents, or corner food.
- **Next Cube Preview**:
  - A random power-of-two value (2, 4, 8, 16) is pre-rolled as the "next cube".
  - Phaser emits `next-cube-changed` when a new food item spawns or is eaten, updating the HUD display card.
- **Score Calculation**:
  - The score/count of the snake is equal to the value of its head segment (the highest block).
  - Eating food appends blocks to the tail; player scores increase when tail blocks merge up to the head, doubling the head block value.

## 2. Controls & Layout Specifications

- **Desktop**: Mouse pointer position guides the head angle. Click or press `Space` to speed boost.
- **Mobile/Tablets**:
  - Touch-drag anywhere on the canvas updates pointer target coordinates.
  - Canvas scales dynamically using Phaser's scale manager to match parent viewport limits.
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
