import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Volume2, VolumeX, Play, Pause, RotateCcw, Compass, Disc, Sparkles, Monitor, Keyboard, Mouse, LayoutGrid } from 'lucide-react';
import { soundEngine } from '../lib/sound';

interface VirtualRetroComputerProps {
  interactive?: boolean;
}

const RETRO_CODE_SNIPPETS = [
  '10 REM *** KEY MASTER RETRO WORKSTATION V3.0 ***',
  '20 PRINT "CRT MONITOR / KEYBOARD / MOUSE READY"',
  '30 PRINT "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG."',
  'SYSTEM CHECK: 640KB BASE RAM OK / FLOPPY 0: OK',
  'SPEED: 114 WPM / ACCURACY: 99.7% / ALL KEYS MAPPED',
  'HOME ROW ANCHOR: ASDF JKL; READY FOR TEST',
  'C:\\KEYMASTER> RUN "TOUCH_TYPING_MASTER.BAS"'
];

interface KeycapData {
  mesh: THREE.Mesh;
  label: string;
  restingY: number;
  restingZ: number;
  currentY: number;
  currentZ: number;
  material: THREE.MeshStandardMaterial;
  activeMaterial: THREE.MeshStandardMaterial;
}

// Synthesize tactile vintage mechanical mouse click
function playMouseClickSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.028);

    gain.gain.setValueAtTime(0.28, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.028);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.028);
  } catch {
    // Audio fallback if muted or blocked
  }
}

