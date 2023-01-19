import { useState, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as random from 'maath/random/dist/maath-random.esm'

export default function ParallaxStar() {
    return (
        <div className="webgl">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <Stars />
                <CameraControls />
            </Canvas>
            <Overlay />
        </div>

    )
}

document.addEventListener('mousemove', animateStars)
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
            autoRotate
            autoRotateSpeed={-0.2}
        />
    );
}


function animateStars(event) {
    mouseY = event.clientY
    mouseX = event.clientX
}

function Stars(props) {
    const ref = useRef()
    const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 1 }))

    useFrame((state, delta) => {
        ref.current.rotation.x = -mouseY * 0.0004
        ref.current.rotation.y = -mouseX * 0.0004
    })
    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial transparent color="#21BBAA" size={0.005} sizeAttenuation={true} depthWrite={false} />
            </Points>
        </group>
    )
}

function Overlay() {
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: '100%', height: '100%' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate3d(-50%,-50%,0)' }}>
                <h1 style={{ margin: 0, padding: 0, fontSize: '15em', fontWeight: 500, letterSpacing: '-0.05em', color: 'aquamarine' }}>Hello</h1>
            </div>
        </div>
    )
}
