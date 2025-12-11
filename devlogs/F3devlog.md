[Game Link](https://josephgonzalez1.github.io/cmpm-121-F/)

# F3 Dev Log 12/5/25

## Selected Requirements

- Continuous Inventory, Save System, Visual Themes, and i18n + l10n.

## How we satisfied the requirements

1. Continuous Inventory:  The game uses a money-based economy where the continuous quantity of money matters. Players collect cash which they can use for betting in various games. The UI displays the current money amount continuously, and different game mechanics (like timed rewards) affect this continuously variable resource.
2. Save System: The game implements a comprehensive save system using localStorage. It supports multiple save slots automatically populated by timestamp. Key features include:
    - Quick saves (F5) and manual saves
    - Auto-save every 5 minutes
    - A "clear all saves" option for debugging
    - Loading game state including player position and current room
3. Visual Themes:  The game implements dynamic light/dark mode switching that responds to the user's system preferences via the `prefers-color-scheme` media query. The theme system uses CSS variables set by a React hook, with different color palettes for UI elements, environment, and game components in each mode.
4. i18n + l10n: The game supports three languages as required: English, Chinese, and Arabic. Localization is implemented using a message system with JSON files for each language (en.json, zh.json, ar.json) loaded dynamically. A context-aware `t()` function handles translations and supports parameterized strings, with text direction automatically adjusted for RTL languages like Arabic.

## Reflection

Looking back, our approach to the F3 requirements evolved significantly from our initial plan. We initially intended to build custom solutions for each requirement in isolation. However, as we implemented them, we discovered the value of creating unified systems. For the save system, we started with a simple checkpoint approach but quickly realized we needed a more robust solution. This led us to implement a full state serialization system with multiple save slots and auto-save functionality, which became far more sophisticated than our initial plan. Our biggest shift was in implementing internationalization. We originally planned to use a simple way to toggle between languages. Instead, we developed a comprehensive React context-based i18n system with dynamic locale loading, which taught us the importance of building scalable architecture from the start. The visual themes implementation also evolved - rather than just swapping a few colors, we created a full theme object system that coordinates UI, environment, and game element colors across both light and dark modes.