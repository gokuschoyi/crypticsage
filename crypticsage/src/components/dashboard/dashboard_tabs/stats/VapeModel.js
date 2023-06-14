import { useMemo } from 'react';
import { Box } from '@mui/material'
import { Canvas, useLoader } from '@react-three/fiber'
import { Stats, OrbitControls, ArcballControls, PerspectiveCamera } from '@react-three/drei'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { useControls } from 'leva'


export default function VapeModel() {
    return (
        <Box sx={{ height: '100vh' }}>
            <Canvas>
                <Stats />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={0.5} color={0xffffff} />
                <Ground />
                <Camera />
                <Drone />
                <Plant />
                <Vape />
                <Controls />
            </Canvas>
        </Box>
    )
}

const Drone = () => {
    const gltf = useLoader(GLTFLoader, 'mavic.glb',)
    return (
        <mesh rotation={[0, 3, 0]}>
            <primitive
                object={gltf.scene}
                position={[0, 0.05, 0]}
            />
        </mesh>
    )
}

// 1.87, -0.67, 0.95 rot value for vape -0.10, 0.02, -0.05 pos
const Vape = () => {
    /* const rotation = useMemo(() => {
        return {
            x: { value: 0, min: -2, max: 2, step: 0.001 },
            y: { value: 0, min: -2, max: 2, step: 0.001 },
            z: { value: 0, min: -2, max: 2, step: 0.001 },
            color: { value: 'lime' },
        }
    }, [])
    const pos = useMemo(() => {
        return {
            x: { value: 0, min: -2, max: 2, step: 0.001 },
            y: { value: 0, min: -2, max: 2, step: 0.001 },
            z: { value: 0, min: -2, max: 2, step: 0.001 },
            color: { value: 'lime' },
        }
    }, [])

    const pA = useControls('Rotation', rotation)
    const pB = useControls('Position', pos) */
    const gltf = useLoader(GLTFLoader, 'vape.glb',)
    return (
        <mesh rotation={[0, 3, 0]} scale={0.5}>
            <axesHelper />
            <primitive
                object={gltf.scene}
                rotation={[1.87, -0.67, 0.95]}
                position={[0.01, 0.09, -0.56]}
            />
        </mesh>
    )
}

const Plant = () => {
    const gltf = useLoader(GLTFLoader, 'plant.glb',)
    return (
        <mesh rotation={[0, 3, 0]} scale={0.4}>
            <primitive
                object={gltf.scene}
                position={[0.45, 0.56, -0.26]}
            />
        </mesh>
    )
}

const Camera = () => {
    return (
        <PerspectiveCamera makeDefault position={[2, 1, 2]} />
    )
}

const Controls = () => {
    return (
        <OrbitControls target={[0, 0, 0]} />
    )
}

const Ground = () => {
    return (
        <mesh rotation={[-1.58, 0, 0]}>
            <planeGeometry args={[10, 10]} />
            <meshPhongMaterial color={0x999999} />
        </mesh>
    )
}