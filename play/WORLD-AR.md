# TJ's Hole in One — tabletop world AR prototype

Prototype: /play/world.html (branch feature/8thwall-tabletop-world-ar)

Original live game remains /play/ on main. Rollback snapshot: backup/pre-tabletop-ar-2026-11-18.

## Intended flow
1. Scan QR to open the site; navigate to /play/world.html to test the prototype.
2. Start camera in Safari on an iPhone.
3. Move slowly across a well-lit textured bar top until a placement ring appears.
4. Tap Place course. The world-space course remains at the selected position as the phone moves.
5. Move physically behind the ball and drag to putt. Use Move course to reposition.

## Implementation
- 8th Wall distributed binary, SLAM enabled, absolute-meter tracking.
- 8th Wall Three.js pipeline; center-screen feature-point hit testing.
- Original Three.js makeGame and physics retained.
- Course is rotated from local XY with Z up into a horizontal world XZ plane with Y up.
- Course does not require continuous coaster visibility.

## Limitations / test checklist
- This is an untested prototype, not yet production-ready. Validate iOS Safari startup, SDK loading, feature-point hit-test return shape, coordinate alignment, placement height, size, camera rendering, input hit testing, and tracking recovery.
- Feature-point hits are not guaranteed to be on a horizontal tabletop. A more robust plane estimation step may be needed before shipping.
- The 8th Wall engine does not directly expose iPhone LiDAR; it uses visual SLAM.
- No existing QR destination has been changed. Do not merge to main until verified on a device.
- Confirm binary license requirements: https://8thwall.org/docs/engine/license
- Engine integration docs: https://8thwall.org/docs/engine/overview
