import { useState, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as random from 'maath/random/dist/maath-random.esm'
import { OrbitControls } from '@react-three/drei'

export default function ParallaxStar() {
    return (
        <div className="webgl">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <Stars />
                <CameraControls />
            </Canvas>
            
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
        <OrbitControls
            ref={controlsRef}
            args={[camera, domElement]}
            autoRotate
            autoRotateSpeed={-0.1}
        />
    );
}


const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

document.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
})


function animateStars(event) {
    mouseX = (event.clientX / sizes.width) * 2 - 1
    mouseY = (event.clientY / sizes.height) * 2 - 1
}

function Stars(props) {
    const ref = useRef()
    const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 1 }))

    useFrame((state, delta) => {
        // console.log(state)
        ref.current.rotation.y = mouseX * 0.04
        ref.current.rotation.z = -mouseY * 0.04
    })
    return (
        <group rotation={[0, 0,0]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial transparent color="#ffffff" size={0.005} sizeAttenuation={true} depthWrite={false} />
            </Points>
        </group>
    )
}

