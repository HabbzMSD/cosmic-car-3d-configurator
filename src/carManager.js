import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { normalizeModelScale, findMeshByName, autoGuessHinge } from './utils.js';

export class CarManager {
    constructor(sceneObject) {
        this.sceneObject = sceneObject;
        this.scene = sceneObject.scene;
        this.loader = new GLTFLoader();
        this.currentCar = null;
        this.carGroup = new THREE.Group();
        this.scene.add(this.carGroup);

        this.materials = {
            body: new THREE.MeshStandardMaterial({
                color: 0xff0000,
                metalness: 0.9,
                roughness: 0.1,
                envMapIntensity: 2.0
            }),
            rims: new THREE.MeshStandardMaterial({
                color: 0xcccccc,
                metalness: 0.8,
                roughness: 0.2
            }),
            calipers: new THREE.MeshStandardMaterial({
                color: 0xffff00,
                metalness: 0.3,
                roughness: 0.5
            })
        };

        if (this.materials.body.clearcoat !== undefined) {
            this.materials.body.clearcoat = 1.0;
            this.materials.body.clearcoatRoughness = 0.05;
        }

        this.meshes = {
            body: [], rims: [], calipers: [], headlights: []
        };

        this.panels = {
            doorL: null, doorR: null, hood: null, trunk: null
        };

        this.panelStates = {
            doorL: 0, doorR: 0, hood: 0, trunk: 0
        }; // 0 = closed, 1 = open

        this.floatEnabled = true;
        this.underglowLight = null;
        this.setupUnderglow();
    }

    setupUnderglow() {
        this.underglowLight = new THREE.RectAreaLight(0x00ffff, 0, 4, 2);
        this.underglowLight.position.set(0, 0.1, 0);
        this.underglowLight.rotation.x = -Math.PI / 2;
        this.carGroup.add(this.underglowLight);
    }

    async loadCar(url, config) {
        if (this.currentCar) {
            this.carGroup.remove(this.currentCar);
            // Proper disposal omitted for brevity, but should traverse and dispose geo/mat
        }

        return new Promise((resolve, reject) => {
            this.loader.load(url, (gltf) => {
                const model = gltf.scene;

                // Normalize scale and center
                normalizeModelScale(model, 4.5);

                // Map materials and panels
                this.processModel(model, config);

                // Cast shadows
                model.traverse(c => {
                    if (c.isMesh) {
                        c.castShadow = true;
                        c.receiveShadow = true;
                    }
                });

                this.currentCar = model;
                this.carGroup.add(model);
                resolve(model);
            }, undefined, (error) => {
                console.error("Failed to load model", error);

                // Create procedural fallback box if model fails
                const geo = new THREE.BoxGeometry(2, 1, 4);
                geo.translate(0, 0.5, 0);
                const fallback = new THREE.Mesh(geo, this.materials.body);
                fallback.castShadow = true;

                this.currentCar = fallback;
                this.carGroup.add(fallback);
                this.meshes.body = [fallback];

                resolve(fallback);
            });
        });
    }

    processModel(model, config) {
        // Note: USERS should edit parts mapping in cars.json
        const mapping = config.mapping || {};

        // Colors
        this.meshes.body = findMeshByName(model, mapping.bodyPaintMeshes || ['body', 'paint', 'shell']);
        this.meshes.body.forEach(m => m.material = this.materials.body);

        this.meshes.rims = findMeshByName(model, mapping.rimMeshes || ['rim', 'wheel_metal']);
        this.meshes.rims.forEach(m => m.material = this.materials.rims);

        this.meshes.calipers = findMeshByName(model, mapping.caliperMeshes || ['caliper', 'brake']);
        this.meshes.calipers.forEach(m => m.material = this.materials.calipers);

        this.meshes.headlights = findMeshByName(model, mapping.headlights || ['headlight_glass', 'headlight_emission']);

        // Panels (Pivots)
        const doorL = findMeshByName(model, mapping.doorLeft || ['door_L', 'doorL'])[0];
        if (doorL) this.panels.doorL = autoGuessHinge(doorL, 'front');

        const doorR = findMeshByName(model, mapping.doorRight || ['door_R', 'doorR'])[0];
        if (doorR) this.panels.doorR = autoGuessHinge(doorR, 'front');

        const hood = findMeshByName(model, mapping.hood || ['hood', 'bonnet'])[0];
        if (hood) this.panels.hood = autoGuessHinge(hood, 'rear');

        const trunk = findMeshByName(model, mapping.trunk || ['trunk', 'boot'])[0];
        if (trunk) this.panels.trunk = autoGuessHinge(trunk, 'front');
    }

    setGlobalMaterial(type, property, value) {
        if (this.materials[type] && this.materials[type][property] !== undefined) {
            if (property === 'color') {
                this.materials[type].color.set(value);
            } else {
                this.materials[type][property] = value;
            }
        }
    }

    togglePanel(panelName) {
        if (!this.panels[panelName]) return false;
        this.panelStates[panelName] = this.panelStates[panelName] === 0 ? 1 : 0;
        return true;
    }

    toggleHeadlights(on) {
        this.meshes.headlights.forEach(m => {
            // Basic approach: swap material emissive
            if (!m.userData.origMat) {
                m.userData.origMat = m.material.clone();
                m.material = m.material.clone();
            }
            m.material.emissive.setHex(on ? 0xffffff : 0x000000);
            m.material.emissiveIntensity = on ? 5.0 : 0.0;
        });
    }

    setUnderglow(on, colorHex) {
        if (colorHex) this.underglowLight.color.set(colorHex);
        this.underglowLight.intensity = on ? 5.0 : 0.0;
    }

    update(time) {
        if (this.floatEnabled && this.currentCar) {
            this.carGroup.position.y = Math.sin(time * 2) * 0.05;
        } else {
            this.carGroup.position.y = 0;
        }

        // Animate panels
        const lerpSpeed = 0.1;
        if (this.panels.doorL) {
            const target = this.panelStates.doorL ? Math.PI / 3 : 0; // open outwards
            this.panels.doorL.rotation.y += (target - this.panels.doorL.rotation.y) * lerpSpeed;
        }
        if (this.panels.doorR) {
            const target = this.panelStates.doorR ? -Math.PI / 3 : 0;
            this.panels.doorR.rotation.y += (target - this.panels.doorR.rotation.y) * lerpSpeed;
        }
        if (this.panels.hood) {
            const target = this.panelStates.hood ? Math.PI / 4 : 0; // open up
            this.panels.hood.rotation.x += (target - this.panels.hood.rotation.x) * lerpSpeed;
        }
        if (this.panels.trunk) {
            const target = this.panelStates.trunk ? -Math.PI / 4 : 0; // open up
            this.panels.trunk.rotation.x += (target - this.panels.trunk.rotation.x) * lerpSpeed;
        }
    }
}
