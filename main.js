import { SceneSetup } from './src/scene.js';
import { CarManager } from './src/carManager.js';
import { PostProcessing } from './src/post.js';
import { UIManager } from './src/ui.js';

class App {
    constructor() {
        this.container = document.getElementById('canvas-container');

        this.sceneSetup = new SceneSetup(this.container);
        this.carManager = new CarManager(this.sceneSetup);
        this.postProcessing = new PostProcessing(this.sceneSetup.renderer, this.sceneSetup.scene, this.sceneSetup.camera);

        this.uiManager = new UIManager(this);

        this.config = null;
        this.clock = new THREE.Clock();

        this.init();
    }

    async init() {
        this.uiManager.setLoading(true);

        try {
            // Load config
            const res = await fetch('/config/cars.json');
            this.config = await res.json();

            this.uiManager.populateCarSelect(this.config.cars);

            // Load first car
            if (this.config.cars.length > 0) {
                await this.loadCarModel(this.config.cars[0].id);
            }
        } catch (e) {
            console.error("Initialization error:", e);
            // Create fallback config if fetch fails (e.g., missing cars.json)
            this.config = { cars: [{ id: "placeholder", name: "Placeholder Box", url: "" }] };
            this.uiManager.populateCarSelect(this.config.cars);
            await this.loadCarModel("placeholder");
        }

        this.uiManager.setLoading(false);
        this.animate();
    }

    async loadCarModel(carId) {
        this.uiManager.setLoading(true);
        const carConf = this.config.cars.find(c => c.id === carId);

        if (carConf) {
            // url fallback for placeholder logic in CarManager
            await this.carManager.loadCar(carConf.url, carConf);
            this.uiManager.updatePanelButtons(this.carManager);
        }

        this.uiManager.setLoading(false);
    }

    async loadCustomCar(fileUrl, fileName) {
        this.uiManager.setLoading(true);

        const carConf = { id: fileName, name: fileName, url: fileUrl };
        const select = document.getElementById('car-select');
        const opt = document.createElement('option');
        opt.value = fileName;
        opt.textContent = fileName + ' (Custom)';
        select.appendChild(opt);
        select.value = fileName;

        await this.carManager.loadCar(fileUrl, carConf);
        this.uiManager.updatePanelButtons(this.carManager);

        this.uiManager.setLoading(false);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const time = this.clock.getElapsedTime();
        const delta = this.clock.getDelta();

        this.sceneSetup.update(time);
        this.carManager.update(time);

        if (this.sceneSetup.station && this.sceneSetup.station.visible) {
            this.sceneSetup.station.rotation.y += (window.stationSpeed || 0.2) * 0.01;
        }

        this.postProcessing.render(this.sceneSetup.renderer, this.sceneSetup.scene, this.sceneSetup.camera);
    }
}

// Attach THREE to window so it's globally available if needed by imported modules
import * as THREE from 'three';
window.THREE = THREE;

window.onload = () => {
    new App();
};
