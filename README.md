# [Live Demo](https://jnguy405.github.io/Mini-Mania/) | UC Santa Cruz CMPM 121 Final Project

# 🕹️ Mini Mania

**An immersive 3D puzzle adventure game built with React, Three.js, and physics simulation which features persistent inventory, save states, dynamic theming, and multi-language support.**

---

## 🎯 Project Summary

*Mini Mania* is a first-person 3D escape-style adventure where players navigate themed rooms, solve physics-based minigames (dice, basketball, Simon), manage a growing economy via in-game currency, and unlock new areas to progress toward an escape goal.

Built from the ground up using modern web stacks, the project emphasizes **scalable architecture**, **state persistence**, **accessibility**, and **player agency**, satisfying advanced requirements around inventory systems, internationalization, visual theming, and auto-save mechanics.

The game reflects a professional-grade workflow with modular component design, type-safe state management, performance-conscious rendering, and a seamless player experience across devices and preferences.

---

## 🔧 Tech Stack

### Core Engine
- **[Three.js](https://threejs.org/)** – Rendered via direct instancing and R3F
- **[Cannon-es](https://github.com/pmndrs/cannon-es)** – Active physics engine managing `RigidBody`, collision, gravity, and player-world interaction
- **[React Three Fiber](https://github.com/pmndrs/react-three-fiber)** – React layer for Three.js
- **[Drei](https://github.com/pmndrs/drei)** – Convenience components (`useKeyboardControls`, `useTexture`, etc.)
- **[Zustand](https://github.com/pmndrs/zustand)** – State container with `persist` and localStorage binding

### Tooling & Workflow
- **TypeScript** – Full type safety
- **Vite** – Build tool and dev server
- **npm** – Standardized scripts for `dev`, `build`, `preview`
- **GitHub Actions** – Deploy to GitHub Pages

### Art Pipeline (Design Phase Only)
- **Blender** → Used **offline** for level prototyping or visualization, but **not** used in build or runtime

---

## 🌐 Key Features

### ✅ Persistent Inventory & Economy
- **Money-based resource**: Continuous variable tracked across saves.
- **Betting system**: Use money to place bets in minigames (dice, basketball, Simon).
- **Rewards**: Win and accumulate money based on skill.

### 💾 Save System
- **Multiple save slots** auto-generated with timestamps.
- **Quick save** (`F5`) and **manual saves**.
- **Auto-save every 5 minutes** with last-triggered timestamp.
- **Clear all saves** (debug tool).
- **Save includes**: player position, room state, money, inventory, unlock progress.

### 🌗 Dynamic Light/Dark Mode
- **System preference detection** via `prefers-color-scheme`.
- **Full theme object** with coordinated palette for:
  - UI elements
  - In-game environments (walls, floors)
  - Interactive components (hoops, buttons)
- **CSS custom properties** updated via React hook (`useTheme`).
- **Themed shadows and panel styling** for visual depth.

### 🌍 i18n + Localization
- **Three languages**: English, Chinese, Arabic.
- **React context system** with `useI18n` hook for translations.
- **JSON message bundles** (`en.json`, `zh.json`, `ar.json`) loaded dynamically.
- **RTL support** for Arabic (text alignment, layout).
- **Parameterized strings** via `t()` function: `"Welcome, {{name}}!"`.

---

## 👥 Contributors

| Name | Role | Responsibilities |
|------|------|------------------|
| **Jenalee Nguyen** | **Tools Lead** | Project tooling, workflow setup (Vite, ESLint, Husky), asset pipeline, technical documentation, repo maintenance |
| **Joseph Gonzalez** | **Engine Lead** | Core architecture, 3D/physics integration (Three.js + Cannon-es), performance optimization, type safety |
| **William Gonzalez** | **Design Lead** | Gameplay design, level structure, puzzles, UI/UX concepts, game rules |
| **Inho Yoo** | **Testing Lead** | Test strategy, QA process, bug tracking, reproducibility, end-to-end validation |
