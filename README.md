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

# F2 Dev Log 12/1/25

## How we satisfied the software requirements
1. The game uses the same 3D rendering and physics simulation identified by the team for F1 or suitable replacements that still satisfy the F1 requirements.
    - The game has the same tech stack described in F1 with cannon and three. All F1 requirements remain satisfied.
2. The game must allow the player to move between scenes (e.g. rooms)
    - The player may move between rooms via keyboard controls and mouse movement.
3. The game must allow the player to select specific objects in a scene for interaction (e.g. tapping an item to pick it up or examine it)
    - The player may interact/click in order to play through the mini games.
4. The game maintains an inventory system allowing the player to carry objects so that what happens in one scene has an impact on what is possible in another scene.
    - The inventory system remains consistent throughout all room updates and displays the item or spaces taken.
5. The game contains at least one physics-based puzzle that is relevant to the player's progress in the game.
    - The player may click the buttons in the correct order and pick up a block to place in a portal. The player may play basketball 
6. The player can succeed or fail at the physics-based puzzle on the basis of their skill and/or reasoning (rather than luck).
    - The player may succeed by inputting the correct pattern for Simon Game, shooting in the basket for Basketball Game, or rolling the value in the Dice Game. The player fails due to incorrect input of a pattern, missing the basket, or failing to predict the dice roll.
7. Via play, the game can reach at least one conclusive ending.
    - The player may escape or fail depending on gameplay.

## Reflection
- Our team's plan has stayed somewhat the same as we chose to stay with the same tech stack with cannon and three.
- The plan only has differed in a way that offers refinement and expanding on certain mechanics.
- There is now an inventory system that remains consistent throughout the puzzle instead of just carrying an object.
- The failure condition for the puzzle has changed where the player can now fail by inputting the incorrect input pattern as it makes the successes or failures more clear cut.
- There is a more conclusive fail ending now as supposed to the fail ending prior where it's just the player stuck there for eternity until they solve it.

# F1 Dev Log 11/21/25

## Introducing the team

### Tools Lead: Jenalee Nguyen
- Jenalee oversees all aspects of tooling for the project, which includes development workflow decisions, asset pipeline integration, and technical documentation standards. She also monitors tool performance and assists teammates when they need support with asset creation, configuration management, or code integration.

### Engine Lead: Joseph Gonzalez
- Joseph is responsible for the technical core of the game by managing the integration and stability of Three.js and Cannon-es. He establishes architectural patterns, reviews core system code, and guides the team on technical feasibility, optimization strategies, and feature implementation.

### Design Lead: William Gonzalez
- William directs the creative direction of the project, gameplay concepts, level structure, and guidelines. He coordinates design documentation, prototypes new mechanics, and scopes.

### Testing Lead: Inho Yoo
- Inho leads all testing efforts, which includes test planning, scenario coverage, bug tracking, and quality assurance workflows. He develops repeatable testing processes, evaluates system stability across updates, and works with the entire team to ensure issues are documented and reproducible.

## Tools and materials

### Stack
- [Three.js](https://threejs.org/)
- [Cannon-es](https://github.com/pmndrs/cannon-es)
- [TypeScript](https://www.typescriptlang.org/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Vite](https://vite.dev/)
- [Blender](https://www.blender.org/)

1. **Engine**:
- We plan on using Three.js and Cannon-es as our core engine layer. Three.js provides a flexible WebGL rendering framework that supports fully 3D environments as well as 2D-style orthographic layouts. Cannon-es adds the physics foundation, realistic collision handling, and dynamic object behavior with proper TypeScript types.

2. **Language**:
- **TypeScript** -> We will be using TypeScript as our main programming language for its strong typing system, better tooling support, and enhanced code maintainability. TypeScript integrates seamlessly with Three.js while providing better development experience and catching errors at compile time.

3. **Tools**: 
- Our project uses a focused set of tools to support 3D modeling, rapid prototyping, clean coding practices, and efficient testing.
    - **IDE: Visual Studio Code**: We use VS Code for its excellent TypeScript support, integrated terminal, and extensive extension ecosystem.
    - **Development Environment - Node.js and npm**: We selected Node.js as our runtime environment and npm for package management, providing a robust ecosystem for our TypeScript development workflow.
    - **Build Tool - Vite**: We use Vite as our build tool because it provides fast hot module replacement, clear configuration options, and excellent TypeScript support that keeps iteration times short.
    - **3D Modeling - Blender**: Blender is used to create and refine our 3D models, environments, and animations. It provides a comprehensive toolset for 3D asset creation and exports to formats compatible with Three.js.

4. **Generative AI**: 
- We plan to use generative AI in our project, but we will not be using agentic AI. The reasoning for not using agentic AI is that it makes mistakes and can potentially make large changes to the code that take lots of effort to undo. Generative AI will be mainly used for autocompleting lines or comments. We will not require and leave it up to each team member's discretion on what features of tools of generative AI they will use.

## Outlook

1. **What do you anticipate being the hardest or riskiest part of the project?**

- **Connecting art and code smoothly**: Three.js and Cannon-es each solve different problems, but combining them introduces complexity. It requires synchronizing physics updates from Cannon-es with the rendering loop in Three.js while maintaining type safety in a TypeScript environment.
- **Keeping good performance in the browser**: Three.js allows for visually rich 3D scenes, but performance can degrade quickly if models, lighting, or physics interactions become too heavy. We may need to optimize scene complexity, material usage, object counts, and physics updates for consistent game performance.
- **Building a stable game**: Our stack requires us to implement these patterns manually with TypeScript, so it is important to maintain proper type definitions, keep the file structure organized, and ensure update loops and rendering logic are type-safe.

2. **What are you hoping to learn by approaching the project with the tools and materials you selected above?**

- By using Three.js and Cannon-es with TypeScript, it helps us understand how real-time 3D rendering, physics simulation, and game loops work at a lower level with type safety, instead of relying on Unity or Unreal.
- Using TypeScript for our entire codebase will help us learn how to write more maintainable, self-documenting code with proper type definitions and interfaces.
- Using Node.js, npm, and Vite with TypeScript helps us maintain a consistent development environment and encourages us to write simple, modular code with compile-time error checking.
- Using Blender to create 3D models and importing them into our project teaches us how real game asset pipelines work and how to optimize 3D assets for web delivery.