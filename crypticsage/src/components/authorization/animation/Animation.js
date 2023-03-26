import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
// import { OrbitControls } from '@react-three/drei'
import './Animation.css'
import TextureImg from './texture.jpg'
import Height from '../../../assets/height.png'
import Alpha from '../../../assets/alpha.png'
// import { useControls } from 'leva'

export default function Animation() {
    /* const options = useMemo(() => {
        return {
            x: { value: 5.17, min: 0, max: Math.PI * 2, step: 0.01 },
            y: { value: 0.47, min: 0, max: Math.PI * 2, step: 0.01 },
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
        <Canvas camera={{ position: [1, 1, 1], fov: 90, near: 0.1, far: 1000, }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[0, 0, 10]} color={0xffffff} />
            <Plane
                // rotation={[pA.x, pA.y, pA.z]}
                // position={[pB.x, pB.y, pB.z]}
            />
            
        </Canvas>
    )
}

document.addEventListener('mousemove', animateStars)
let mouseY = 0
let mouseX = 0


function animateStars(event) {
    mouseX = (event.clientX / sizes.width) * 2 - 1
    mouseY = (event.clientY / sizes.height) * 2 - 1

}

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

document.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
})

const Geometry = () => {
    useFrame((state) => {
        const clock = state.clock.getElapsedTime()
        state.scene.rotation.y = clock * 0.1
        state.scene.rotation.x = (mouseY * 0.005 + state.scene.rotation.x);
        state.scene.rotation.y = (mouseX * 0.005 + state.scene.rotation.y);
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

const Plane = (props) => {
    useFrame(({ clock }) => {
        // ref.current.rotation.z = clock.getElapsedTime() * 0.1
        // ref.current.rotation.y = mouseX * 0.0001

    })
    return (

        <mesh rotation={[5.17,0.47,0]}>
            <Geometry />
            <Material />
        </mesh>

    )
}


