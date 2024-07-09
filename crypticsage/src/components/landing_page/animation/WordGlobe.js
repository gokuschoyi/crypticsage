import * as THREE from 'three'
import { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text, OrbitControls } from '@react-three/drei'
// import randomWord from 'random-words';
// import { useControls } from 'leva'

import G_Data from '../../dashboard/dashboard_tabs/glossary/GlossaryData'

function generateWord(g_data) {
    const wordList = []
    // eslint-disable-next-line no-unused-vars
    for (const [key, value] of Object.entries(g_data)) {
        wordList.push(...value)
    }

    const randomWordsList = new Set()
    const totalWords = wordList.length
    const maxWords = Math.min(70, totalWords)

    while (randomWordsList.size < maxWords) {
        const randomIndex = Math.floor(Math.random() * totalWords)
        const randomWord = wordList[randomIndex]
        randomWordsList.add(randomWord)
    }

    const rWLArray = Array.from(randomWordsList)

    const words = rWLArray.map((word) => word.word)
    return [rWLArray, words]
}

function selectWords(words) {
    if (words.length === 0) {
        return "No more words";
    }
    let randomIndex = Math.floor(Math.random() * words.length);
    let selectedWord = words[randomIndex];

    return selectedWord;
}

function Word({ children, setSelectedWord, handleOpenWordMeaning, ...props }) {
    // console.log('FUNC : Word')
    const color = new THREE.Color()
    const fontProps = { fontSize: 1.5, letterSpacing: 0.05, lineHeight: 1, 'material-toneMapped': false }
    const ref = useRef()
    const [hovered, setHovered] = useState(false)
    const over = (e) => {
        // console.log(e.eventObject._private_text)
        e.stopPropagation()
        setHovered(true)
    }
    const out = () => setHovered(false)
    // Change the mouse cursor on hover
    useEffect(() => {
        if (hovered) document.body.style.cursor = 'pointer'
        return () => (document.body.style.cursor = 'auto')
    }, [hovered])
    // Tie component to the render-loop
    useFrame(({ camera }) => {
        // Make text face the camera
        ref.current.quaternion.copy(camera.quaternion)
        // Animate font color
        ref.current.material.color.lerp(color.set(hovered ? '#fa2720' : 'white'), 0.1)

    })
    return <Text
        ref={ref}
        onPointerOver={over}
        onPointerOut={out}
        onClick={(e) => {
            e.stopPropagation()
            handleOpenWordMeaning()
            setSelectedWord(ref.current._private_text)
            // console.log(ref.current._private_text)
        }
        }
        {...props}
        {...fontProps}
        children={children}
    />
}

function Cloud(props) {
    // console.log('FUNC : Cloud')
    const { words: wds, count, radius, setSelectedWord, handleOpenWordMeaning } = props
    const tempBuffer = useRef([]);


    const generatePosition = ({ count, radius }) => {
        const spherical = new THREE.Spherical()
        const phiSpan = Math.PI / (count + 1)
        const thetaSpan = (Math.PI * 2) / count
        for (let i = 1; i < count + 1; i++)
            for (let j = 0; j < count; j++)
                tempBuffer.current.push([new THREE.Vector3().setFromSpherical(spherical.set(radius, phiSpan * i, thetaSpan * j)), selectWords(wds)])
        // console.log(spherical)
        return tempBuffer.current;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const words = useMemo(() => generatePosition({ count, radius }), [count, radius])
    // console.log(words.map(([pos, word], index) => <Word key={index} position={pos} children={word} />))
    return words.map(([pos, word], index) => <Word key={index} position={pos} children={word} setSelectedWord={setSelectedWord} handleOpenWordMeaning={handleOpenWordMeaning} />)
}

function WordlGlobeMesh(props) {
    // console.log('FUNC : WordlGlobeMesh')
    const { words, setSelectedWord, handleOpenWordMeaning } = props
    const CloudRef = useMemo(() => {
        return <Cloud words={words} count={7} radius={24} setSelectedWord={setSelectedWord} handleOpenWordMeaning={handleOpenWordMeaning} />
    }, [setSelectedWord, handleOpenWordMeaning, words])

    /* const options = useMemo(() => {
        return {
            x: { value: 0, min: 0, max: Math.PI * 2, step: 0.01 },
            y: { value: 0, min: 0, max: Math.PI * 2, step: 0.01 },
            z: { value: 0, min: 0, max: Math.PI * 2, step: 0.01 },
            visible: true,
            color: { value: 'lime' },
        }
    }, []) */
    // const pA = useControls('Points', options)
    // console.log(<Cloud count={7} radius={20} />)
    // console.log("______________________________")
    // console.log(CloudRef)

    const myMesh = useRef();

    useFrame(({ clock }) => {
        console.log()
        // myMesh.current.scene.rotation.x = clock.getElapsedTime()s
    })
    return (
        <mesh ref={myMesh}>
            <fog attach="fog" args={['#202025', 0, 80]} />
            {CloudRef}
            <OrbitControls
                autoRotate
                autoRotateSpeed={0.4}
                position0={[30, 0, 35]}
                enableZoom={false}
            />
        </mesh>
    )
}

export default function WordCloud(props) {
    // console.log('FUNC : WordCloud')
    const { setSelectedWord, handleOpenWordMeaning, setWordList } = props
    const [generatedWords, setGeneratedWords] = useState(null)
    const canvasRef = useRef()

    useEffect(() => {
        if (!generatedWords) {
            const [randomWordsList, words] = generateWord(G_Data)
            setWordList(randomWordsList)
            setGeneratedWords(words)
            // console.log(randomWordsList, words)
        }

        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            const canvas = canvasRef.current;
            const renderer = canvas?.getContext('word-globe');
            if (renderer) renderer.dispose();
        };
    }, [generatedWords, setGeneratedWords, setWordList])

    return (
        <div className="word-globe">
            <Canvas ref={canvasRef} dpr={[1, 2]} camera={{ position: [0, 0, 38], fov: 90 }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[0, 0, 50]} angle={0.3} penumbra={1} intensity={2} castShadow />
                {generatedWords && <WordlGlobeMesh words={generatedWords} setSelectedWord={setSelectedWord} handleOpenWordMeaning={handleOpenWordMeaning} />}
            </Canvas>
        </div>
    )
}
