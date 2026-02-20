# Master Prompt: "Car In Space" Configurator

**Act as an expert Three.js and Vite developer.** Your task is to build a highly polished, interactive 3D web application called the "Car In Space" Configurator. 

## Tech Stack
*   **Build Tool:** Vite
*   **Core Library:** Three.js (Vanilla JavaScript, no framework like React/Vue).
*   **Loaders:** `GLTFLoader` (for `.glb`/`.gltf` 3D models), `RGBELoader` (for `.hdr` environment maps).
*   **Addons:** `OrbitControls`, `EffectComposer`, `RenderPass`, `UnrealBloomPass` (for glowing effects).

## Architecture & File Structure
Ensure the code is heavily modularized for maintainability:
1.  `index.html`: Contains the UI panel overlay structure using tabs.
2.  `styles.css`: Dark, glassy, premium modern UI styling.
3.  `main.js`: Bootstraps the application, handles the central animation loop, and fetches the `cars.json` config.
4.  `src/scene.js`: Manages the Three.js scene, camera, renderer, lights, background space station, procedural starfield, and environment maps.
5.  `src/carManager.js`: Handles loading car models, parsing materials, mapping parts, handling PBR material tweaks, animations, headlights, and underglow.
6.  `src/ui.js`: Binds all HTML elements (buttons, sliders, color pickers, file uploads) to their corresponding methods in the 3D logic classes.
7.  `src/post.js`: Configures the post-processing pipeline for bloom and exposure.
8.  `src/utils.js`: Helper functions (e.g., traversing a GLTF and finding meshes by comparing `node.name` AND `node.material.name` against an array of possible target strings).
9.  `public/config/cars.json`: JSON configuration defining default car models and arrays of target names for mapping parts like `body`, `rims`, `calipers`, `doors`, `hood`, `headlights`.

## Core Requirements & Features

### 1. The Rendering Environment (`scene.js`)
*   Initialize a WebGLRenderer with `antialias: true` and `preserveDrawingBuffer: true` (critical for capturing screenshots).
*   Use `ACESFilmicToneMapping` for realistic lighting.
*   **Camera:** Implement `OrbitControls` with damping, maximum polar angle constraints (preventing viewing strictly from underneath), and zoom limits.
*   **Lighting:** Include Ambient Light, a Key Light (Directional, casting soft shadows), and a Rim Light.
*   **Starfield:** Generate a background starfield dynamically.
*   **Space Station Background:** Load a background model (`station.glb`) positioned in the distance. If none exists, generate a procedural fallback (e.g., a wireframe sphere and glowing torus).
*   **Dynamic Environment Map:** Generate a `PMREMGenerator` equirectangular background map for physically based reflections on the cars. *Crucial:* Allow the environment map color to be dynamically tinted matching the "Space Station Color" UI picker to cast colored reflections on the car's glossy paint.

### 2. Car Management (`carManager.js`)
*   Implement a robust system to load a `.glb` car. Center the car via bounding box calculations natively so it always sits flush at `y=0`.
*   Parse the loaded GLB using `utils.js` to identify materials for specific sections based on `cars.json` naming rules (e.g., find materials named "paint", "carbody", etc., and assign them to a `body` group).
*   Store references to these materials so the user can dynamically alter:
    *   **Colors:** Base color of the Body, Rims, and Brake Calipers.
    *   **PBR Maps:** Adjust `metalness`, `roughness`, and `clearcoat` on the main body paint.
*   **Interactivity:** Allow the user to toggle the visibility of specific meshes like the Left/Right doors, Hood, and Trunk.
*   **Headlights:** Implement a method to swap the headlight material's emissive color to bright white and increase intensity to synergize with the UnrealBloomPass.
*   **Underglow:** Create a planar mesh under the car that projects a customizable colored glow with high emission.
*   **Float Animation:** Implement an optional sine-wave vertical floating animation for the car model.

### 3. User Interface (`ui.js` & `index.html`)
Build a rich UI panel with 4 distinct tabs. Ensure inputs trigger changes immediately without page reloading.
*   **CAR Tab:**
    *   Select dropdown to switch between default car models in `cars.json`.
    *   **"Upload Custom Car"** (`<input type="file">`) button allowing users to upload a local `.glb` and load it into the scene.
    *   Color pickers for Paint, Rims, and Calipers.
    *   Sliders (0 to 1) for Metallic, Roughness, and Clearcoat.
    *   Toggle buttons for Doors, Hood, and Trunk.
    *   Toggle button for Headlights.
    *   Toggle button and Color Picker for Underglow.
*   **CAMERA Tab:**
    *   Buttons for static Preset Views (Front, Rear, Left, Right, Top, Cinematic).
    *   Slider for Camera FOV.
    *   "Reset View" button.
*   **ENVIRONMENT Tab:**
    *   Sliders for Ambient, Key, and Rim Light intensity.
    *   Toggle Space Station visibility.
    *   **"Upload Custom Station"** button to replace the background `.glb`.
    *   Sliders for Station Scale and Station Rotation Speed.
    *   **"Station Color"** Picker: Tint the Space Station and dynamically rebuild the PMREM environment reflections to match.
    *   Slider to dynamically change Star Density.
    *   **"Upload HDRI / Image Background"** button to dynamically load user `.hdr` or `.jpg` skyboxes via `RGBELoader` or `TextureLoader`.
*   **EFFECTS Tab:**
    *   "Performance Mode" toggle (disables bloom compositor to save frames).
    *   Slider to control Bloom Exposure.
    *   Toggle for the Car Float animation.
    *   **"Capture Screenshot"** button: Extracts `renderer.domElement.toDataURL('image/png')` and triggers an automatic browser download.

## Edge Cases & Error Handling
*   If a mapped part (e.g., "Left Door") isn't found in a given `.glb`, disable the corresponding UI button gracefully.
*   Ensure uploaded files are read using `URL.createObjectURL(file)` so they load locally without CORS issues.
*   Handle the destruction of old materials, geometries, and textures to prevent memory leaks when swapping cars or environments.
