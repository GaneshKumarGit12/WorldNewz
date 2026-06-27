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

## 2. Controls & Responsiveness

- **Desktop**: Mouse pointer position guides the head angle. Click or press `Space` to speed boost.
- **Mobile/Tablets**:
  - Touch-drag anywhere on the canvas updates pointer target coordinates.
  - Canvas scales dynamically using Phaser's scale manager to match parent viewport limits, preventing letterboxing.
  - Speed boost is activated via an on-screen overlay button.

## 3. Global Page UI Integration

- When route matches `/games/dvcubie2026`, parent layouts automatically hide the global search form and comments/bookmarks badges.
- Toggle events are dispatched globally via:
  ```javascript
  window.dispatchEvent(new CustomEvent("dvcubie-settings-changed"));
  ```
