# App icon and splash sources

SVG masters for every PNG in `assets/`. The mark is a North-Indian kundli frame
(square, diagonals, inner diamond) with the sun at the centre, in the web app's saffron.

| PNG | Size | Use |
|---|---|---|
| icon.png | 1024 | iOS icon and stores (full-bleed; iOS rounds the corners) |
| android-icon-foreground.png | 1024 | Adaptive icon foreground (inside the 66 % safe zone) |
| android-icon-background.png | 1024 | Adaptive icon background (gradient) |
| android-icon-monochrome.png | 1024 | Android 13+ themed icon |
| splash-icon.png / splash-icon-dark.png | 1024 | Splash mark on #faf7f2 / #15110e |
| favicon.png | 48 | Web |

To regenerate after editing an SVG, render each one to PNG at the size above with a
transparent background (any SVG renderer: Inkscape, Figma export, or a headless browser).
Splash and icon changes show only in a development or release build, not in Expo Go.
