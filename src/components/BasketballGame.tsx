import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { useGameStore } from '../hooks/useGameStore';
import { useKeyboard } from '../hooks/useKeyboard';
import { useTheme } from '../hooks/useTheme';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface BasketballGameProps {
  position: [number, number, number];
  zoneSize: [number, number, number];
}

// ============================================================================
// GAME CONSTANTS
// ============================================================================
const BASKETBALL_CONFIG = {
  PHYSICS: {
    WALL_HEIGHT: 8,
    WALL_THICKNESS: 0.1,
    GRAVITY: -15,
    MAX_PICKUP_DISTANCE: 3,
    GROUNDED_CHECK_TIME: 1,
    SETTLE_THRESHOLD: 0.5,
    PROXIMITY_RADIUS: 8,
  },
  HOOP: {
    RADIUS: 0.45,
    HEIGHT: 3.05,
    BACKBOARD_WIDTH: 1.8,
    BACKBOARD_HEIGHT: 1.2,
    RIM_SEGMENTS: 12,
    RIM_SPHERE_RADIUS: 0.03,
  },
  BALL: {
    RADIUS: 0.12,
    MASS: 0.6,
    DAMPING: {
      LINEAR: 0.1,
      ANGULAR: 0.3,
    },
    FRICTION: 0.7,
    RESTITUTION: 0.6,
  },
  THROWING: {
    POWER_MULTIPLIER: 6,
    POWER_OFFSET: 4,
    POWER_INCREMENT: 80,
    MAX_POWER: 100,
  },
  TRAJECTORY: {
    MAX_POINTS: 200,
    MIN_DISTANCE: 0.05,
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const createEnvironmentBodies = (
  world: CANNON.World,
  position: [number, number, number],
  zoneSize: [number, number, number],
  wallMaterial: CANNON.Material,
  groundMaterial: CANNON.Material
) => {
  // Ground
  const groundBody = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(position[0], position[1], position[2]),
    shape: new CANNON.Box(new CANNON.Vec3(zoneSize[0] / 2, 0.1, zoneSize[2] / 2)),
    material: groundMaterial,
  });
  world.addBody(groundBody);

  // Walls
  const walls = [
    {
      position: new CANNON.Vec3(position[0], position[1] + BASKETBALL_CONFIG.PHYSICS.WALL_HEIGHT / 2, position[2] - zoneSize[2] / 2),
      shape: new CANNON.Box(new CANNON.Vec3(zoneSize[0] / 2, BASKETBALL_CONFIG.PHYSICS.WALL_HEIGHT / 2, BASKETBALL_CONFIG.PHYSICS.WALL_THICKNESS)),
    },
    {
      position: new CANNON.Vec3(position[0], position[1] + BASKETBALL_CONFIG.PHYSICS.WALL_HEIGHT / 2, position[2] + zoneSize[2] / 2),
      shape: new CANNON.Box(new CANNON.Vec3(zoneSize[0] / 2, BASKETBALL_CONFIG.PHYSICS.WALL_HEIGHT / 2, BASKETBALL_CONFIG.PHYSICS.WALL_THICKNESS)),
    },
    {
      position: new CANNON.Vec3(position[0] + zoneSize[0] / 2, position[1] + BASKETBALL_CONFIG.PHYSICS.WALL_HEIGHT / 2, position[2]),
      shape: new CANNON.Box(new CANNON.Vec3(BASKETBALL_CONFIG.PHYSICS.WALL_THICKNESS, BASKETBALL_CONFIG.PHYSICS.WALL_HEIGHT / 2, zoneSize[2] / 2)),
    },
    {
      position: new CANNON.Vec3(position[0] - zoneSize[0] / 2, position[1] + BASKETBALL_CONFIG.PHYSICS.WALL_HEIGHT / 2, position[2]),
      shape: new CANNON.Box(new CANNON.Vec3(BASKETBALL_CONFIG.PHYSICS.WALL_THICKNESS, BASKETBALL_CONFIG.PHYSICS.WALL_HEIGHT / 2, zoneSize[2] / 2)),
    },
  ];

  walls.forEach(wall => {
    const wallBody = new CANNON.Body({
      mass: 0,
      position: wall.position,
      shape: wall.shape,
      material: wallMaterial,
    });
    world.addBody(wallBody);
  });

  // Ceiling
  const ceiling = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(position[0], position[1] + BASKETBALL_CONFIG.PHYSICS.WALL_HEIGHT, position[2]),
    shape: new CANNON.Box(new CANNON.Vec3(zoneSize[0] / 2, 0.1, zoneSize[2] / 2)),
    material: wallMaterial,
  });
  world.addBody(ceiling);

  return groundBody;
};

