import React, { useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from 'three';

function MyRotatingBox() {
    const myMesh = React.useRef();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const onMouseMove = (event) => {
        setMousePosition({
            x: (event.clientX - window.innerWidth / 2) / 100,
            y: (event.clientY - window.innerHeight / 2) / 100
        });
    };
    useFrame(({ clock }) => {
        myMesh.current.rotation.x = mousePosition.y;
        myMesh.current.rotation.y = mousePosition.x;
    });

    return (
        <mesh ref={myMesh} onPointerMove={onMouseMove}>
            <boxGeometry />
            <meshPhongMaterial color="white" />
        </mesh>
    );
}

export default function Test() {
    return (
        <div className="webgl">
            <Canvas>
                <MyRotatingBox />
                <ambientLight intensity={0.1} />
                <directionalLight />
            </Canvas>
        </div>
    );
}
