## DEV UPDATES

### Project Structure

- **cmpm-121-F-app/**
    - **src/**
        - `App.tsx`: Main application with React + Three.js integration
        - `main.tsx`: Application entry point
        - `vite-env.d.ts`: TypeScript definitions
        - **components/**
            - `SimplePhysics.tsx`: # Three.js + Ammo.js demo components
    - `deno.json`: Deno configuration with dependencies
    - `vite.config.ts`: Vite build configuration
    - `tsconfig.json`: TypeScript configuration

### Dependencies

- **Runtime**: Deno with Node modules compatibility
- **Frontend**: React 19, Three.js, Ammo.js
- **Build Tool**: Vite with TypeScript
- **Development**: Hot reload, TypeScript checking

## Dev Log

### 11/20/25

**Jenalee 2:40 pm**
- Installed dependencies `deno install`, React, Vite, Ammo, Three... Run `deno task dev`.
- [Base Setup Reference](https://docs.deno.com/examples/react_tutorial/)