import {
    BoxGeometry,
    BufferGeometry,
    DirectionalLight,
    Mesh,
    MeshStandardMaterial,
    PlaneGeometry,
    PerspectiveCamera,
    Scene,
    Vector3,
    WebGLRenderer,
} from 'three';
import Stats from 'three/addons/libs/stats.module.js';

import { Cloth, Node, Spring } from './cloth.js'
import './style.css'


const GRAVITY = new Vector3(0, -1, 0);
const WIND = new Vector3(10, 0, 5);

class SimpleOscillator {
    constructor(mass, length, stiffness, damping) {
        this.top = new Node(0, 0, mass);
        this.top.fixed = true;
        this.bottom = new Node(0, length, mass);

        this.spring = new Spring(this.top, this.bottom, length, stiffness, damping);
    }

    update(dt) {
        this.bottom.addForce(GRAVITY);
        this.spring.addForces();
        this.top.applyForce();
        this.bottom.applyForce(dt);
    }
}

const beginScene = (container) => {
    const scene = new Scene();
    const camera = new PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 5;

    const renderer = new WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    addEventListener('resize', (_) => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });


    const stats = new Stats();
    container.appendChild(stats.dom);

    const SIDELENGTH = 3;
    const DENSITY = 12;
    const cloth = new Cloth(SIDELENGTH, DENSITY, 5, 10, 0.1, 1.1);
    cloth.addForce(GRAVITY);
    cloth.addForce(node => {
        const wind = WIND.clone().sub(node.vel).dot(node.normal);
        return node.normal.clone().multiplyScalar(wind);
    });

    const material = new MeshStandardMaterial();
    const geom = new PlaneGeometry(SIDELENGTH, SIDELENGTH, DENSITY, DENSITY);
    const clothMesh = new Mesh(geom, material);
    scene.add(clothMesh);

    const light = new DirectionalLight(0xfff, 1);
    light.target = clothMesh;
    light.position.set(0, 10, 10);
    scene.add(light);

    const dt = 2;
    let currTime = performance.now();
    let accumulator = 0;

    const renderfn = () => {
        const newTime = performance.now();
        const frameTime = newTime - currTime;
        currTime = newTime;

        accumulator += frameTime;

        while (accumulator > 0) {
            const step = Math.min(accumulator, dt);
            cloth.update(step * 0.001);
            accumulator -= step;
        }

        cloth.updateGeometry(geom);

        stats.update();
        renderer.render(scene, camera);
        requestAnimationFrame(renderfn);
    }
    renderfn();

    renderer.domElement.classList.add('scene');
    container.appendChild(renderer.domElement);
}

addEventListener('load', (_) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    beginScene(container);
});