const createHoopPhysics = (
  world: CANNON.World,
  hoopPosition: [number, number, number],
  wallMaterial: CANNON.Material
) => {
  // Backboard
  const backboard = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(hoopPosition[0], hoopPosition[1] + 3.35, hoopPosition[2] - 0.1),
    shape: new CANNON.Box(new CANNON.Vec3(0.9, 0.6, 0.05)),
    material: wallMaterial,
  });
  world.addBody(backboard);

  // Rim segments
  const rimRadius = BASKETBALL_CONFIG.HOOP.RADIUS;
  const rimY = hoopPosition[1] + BASKETBALL_CONFIG.HOOP.HEIGHT;
  const rimZ = hoopPosition[2] + 0.3;

  for (let i = 0; i < BASKETBALL_CONFIG.HOOP.RIM_SEGMENTS; i++) {
    const angle = (i / BASKETBALL_CONFIG.HOOP.RIM_SEGMENTS) * Math.PI * 2;
    const rimX = hoopPosition[0] + Math.cos(angle) * rimRadius;
    const rimZPos = rimZ + Math.sin(angle) * rimRadius;

    const rimSegment = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(rimX, rimY, rimZPos),
      shape: new CANNON.Sphere(BASKETBALL_CONFIG.HOOP.RIM_SPHERE_RADIUS),
      material: wallMaterial,
    });
    world.addBody(rimSegment);
  }
};

const createBallBody = (
  world: CANNON.World,
  position: [number, number, number],
  material: CANNON.Material
) => {
  const ballBody = new CANNON.Body({
    mass: BASKETBALL_CONFIG.BALL.MASS,
    position: new CANNON.Vec3(position[0], position[1], position[2]),
    shape: new CANNON.Sphere(BASKETBALL_CONFIG.BALL.RADIUS),
    material: material,
    linearDamping: BASKETBALL_CONFIG.BALL.DAMPING.LINEAR,
    angularDamping: BASKETBALL_CONFIG.BALL.DAMPING.ANGULAR,
  });
  world.addBody(ballBody);
  return ballBody;
};

// ============================================================================
// VISUAL COMPONENTS
// ============================================================================

// Court Boundary Walls Component
const CourtBoundaries = React.memo(({ 
  position, 
  zoneSize,
  isDarkMode
}: { 
  position: [number, number, number]; 
  zoneSize: [number, number, number];
  isDarkMode: boolean;
}) => (
  <>
    <mesh position={[position[0], position[1] + 4, position[2] - zoneSize[2] / 2]}>
      <boxGeometry args={[zoneSize[0], 8, 0.05]} />
      <meshBasicMaterial 
        color={isDarkMode ? "#88ffff" : "#44ffff"}
        transparent 
        opacity={0.15} 
      />
    </mesh>
    <mesh position={[position[0], position[1] + 4, position[2] + zoneSize[2] / 2]}>
      <boxGeometry args={[zoneSize[0], 8, 0.05]} />
      <meshBasicMaterial 
        color={isDarkMode ? "#88ffff" : "#44ffff"}
        transparent 
        opacity={0.15} 
      />
    </mesh>
    <mesh position={[position[0] + zoneSize[0] / 2, position[1] + 4, position[2]]}>
      <boxGeometry args={[0.05, 8, zoneSize[2]]} />
      <meshBasicMaterial 
        color={isDarkMode ? "#88ffff" : "#44ffff"}
        transparent 
        opacity={0.15} 
      />
    </mesh>
    <mesh position={[position[0] - zoneSize[0] / 2, position[1] + 4, position[2]]}>
      <boxGeometry args={[0.05, 8, zoneSize[2]]} />
      <meshBasicMaterial 
        color={isDarkMode ? "#88ffff" : "#44ffff"}
        transparent 
        opacity={0.15} 
      />
    </mesh>
  </>
));

CourtBoundaries.displayName = 'CourtBoundaries';

