# 🪐 Tata Surya — Solar System Sandbox

An interactive, high-quality 3D solar system you can explore right in the browser. Built with [Three.js](https://threejs.org/) (WebGL) — no build step, no external image assets, fully self-contained.

**▶️ Live demo:** enable GitHub Pages (see below), then open `https://m45argaeth.github.io/sand-surya/`

![Three.js](https://img.shields.io/badge/Three.js-r160-000?logo=three.js) ![No build](https://img.shields.io/badge/build-none-success) ![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

- **Full solar system** — the Sun + all 8 planets, Earth's Moon, and rings for Saturn & Uranus.
- **Zoom in / out** — mouse scroll, on-screen `+ / −` buttons, or pinch on touch devices.
- **Orbit & pan** — drag to rotate the whole system, right-drag to pan.
- **Click a planet** — the camera smoothly follows it and shows a fact card (diameter, distance, orbital period, day length, number of moons).
- **Sandbox controls** — play/pause, orbital speed slider (0–5×), focus selector, and toggles for orbit lines, name labels, background stars, and bloom glow.
- **Cinematic quality** — procedural planet textures, gas-giant banding, additive sun glow, a 6,000-star sky, ACES tone mapping, and UnrealBloom post-processing.
- **Responsive** — adapts to desktop and mobile.

## 🎮 Controls

| Action | How |
| --- | --- |
| Rotate view | Left-drag |
| Pan | Right-drag (or two-finger drag) |
| Zoom | Scroll wheel · pinch · `+` / `−` buttons |
| Focus a planet | Click it, or use the **Fokus Planet** dropdown |
| Pause / resume | **Pause** button |
| Orbit speed | **Kecepatan Orbit** slider |
| Reset camera | **Reset View** button |

## 🚀 Run locally

Because it uses ES modules, open it through a local server (not `file://`):

```bash
# any one of these from the project folder
python3 -m http.server 8000
# then visit http://localhost:8000
```

## 🌐 Deploy on GitHub Pages

1. Go to the repo **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Select the `main` branch and `/ (root)` folder, then **Save**.
4. After a minute your sandbox is live at `https://m45argaeth.github.io/sand-surya/`.

The `.nojekyll` file is already included so all assets are served as-is.

## 🗂️ Project structure

```
sand-surya/
├── index.html    # markup, styling, control panel
├── main.js       # Three.js scene, planets, interaction, post-processing
├── .nojekyll     # tell GitHub Pages to skip Jekyll processing
└── README.md
```

## 📝 Notes

Planet **sizes and distances are visualisation-scaled** so everything fits comfortably on screen — the real astronomical figures are shown in each planet's info card. Three.js is loaded from a CDN via an import map, so an internet connection is needed the first time the page loads.

## 📄 License

MIT — do whatever you like.
