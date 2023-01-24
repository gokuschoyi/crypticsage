import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Canvas, extend, useFrame, useLoader, useThree } from '@react-three/fiber';
import circleImg from '../../../assets/circle.png';
import { Suspense, useCallback, useMemo, useRef, useEffect } from 'react';
import * as dat from 'dat.gui'
extend({ OrbitControls })

export default function AnimationScript() {
    return (
        <div className="webgl">
            <Suspense fallback={<div>Loading...</div>}>
                <Canvas
                    legacy={false}
                    camera={{ fov: 100, near: 0.1, far: 1000, position: [0, 130, 0] }}
                >
                    <Suspense fallback={null}>
                        <Points />
                    </Suspense>
                    <CameraControls />
                </Canvas>
            </Suspense>
        </div>
    );
}

const gui = new dat.GUI()


document.addEventListener('mousemove', animateWaves)
let mouseY = 0
let mouseX = 0

function CameraControls() {
    const {
        camera,
        gl: { domElement }
    } = useThree();

    const controlsRef = useRef();
    useFrame(() => controlsRef.current.update())
    return (
        <orbitControls
            ref={controlsRef}
            args={[camera, domElement]}
        // autoRotate
        // autoRotateSpeed={-0.2}
        />
    );
}

function animateWaves(event) {
    mouseY = event.clientY
    mouseX = event.clientX
}

function Points() {
    const imgTex = useLoader(THREE.TextureLoader, circleImg);
    const bufferRef = useRef();

    let t = 0;
    let f = 0.002;
    let a = 5;

    const graph = useCallback((x, z) => {
        return Math.sin(f * (x ** 2 + z ** 2 + t)) * a;
    }, [t, f, a])

    const count = 150
    const sep = 5

    let positions = useMemo(() => {
        let positions = []

        for (let xi = 0; xi < count; xi++) {
            for (let zi = 0; zi < count; zi++) {
                let x = sep * (xi - count / 2);
                let z = sep * (zi - count / 2);
                let y = graph(x, z);
                positions.push(x, y, z);
            }
        }

        return new Float32Array(positions);
    }, [count, sep, graph])

    const Wave = () => {
        t += 10

        const positions = bufferRef.current.array;

        let i = 0;
        for (let xi = 0; xi < count; xi++) {
            for (let zi = 0; zi < count; zi++) {
                let x = sep * (xi - count / 2);
                let z = sep * (zi - count / 2);

                positions[i + 1] = graph(x, z);
                i += 3;
            }
        }

        bufferRef.current.needsUpdate = true;
    }

    useFrame((state, delta) => {
        Wave();
        console.log()
        state.camera.rotation.z = (mouseY + state.camera.rotation.z) * 0.0001;
        state.camera.rotation.y = (mouseX + state.camera.rotation.x) * 0.0001;

    })
    useEffect(() => {
        
        gui.add(bufferRef.camera.position, "x",).max(10).min(-10).step(0.01).name("x")
    }, [])


    return (
        <group rotation={[2, 2, 0]}>
            <points>
                <bufferGeometry attach="geometry">
                    <bufferAttribute
                        ref={bufferRef}
                        attach='attributes-position'
                        array={positions}
                        count={positions.length / 3}
                        itemSize={3}
                    />
                </bufferGeometry>

                <pointsMaterial
                    attach="material"
                    map={imgTex}
                    color={0x2cf2dc}
                    size={0.5}
                    sizeAttenuation
                    transparent={false}
                    alphaTest={0.5}
                    opacity={1.0}
                />
            </points>
        </group>
    );
}


