import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Clouds, Cloud } from "@react-three/drei";
import { Sky } from "three/addons/objects/Sky.js";
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  createRGBDisplay,
  updateRGBDisplay,
  createCreationHelpers,
  createCameraHelpers,
} from "../../ui-helpers.js";

// Global state (will be managed in component)
let rgbDisplay: HTMLElement | null = null;
let rgbPills: {
  r: HTMLElement | null;
  g: HTMLElement | null;
  b: HTMLElement | null;
  a: HTMLElement | null;
} = {
  r: null,
  g: null,
  b: null,
  a: null,
};

export default function Scene() {
  const { camera, scene, gl } = useThree();
  const [spawnedCubes, setSpawnedCubes] = useState<THREE.Mesh[]>([]);
  const [spawnedClouds, setSpawnedClouds] = useState<
    Array<{ id: number; position: [number, number, number]; scale: number }>
  >([]);

  const meshRef = useRef<THREE.Mesh>(null);
  const previewRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<any>(null);
  const audioListenerRef = useRef<THREE.AudioListener | null>(null);
  const positionalAudioRef = useRef<THREE.PositionalAudio | null>(null);

  const [isHolding, setIsHolding] = useState(false);
  const [holdStartTime, setHoldStartTime] = useState(0);
  const [holdStartPosition, setHoldStartPosition] =
    useState<THREE.Vector3 | null>(null);
  const [isSpacebarHeld, setIsSpacebarHeld] = useState(false);
  const [maxRoundnessAchieved, setMaxRoundnessAchieved] = useState(0);
  const FIXED_CLOUD_COUNT = 40;

  const [arrowKeys, setArrowKeys] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
  });
  const [globalRGB, setGlobalRGB] = useState({
    r: 255,
    g: 255,
    b: 255,
    a: 255,
  });
  const [keyHoldState, setKeyHoldState] = useState({
    1: { isHolding: false, startTime: 0 },
    2: { isHolding: false, startTime: 0 },
    3: { isHolding: false, startTime: 0 },
    4: { isHolding: false, startTime: 0 },
  });

  // Initialize camera
  useEffect(() => {
    camera.position.set(30, 50, 200);
    camera.lookAt(0, 10, 0);
  }, [camera]);

  // Setup 3D positional audio at starting cube location
  useEffect(() => {
    // Create audio listener and attach to camera
    const listener = new THREE.AudioListener();
    camera.add(listener);
    audioListenerRef.current = listener;

    // Create positional audio at starting cube position [0, 10, 0]
    const sound = new THREE.PositionalAudio(listener);
    const audioLoader = new THREE.AudioLoader();

    audioLoader.load("/ocean.mp3", (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setRefDistance(50); // Reference distance for volume falloff
      sound.setRolloffFactor(1); // How quickly volume decreases with distance
      sound.play();
    });

    // Position audio at starting cube location
    sound.position.set(0, 10, 0);
    scene.add(sound);
    positionalAudioRef.current = sound;

    return () => {
      // Cleanup
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.disconnect();
      scene.remove(sound);
      camera.remove(listener);
    };
  }, [camera, scene]);

  // Setup renderer
  useEffect(() => {
    gl.setPixelRatio(window.devicePixelRatio);
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.5;
  }, [gl]);

  // Setup Water
  const water = useMemo(() => {
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    const waterObj = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        "https://threejs.org/examples/textures/waternormals.jpg",
        function (texture) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
      ),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: scene.fog !== undefined,
    });

    waterObj.rotation.x = -Math.PI / 2;
    waterObj.material.uniforms.size.value = 2;
    waterObj.material.uniforms.distortionScale.value = 3.7;
    return waterObj;
  }, [scene]);

  // Setup Sky
  const sky = useMemo(() => {
    const skyObj = new Sky();
    skyObj.scale.setScalar(10000);
    const skyUniforms = skyObj.material.uniforms;
    skyUniforms["turbidity"].value = 10;
    skyUniforms["rayleigh"].value = 2;
    skyUniforms["mieCoefficient"].value = 0.005;
    skyUniforms["mieDirectionalG"].value = 0.8;
    return skyObj;
  }, []);

  // Setup Sky and environment - ensure sky is added to scene first (like original line 97)
  useEffect(() => {
    // Add sky to scene immediately (like original: scene.add(sky) at line 97)
    if (!scene.children.includes(sky)) {
      scene.add(sky);
    }
  }, [scene, sky]);

  // Setup Sky and environment
  useEffect(() => {
    const parameters = {
      elevation: 1.8,
      azimuth: -120,
    };

    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const sceneEnv = new THREE.Scene();
    const sun = new THREE.Vector3();
    let renderTarget: THREE.WebGLRenderTarget | undefined;

    function updateSun() {
      const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
      const theta = THREE.MathUtils.degToRad(parameters.azimuth);

      sun.setFromSphericalCoords(1, phi, theta);

      if (sky.material && sky.material.uniforms) {
        sky.material.uniforms["sunPosition"].value.copy(sun);
      }

      if (water.material && water.material.uniforms) {
        water.material.uniforms["sunDirection"].value.copy(sun).normalize();
      }

      // Dispose previous renderTarget if it exists (like original line 126)
      if (renderTarget !== undefined) {
        renderTarget.dispose();
      }

      // Add sky to sceneEnv for PMREM generation (like original line 128)
      sceneEnv.add(sky);
      renderTarget = pmremGenerator.fromScene(sceneEnv);
      // Ensure sky is in the main scene for rendering (like original line 130)
      scene.add(sky);
      scene.environment = renderTarget.texture;
    }

    updateSun();

    return () => {
      if (renderTarget !== undefined) {
        renderTarget.dispose();
      }
      pmremGenerator.dispose();
    };
  }, [gl, scene, water, sky]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp")
        setArrowKeys((prev) => ({ ...prev, up: true }));
      if (event.key === "ArrowDown")
        setArrowKeys((prev) => ({ ...prev, down: true }));
      if (event.key === "ArrowLeft")
        setArrowKeys((prev) => ({ ...prev, left: true }));
      if (event.key === "ArrowRight")
        setArrowKeys((prev) => ({ ...prev, right: true }));

      if (event.key === " " || event.key === "Spacebar") {
        setIsSpacebarHeld(true);
      }

      // Only set startTime if key wasn't already being held (prevents reset on key repeat)
      if (
        event.key === "1" ||
        event.key === "2" ||
        event.key === "3" ||
        event.key === "4"
      ) {
        setKeyHoldState((prev) => {
          const key = event.key as "1" | "2" | "3" | "4";
          // Only set startTime if not already holding
          if (!prev[key].isHolding) {
            return {
              ...prev,
              [key]: { isHolding: true, startTime: performance.now() },
            };
          }
          return prev;
        });
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp")
        setArrowKeys((prev) => ({ ...prev, up: false }));
      if (event.key === "ArrowDown")
        setArrowKeys((prev) => ({ ...prev, down: false }));
      if (event.key === "ArrowLeft")
        setArrowKeys((prev) => ({ ...prev, left: false }));
      if (event.key === "ArrowRight")
        setArrowKeys((prev) => ({ ...prev, right: false }));

      if (event.key === " " || event.key === "Spacebar") {
        setIsSpacebarHeld(false);
      }

      if (
        event.key === "1" ||
        event.key === "2" ||
        event.key === "3" ||
        event.key === "4"
      ) {
        const key = event.key as "1" | "2" | "3" | "4";
        setKeyHoldState((prev) => {
          const holdDuration = performance.now() - prev[key].startTime;

          // Update global RGB
          const maxHold = 3000;
          const colorChange = Math.floor((holdDuration / maxHold) * 255);

          setGlobalRGB((currentRGB) => {
            const newRGB = { ...currentRGB };
            if (key === "1") {
              newRGB.r = (currentRGB.r + colorChange) % 256;
            } else if (key === "2") {
              newRGB.g = (currentRGB.g + colorChange) % 256;
            } else if (key === "3") {
              newRGB.b = (currentRGB.b + colorChange) % 256;
            } else if (key === "4") {
              newRGB.a = (currentRGB.a + colorChange) % 256;
            }
            return newRGB;
          });

          return {
            ...prev,
            [key]: { isHolding: false, startTime: 0 },
          };
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Initialize fixed clouds on mount
  useEffect(() => {
    const clouds: Array<{
      id: number;
      position: [number, number, number];
      scale: number;
    }> = [];

    // Create fixed number of clouds at random positions in the sky
    for (let i = 0; i < FIXED_CLOUD_COUNT; i++) {
      clouds.push({
        id: i,
        position: [
          (Math.random() - 0.5) * 1000,
          100 + Math.random() * 100,
          (Math.random() - 0.5) * 1000,
        ],
        scale: 2 + Math.random() * 0.3,
      });
    }

    setSpawnedClouds(clouds);
  }, []);

  // Mouse handlers
  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;

      setIsHolding(true);
      setHoldStartTime(performance.now());
      setMaxRoundnessAchieved(0);

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObject(water);
      if (intersects.length > 0) {
        setHoldStartPosition(intersects[0].point);
      } else {
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectionPoint = new THREE.Vector3();
        const hasIntersection = raycaster.ray.intersectPlane(
          plane,
          intersectionPoint
        );
        setHoldStartPosition(
          hasIntersection ? intersectionPoint : new THREE.Vector3(0, 0, 0)
        );
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button !== 0 || !isHolding) return;

      const holdDuration = performance.now() - holdStartTime;
      setIsHolding(false);

      const minSize = 5;
      const maxSize = 50;
      const maxHold = 3000;
      const normalizedHold = Math.min(holdDuration, maxHold) / maxHold;
      const size = minSize + (maxSize - minSize) * normalizedHold;
      const roundness = maxRoundnessAchieved;

      if (holdStartPosition) {
        spawnCube(holdStartPosition, size, roundness);
      }
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    gl.domElement.addEventListener("mousedown", handleMouseDown);
    gl.domElement.addEventListener("mouseup", handleMouseUp);
    gl.domElement.addEventListener("contextmenu", handleContextMenu);

    return () => {
      gl.domElement.removeEventListener("mousedown", handleMouseDown);
      gl.domElement.removeEventListener("mouseup", handleMouseUp);
      gl.domElement.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [
    camera,
    gl,
    isHolding,
    holdStartTime,
    holdStartPosition,
    maxRoundnessAchieved,
  ]);

  // UI Helpers setup
  useEffect(() => {
    const container = document.getElementById("container");
    if (!container) return;

    const { rgbDisplay: rgbDisplayElement, rgbPills: rgbPillsObject } =
      createRGBDisplay(container);
    rgbDisplay = rgbDisplayElement;
    rgbPills = rgbPillsObject;
    updateRGBDisplay(rgbDisplay, rgbPills, globalRGB, keyHoldState);

    createCreationHelpers(container);
    createCameraHelpers(container);
  }, []);

  // Update RGB display - will be called in useFrame for real-time updates

  const spawnCube = (
    position: THREE.Vector3,
    size: number,
    roundness: number
  ) => {
    // Use BoxGeometry when roundness is 0, RoundedBoxGeometry when roundness > 0
    const geometry =
      roundness > 0
        ? new RoundedBoxGeometry(
            size,
            size,
            size,
            8,
            Math.min(roundness, size / 2)
          )
        : new THREE.BoxGeometry(size, size, size);
    const color = new THREE.Color(
      globalRGB.r / 255,
      globalRGB.g / 255,
      globalRGB.b / 255
    );
    const material = new THREE.MeshStandardMaterial({
      roughness: 0,
      color: color,
      transparent: true,
      opacity: globalRGB.a / 255,
    });

    const cube = new THREE.Mesh(geometry, material);
    cube.position.copy(position);
    cube.position.y = position.y + size / 2;
    cube.userData.spawnTime = performance.now() * 0.001;
    cube.userData.baseY = position.y + size / 2;

    scene.add(cube);
    setSpawnedCubes((prev) => [...prev, cube]);
  };

  // Camera controls with arrow keys
  useFrame((state, delta) => {
    const rotationSpeed = 1.2;
    const target = new THREE.Vector3(0, 10, 0);

    // Update audio volume based on camera distance from starting cube
    if (positionalAudioRef.current) {
      const distance = camera.position.distanceTo(target);
      // Map distance to volume: closer (40) = louder (1.0), farther (1000) = quieter (0.1)
      const minDistance = 40;
      const maxDistance = 1000;
      const normalizedDistance = Math.max(
        0,
        Math.min(1, (distance - minDistance) / (maxDistance - minDistance))
      );
      // Inverse: closer = higher volume
      const volume = 1.0 - normalizedDistance * 0.9; // Range: 1.0 to 0.1
      positionalAudioRef.current.setVolume(
        Math.max(0.2, Math.min(1.0, volume))
      );
    }

    if (arrowKeys.left || arrowKeys.right || arrowKeys.up || arrowKeys.down) {
      const offset = new THREE.Vector3();
      offset.subVectors(camera.position, target);
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(offset);

      if (arrowKeys.left) spherical.theta -= rotationSpeed * delta;
      if (arrowKeys.right) spherical.theta += rotationSpeed * delta;
      if (arrowKeys.up) {
        spherical.phi = Math.max(
          0.1,
          Math.min(Math.PI * 0.495, spherical.phi - rotationSpeed * delta)
        );
      }
      if (arrowKeys.down) {
        spherical.phi = Math.max(
          0.1,
          Math.min(Math.PI * 0.495, spherical.phi + rotationSpeed * delta)
        );
      }

      offset.setFromSpherical(spherical);
      camera.position.copy(target).add(offset);
      camera.lookAt(target);
    }

    // Animate original mesh
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      meshRef.current.position.y = Math.sin(time) * 20 + 5;
      meshRef.current.rotation.x = time * 0.5;
      meshRef.current.rotation.z = time * 0.51;
    }

    // Animate spawned cubes
    spawnedCubes.forEach((cube) => {
      const time = state.clock.elapsedTime;
      const cubeTime = time - cube.userData.spawnTime;
      cube.position.y = cube.userData.baseY + Math.sin(cubeTime) * 20;
      cube.rotation.x = cubeTime * 0.5;
      cube.rotation.z = cubeTime * 0.51;
    });

    // Update water
    if (water.material && water.material.uniforms) {
      water.material.uniforms["time"].value += 1.0 / 60.0;
    }

    // Update RGB display in real-time (every frame)
    if (rgbDisplay) {
      updateRGBDisplay(rgbDisplay, rgbPills, globalRGB, keyHoldState);
    }

    // Update preview object
    if (isHolding && holdStartPosition) {
      const holdDuration = performance.now() - holdStartTime;

      const minSize = 5;
      const maxSize = 50;
      const maxHold = 3000;
      const normalizedHold = Math.min(holdDuration, maxHold) / maxHold;
      const currentSize = minSize + (maxSize - minSize) * normalizedHold;

      let currentRoundness = 0;
      if (isSpacebarHeld) {
        const maxRoundnessHold = 3000;
        const normalizedRoundness =
          Math.min(holdDuration, maxRoundnessHold) / maxRoundnessHold;
        currentRoundness = (currentSize / 2) * normalizedRoundness;
        setMaxRoundnessAchieved((prev) => Math.max(prev, currentRoundness));
      } else {
        currentRoundness = maxRoundnessAchieved;
      }

      if (!previewRef.current) {
        // Start preview at minimum size (same as cube spawn)
        const minSize = 5;
        const geometry = new THREE.BoxGeometry(minSize, minSize, minSize);
        const color = new THREE.Color(
          globalRGB.r / 255,
          globalRGB.g / 255,
          globalRGB.b / 255
        );
        const material = new THREE.MeshStandardMaterial({
          roughness: 0,
          color: color,
          transparent: true,
          opacity: (globalRGB.a / 255) * 0.5,
        });

        const preview = new THREE.Mesh(geometry, material);
        // Position preview exactly like cubes are spawned
        preview.position.copy(holdStartPosition);
        preview.position.y = holdStartPosition.y + minSize / 2;
        preview.userData.isPreview = true;
        scene.add(preview);
        previewRef.current = preview;
      }

      // Update preview
      if (previewRef.current) {
        previewRef.current.geometry.dispose();

        // Use BoxGeometry when roundness is 0, RoundedBoxGeometry when roundness > 0
        previewRef.current.geometry =
          currentRoundness > 0
            ? new RoundedBoxGeometry(
                currentSize,
                currentSize,
                currentSize,
                8,
                Math.min(currentRoundness, currentSize / 2)
              )
            : new THREE.BoxGeometry(currentSize, currentSize, currentSize);

        if (holdStartPosition) {
          previewRef.current.position.copy(holdStartPosition);
          previewRef.current.position.y = holdStartPosition.y + currentSize / 2;
        }

        const color = new THREE.Color(
          globalRGB.r / 255,
          globalRGB.g / 255,
          globalRGB.b / 255
        );
        (previewRef.current.material as THREE.MeshStandardMaterial).color.copy(
          color
        );
        (previewRef.current.material as THREE.MeshStandardMaterial).opacity =
          (globalRGB.a / 255) * 0.5;
      }
    } else if (!isHolding && previewRef.current) {
      scene.remove(previewRef.current);
      previewRef.current.geometry.dispose();
      (previewRef.current.material as THREE.MeshStandardMaterial).dispose();
      previewRef.current = null;
    }
  });

  // Original mesh geometry - no rounded edges
  const meshGeometry = useMemo(() => new THREE.BoxGeometry(30, 30, 30), []);

  return (
    <>
      {/* Water */}
      <primitive object={water} />

      {/* Sky - added manually in useEffect to match original implementation */}

      {/* Original mesh */}
      <mesh ref={meshRef} geometry={meshGeometry}>
        <meshStandardMaterial roughness={0} />
      </mesh>

      {/* Spawned cubes */}
      {spawnedCubes.map((cube, index) => (
        <primitive key={`cube-${index}`} object={cube} />
      ))}

      {/* Spawned clouds */}
      {spawnedClouds.map((cloud) => (
        <Clouds
          key={cloud.id}
          material={THREE.MeshBasicMaterial}
          scale={cloud.scale}
          position={cloud.position}
        >
          <Cloud segments={20} bounds={[5, 3, 2]} volume={6} color="#fff" />
        </Clouds>
      ))}

      {/* Preview object */}
      {previewRef.current && <primitive object={previewRef.current} />}

      {/* OrbitControls */}
      <OrbitControls
        ref={controlsRef}
        enableRotate={false}
        enablePan={false}
        mouseButtons={{
          LEFT: undefined,
          MIDDLE: undefined,
        }}
        maxPolarAngle={Math.PI * 0.495}
        target={[0, 10, 0]}
        minDistance={40.0}
        maxDistance={1000.0}
      />
    </>
  );
}
