import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as random from 'maath/random/dist/maath-random.esm'
import { ArcballControls } from '@react-three/drei'
import gsap from "gsap";

export default function ParallaxStar() {
    const canvasRef = useRef()
    useEffect(() => {
        return () => {
            // console.log('UE : ParallaxStar : return')
            // eslint-disable-next-line react-hooks/exhaustive-deps
            const canvas = canvasRef.current;
            const renderer = canvas?.getContext('parallax-star');
            if (renderer) renderer.dispose();
        };
    })
    return (
        <div className="parallax-star">
            <Canvas ref={canvasRef} camera={{ position: [0, 0, 1] }}>
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

    useEffect(() => {
        return () => {
            // console.log('UE : ParallaxStar Stars : return')
            const canvas = ref.current;
            if (canvas) ref.current = undefined;
        };
    })

    useFrame((state, delta) => {
        // console.log(state)
        ref.current.rotation.z = state.clock.elapsedTime * 0.01
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

