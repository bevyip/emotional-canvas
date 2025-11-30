import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Scene from "./components/Scene";
import "./index.css";

function App() {
  return (
    <>
      <div
        id="container"
        style={{ width: "100vw", height: "100vh", margin: 0, padding: 0 }}
      >
        <Canvas
          camera={{ position: [30, 50, 200], fov: 55, near: 1, far: 50000 }}
          gl={{
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.5,
          }}
        >
          <Scene />
        </Canvas>
      </div>
    </>
  );
}

export default App;
