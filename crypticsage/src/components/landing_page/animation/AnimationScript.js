import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Canvas, extend, useFrame, useLoader, useThree } from '@react-three/fiber';
import circleImg from '../../../assets/circle.png';
import { Suspense, useCallback, useMemo, useRef } from 'react';
// import { useControls } from 'leva'
extend({ OrbitControls })

export default function AnimationScript() {
   /*  const options = useMemo(() => {
        return {
            x: { value: 3.12, min: 0, max: Math.PI * 2, step: 0.01 },
            y: { value: 0, min: 0, max: Math.PI * 2, step: 0.01 },
            z: { value: 0, min: 0, max: Math.PI * 2, step: 0.01 },
            visible: true,
            color: { value: 'lime' },
        }
    }, [])
    const position = useMemo(() => {
        return {
            x: { value: 0, min: 0, max: 100, step: 0.01 },
            y: { value: 0, min: -100, max: 100, step: 0.01 },
            z: { value: 0, min: 0, max: 100, step: 0.01 },
            color: { value: 'lime' },
        }
    }, []) */

    // const pA = useControls('Points', options)
    // const pB = useControls('position', position)
    return (
        <div className="webgl">
            <Suspense fallback={<div>Loading...</div>}>
                <Canvas
                    legacy={false}
                    camera={{ fov: 100, near: 0.1, far: 1000, position: [0, 130, 0] }}
                >
                    <Suspense fallback={null}>
                        <Points
                            /* rotation={[pA.x, pA.y, pA.z]}
                            position={[pB.x, pB.y, pB.z]}
                            visible={pA.visible} */ 
                            />
                    </Suspense>
                    <CameraControls />
                </Canvas>
            </Suspense>
        </div>
    );
}

document.addEventListener('mousemove', animateWaves)
let mouseY = 0
let mouseX = 0

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

document.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
})

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
    mouseX = (event.clientX / sizes.width) * 2 - 1
    mouseY = (event.clientY / sizes.height) * 2 - 1
    // console.log({mouseX, mouseY})
}

function Points(props) {
    const imgTex = useLoader(THREE.TextureLoader, circleImg);
    const bufferRef = useRef();

    let t = 0;
    let f = 0.002;
    let a = 5;

    const graph = useCallback((x, z) => {
        return Math.sin(f * (x ** 2 + z ** 2 +z**2 + t)) * a;
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

    useFrame((state) => {
        Wave();
        console.log()
        state.camera.rotation.x = (mouseY * 0.1 + state.camera.rotation.x);
        state.camera.rotation.y = (mouseX * 0.1 + state.camera.rotation.y);
        // state.scene.rotation.y = clock * 0.1;
    })

    return (
        <mesh rotation={[3.12,0,0]} >
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
        </mesh>
    );
}


