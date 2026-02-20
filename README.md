# CarSpace Configurator

A web-based 3D interactive car configurator built with Vite, Three.js, and Vanilla JavaScript.
Features a premium UI, procedural space station, Bloom post-processing, and dynamic part animations.

## Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Dev Server:**
   ```bash
   npm run dev
   ```

3. **Build for Production (Static Deployment):**
   ```bash
   npm run build
   ```
   The files in the `dist` folder can be served by any static hosting provider (Vercel, GitHub Pages, Nginx, etc.).

## Adding Custom Cars
1. Drop your `.glb` model files into `/public/assets/cars/`.
2. Open `/public/config/cars.json`.
3. Add a new object mapping your car's internal node names to the configurator.
Example:
```json
{
  "id": "m4",
  "name": "BMW M4",
  "url": "/assets/cars/bmw_m4.glb",
  "mapping": {
    "bodyPaintMeshes": ["CarBody", "Bumper"],
    "rimMeshes": ["Rim", "WheelStructure"],
    "headlights": ["HeadlightGlass", "LEDs"]
  }
}
```

The app will auto-detect these strings as substrings in real mesh names.