// Court Markings Component
const CourtMarkings = React.memo(({ 
  hoopPosition,
  position,
  zoneSize,
  isDarkMode
}: { 
  hoopPosition: [number, number, number];
  position: [number, number, number];
  zoneSize: [number, number, number];
  isDarkMode: boolean;
}) => (
  <>
    {/* Pickup Circle */}
    <mesh position={[position[0], position[1] + 0.02, position[2] + zoneSize[2] / 2 - 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.3, 0.4, 32]} />
      <meshBasicMaterial 
        color={isDarkMode ? "#88ff88" : "#00ff00"}
        transparent 
        opacity={0.5} 
      />
    </mesh>

    {/* Three-point Line (Arc) */}
    <mesh position={[hoopPosition[0], position[1] + 0.01, hoopPosition[2] + 0.5]} rotation={[-Math.PI / 2, 0, Math.PI]}>
      <ringGeometry args={[3, 3.1, 32, 1, 0, Math.PI]} />
      <meshBasicMaterial 
        color={isDarkMode ? "#cccccc" : "#ffffff"}
        transparent 
        opacity={0.3} 
      />
    </mesh>

    {/* Free-throw Line */}
    <mesh position={[hoopPosition[0], position[1] + 0.02, hoopPosition[2] + 7]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[3.6, 0.1]} />
      <meshBasicMaterial 
        color={isDarkMode ? "#cccccc" : "#ffffff"}
        transparent 
        opacity={0.5} 
      />
    </mesh>

    {/* Court Floor */}
    <mesh position={[position[0], position[1] + 0.01, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[zoneSize[0], zoneSize[2]]} />
      <meshBasicMaterial 
        color={isDarkMode ? "#224444" : "#44aaff"}
        transparent 
        opacity={0.1} 
      />
    </mesh>
  </>
));

CourtMarkings.displayName = 'CourtMarkings';

// HOOP COMPONENT
// ----------------------------------------------------------------------------
function Hoop({ position }: { position: [number, number, number] }) {
  const { isDarkMode } = useTheme();

  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      {/* Backboard */}
      <mesh position={[0, BASKETBALL_CONFIG.HOOP.HEIGHT + 0.3, 0.1]}>
        <boxGeometry args={[BASKETBALL_CONFIG.HOOP.BACKBOARD_WIDTH, BASKETBALL_CONFIG.HOOP.BACKBOARD_HEIGHT, 0.05]} />
        <meshBasicMaterial 
          color={isDarkMode ? "#444444" : "#ffffff"}
          transparent 
          opacity={isDarkMode ? 0.9 : 0.8} 
        />
      </mesh>

      {/* Backboard outline */}
      <lineSegments position={[0, BASKETBALL_CONFIG.HOOP.HEIGHT + 0.3, 0.12]}>
        <edgesGeometry args={[new THREE.BoxGeometry(BASKETBALL_CONFIG.HOOP.BACKBOARD_WIDTH, BASKETBALL_CONFIG.HOOP.BACKBOARD_HEIGHT, 0.05)]} />
        <lineBasicMaterial 
          color={isDarkMode ? "#ff8888" : "#ff4444"}
          linewidth={2} 
        />
      </lineSegments>

      {/* Rim */}
      <mesh position={[0, BASKETBALL_CONFIG.HOOP.HEIGHT, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BASKETBALL_CONFIG.HOOP.RADIUS, 0.02, 16, 32]} />
        <meshBasicMaterial color="#ff6600" />
      </mesh>

      {/* Pole */}
      <mesh position={[0, BASKETBALL_CONFIG.HOOP.HEIGHT / 2, 0.2]}>
        <cylinderGeometry args={[0.08, 0.08, BASKETBALL_CONFIG.HOOP.HEIGHT, 8]} />
        <meshBasicMaterial color={isDarkMode ? "#555555" : "#333333"} />
      </mesh>

      {/* Net visualization */}
      <mesh position={[0, BASKETBALL_CONFIG.HOOP.HEIGHT - 0.3, -0.3]}>
        <cylinderGeometry args={[BASKETBALL_CONFIG.HOOP.RADIUS, BASKETBALL_CONFIG.HOOP.RADIUS * 0.7, 0.5, 16, 1, true]} />
        <meshBasicMaterial 
          color={isDarkMode ? "#cccccc" : "#ffffff"}
          transparent 
          opacity={isDarkMode ? 0.4 : 0.3} 
          wireframe 
        />
      </mesh>
    </group>
  );
}

