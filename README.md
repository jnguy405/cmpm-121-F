# Devlog Entry - 11/14/2025

## Introducing the team

- Tools Lead: Jenalee Nguyen
- Jenalee oversees all aspects of tooling for the project, which includes development workflow decisions, asset pipeline integration, and technical documentation standards. She also monitors tool performance and assists teammates when they need support with asset creation, configuration management, or code integration.
- Engine Lead: Joseph Gonzalez
- Design Lead: William Gonzalez
- Testing Lead: Inho Yoo

## Tools and materials
1. Engine:
We plan on using p5.js as it is an easy starting point for F1. It has no built-in 3d rendering and physics. We are all also familiar with it and have some good practice with it already. We have found it to be a good candidate for the game we will be making. We wanted to stick to a JavaScript framework as we were comfortable with it and wanted to make a game with it.
2. Language: JavaScript JSON
We will be using JavaScript as our programming language because we are comfortable with it and have experience using it. We will also be using JSON as our data language, as it is needed for most web development. JavaScript is also needed for p5.js, so we need to use that as our programming language. That is why we chose p5.js.
3. Tools: Our project uses a focused set of tools to support art creation, rapid prototyping, clean coding practices, and efficient testing.

**IDE: Visual Studio Code (GitHub Codespaces)**: We use VS Code through GitHub Codespaces to ensure that everyone develops inside the same cloud-based environment with consistent dependencies and configuration.
**Development Environment: Deno and Vite**: We selected Deno for its secure and modern JavaScript runtime that simplifies dependency management. We use Vite as our build tool because it provides clear configuration options that keep iteration times short.
**Art Tools: Piskel**: Piskel is used to create and refine our pixel art animations. It simplifies sprite sheet generation, supports onion skinning for animation workflows, and lets us export asset files directly into our code pipeline.
**Asset Library: Kenney Assets**: We use the free Kenney asset collections as a foundation for placeholder art and environmental elements. These assets help us prototype quickly while refining our own art style.
4. Generative AI: 
We plan to use generative AI in our project, but we will not be using agentic AI. The reasoning for not using agentic AI is that it makes mistakes and can potentially make large changes to the code that take lots of effort to undo. Generative AI will be mainly used for autocompleting lines or comments. We will not require and leave it up to each team member’s discretion on what features of tools of generative AI they will use. 

## Outlook
1. What do you anticipate being the hardest or riskiest part of the project?

- Connecting art and code smoothly: Moving sprite sheets from PISKEL in Vite and p5.js can cause issues with file paths, image sizes, and animation frames.
- Keeping good performance in the browser: p5.js works well for small games, but as we add more animations and objects, the game may slow down. We will need to optimize our drawing and update logic to keep the game smooth on the web. 
- Building a stable game: p5.js gives freedom, but it does not include built in systems like collision handling or scene management like other tools. Because of this, keeping the game organized as it grows may become difficult.

2. What are you hoping to learn by approaching the project with the tools and materials you selected above?

- By using p5.js and JavaScript, we want to better understand how a basic game loop actually works instead of depending on a more advanced engine like unity. 
- Using JSON for our game data will help us learn how to keep code and settings separate. 
- Using Deno and Vite helps us keep a consistent development environment and encourages us to write simple, modular code. 
- Using PISKEL to make sprites and importing them into our project teaches us how real game asset pipelines work. 

