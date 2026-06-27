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
  - Head-to-head collisions result in the larger head consuming the entire smaller snake (transferring its score value).
- **Division Signs `(/)`**:
  - Halves the value of the head segment upon collision, with a minimum value of 2.
- **Next Cube Preview**:
  - A random power-of-two value (2, 4, 8, 16) is pre-rolled as the "next cube".
  - Phaser emits `next-cube-changed` when a new food item spawns or is eaten, updating the HUD display card.

## 2. Controls & Layout Specifications

- **Desktop**: Mouse pointer position guides the head angle. Click or press `Space` to speed boost.
- **Mobile/Tablets**:
  - Touch-drag anywhere on the canvas updates pointer target coordinates.
  - Canvas scales dynamically using Phaser's scale manager to match parent viewport limits.
  - Speed boost is activated via an on-screen overlay button.
- **HUD Placements**:
  - **Pause Button**: Positioned in the **top-left** of the gameplay screen.
  - **Scoreboard**: Current Score on the **left**, Best Score on the **right**.
  - **Next Cube**: Card container in the **top-right** displaying the upcoming value.
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
