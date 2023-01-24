import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture, PivotControls, GizmoHelper, GizmoViewport } from '@react-three/drei'
import './Animation.css'
import TextureImg from './texture.jpg'
import Height from '../../../assets/height.png'
import Alpha from '../../../assets/alpha.png'
export default function Animation() {
    return (
        <Canvas camera={{ position: [1, 1, 1], fov: 60, near: 0.1, far: 1000, }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[0, 0, 10]} color={0xffffff} />
            <Plane />
            <OrbitControls makeDefault />
        </Canvas>
    )
}

document.addEventListener('mousemove', animateStars)

let mouseX = 0

function animateStars(event) {
    
    mouseX = event.clientX
}

const Geometry = () => {
    useFrame((state) => {
        // state.camera.rotation.z = mouseY * 0.001
        // state.camera.rotation.y = mouseY * 0.0001
    })
    return (
        <planeGeometry attach="geometry" args={[3, 3, 64, 64]} />
    )
}

const Material = () => {
    const colorMap = useTexture(TextureImg)
    const height = useTexture(Height)
    const alpha = useTexture(Alpha)
    return (
        <meshStandardMaterial
            attach="material"
            color="grey"
            map={colorMap}
            displacementMap={height}
            alphaMap={alpha}
            transparent={true}
        />
    )
}

const Plane = () => {
    const ref = useRef()
    useFrame(({ clock }) => {
        ref.current.rotation.z = clock.getElapsedTime() * 0.1
        ref.current.rotation.y = mouseX * 0.0001 
        
    })
    return (
        <PivotControls>
            <mesh ref={ref} position={[0, 0, 0]} rotation={[-1.4, 0.4, 0]}>
                <Geometry />
                <Material />
                <GizmoHelper
                    alignment="bottom-right" // widget alignment within scene
                    margin={[80, 80]} // widget margins (X, Y)                    
                >
                    <GizmoViewport axisColors={['red', 'green', 'blue']} labelColor="black" />
                </GizmoHelper>
            </mesh>
        </PivotControls>
    )
}


