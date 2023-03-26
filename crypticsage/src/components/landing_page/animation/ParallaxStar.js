import { useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as random from 'maath/random/dist/maath-random.esm'
import { ArcballControls } from '@react-three/drei'
import gsap from "gsap";

export default function ParallaxStar() {
    return (
        <div className="webgl">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <Stars />
                <ArcballControls />
            </Canvas>

        </div>

    )
}

document.addEventListener('mousemove', animateStars)
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


function animateStars(event) {
    mouseX = (event.clientX / sizes.width) * 2 - 1
    mouseY = (event.clientY / sizes.height) * 2 + 1
}

function Stars(props) {
    const ref = useRef()
    const [sphere] = useState(() => random.inCircle(new Float32Array(5000), { radius: 1.2 }))

    useFrame((state, delta) => {
        // console.log(state)
        ref.current.rotation.z= state.clock.elapsedTime * 0.01
        gsap.to(ref.current.rotation, {
            y: mouseX * 0.04,
            x: mouseY * 0.04,
            duration: 2
        })
    })
    return (
        <group rotation={[0, 0, 0]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial transparent color="#ffffff" size={0.005} sizeAttenuation={true} depthWrite={false} />
            </Points>
        </group>
    )
}

