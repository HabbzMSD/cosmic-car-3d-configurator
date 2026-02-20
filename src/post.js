import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export class PostProcessing {
    constructor(renderer, scene, camera) {
        this.composer = new EffectComposer(renderer);

        const renderPass = new RenderPass(scene, camera);
        this.composer.addPass(renderPass);

        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.0,  // strength
            0.4,  // radius
            0.85  // threshold
        );
        this.composer.addPass(this.bloomPass);

        this.enabled = true;

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    setBloomExposure(value) {
        this.bloomPass.strength = value;
    }

    setPerformanceMode(isPerfMode) {
        this.enabled = !isPerfMode;
        // In actual implementation, we jump back to simple renderer.render if !enabled
    }

    render(renderer, scene, camera) {
        if (this.enabled) {
            this.composer.render();
        } else {
            renderer.render(scene, camera);
        }
    }

    onWindowResize() {
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }
}
