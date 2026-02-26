export class UIManager {
    constructor(app) {
        this.app = app;
        this.initTabs();
        this.initCarControls();
        this.initCameraControls();
        this.initEnvControls();
        this.initFxControls();
    }

    initTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class
                document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

                // Add active
                tab.classList.add('active');
                document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
            });
        });
    }

    setLoading(isLoading) {
        const overlay = document.getElementById('loading-overlay');
        if (isLoading) {
            overlay.classList.add('visible');
        } else {
            overlay.classList.remove('visible');
        }
    }

    populateCarSelect(cars) {
        const select = document.getElementById('car-select');
        select.innerHTML = '';
        cars.forEach(car => {
            const opt = document.createElement('option');
            opt.value = car.id;
            opt.textContent = car.name;
            select.appendChild(opt);
        });

        select.addEventListener('change', (e) => {
            this.app.loadCarModel(e.target.value);
        });
    }

    updatePanelButtons(carManager) {
        const panels = ['doorL', 'doorR', 'hood', 'trunk'];
        let anyValid = false;
        panels.forEach(p => {
            const btn = document.getElementById(`btn-${p}`);
            btn.onclick = () => {
                carManager.togglePanel(p);
                btn.classList.toggle('active');
            };
            if (carManager.panels[p]) {
                btn.disabled = false;
                anyValid = true;
            } else {
                btn.disabled = true;
                btn.classList.remove('active');
            }
        });

        document.getElementById('panel-hint').style.display = anyValid ? 'none' : 'block';
    }

    initCarControls() {
        const { carManager } = this.app;

        const bindColor = (id, target) => {
            document.getElementById(id).addEventListener('input', (e) => {
                carManager.setGlobalMaterial(target, 'color', e.target.value);
            });
        };
        bindColor('color-body', 'body');
        bindColor('color-rims', 'rims');
        bindColor('color-calipers', 'calipers');

        const bindSlider = (id, prop) => {
            document.getElementById(id).addEventListener('input', (e) => {
                carManager.setGlobalMaterial('body', prop, parseFloat(e.target.value));
            });
        };
        bindSlider('mat-metal', 'metalness');
        bindSlider('mat-rough', 'roughness');
        bindSlider('mat-clearcoat', 'clearcoat');

        const btnHl = document.getElementById('btn-headlights');
        btnHl.addEventListener('click', () => {
            btnHl.classList.toggle('active');
            carManager.toggleHeadlights(btnHl.classList.contains('active'));
        });

        const btnUg = document.getElementById('btn-underglow');
        const colorUg = document.getElementById('color-underglow');
        btnUg.addEventListener('click', () => {
            btnUg.classList.toggle('active');
            carManager.setUnderglow(btnUg.classList.contains('active'), colorUg.value);
        });
        colorUg.addEventListener('input', (e) => {
            if (btnUg.classList.contains('active')) {
                carManager.setUnderglow(true, e.target.value);
            }
        });

        const uploadCar = document.getElementById('upload-car');
        uploadCar.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const url = URL.createObjectURL(file);
                this.app.loadCustomCar(url, file.name);
            }
        });
    }

    initCameraControls() {
        const { sceneSetup } = this.app;

        document.querySelectorAll('.cam-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                const cam = sceneSetup.camera;
                // Basic static positions relative to target
                switch (preset) {
                    case 'front': cam.position.set(0, 1, 6); break;
                    case 'rear': cam.position.set(0, 1, -6); break;
                    case 'left': cam.position.set(6, 1, 0); break;
                    case 'right': cam.position.set(-6, 1, 0); break;
                    case 'top': cam.position.set(0, 8, 0); break;
                    case 'cinematic': cam.position.set(4, 3, 5); break;
                }
                sceneSetup.controls.update();
            });
        });

        document.getElementById('cam-fov').addEventListener('input', (e) => {
            sceneSetup.camera.fov = parseFloat(e.target.value);
            sceneSetup.camera.updateProjectionMatrix();
        });

        document.getElementById('btn-reset-view').addEventListener('click', () => {
            sceneSetup.camera.position.set(5, 2, 6);
            sceneSetup.controls.target.set(0, 0.5, 0);
            sceneSetup.controls.update();
            document.getElementById('cam-fov').value = 45;
            sceneSetup.camera.fov = 45;
            sceneSetup.camera.updateProjectionMatrix();
        });
    }

    initEnvControls() {
        const { sceneSetup } = this.app;

        document.getElementById('env-ambient').addEventListener('input', e => {
            sceneSetup.lights.ambient.intensity = parseFloat(e.target.value);
        });
        document.getElementById('env-key').addEventListener('input', e => {
            sceneSetup.lights.key.intensity = parseFloat(e.target.value);
        });
        document.getElementById('env-rim').addEventListener('input', e => {
            sceneSetup.lights.rim.intensity = parseFloat(e.target.value);
        });

        const btnStation = document.getElementById('btn-station');
        btnStation.addEventListener('click', () => {
            btnStation.classList.toggle('active');
            sceneSetup.station.visible = btnStation.classList.contains('active');
        });

        document.getElementById('station-scale').addEventListener('input', e => {
            const s = parseFloat(e.target.value);
            sceneSetup.station.scale.set(s, s, s);
        });

        // speed is handled in main loop by reading this value
        window.stationSpeed = 0.2;
        document.getElementById('station-speed').addEventListener('input', e => {
            window.stationSpeed = parseFloat(e.target.value);
        });

        document.getElementById('station-color').addEventListener('input', e => {
            sceneSetup.setStationColor(e.target.value);
        });

        document.getElementById('star-density').addEventListener('change', e => {
            sceneSetup.setupStarfield(parseInt(e.target.value));
        });

        const uploadStation = document.getElementById('upload-station');
        uploadStation.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const url = URL.createObjectURL(file);
                sceneSetup.setupSpaceStation(url);
            }
        });

        const uploadBg = document.getElementById('upload-bg');
        uploadBg.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const url = URL.createObjectURL(file);
                sceneSetup.loadCustomBackground(url);
                // Reset select since we use custom
                document.getElementById('bg-select').value = 'custom';
            }
        });

        // Ensure there's a custom option in HTML or just ignore it, but we can set value.
        // Also add logic for predefined backgrounds
        const bgSelect = document.getElementById('bg-select');
        bgSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'procedural') {
                sceneSetup.resetEnvironment();
            } else if (val !== 'custom') {
                sceneSetup.loadCustomBackground(`/assets/background/${val}.png`);
            }
        });
    }

    initFxControls() {
        const { postProcessing, carManager } = this.app;

        const btnPerf = document.getElementById('btn-perf-mode');
        btnPerf.addEventListener('click', () => {
            btnPerf.classList.toggle('active');
            postProcessing.setPerformanceMode(btnPerf.classList.contains('active'));
            const isPerf = btnPerf.classList.contains('active');
            // maybe lower render resolution or hide station
        });

        document.getElementById('fx-exposure').addEventListener('input', e => {
            postProcessing.setBloomExposure(parseFloat(e.target.value));
        });

        const btnFloat = document.getElementById('btn-float');
        btnFloat.addEventListener('click', () => {
            btnFloat.classList.toggle('active');
            carManager.floatEnabled = btnFloat.classList.contains('active');
        });

        const btnScreenshot = document.getElementById('btn-screenshot');
        btnScreenshot.addEventListener('click', () => {
            // Render one frame to make sure buffers are fresh
            this.app.postProcessing.render(this.app.sceneSetup.renderer, this.app.sceneSetup.scene, this.app.sceneSetup.camera);
            const canvas = this.app.sceneSetup.renderer.domElement;
            const dataURL = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'car-in-space-screenshot.png';
            link.href = dataURL;
            link.click();
        });
    }
}
