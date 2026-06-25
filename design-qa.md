# Design QA

Source reference: user-provided 1024 x 1536 reference image in this thread.

Prototype screenshot: `/Users/gavin/Documents/Codex/2026-06-24/express-q-c-hk-1-2/outputs/language-gateway-local-final.png`

Viewport compared: 1024 x 1536.

Checks:
- Top welcome block follows the reference order: Chinese, English, Thai, Vietnamese.
- Main language selection uses two columns and three rows.
- Six cards are clickable and link into the existing quote flow.
- The page does not embed or reuse the original reference image.
- Background and flag/icon visuals are generated or locally drawn project assets.
- The language gateway has no normal site header or footer, matching the reference landing-screen composition.
- Bottom service row contains four service items matching the reference structure.
- Desktop viewport has no horizontal overflow and no vertical scroll at 1024 x 1536.
- Mobile viewport has no horizontal overflow and keeps all cards clickable.

Remaining visual differences accepted as non-blocking:
- Generated background is stylistically matched but not identical, because the original image cannot be used directly.
- Flag assets are locally redrawn and flatter than the glossy reference flags.
- Card frame uses CSS neon borders rather than the exact mechanical frame artwork from the reference.

final result: passed
