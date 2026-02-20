import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export class SceneSetup {
    constructor(canvasContainer) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050508);
        this.scene.fog = new THREE.FogExp2(0x050508, 0.02);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(5, 2, 6);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        canvasContainer.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.1; // allow slight under view
        this.controls.minDistance = 2;
        this.controls.maxDistance = 20;
        this.controls.target.set(0, 0.5, 0);

        this.lights = {};
        this.setupLights();

        this.stars = null;
        this.setupStarfield(1500);

        this.station = null;
        this.setupSpaceStation();

        // Procedural Env Map for reflections
        this.setupEnvironment();

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    setupLights() {
        this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.lights.ambient);

        this.lights.key = new THREE.DirectionalLight(0xfff0dd, 2.0);
        this.lights.key.position.set(5, 5, -5);
        this.lights.key.castShadow = true;
        this.lights.key.shadow.mapSize.width = 2048;
        this.lights.key.shadow.mapSize.height = 2048;
        this.scene.add(this.lights.key);

        this.lights.rim = new THREE.DirectionalLight(0x00e5ff, 1.0);
        this.lights.rim.position.set(-5, 3, 5);
        this.scene.add(this.lights.rim);

        // Floor to catch shadows
        const floorGeo = new THREE.PlaneGeometry(100, 100);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x050508,
            roughness: 0.1,
            metalness: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }

    setupEnvironment() {
        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.pmremGenerator.compileEquirectangularShader();
        this.updateEnvironmentColor('#00e5ff');
    }

    updateEnvironmentColor(hexColor) {
        if (!this.pmremGenerator) return;

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const context = canvas.getContext('2d');

        const gradient = context.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(0.5, '#222233');
        gradient.addColorStop(1, '#000000');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 512, 256);

        context.fillStyle = '#ffffff';
        context.beginPath(); context.arc(256, 128, 20, 0, Math.PI * 2); context.fill();
        context.fillStyle = hexColor;
        context.beginPath(); context.arc(100, 100, 15, 0, Math.PI * 2); context.fill();
        context.fillStyle = '#ff0055';
        context.beginPath(); context.arc(400, 150, 15, 0, Math.PI * 2); context.fill();

        const texture = new THREE.CanvasTexture(canvas);
        texture.mapping = THREE.EquirectangularReflectionMapping;

        const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;

        if (this.scene.environment) {
            this.scene.environment.dispose();
        }
        this.scene.environment = envMap;
        texture.dispose();
    }

    setupStarfield(count) {
        if (this.stars) this.scene.remove(this.stars);

        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) {
            pos[i] = (Math.random() - 0.5) * 100;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

        const mat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.05,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });

        this.stars = new THREE.Points(geo, mat);
        this.scene.add(this.stars);
    }

    setupSpaceStation(url = '/assets/background/station.glb') {
        if (!this.station) {
            this.station = new THREE.Group();
            this.station.position.set(-30, 10, -40);
            this.scene.add(this.station);
        } else {
            // Clear existing
            while (this.station.children.length > 0) {
                this.station.remove(this.station.children[0]);
            }
        }

        const loader = new GLTFLoader();
        loader.load(url, (gltf) => {
            // Replace procedural with loaded model
            this.station.add(gltf.scene);

            // Auto scale background model to fit reasonably
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 0) {
                const scale = 50 / maxDim; // target size around 50 units
                gltf.scene.scale.set(scale, scale, scale);
            }

        }, undefined, (error) => {
            // Fallback to procedural space station
            console.log("No custom station.glb found, using procedural fallback.");
            this.buildProceduralStation();
        });
    }

    loadCustomBackground(url) {
        if (url.toLowerCase().endsWith('.hdr')) {
            const loader = new RGBELoader();
            loader.load(url, (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                if (this.scene.environment) this.scene.environment.dispose();
                this.scene.environment = texture;
                if (this.scene.background) this.scene.background.dispose();
                this.scene.background = texture;
            });
        } else {
            const loader = new THREE.TextureLoader();
            loader.load(url, (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                if (this.scene.environment) this.scene.environment.dispose();
                this.scene.environment = texture;
                if (this.scene.background) this.scene.background.dispose();
                this.scene.background = texture;
            });
        }
    }

    buildProceduralStation() {
        // Core sphere
        const coreGeo = new THREE.IcosahedronGeometry(15, 2);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8,
            metalness: 0.5,
            wireframe: true // gives a sci-fi panel look easily
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        this.station.add(core);

        // Ring
        const ringGeo = new THREE.TorusGeometry(20, 0.5, 16, 100);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x444444,
            emissive: 0x00e5ff,
            emissiveIntensity: 0.2
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2 - 0.2;
        this.station.add(ring);
    }

    setStationColor(hexColor) {
        if (this.lights && this.lights.rim) {
            this.lights.rim.color.set(hexColor);
        }

        this.updateEnvironmentColor(hexColor);

        if (!this.station) return;

        const color = new THREE.Color(hexColor);

        this.station.traverse((child) => {
            if (child.isMesh && child.material) {
                // If it's our procedural rim, it has emissive
                if (child.material.emissive && child.material.emissive.getHex() !== 0x000000) {
                    child.material.emissive.copy(color);
                } else if (child.material.color) {
                    // For custom GLBs, tint the base color
                    child.material.color.copy(color);
                }
            }
        });
    }

    update(time) {
        this.controls.update();
        if (this.stars) {
            this.stars.rotation.y = time * 0.01;
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