// BASKETBALL COMPONENT
// ----------------------------------------------------------------------------
function Basketball({ ballRef }: { ballRef: (mesh: THREE.Mesh | null) => void }) {
  return (
    <mesh ref={ballRef}>
      <sphereGeometry args={[BASKETBALL_CONFIG.BALL.RADIUS, 32, 32]} />
      <meshBasicMaterial color="#ff6600" />

      <lineSegments>
        <edgesGeometry args={[new THREE.SphereGeometry(BASKETBALL_CONFIG.BALL.RADIUS + 0.001, 8, 8)]} />
        <lineBasicMaterial color="#333333" />
      </lineSegments>
    </mesh>
  );
}

// ============================================================================
// MAIN GAME COMPONENT
// ============================================================================
export function BasketballGame({ position, zoneSize }: BasketballGameProps) {
  // HOOKS & EXTERNAL DEPENDENCIES
  // --------------------------------------------------------------------------
  const { camera, gl } = useThree();
  const { keys, resetInteract } = useKeyboard();
  const { isDarkMode } = useTheme();

  // GAME STORE STATE
  // --------------------------------------------------------------------------
  const {
    currentRoom,
    isNearBasketball,
    setIsNearBasketball,
    isBasketballActive,
    isHoldingBall,
    setIsHoldingBall,
    throwPower,
    setThrowPower,
    isChargingThrow,
    setIsChargingThrow,
    incrementBasketballScore,
    incrementBasketballAttempts,
    basketballBetPlaced,
    basketballBetAmount,
    addMoney,
    removeMoney,
    isLocked,
    exitBasketballZone,
    enterBasketballZone,
    resetBasketballGame,
  } = useGameStore();

  // PHYSICS REFERENCES
  // --------------------------------------------------------------------------
  const worldRef = useRef<CANNON.World | null>(null);
  const ballBodyRef = useRef<CANNON.Body | null>(null);
  const ballMeshRef = useRef<THREE.Mesh | null>(null);

  // GAME LOGIC REFERENCES
  // --------------------------------------------------------------------------
  const scoreCheckTimeRef = useRef(0);
  const lastBallYRef = useRef(0);
  const hasScoreCheckedRef = useRef(false);
  const hasThrownBallRef = useRef(false);
  const ballGroundedTimeRef = useRef(0);

  // VISUALIZATION REFERENCES
  // --------------------------------------------------------------------------
  const trajectoryRef = useRef<THREE.Vector3[]>([]);
  const trajectoryLineRef = useRef<THREE.Line | null>(null);

  // COMPUTED POSITIONS
  // --------------------------------------------------------------------------
  const ballInitialPosition = useMemo<[number, number, number]>(() => [
    position[0],
    position[1] + 0.5,
    position[2] + zoneSize[2] / 2 - 1.5,
  ], [position, zoneSize]);

  const hoopPosition = useMemo<[number, number, number]>(() => [
    position[0],
    position[1],
    position[2] - zoneSize[2] / 2 + 0.5,
  ], [position, zoneSize]);

  // ==========================================================================
  // GAME LOGIC FUNCTIONS
  // ==========================================================================

  // EXIT / ENTRY HANDLING
  // --------------------------------------------------------------------------
  const exitGame = useCallback(() => {
    exitBasketballZone();
    resetBasketballGame();
    gl.domElement.requestPointerLock();
  }, [exitBasketballZone, resetBasketballGame, gl]);

  // THROWING MECHANICS
  // --------------------------------------------------------------------------
  const throwBall = useCallback(() => {
    if (!ballBodyRef.current || !isHoldingBall) return;

    // Calculate throw position
    const throwPos = camera.position.clone();
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    throwPos.add(forward.multiplyScalar(0.8));
    throwPos.y -= 0.2;

    // Position ball at throw point
    ballBodyRef.current.position.set(throwPos.x, throwPos.y, throwPos.z);

    // Calculate throw direction
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    direction.y += 0.4;
    direction.normalize();

    // Apply velocity based on charge power
    const power = (throwPower / 100) * BASKETBALL_CONFIG.THROWING.POWER_MULTIPLIER + BASKETBALL_CONFIG.THROWING.POWER_OFFSET;
    ballBodyRef.current.velocity.set(
      direction.x * power,
      direction.y * power + 3,
      direction.z * power,
    );

    // Add random spin
    ballBodyRef.current.angularVelocity.set(
      Math.random() * 5 - 2.5,
      Math.random() * 5 - 2.5,
      Math.random() * 5 - 2.5,
    );

    // Update game state
    hasThrownBallRef.current = true;
    hasScoreCheckedRef.current = false;
    scoreCheckTimeRef.current = 0;

    setIsHoldingBall(false);
    setIsChargingThrow(false);
    setThrowPower(0);
    incrementBasketballAttempts();
  }, [camera, incrementBasketballAttempts, isHoldingBall, setIsChargingThrow, setIsHoldingBall, setThrowPower, throwPower]);

  // SCORING LOGIC
  // --------------------------------------------------------------------------
  const checkScore = useCallback(() => {
    if (!ballBodyRef.current || hasScoreCheckedRef.current) return;

    const ballPos = ballBodyRef.current.position;
    const hoopCenter = {
      x: hoopPosition[0],
      y: hoopPosition[1] + BASKETBALL_CONFIG.HOOP.HEIGHT,
      z: hoopPosition[2] + 0.3,
    };

    // Check if ball passed through hoop
    const dx = ballPos.x - hoopCenter.x;
    const dz = ballPos.z - hoopCenter.z;
    const horizontalDist = Math.sqrt(dx * dx + dz * dz);

    const currentY = ballPos.y;
    const lastY = lastBallYRef.current;

    if (horizontalDist < 0.35 && lastY > hoopCenter.y && currentY < hoopCenter.y) {
      incrementBasketballScore();
      hasScoreCheckedRef.current = true;

      if (basketballBetPlaced) {
        addMoney(basketballBetAmount * 2);
      }
    }

    lastBallYRef.current = currentY;
  }, [addMoney, basketballBetAmount, basketballBetPlaced, hoopPosition, incrementBasketballScore]);

  // PROXIMITY CHECK LOGIC
  // --------------------------------------------------------------------------
  const handleProximityCheck = useCallback(() => {
    const playerPos = camera.position;
    const zoneCenter = new THREE.Vector3(position[0], position[1], position[2]);
    const distance = playerPos.distanceTo(zoneCenter);

    const isNear = distance < BASKETBALL_CONFIG.PHYSICS.PROXIMITY_RADIUS;
    if (isNear !== isNearBasketball) {
      setIsNearBasketball(isNear);
      if (!isNear && isBasketballActive) {
        exitGame();
      }
    }

    if (isNear && keys.current.interact && isLocked && !isBasketballActive) {
      resetInteract();
      enterBasketballZone();
      // Mark minigame2 as played
      useGameStore.getState().markMinigamePlayed('minigame2');
      document.exitPointerLock();
    }
  }, [camera, position, isNearBasketball, isLocked, keys, resetInteract, setIsNearBasketball, exitGame, isBasketballActive, enterBasketballZone]);

  // THROW CHARGING LOGIC
  // --------------------------------------------------------------------------
  const handleThrowCharging = useCallback((delta: number) => {
    if (isChargingThrow) {
      setThrowPower(throwPower + delta * BASKETBALL_CONFIG.THROWING.POWER_INCREMENT);
      if (throwPower >= BASKETBALL_CONFIG.THROWING.MAX_POWER) {
        throwBall();
      }
    }
  }, [isChargingThrow, throwPower, setThrowPower, throwBall]);

  // BALL HOLDING LOGIC
  // --------------------------------------------------------------------------
  const handleBallHolding = useCallback(() => {
    if (isHoldingBall && !hasThrownBallRef.current) {
      const holdPos = camera.position.clone();
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(camera.quaternion);
      holdPos.add(forward.multiplyScalar(0.8));
      holdPos.y -= 0.3;

      ballBodyRef.current!.position.set(holdPos.x, holdPos.y, holdPos.z);
      ballBodyRef.current!.velocity.set(0, 0, 0);
    }
  }, [camera, isHoldingBall]);

  // TRAJECTORY VISUALIZATION LOGIC
  // --------------------------------------------------------------------------
  const handleTrajectoryVisualization = useCallback(() => {
    if (hasThrownBallRef.current && !isHoldingBall && ballBodyRef.current) {
      const pos = new THREE.Vector3(
        ballBodyRef.current.position.x,
        ballBodyRef.current.position.y,
        ballBodyRef.current.position.z,
      );

      const lastPos = trajectoryRef.current[trajectoryRef.current.length - 1];
      if (!lastPos || pos.distanceTo(lastPos) > BASKETBALL_CONFIG.TRAJECTORY.MIN_DISTANCE) {
        trajectoryRef.current.push(pos);
        // Limit trajectory array size to prevent memory issues
        if (trajectoryRef.current.length > BASKETBALL_CONFIG.TRAJECTORY.MAX_POINTS) {
          trajectoryRef.current.shift();
        }
      }

      if (trajectoryLineRef.current && trajectoryRef.current.length >= 2) {
        const geometry = new THREE.BufferGeometry().setFromPoints(trajectoryRef.current);
        trajectoryLineRef.current.geometry.dispose();
        trajectoryLineRef.current.geometry = geometry;
      }
    }
  }, [isHoldingBall]);

  // BALL RESET LOGIC
  // --------------------------------------------------------------------------
  const handleBallReset = useCallback((delta: number) => {
    if (!isHoldingBall && hasThrownBallRef.current && ballBodyRef.current) {
      scoreCheckTimeRef.current += delta;
      checkScore();

      // Check if ball is grounded
      const ballY = ballBodyRef.current.position.y;
      const ballVelY = Math.abs(ballBodyRef.current.velocity.y);
      const isOnGround = ballY < position[1] + 0.3 && ballVelY < BASKETBALL_CONFIG.PHYSICS.SETTLE_THRESHOLD;

      if (isOnGround) {
        ballGroundedTimeRef.current += delta;

        // Reset ball after being grounded for configured time
        if (ballGroundedTimeRef.current > BASKETBALL_CONFIG.PHYSICS.GROUNDED_CHECK_TIME) {
          ballBodyRef.current.position.set(
            ballInitialPosition[0],
            ballInitialPosition[1],
            ballInitialPosition[2],
          );
          ballBodyRef.current.velocity.set(0, 0, 0);
          ballBodyRef.current.angularVelocity.set(0, 0, 0);

          hasThrownBallRef.current = false;
          hasScoreCheckedRef.current = false;
          ballGroundedTimeRef.current = 0;
          scoreCheckTimeRef.current = 0;
        }
      } else {
        ballGroundedTimeRef.current = 0;
      }
    }
  }, [isHoldingBall, checkScore, position, ballInitialPosition]);

  // UPDATE BALL MESH HELPER
  // --------------------------------------------------------------------------
  const updateBallMesh = useCallback(() => {
    if (ballMeshRef.current && ballBodyRef.current) {
      ballMeshRef.current.position.copy(ballBodyRef.current.position as unknown as THREE.Vector3);
      ballMeshRef.current.quaternion.copy(ballBodyRef.current.quaternion as unknown as THREE.Quaternion);
    }
  }, []);

  // ==========================================================================
  // USE EFFECTS
  // ==========================================================================

  // GLOBAL KEY HANDLERS (Exit Game)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyQ' && isBasketballActive) {
        exitGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBasketballActive, exitGame]);

  // BET STATE RESET
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (basketballBetPlaced) {
      hasThrownBallRef.current = false;
      hasScoreCheckedRef.current = false;
      scoreCheckTimeRef.current = 0;
    }
  }, [basketballBetPlaced]);

  // MOUSE INTERACTION (Pick up ball)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!isBasketballActive || !basketballBetPlaced || e.button !== 0) return;

      if (!isHoldingBall && ballBodyRef.current && ballMeshRef.current) {
        const ballPos = new THREE.Vector3(
          ballBodyRef.current.position.x,
          ballBodyRef.current.position.y,
          ballBodyRef.current.position.z,
        );
        const playerPos = camera.position.clone();
        const distance = ballPos.distanceTo(playerPos);

        if (distance < BASKETBALL_CONFIG.PHYSICS.MAX_PICKUP_DISTANCE) {
          const success = removeMoney(basketballBetAmount);
          if (!success) return;

          setIsHoldingBall(true);
          ballBodyRef.current.velocity.set(0, 0, 0);
          ballBodyRef.current.angularVelocity.set(0, 0, 0);

          trajectoryRef.current = [];
        }
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [isBasketballActive, basketballBetPlaced, isHoldingBall, camera, setIsHoldingBall, removeMoney, basketballBetAmount]);

  // KEYBOARD THROW CONTROLS
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isBasketballActive || !basketballBetPlaced || !isHoldingBall) return;

      if (e.code === 'Space' && !isChargingThrow) {
        e.preventDefault();
        setIsChargingThrow(true);
        setThrowPower(0);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isBasketballActive || !basketballBetPlaced || !isHoldingBall) return;

      if (e.code === 'Space' && isChargingThrow) {
        e.preventDefault();
        throwBall();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [basketballBetPlaced, isBasketballActive, isChargingThrow, isHoldingBall, setIsChargingThrow, setThrowPower, throwBall]);

  // PHYSICS WORLD INITIALIZATION
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (currentRoom !== 'minigame2') return;

    const world = new CANNON.World();
    world.gravity.set(0, BASKETBALL_CONFIG.PHYSICS.GRAVITY, 0);
    world.broadphase = new CANNON.NaiveBroadphase();

    // Materials
    const ballMaterial = new CANNON.Material('ball');
    const groundMaterial = new CANNON.Material('ground');
    const wallMaterial = new CANNON.Material('wall');

    // Contact materials
    world.addContactMaterial(new CANNON.ContactMaterial(ballMaterial, groundMaterial, {
      friction: BASKETBALL_CONFIG.BALL.FRICTION,
      restitution: BASKETBALL_CONFIG.BALL.RESTITUTION,
    }));

    world.addContactMaterial(new CANNON.ContactMaterial(ballMaterial, wallMaterial, {
      friction: 0.3,
      restitution: 0.5,
    }));

    // ENVIRONMENT BODIES
    createEnvironmentBodies(world, position, zoneSize, wallMaterial, groundMaterial);

    // HOOP PHYSICS
    createHoopPhysics(world, hoopPosition, wallMaterial);

    // BALL PHYSICS
    const ballBody = createBallBody(world, ballInitialPosition, ballMaterial);
    ballBodyRef.current = ballBody;

    if (ballMeshRef.current) {
      ballMeshRef.current.position.set(ballInitialPosition[0], ballInitialPosition[1], ballInitialPosition[2]);
    }

    worldRef.current = world;

    return () => {
      if (worldRef.current) {
        const bodies = worldRef.current.bodies.slice();
        bodies.forEach(body => {
          worldRef.current!.removeBody(body);
        });
        worldRef.current = null;
      }
      ballBodyRef.current = null;
      trajectoryRef.current = [];
      if (trajectoryLineRef.current) {
        trajectoryLineRef.current.geometry.dispose();
      }
    };
  }, [ballInitialPosition, currentRoom, position, zoneSize, hoopPosition]);

  // ==========================================================================
  // GAME LOOP (useFrame)
  // ==========================================================================
  useFrame((_, delta) => {
    // Early return if not in basketball room or world not initialized
    if (currentRoom !== 'minigame2' || !worldRef.current || !ballBodyRef.current) {
      return;
    }

    // PROXIMITY CHECK & GAME ENTRY
    handleProximityCheck();
    
    // THROW CHARGING
    handleThrowCharging(delta);

    // PHYSICS SIMULATION
    worldRef.current.step(1 / 60, delta, 3);

    // GAME LOGIC UPDATES
    handleBallHolding();
    updateBallMesh();
    handleTrajectoryVisualization();
    handleBallReset(delta);
  });

  // REF HANDLER
  const setBallMeshRef = (mesh: THREE.Mesh | null) => {
    ballMeshRef.current = mesh;
  };

  // RENDER GUARD
  if (currentRoom !== 'minigame2') return null;

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <group>
      {/* Court Boundaries */}
      <CourtBoundaries position={position} zoneSize={zoneSize} isDarkMode={isDarkMode} />

      {/* Hoop */}
      <Hoop position={hoopPosition} />

      {/* Basketball */}
      <Basketball ballRef={setBallMeshRef} />

      {/* Trajectory Line */}
      <line ref={(line) => { trajectoryLineRef.current = line as unknown as THREE.Line; }}>
        <bufferGeometry />
        <lineBasicMaterial 
          color={isDarkMode ? "#ffff88" : "#ffff00"}
          linewidth={2} 
          transparent 
          opacity={0.8} 
        />
      </line>

      {/* Court Markings */}
      <CourtMarkings 
        hoopPosition={hoopPosition}
        position={position}
        zoneSize={zoneSize}
        isDarkMode={isDarkMode}
      />
    </group>
  );
}