export const VirtualRetroComputer: React.FC<VirtualRetroComputerProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Terminal UI State
  const [crtColor, setCrtColor] = useState<'amber' | 'green' | 'cyan'>('amber');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isAutoOrbit, setIsAutoOrbit] = useState(false);
  const [viewMode, setViewMode] = useState<'desk' | 'screen' | 'keyboard'>('desk');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [typedChars, setTypedChars] = useState('');
  const [activeKey, setActiveKey] = useState<string>('READY');
  const [diskAccess, setDiskAccess] = useState(false);
  const [speedWpm, setSpeedWpm] = useState(92);
  const [mouseClicked, setMouseClicked] = useState(false);

  // Mutable reference for high-frequency animation loop
  const stateRef = useRef({
    crtColor,
    soundEnabled,
    isPlaying,
    isAutoOrbit,
    viewMode,
    typedChars,
    activeKey,
    diskAccess,
    speedWpm,
    mouseClicked,
    textSnippet: RETRO_CODE_SNIPPETS[0],
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    // Orbit camera spherical angles
    rotY: 0.12,
    rotX: 0.36,
    targetRotY: 0.12,
    targetRotX: 0.36,
    distance: 6.2,
    targetDist: 6.2,
    // LookAt coordinates
    targetLookAtX: -0.15,
    targetLookAtY: 1.15,
    targetLookAtZ: 0.15
  });

  useEffect(() => {
    stateRef.current.crtColor = crtColor;
    stateRef.current.soundEnabled = soundEnabled;
    stateRef.current.isPlaying = isPlaying;
    stateRef.current.isAutoOrbit = isAutoOrbit;
    stateRef.current.viewMode = viewMode;
    stateRef.current.typedChars = typedChars;
    stateRef.current.activeKey = activeKey;
    stateRef.current.diskAccess = diskAccess;
    stateRef.current.speedWpm = speedWpm;
    stateRef.current.mouseClicked = mouseClicked;
    stateRef.current.textSnippet = RETRO_CODE_SNIPPETS[currentTextIndex];
  }, [crtColor, soundEnabled, isPlaying, isAutoOrbit, viewMode, typedChars, activeKey, diskAccess, speedWpm, mouseClicked, currentTextIndex]);

  const keycapsRef = useRef<Map<string, KeycapData>>(new Map());
  const mouseButtonRef = useRef<THREE.Mesh | null>(null);
  const crtTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const screenPointLightRef = useRef<THREE.PointLight | null>(null);
  const diskLedRef = useRef<THREE.Mesh | null>(null);

  // Switch camera view presets smoothly
  const handleViewChange = (mode: 'desk' | 'screen' | 'keyboard') => {
    setViewMode(mode);
    setIsAutoOrbit(false);
    if (mode === 'desk') {
      stateRef.current.targetLookAtX = -0.15;
      stateRef.current.targetLookAtY = 1.15;
      stateRef.current.targetLookAtZ = 0.15;
      stateRef.current.targetRotY = 0.12;
      stateRef.current.targetRotX = 0.36;
      stateRef.current.targetDist = 6.2;
    } else if (mode === 'screen') {
      // Normal display straight-on screen focus
      stateRef.current.targetLookAtX = -0.35;
      stateRef.current.targetLookAtY = 1.95;
      stateRef.current.targetLookAtZ = 0.56;
      stateRef.current.targetRotY = 0.0;
      stateRef.current.targetRotX = 0.0;
      stateRef.current.targetDist = 3.6;
    } else if (mode === 'keyboard') {
      // Close-up mechanical keyboard view
      stateRef.current.targetLookAtX = -0.35;
      stateRef.current.targetLookAtY = 0.30;
      stateRef.current.targetLookAtZ = 1.15;
      stateRef.current.targetRotY = 0.0;
      stateRef.current.targetRotX = 0.68;
      stateRef.current.targetDist = 3.3;
    }
  };

  // Trigger 3D key actuation
  const triggerKeyAction = useCallback((keyChar: string) => {
    const upper = keyChar.toUpperCase();
    setActiveKey(upper);
    setDiskAccess(true);
    setTimeout(() => setDiskAccess(false), 120);

    if (soundEnabled) {
      soundEngine.playKeyPress(keyChar);
    }

    // Depress 3D keycap in scene
    const keyData = keycapsRef.current.get(upper) || keycapsRef.current.get(keyChar === ' ' ? 'SPACE' : upper);
    if (keyData) {
      keyData.currentY = keyData.restingY - 0.07;
      keyData.mesh.material = keyData.activeMaterial;
    }
  }, [soundEnabled]);

  // Trigger 3D mouse click
  const triggerMouseAction = useCallback(() => {
    setMouseClicked(true);
    setActiveKey('MOUSE 1');
    setDiskAccess(true);
    setTimeout(() => setDiskAccess(false), 160);
    setTimeout(() => setMouseClicked(false), 140);

    if (soundEnabled) {
      playMouseClickSound();
    }

    if (mouseButtonRef.current) {
      mouseButtonRef.current.position.y = 0.23; // Depress button
    }
  }, [soundEnabled]);

  // Typing animation driver
  useEffect(() => {
    if (!isPlaying) return;

    const currentTarget = RETRO_CODE_SNIPPETS[currentTextIndex];
    let charIdx = typedChars.length;

    const interval = setInterval(() => {
      if (charIdx < currentTarget.length) {
        const nextChar = currentTarget[charIdx];
        setTypedChars(prev => prev + nextChar);
        triggerKeyAction(nextChar);
        charIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setTypedChars('');
          setCurrentTextIndex(prev => (prev + 1) % RETRO_CODE_SNIPPETS.length);
          setSpeedWpm(Math.floor(82 + Math.random() * 38));
        }, 1800);
      }
    }, 85);

    return () => clearInterval(interval);
  }, [isPlaying, typedChars, currentTextIndex, triggerKeyAction]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === ' ' || (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey)) {
        triggerKeyAction(e.key);
        setTypedChars(prev => (prev.length > 55 ? prev.slice(-35) : prev) + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerKeyAction]);

  // Reset 3D camera angle
  const handleResetAngle = () => {
    handleViewChange('desk');
  };

  // Main Three.js Scene Setup & Animation Loop
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationFrameId: number;

    // 1. Scene & Centered LookAt Target
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x161311); // Rich dark vintage ambiance

    // Dynamic look-at target vector
    const targetPoint = new THREE.Vector3(
      stateRef.current.targetLookAtX,
      stateRef.current.targetLookAtY,
      stateRef.current.targetLookAtZ
    );

    const initialWidth = container.clientWidth || 900;
    const initialHeight = container.clientHeight || 520;

    const camera = new THREE.PerspectiveCamera(40, initialWidth / initialHeight, 0.1, 100);

    // Initial camera positioning focused on target
    const initDist = stateRef.current.distance;
    camera.position.set(
      targetPoint.x + initDist * Math.sin(0.12) * Math.cos(0.36),
      targetPoint.y + initDist * Math.sin(0.36),
      targetPoint.z + initDist * Math.cos(0.12) * Math.cos(0.36)
    );
    camera.lookAt(targetPoint);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // 3. Lighting Architecture
    const ambientLight = new THREE.AmbientLight(0xFFF8EE, 0.95);
    scene.add(ambientLight);

    // Key Directional Light (Overhead front right)
    const dirLight = new THREE.DirectionalLight(0xFFFAF0, 2.4);
    dirLight.position.set(4.5, 7.5, 5.0);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.bias = -0.0008;
    scene.add(dirLight);

    // Soft Ambient Fill (Left side)
    const softFill = new THREE.DirectionalLight(0xD8C8B5, 0.85);
    softFill.position.set(-6, 4, 3);
    scene.add(softFill);

    // No specular-glare point light in front of the screen
    screenPointLightRef.current = null;

    // 4. Root Workstation Group
    const rootGroup = new THREE.Group();
    rootGroup.position.set(0, 0, 0);
    scene.add(rootGroup);

    // 5. Materials Palette
    const beigePlasticMat = new THREE.MeshStandardMaterial({
      color: 0xD8D0C2, // Vintage Apple/IBM beige
      roughness: 0.52,
      metalness: 0.04
    });

    const darkBezelMat = new THREE.MeshStandardMaterial({
      color: 0x24201D,
      roughness: 0.72,
      metalness: 0.12
    });

    const accentTerracottaMat = new THREE.MeshStandardMaterial({
      color: 0xDA6A45,
      roughness: 0.38,
      metalness: 0.06
    });

    const walnutDeskMat = new THREE.MeshStandardMaterial({
      color: 0x2A201A,
      roughness: 0.78,
      metalness: 0.08
    });

    const mousepadMat = new THREE.MeshStandardMaterial({
      color: 0x1A1F26,
      roughness: 0.88,
      metalness: 0.02
    });

    // 6. Desk Surface
    const deskGeo = new THREE.PlaneGeometry(22, 18);
    const deskMesh = new THREE.Mesh(deskGeo, walnutDeskMat);
    deskMesh.rotation.x = -Math.PI / 2;
    deskMesh.position.y = -0.01;
    deskMesh.receiveShadow = true;
    rootGroup.add(deskMesh);

    // ----------------------------------------------------
    // 7. RETRO COMPUTER & NORMAL CRT DISPLAY (Center-Back)
    // ----------------------------------------------------
    const computerGroup = new THREE.Group();
    computerGroup.position.set(-0.35, 0, -0.85);
    rootGroup.add(computerGroup);

    // Computer Stand Pedestal Base
    const standGeo = new THREE.BoxGeometry(2.8, 0.28, 2.3);
    const standMesh = new THREE.Mesh(standGeo, beigePlasticMat);
    standMesh.position.set(0, 0.14, 0);
    standMesh.castShadow = true;
    standMesh.receiveShadow = true;
    computerGroup.add(standMesh);

    // Swivel Joint Collar
    const swivelGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.25, 24);
    const swivelMesh = new THREE.Mesh(swivelGeo, darkBezelMat);
    swivelMesh.position.set(0, 0.4, 0);
    computerGroup.add(swivelMesh);

    // Main CRT Monitor Housing (Beige vintage casing)
    const monitorBoxGeo = new THREE.BoxGeometry(3.6, 2.8, 2.8);
    const monitorBoxMesh = new THREE.Mesh(monitorBoxGeo, beigePlasticMat);
    monitorBoxMesh.position.set(0, 1.85, 0);
    monitorBoxMesh.castShadow = true;
    monitorBoxMesh.receiveShadow = true;
    computerGroup.add(monitorBoxMesh);

    // Ventilation Louvers on top
    for (let i = 0; i < 4; i++) {
      const louverGeo = new THREE.BoxGeometry(2.3, 0.03, 0.14);
      const louverMesh = new THREE.Mesh(louverGeo, darkBezelMat);
      louverMesh.position.set(0, 3.26, -0.55 + i * 0.35);
      computerGroup.add(louverMesh);
    }

    // ----------------------------------------------------
    // FRONT BEZEL FRAME AROUND SCREEN (Outer rectangular frame)
    // ----------------------------------------------------
    // 1. Top Bezel Bar
    const topBezelGeo = new THREE.BoxGeometry(3.4, 0.26, 0.14);
    const topBezelMesh = new THREE.Mesh(topBezelGeo, beigePlasticMat);
    topBezelMesh.position.set(0, 3.12, 1.42);
    topBezelMesh.castShadow = true;
    computerGroup.add(topBezelMesh);

    // 2. Bottom Chin Panel (houses floppy drive slot, eject button, drive LED, badge)
    const bottomChinGeo = new THREE.BoxGeometry(3.4, 0.54, 0.14);
    const bottomChinMesh = new THREE.Mesh(bottomChinGeo, beigePlasticMat);
    bottomChinMesh.position.set(0, 0.64, 1.42);
    bottomChinMesh.castShadow = true;
    computerGroup.add(bottomChinMesh);

    // 3. Left Bezel Pillar
    const leftBezelGeo = new THREE.BoxGeometry(0.30, 2.12, 0.14);
    const leftBezelMesh = new THREE.Mesh(leftBezelGeo, beigePlasticMat);
    leftBezelMesh.position.set(-1.55, 1.95, 1.42);
    leftBezelMesh.castShadow = true;
    computerGroup.add(leftBezelMesh);

    // 4. Right Bezel Pillar
    const rightBezelGeo = new THREE.BoxGeometry(0.30, 2.12, 0.14);
    const rightBezelMesh = new THREE.Mesh(rightBezelGeo, beigePlasticMat);
    rightBezelMesh.position.set(1.55, 1.95, 1.42);
    rightBezelMesh.castShadow = true;
    computerGroup.add(rightBezelMesh);

    // Dark Inset Trim around the glass screen (subtle bevel frame)
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x1E1B18, roughness: 0.8 });
    const trimTop = new THREE.Mesh(new THREE.BoxGeometry(2.84, 0.04, 0.06), trimMat);
    trimTop.position.set(0, 3.01, 1.44);
    computerGroup.add(trimTop);

    const trimBottom = new THREE.Mesh(new THREE.BoxGeometry(2.84, 0.04, 0.06), trimMat);
    trimBottom.position.set(0, 0.89, 1.44);
    computerGroup.add(trimBottom);

    const trimLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.12, 0.06), trimMat);
    trimLeft.position.set(-1.41, 1.95, 1.44);
    computerGroup.add(trimLeft);

    const trimRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.12, 0.06), trimMat);
    trimRight.position.set(1.41, 1.95, 1.44);
    computerGroup.add(trimRight);

    // ----------------------------------------------------
    // DYNAMIC NORMAL RECTANGULAR CRT SCREEN (Zero circular clipping)
    // ----------------------------------------------------
    const crtCanvas = document.createElement('canvas');
    crtCanvas.width = 1024;
    crtCanvas.height = 768;
    const crtCtx = crtCanvas.getContext('2d')!;

    const crtTexture = new THREE.CanvasTexture(crtCanvas);
    crtTexture.colorSpace = THREE.SRGBColorSpace;
    crtTextureRef.current = crtTexture;

    // Completely normal flat rectangular display plane (Zero circular clipping, zero distortion, zero specular glare)
    const screenGeo = new THREE.PlaneGeometry(2.8, 2.1);
    const screenMat = new THREE.MeshBasicMaterial({
      map: crtTexture,
      toneMapped: false,
    });

    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 1.95, 1.41);
    computerGroup.add(screenMesh);

    // Floppy Disk Drive Slot
    const floppySlotGeo = new THREE.BoxGeometry(0.95, 0.08, 0.06);
    const floppySlotMesh = new THREE.Mesh(floppySlotGeo, darkBezelMat);
    floppySlotMesh.position.set(0.75, 0.65, 1.49);
    computerGroup.add(floppySlotMesh);

    // Floppy Drive Eject Button
    const ejectBtnGeo = new THREE.BoxGeometry(0.16, 0.08, 0.06);
    const ejectBtnMesh = new THREE.Mesh(ejectBtnGeo, beigePlasticMat);
    ejectBtnMesh.position.set(1.35, 0.65, 1.49);
    computerGroup.add(ejectBtnMesh);

    // Floppy Drive Activity LED (Red when accessing)
    const diskLedGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const diskLedMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const diskLedMesh = new THREE.Mesh(diskLedGeo, diskLedMat);
    diskLedMesh.position.set(0.20, 0.65, 1.50);
    computerGroup.add(diskLedMesh);
    diskLedRef.current = diskLedMesh;

    // Vintage Brand Nameplate: "KEY MASTER 800"
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 64;
    const badgeCtx = badgeCanvas.getContext('2d')!;
    badgeCtx.fillStyle = '#C85A37';
    badgeCtx.fillRect(0, 0, 256, 64);
    badgeCtx.fillStyle = '#FFFFFF';
    badgeCtx.font = 'bold 22px monospace';
    badgeCtx.textAlign = 'center';
    badgeCtx.textBaseline = 'middle';
    badgeCtx.fillText('KEY MASTER', 128, 32);
    const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
    const badgeMat = new THREE.MeshStandardMaterial({
      map: badgeTexture,
      roughness: 0.45,
      metalness: 0.05
    });
    const badgeGeo = new THREE.BoxGeometry(0.95, 0.18, 0.04);
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.position.set(-0.95, 0.65, 1.49);
    computerGroup.add(badgeMesh);

    // Vintage Power Rocker Switch Accent
    const pwrGeo = new THREE.BoxGeometry(0.12, 0.16, 0.04);
    const pwrMesh = new THREE.Mesh(pwrGeo, accentTerracottaMat);
    pwrMesh.position.set(1.58, 0.65, 1.49);
    computerGroup.add(pwrMesh);

    // ----------------------------------------------------
    // 8. FULL VINTAGE MECHANICAL KEYBOARD (Center-Front)
    // ----------------------------------------------------
    const keyboardGroup = new THREE.Group();
    keyboardGroup.position.set(-0.35, 0, 1.15);
    rootGroup.add(keyboardGroup);

    // Keyboard Chassis Wedge (Inclined ~8 degrees)
    const kbChassisGeo = new THREE.BoxGeometry(4.0, 0.32, 1.75);
    const kbChassisMesh = new THREE.Mesh(kbChassisGeo, beigePlasticMat);
    kbChassisMesh.rotation.x = -0.14;
    kbChassisMesh.position.set(0, 0.16, 0);
    kbChassisMesh.castShadow = true;
    kbChassisMesh.receiveShadow = true;
    keyboardGroup.add(kbChassisMesh);

    // Recessed Steel Key Mounting Plate
    const plateGeo = new THREE.BoxGeometry(3.75, 0.04, 1.5);
    const plateMesh = new THREE.Mesh(plateGeo, darkBezelMat);
    plateMesh.rotation.x = -0.14;
    plateMesh.position.set(0, 0.28, -0.01);
    keyboardGroup.add(plateMesh);

    // Coiled Keyboard Cable routing from keyboard back into computer
    const kbCableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.35, 0.22, 0.4),
      new THREE.Vector3(-0.1, 0.12, -0.1),
      new THREE.Vector3(-0.4, 0.12, -0.4),
      new THREE.Vector3(-0.35, 0.2, -0.7)
    ]);
    const kbCableGeo = new THREE.TubeGeometry(kbCableCurve, 28, 0.038, 8, false);
    const kbCableMat = new THREE.MeshStandardMaterial({ color: 0x2A2521, roughness: 0.7 });
    const kbCableMesh = new THREE.Mesh(kbCableGeo, kbCableMat);
    rootGroup.add(kbCableMesh);

    // Procedural keycap textures
    const createKeyTexture = (label: string, isAccent = false, isMod = false) => {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d')!;

      ctx.fillStyle = isAccent ? '#DA6A45' : isMod ? '#C8BFAF' : '#ECE4D6';
      ctx.fillRect(0, 0, 128, 128);

      // Beveled key border
      ctx.strokeStyle = isAccent ? '#B8502E' : '#DFD6C6';
      ctx.lineWidth = 8;
      ctx.strokeRect(6, 6, 116, 116);

      // Typography
      ctx.fillStyle = isAccent ? '#FFFFFF' : '#2A2420';
      ctx.font = 'bold 44px monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 64, 64);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    // Keyboard Keycap Rows
    const keyboardRows = [
      { keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='], zOffset: -0.58 },
      { keys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']'], zOffset: -0.28 },
      { keys: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'"], zOffset: 0.02 },
      { keys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'], zOffset: 0.32 }
    ];

    const keycapsMap = new Map<string, KeycapData>();
    const interactiveMeshes: THREE.Mesh[] = [];

    // Construct each keycap
    keyboardRows.forEach((row) => {
      const count = row.keys.length;
      const spacingX = 0.29;
      const startX = -((count - 1) * spacingX) / 2;

      row.keys.forEach((key, idx) => {
        const xPos = startX + idx * spacingX;
        const zPos = row.zOffset;

        const keyGeo = new THREE.BoxGeometry(0.25, 0.16, 0.25);
        const normTex = createKeyTexture(key);
        const actTex = createKeyTexture(key, true);

        const normalMat = new THREE.MeshStandardMaterial({
          map: normTex,
          roughness: 0.45,
          metalness: 0.05
        });

        const activeMat = new THREE.MeshStandardMaterial({
          map: actTex,
          color: 0xDA6A45,
          roughness: 0.35,
          metalness: 0.05
        });

        const keyMesh = new THREE.Mesh(keyGeo, normalMat);
        keyMesh.rotation.x = -0.14;

        const restingY = 0.3 - zPos * Math.sin(-0.14);
        const restingZ = zPos * Math.cos(-0.14);

        keyMesh.position.set(xPos, restingY, restingZ);
        keyMesh.castShadow = true;
        keyMesh.userData = { type: 'key', label: key };

        keyboardGroup.add(keyMesh);
        interactiveMeshes.push(keyMesh);

        keycapsMap.set(key, {
          mesh: keyMesh,
          label: key,
          restingY,
          restingZ,
          currentY: restingY,
          currentZ: restingZ,
          material: normalMat,
          activeMaterial: activeMat
        });
      });
    });

    // Spacebar & Accent Return Keys
    const spaceZ = 0.6;
    const spaceRestingY = 0.3 - spaceZ * Math.sin(-0.14);
    const spaceRestingZ = spaceZ * Math.cos(-0.14);

    const spaceGeo = new THREE.BoxGeometry(1.65, 0.16, 0.25);
    const spaceNormTex = createKeyTexture('SPACE', false, true);
    const spaceActTex = createKeyTexture('SPACE', true);

    const spaceNormalMat = new THREE.MeshStandardMaterial({ map: spaceNormTex, roughness: 0.5 });
    const spaceActiveMat = new THREE.MeshStandardMaterial({ map: spaceActTex, color: 0xDA6A45 });

    const spaceMesh = new THREE.Mesh(spaceGeo, spaceNormalMat);
    spaceMesh.rotation.x = -0.14;
    spaceMesh.position.set(0, spaceRestingY, spaceRestingZ);
    spaceMesh.castShadow = true;
    spaceMesh.userData = { type: 'key', label: 'SPACE' };
    keyboardGroup.add(spaceMesh);
    interactiveMeshes.push(spaceMesh);

    keycapsMap.set('SPACE', {
      mesh: spaceMesh,
      label: 'SPACE',
      restingY: spaceRestingY,
      restingZ: spaceRestingZ,
      currentY: spaceRestingY,
      currentZ: spaceRestingZ,
      material: spaceNormalMat,
      activeMaterial: spaceActiveMat
    });

    // Terracotta Enter Key
    const enterGeo = new THREE.BoxGeometry(0.48, 0.16, 0.25);
    const enterTex = createKeyTexture('ENTER', true);
    const enterMat = new THREE.MeshStandardMaterial({ map: enterTex, color: 0xDA6A45 });
    const enterMesh = new THREE.Mesh(enterGeo, enterMat);
    enterMesh.rotation.x = -0.14;
    enterMesh.position.set(1.48, spaceRestingY, spaceRestingZ);
    enterMesh.castShadow = true;
    enterMesh.userData = { type: 'key', label: 'ENTER' };
    keyboardGroup.add(enterMesh);
    interactiveMeshes.push(enterMesh);

    keycapsMap.set('ENTER', {
      mesh: enterMesh,
      label: 'ENTER',
      restingY: spaceRestingY,
      restingZ: spaceRestingZ,
      currentY: spaceRestingY,
      currentZ: spaceRestingZ,
      material: enterMat,
      activeMaterial: enterMat
    });

    keycapsRef.current = keycapsMap;

    // ----------------------------------------------------
    // 9. VINTAGE RETRO MOUSE & MOUSEPAD (Right-Side of Desk)
    // ----------------------------------------------------
    const mousepadGroup = new THREE.Group();
    mousepadGroup.position.set(2.1, 0, 1.15);
    rootGroup.add(mousepadGroup);

    // Mousepad Base
    const padGeo = new THREE.BoxGeometry(1.35, 0.024, 1.65);
    const padMesh = new THREE.Mesh(padGeo, mousepadMat);
    padMesh.position.set(0, 0.012, 0);
    padMesh.receiveShadow = true;
    mousepadGroup.add(padMesh);

    // Mousepad Border Line Accent
    const padBorderGeo = new THREE.BoxGeometry(1.31, 0.026, 1.61);
    const padBorderMat = new THREE.MeshStandardMaterial({ color: 0xDA6A45, roughness: 0.5 });
    const padBorderMesh = new THREE.Mesh(padBorderGeo, padBorderMat);
    padBorderMesh.position.set(0, 0.011, 0);
    mousepadGroup.add(padBorderMesh);

    // Vintage Mouse Assembly
    const mouseGroup = new THREE.Group();
    mouseGroup.position.set(0, 0, 0);
    mousepadGroup.add(mouseGroup);

    // Vintage Mouse Main Body
    const mouseBodyGeo = new THREE.BoxGeometry(0.58, 0.24, 0.94);
    const mouseBodyMat = new THREE.MeshStandardMaterial({
      color: 0xD8CFBE,
      roughness: 0.46,
      metalness: 0.04
    });
    const mouseBodyMesh = new THREE.Mesh(mouseBodyGeo, mouseBodyMat);
    mouseBodyMesh.position.set(0, 0.14, 0.02);
    mouseBodyMesh.castShadow = true;
    mouseBodyMesh.receiveShadow = true;
    mouseGroup.add(mouseBodyMesh);

    // Vintage Click Button on Front of Mouse
    const mouseBtnGeo = new THREE.BoxGeometry(0.52, 0.05, 0.4);
    const mouseBtnMat = new THREE.MeshStandardMaterial({
      color: 0xC8BFAF,
      roughness: 0.42,
      metalness: 0.04
    });
    const mouseBtnMesh = new THREE.Mesh(mouseBtnGeo, mouseBtnMat);
    mouseBtnMesh.position.set(0, 0.27, -0.22);
    mouseBtnMesh.castShadow = true;
    mouseBtnMesh.userData = { type: 'mouse' };
    mouseGroup.add(mouseBtnMesh);
    mouseButtonRef.current = mouseBtnMesh;
    interactiveMeshes.push(mouseBtnMesh);

    // Center divider line between Left/Right buttons
    const btnDividerGeo = new THREE.BoxGeometry(0.02, 0.06, 0.41);
    const btnDividerMesh = new THREE.Mesh(btnDividerGeo, darkBezelMat);
    btnDividerMesh.position.set(0, 0.27, -0.22);
    mouseGroup.add(btnDividerMesh);

    // Mouse Cable
    const mouseCableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(2.1, 0.12, 0.65),
      new THREE.Vector3(2.4, 0.08, 0.1),
      new THREE.Vector3(1.8, 0.08, -0.4),
      new THREE.Vector3(0.8, 0.12, -0.85)
    ]);
    const mouseCableGeo = new THREE.TubeGeometry(mouseCableCurve, 32, 0.028, 8, false);
    const mouseCableMat = new THREE.MeshStandardMaterial({ color: 0x2A2521, roughness: 0.7 });
    const mouseCableMesh = new THREE.Mesh(mouseCableGeo, mouseCableMat);
    rootGroup.add(mouseCableMesh);

    // ----------------------------------------------------
    // 10. INTERACTION RAYCASTER & POINTER HANDLERS
    // ----------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const mouseCoords = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      stateRef.current.isDragging = true;
      stateRef.current.prevMouseX = event.clientX;
      stateRef.current.prevMouseY = event.clientY;

      const rect = canvas.getBoundingClientRect();
      mouseCoords.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoords.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseCoords, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData.type === 'key') {
          const keyLabel = hit.userData.label;
          triggerKeyAction(keyLabel === 'SPACE' ? ' ' : keyLabel);
          setTypedChars(prev => (prev.length > 55 ? prev.slice(-35) : prev) + (keyLabel === 'SPACE' ? ' ' : keyLabel));
        } else if (hit.userData.type === 'mouse') {
          triggerMouseAction();
        }
      }
    };

    const handlePointerMove = (event: MouseEvent) => {
      if (!stateRef.current.isDragging) return;
      const deltaX = event.clientX - stateRef.current.prevMouseX;
      const deltaY = event.clientY - stateRef.current.prevMouseY;

      stateRef.current.prevMouseX = event.clientX;
      stateRef.current.prevMouseY = event.clientY;

      // Orbit angles with ergonomic clamping
      stateRef.current.targetRotY += deltaX * 0.007;
      stateRef.current.targetRotX = Math.max(
        0.02,
        Math.min(0.72, stateRef.current.targetRotX + deltaY * 0.005)
      );
    };

    const handlePointerUp = () => {
      stateRef.current.isDragging = false;
    };

    // Smooth mouse wheel zoom
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      stateRef.current.targetDist = Math.max(
        2.8,
        Math.min(8.5, stateRef.current.targetDist + event.deltaY * 0.004)
      );
    };

    // Touch handlers for mobile/tablet orbit
    let touchStartX = 0;
    let touchStartY = 0;
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
      }
    };
    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        const deltaX = event.touches[0].clientX - touchStartX;
        const deltaY = event.touches[0].clientY - touchStartY;
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        stateRef.current.targetRotY += deltaX * 0.008;
        stateRef.current.targetRotX = Math.max(
          0.02,
          Math.min(0.72, stateRef.current.targetRotX + deltaY * 0.006)
        );
      }
    };

    canvas.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    // ----------------------------------------------------
    // 11. RENDER & ANIMATION LOOP
    // ----------------------------------------------------
    const clock = new THREE.Clock();
    let blinkTimer = 0;
    let cursorVisible = true;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      blinkTimer += delta;
      if (blinkTimer > 0.45) {
        cursorVisible = !cursorVisible;
        blinkTimer = 0;
      }

      // Smooth camera orbit
      if (stateRef.current.isAutoOrbit) {
        stateRef.current.targetRotY += delta * 0.22;
      }

      stateRef.current.rotY += (stateRef.current.targetRotY - stateRef.current.rotY) * 0.08;
      stateRef.current.rotX += (stateRef.current.targetRotX - stateRef.current.rotX) * 0.08;
      stateRef.current.distance += (stateRef.current.targetDist - stateRef.current.distance) * 0.08;

      // Smooth look-at target transition
      targetPoint.x += (stateRef.current.targetLookAtX - targetPoint.x) * 0.08;
      targetPoint.y += (stateRef.current.targetLookAtY - targetPoint.y) * 0.08;
      targetPoint.z += (stateRef.current.targetLookAtZ - targetPoint.z) * 0.08;

      // Calculate camera position on orbit sphere around targetPoint
      const curDist = stateRef.current.distance;
      camera.position.x = targetPoint.x + curDist * Math.sin(stateRef.current.rotY) * Math.cos(stateRef.current.rotX);
      camera.position.y = targetPoint.y + curDist * Math.sin(stateRef.current.rotX);
      camera.position.z = targetPoint.z + curDist * Math.cos(stateRef.current.rotY) * Math.cos(stateRef.current.rotX);
      camera.lookAt(targetPoint);

      // Subtle vintage hover float
      computerGroup.position.y = Math.sin(elapsed * 1.6) * 0.015;

      // Animate depressed 3D keys springing back up
      keycapsRef.current.forEach((data) => {
        if (data.mesh.position.y < data.restingY) {
          data.mesh.position.y += (data.restingY - data.mesh.position.y) * 0.24;
          if (Math.abs(data.restingY - data.mesh.position.y) < 0.005) {
            data.mesh.position.y = data.restingY;
            data.mesh.material = data.material;
          }
        }
      });

      // Animate mouse button springing back up
      if (mouseButtonRef.current && mouseButtonRef.current.position.y < 0.27) {
        mouseButtonRef.current.position.y += (0.27 - mouseButtonRef.current.position.y) * 0.25;
      }

      // Update disk access LED color
      if (diskLedRef.current) {
        const isAccessing = stateRef.current.diskAccess;
        (diskLedRef.current.material as THREE.MeshBasicMaterial).color.setHex(
          isAccessing ? 0xEF4444 : 0x222222
        );
      }

      // Update dynamic screen point light color
      if (screenPointLightRef.current) {
        const mode = stateRef.current.crtColor;
        const color = mode === 'amber' ? 0xFFA500 : mode === 'green' ? 0x22C55E : 0x06B6D4;
        screenPointLightRef.current.color.setHex(color);
      }

      // Redraw 2D Canvas onto 3D CRT Texture
      renderCrtCanvas(
        crtCtx,
        stateRef.current.crtColor,
        stateRef.current.typedChars,
        stateRef.current.speedWpm,
        stateRef.current.activeKey,
        stateRef.current.diskAccess,
        cursorVisible
      );
      crtTexture.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Responsive Canvas Resize Observer
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 520;
      camera.aspect = newWidth / newHeight;

      // Adjust camera distance to guarantee full workstation is visible on any aspect ratio
      const minAspect = 1.45;
      const effAspect = Math.max(0.7, camera.aspect);
      const baseDist = stateRef.current.viewMode === 'screen' ? 3.6 : stateRef.current.viewMode === 'keyboard' ? 3.3 : 6.2;
      stateRef.current.targetDist = baseDist * (effAspect < minAspect ? minAspect / effAspect : 1.0);

      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    // Cleanup resources on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);

      renderer.dispose();
      scene.clear();
    };
  }, [triggerKeyAction, triggerMouseAction]);

  return (
    <div className="w-full bg-[#EAE3D6] border-2 border-[#D5CBB9] rounded-3xl p-4 sm:p-6 shadow-[0_14px_40px_rgba(60,45,30,0.14)] flex flex-col gap-3.5 select-none relative overflow-hidden font-sans">
      {/* Top Retro Computer Hardware Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D5CBB9] pb-3.5 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono font-black text-xs text-[#2C2825] tracking-wider uppercase">
            <span>KEY MASTER WORKSTATION 800</span>
            <span className="text-[#DA6A45]">/</span>
            <span className="text-[11px] text-[#78726A] font-bold">NORMAL CRT DISPLAY</span>
          </div>
        </div>

        {/* Camera View Mode & Hardware Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Preset Selector: Full Desk vs Normal Screen Focus vs Keyboard */}
          <div className="flex items-center bg-[#F4EFE6] p-1 rounded-xl border border-[#D5CBB9] gap-1 shadow-2xs">
            <button
              onClick={() => handleViewChange('desk')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'desk' ? 'bg-[#2C2825] text-white shadow-xs' : 'text-[#78726A] hover:text-[#2C2825]'
              }`}
              title="Wide view of entire workstation (Monitor, Keyboard, Mouse)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Full Desk</span>
            </button>
            <button
              onClick={() => handleViewChange('screen')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'screen' ? 'bg-[#DA6A45] text-white shadow-xs' : 'text-[#78726A] hover:text-[#2C2825]'
              }`}
              title="Focus directly on the normal CRT display screen"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Screen View</span>
            </button>
            <button
              onClick={() => handleViewChange('keyboard')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'keyboard' ? 'bg-[#2C2825] text-white shadow-xs' : 'text-[#78726A] hover:text-[#2C2825]'
              }`}
              title="Close-up view of mechanical keyboard"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Keyboard View</span>
            </button>
          </div>

          {/* CRT Phosphor Palette Selector */}
          <div className="flex items-center bg-[#F4EFE6] p-1 rounded-xl border border-[#D5CBB9] gap-1.5 shadow-2xs">
            <button
              onClick={() => setCrtColor('amber')}
              className={`w-4 h-4 rounded-md transition-all cursor-pointer ${
                crtColor === 'amber' ? 'bg-amber-500 scale-110 shadow-xs' : 'bg-amber-900/40 opacity-40 hover:opacity-80'
              }`}
              title="Amber Phosphor Display"
            />
            <button
              onClick={() => setCrtColor('green')}
              className={`w-4 h-4 rounded-md transition-all cursor-pointer ${
                crtColor === 'green' ? 'bg-emerald-500 scale-110 shadow-xs' : 'bg-emerald-900/40 opacity-40 hover:opacity-80'
              }`}
              title="Phosphor Green Display"
            />
            <button
              onClick={() => setCrtColor('cyan')}
              className={`w-4 h-4 rounded-md transition-all cursor-pointer ${
                crtColor === 'cyan' ? 'bg-cyan-400 scale-110 shadow-xs' : 'bg-cyan-900/40 opacity-40 hover:opacity-80'
              }`}
              title="Cyan Monochrome Display"
            />
          </div>

          {/* Mechanical Audio Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-[#F4EFE6] hover:bg-[#E2DBCF] text-[#2C2825] rounded-xl border border-[#D5CBB9] transition-colors cursor-pointer shadow-2xs"
            title="Toggle Mechanical Key & Mouse Audio"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#DA6A45]" /> : <VolumeX className="w-4 h-4 text-[#A0988E]" />}
          </button>

          {/* Auto-Typing Simulation Toggle */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-[#DA6A45] hover:bg-[#C85A37] text-white rounded-xl transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold"
            title={isPlaying ? 'Pause Auto Typing' : 'Resume Auto Typing'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span className="hidden sm:inline">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          {/* 3D Auto-Orbit Toggle */}
          <button
            onClick={() => setIsAutoOrbit(!isAutoOrbit)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer shadow-2xs ${
              isAutoOrbit
                ? 'bg-[#2C2825] text-white border-[#2C2825]'
                : 'bg-[#F4EFE6] hover:bg-[#E2DBCF] text-[#78726A] border-[#D5CBB9]'
            }`}
            title="Auto-Orbit 3D Workstation"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Reset 3D Camera View */}
          <button
            onClick={handleResetAngle}
            className="p-2 bg-[#F4EFE6] hover:bg-[#E2DBCF] text-[#78726A] hover:text-[#2C2825] rounded-xl border border-[#D5CBB9] transition-colors cursor-pointer shadow-2xs"
            title="Reset to Default Perspective"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Workstation Viewport */}
      <div
        ref={containerRef}
        className="w-full h-[480px] sm:h-[520px] lg:h-[560px] rounded-2xl overflow-hidden bg-[#161311] relative cursor-grab active:cursor-grabbing border border-[#2C2825]/70 shadow-[inset_0_4px_36px_rgba(0,0,0,0.85)]"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Informative Hardware Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 pointer-events-none">
          <span className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/90 flex items-center gap-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#DA6A45]" />
            <span>Normal CRT Display • 4:3 Aspect Ratio</span>
          </span>

          <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/70">
            <Monitor className="w-3 h-3 text-[#DA6A45]" />
            <span>FULL DISPLAY</span>
            <span className="text-white/30">•</span>
            <Keyboard className="w-3 h-3 text-[#DA6A45]" />
            <span>KEYBOARD</span>
            <span className="text-white/30">•</span>
            <Mouse className="w-3 h-3 text-[#DA6A45]" />
            <span>MOUSE</span>
          </span>
        </div>

        {/* Floppy Drive Status Indicator */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none">
          <span className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/80 flex items-center gap-1.5 shadow-xs">
            <Disc className={`w-3.5 h-3.5 ${diskAccess ? 'text-rose-500 animate-spin' : 'text-slate-500'}`} />
            <span>{diskAccess ? 'FLOPPY 0: READ/WRITE' : 'DRIVE 0: READY'}</span>
          </span>
        </div>

        {/* Real-time Hardware Telemetry Pill */}
        <div className="absolute bottom-3 left-3 pointer-events-none flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/80">
            ACTIVE INPUT: <strong className="text-[#DA6A45]">{activeKey}</strong>
          </span>
        </div>
      </div>

      {/* Footer Guidance Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs text-[#78726A] px-1 font-mono gap-2">
        <span className="flex items-center gap-2">
          <span>Click &amp; type on keys / Click retro mouse / Drag to orbit / Scroll wheel to zoom</span>
        </span>
        <span className="text-[#DA6A45] font-bold">Unclipped Normal Display Active</span>
      </div>
    </div>
  );
};

// Canvas 2D CRT Raster Renderer (Normal rectangular high-contrast display)
function renderCrtCanvas(
  ctx: CanvasRenderingContext2D,
  colorMode: 'amber' | 'green' | 'cyan',
  typedText: string,
  wpm: number,
  activeKey: string,
  isDiskActive: boolean,
  cursorVisible: boolean
) {
  const width = 1024;
  const height = 768;

  // Solid dark vintage CRT phosphor glass background (Normal clean display, zero circular vignette!)
  ctx.fillStyle = '#0E0D0B';
  ctx.fillRect(0, 0, width, height);

  // Setup phosphor color theme
  let mainColor = '#FFB31A';
  let glowColor = 'rgba(255, 179, 26, 0.45)';
  let accentColor = '#FFE28A';
  if (colorMode === 'green') {
    mainColor = '#22C55E';
    glowColor = 'rgba(34, 197, 94, 0.45)';
    accentColor = '#86EFAC';
  } else if (colorMode === 'cyan') {
    mainColor = '#06B6D4';
    glowColor = 'rgba(6, 182, 212, 0.45)';
    accentColor = '#67E8F9';
  }

  // Rectangular CRT Terminal Frame
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  // Subtle inner border
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // Header Bar background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.fillRect(32, 32, width - 64, 52);

  // Draw Header Bar Text
  ctx.fillStyle = mainColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 6;
  ctx.font = 'bold 24px monospace';
  ctx.fillText('KEY MASTER CRT-800 DISPLAY / 640KB BASE RAM OK', 50, 68);

  // Status metrics top-right
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`SPEED: ${wpm} WPM`, 750, 68);

  if (isDiskActive) {
    ctx.fillStyle = '#EF4444';
    ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
    ctx.fillText('DISK IO', 630, 68);
  }

  // Top Divider line
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(32, 86);
  ctx.lineTo(width - 32, 86);
  ctx.stroke();

  // Terminal Output
  ctx.fillStyle = mainColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 4;
  ctx.font = '22px monospace';

  ctx.fillText('C:\\KEYMASTER\\TOUCH_TYPING> LOAD "TUTORIAL_CORE.BAS",8,1', 50, 134);
  ctx.fillText('SEARCHING FOR TUTORIAL_CORE.BAS', 50, 168);
  ctx.fillText('LOADING 64 SECTORS... COMPLETE. READY.', 50, 202);
  ctx.fillText('RUN "KEY_MASTER_TOUCH_TYPING"', 50, 236);

  // Active Lesson Card Panel
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.fillRect(50, 266, width - 100, 150);
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(50, 266, width - 100, 150);

  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = accentColor;
  ctx.fillText('[ ACTIVE DRILL: HOME ROW ANCHOR & SPEED TEST ]', 70, 300);

  // Active Prompt / Typing text line
  ctx.font = 'bold 34px monospace';
  ctx.fillStyle = mainColor;
  ctx.shadowBlur = 8;
  const promptY = 360;
  ctx.fillText(typedText, 70, promptY);

  // Solid Blinking Block Cursor
  if (cursorVisible) {
    const textWidth = ctx.measureText(typedText).width;
    ctx.fillRect(70 + textWidth + 4, promptY - 28, 20, 34);
  }

  // Telemetry section
  ctx.shadowBlur = 0;
  ctx.font = '20px monospace';
  ctx.fillStyle = mainColor;
  ctx.fillText('HARDWARE BUS BUFFER: ' + (activeKey ? `[ KEY: ${activeKey} ]` : '[ READY ]'), 50, 470);
  ctx.fillText('ACCURACY: 99.6%  /  ERRORS: 0  /  LATENCY: 1.2ms  /  SYNC: 60Hz', 50, 506);
  ctx.fillText('INPUT PERIPHERALS: RETRO CRT + MECH KEYBOARD + BUS MOUSE', 50, 542);
  ctx.fillText('TUTORIAL LEVEL 01 / 18: HOME ROW ASDF JKL; MASTERY', 50, 578);

  // Bottom Divider
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(32, 630);
  ctx.lineTo(width - 32, 630);
  ctx.stroke();

  // Footer text
  ctx.font = '18px monospace';
  ctx.fillStyle = mainColor;
  ctx.fillText('KEY MASTER COMPUTER CORPORATION (C) 1984 / HARDWARE NORMAL / ALL SUBSYSTEMS OK', 50, 672);
  ctx.fillText('PRESS ANY KEY TO TYPE / DRAG TO ORBIT / CLICK MOUSE TO TEST / SCROLL TO ZOOM', 50, 708);

  // Authentic Raster Scanlines (subtle 10% opacity, completely even and clean across full rectangular display)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.10)';
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, width, 2);
  }
}
