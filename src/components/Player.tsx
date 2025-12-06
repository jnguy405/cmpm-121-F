import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { useKeyboard } from '../hooks/useKeyboard';
import { useGameStore } from '../hooks/useGameStore';
import { PLAYER_CONFIG, ROOM_CONFIGS, PORTAL_CONFIG } from '../config/rooms';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface PlayerProps {
  playerBody: React.MutableRefObject<CANNON.Body | null>;
  physicsStep: (delta: number) => void;
}

interface DebugState {
  prevYaw: number;
  prevPitch: number;
  prevQuaternion: THREE.Quaternion;
  frameCount: number;
}

// ============================================================================
// MAIN PLAYER COMPONENT
// ============================================================================
export function Player({ playerBody, physicsStep }: PlayerProps) {
  
  // HOOKS & EXTERNAL DEPENDENCIES
  const { camera, gl } = useThree();
  const { keys, resetInteract } = useKeyboard();

  // CAMERA ROTATION STATE
  const yawRef = useRef(0);
  const pitchRef = useRef(0);

  // MOVEMENT STATE
  const velocityRef = useRef(new THREE.Vector3());
  const canJumpRef = useRef(true);

  // DEBUG TRACKING STATE
  const debugRef = useRef<DebugState>({
    prevYaw: 0,
    prevPitch: 0,
    prevQuaternion: new THREE.Quaternion(),
    frameCount: 0,
  });

  // GAME STORE STATE
  // --------------------------------------------------------------------------
  const { 
    currentRoom, 
    setNearPortal, 
    nearPortal, 
    teleportToRoom, 
    setIsLocked,
    isLocked,
    playerTeleportTarget,
    setPlayerTeleportTarget,
    isBasketballActive,
    saveGame,
    loadGame,
  } = useGameStore();

  // ==========================================================================
  // INPUT & INTERACTION FUNCTIONS
  // ==========================================================================

  // POINTER LOCK CONTROL
  // --------------------------------------------------------------------------
  const requestPointerLock = useCallback(() => {
    gl.domElement.requestPointerLock();
  }, [gl]);

  // MOUSE MOVEMENT HANDLER
  // --------------------------------------------------------------------------
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (document.pointerLockElement !== gl.domElement) return;

    const sensitivity = PLAYER_CONFIG.mouseSensitivity * 0.002;

    // Threshold to ignore large jumps (e.g., screen edge wrapping)
    const THRESHOLD = 100;
    if (Math.abs(event.movementX) > THRESHOLD || Math.abs(event.movementY) > THRESHOLD) {
      return;
    }

    // Yaw rotation (horizontal)
    yawRef.current -= event.movementX * sensitivity;
    while (yawRef.current > Math.PI) yawRef.current -= Math.PI * 2;
    while (yawRef.current < -Math.PI) yawRef.current += Math.PI * 2;

    // Pitch rotation (vertical) with limits
    const maxPitch = Math.PI / 2 - 0.05;
    pitchRef.current -= event.movementY * sensitivity;
    pitchRef.current = Math.max(-maxPitch, Math.min(maxPitch, pitchRef.current));
  }, [gl]);

  // POINTER LOCK STATE HANDLER
  // --------------------------------------------------------------------------
  const handlePointerLockChange = useCallback(() => {
    const locked = document.pointerLockElement === gl.domElement;
    setIsLocked(locked);
  }, [gl, setIsLocked]);

  // CANVAS CLICK HANDLER
  // --------------------------------------------------------------------------
  const handleClick = useCallback(() => {
    if (document.pointerLockElement !== gl.domElement) {
      requestPointerLock();
    }
  }, [gl, requestPointerLock]);

  // ==========================================================================
  // USE EFFECTS
  // ==========================================================================

  // INPUT EVENT LISTENERS
  // --------------------------------------------------------------------------
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    gl.domElement.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [handleMouseMove, handlePointerLockChange, handleClick, gl]);

  // SAVE/LOAD KEYBOARD SHORTCUTS
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const body = playerBody.current;
      if (!body) return;

      // Quick save (F5)
      if (e.code === 'F5') {
        e.preventDefault();
        const position = {
          x: body.position.x,
          y: body.position.y,
          z: body.position.z,
        };
        saveGame(position, 'quick');
      }

      // Quick Load (F9)
      if (e.code === 'F9') {
        e.preventDefault();
        const lastQuickSaveId = localStorage.getItem('mini3d_last_quicksave');
        if (lastQuickSaveId) {
          loadGame(lastQuickSaveId);
        } else {
          console.log('No quick save found');
        }
      }
      
      // Manual save (Ctrl+S)
      if (e.ctrlKey && e.code === 'KeyS') {
        e.preventDefault();
        const position = {
          x: body.position.x,
          y: body.position.y,
          z: body.position.z,
        };
        const saveName = prompt('Save name (optional):') || undefined;
        saveGame(position, 'manual', saveName);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerBody, saveGame, loadGame]); 

  // ROOM TRANSITION HANDLER
  // --------------------------------------------------------------------------
  useEffect(() => {
    const body = playerBody.current;
    const roomConfig = ROOM_CONFIGS[currentRoom];
    const spawnPos = roomConfig.spawnPosition || new THREE.Vector3(0, PLAYER_CONFIG.spawnHeight, 0);

    // Reset physics body
    if (body) {
      body.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
      body.velocity.set(0, 0, 0);
    }

    // Reset camera position
    camera.position.set(
      spawnPos.x, 
      spawnPos.y + PLAYER_CONFIG.eyeHeight - PLAYER_CONFIG.spawnHeight, 
      spawnPos.z
    );

    // Reset rotation
    yawRef.current = 0;
    pitchRef.current = 0;

    // Reset debug tracking
    debugRef.current.prevYaw = 0;
    debugRef.current.prevPitch = 0;
    debugRef.current.prevQuaternion.identity();
  }, [currentRoom, playerBody, camera]);

  // TELEPORTATION HANDLER
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!playerTeleportTarget) return;

    const body = playerBody.current;
    if (body) {
      body.position.set(
        playerTeleportTarget.x,
        playerTeleportTarget.y,
        playerTeleportTarget.z
      );
      body.velocity.set(0, 0, 0);
    }

    camera.position.set(
      playerTeleportTarget.x,
      playerTeleportTarget.y + PLAYER_CONFIG.eyeHeight - PLAYER_CONFIG.spawnHeight,
      playerTeleportTarget.z
    );

    setPlayerTeleportTarget(null);
  }, [playerTeleportTarget, playerBody, camera, setPlayerTeleportTarget]);

  // ==========================================================================
  // GAME LOOP (useFrame)
  // ==========================================================================
  useFrame((_, delta) => {
    const body = playerBody.current;
    if (!body || !isLocked) return;

    // PHYSICS STEP
    physicsStep(delta);

    // CAMERA ROTATION
    const debug = debugRef.current;
    debug.frameCount++;

    const euler = new THREE.Euler(pitchRef.current, yawRef.current, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    // MOVEMENT CALCULATION
    // ------------------------------------------------------------------------
    const forward = new THREE.Vector3(
      -Math.sin(yawRef.current),
      0,
      -Math.cos(yawRef.current)
    );
    const right = new THREE.Vector3(
      Math.cos(yawRef.current),
      0,
      -Math.sin(yawRef.current)
    );

    const speed = keys.current.sprint 
      ? PLAYER_CONFIG.moveSpeed * PLAYER_CONFIG.sprintMultiplier 
      : PLAYER_CONFIG.moveSpeed;

    const velocity = velocityRef.current;
    velocity.set(0, 0, 0);

    // Apply movement based on keys
    if (keys.current.forward) velocity.add(forward.clone().multiplyScalar(speed));
    if (keys.current.backward) velocity.add(forward.clone().multiplyScalar(-speed));
    if (keys.current.left) velocity.add(right.clone().multiplyScalar(-speed));
    if (keys.current.right) velocity.add(right.clone().multiplyScalar(speed));

    // Update physics body velocity (preserve Y for gravity/jumping)
    const currentYVelocity = body.velocity.y;
    body.velocity.set(velocity.x, currentYVelocity, velocity.z);

    // JUMP MECHANICS
    // ------------------------------------------------------------------------
    const isGrounded =
      Math.abs(body.velocity.y) < 0.5 &&
      body.position.y <= PLAYER_CONFIG.spawnHeight + 0.2;

    if (keys.current.jump && isGrounded && canJumpRef.current && !isBasketballActive) {
      body.velocity.set(body.velocity.x, PLAYER_CONFIG.jumpForce, body.velocity.z);
      canJumpRef.current = false;
    }
    if (!keys.current.jump) {
      canJumpRef.current = true;
    }

    // CAMERA POSITION SYNC
    // ------------------------------------------------------------------------
    camera.position.set(
      body.position.x,
      body.position.y + PLAYER_CONFIG.eyeHeight - PLAYER_CONFIG.spawnHeight,
      body.position.z
    );

    // PORTAL DETECTION
    // ------------------------------------------------------------------------
    const roomConfig = ROOM_CONFIGS[currentRoom];
    let foundPortal = null;

    for (const portal of roomConfig.portals) {
      const distance = camera.position.distanceTo(portal.position);
      if (distance < PORTAL_CONFIG.interactionDistance) {
        foundPortal = portal;
        break;
      }
    }
    setNearPortal(foundPortal);

    // PORTAL INTERACTION
    // ------------------------------------------------------------------------
    if (keys.current.interact && nearPortal) {
      resetInteract();
      teleportToRoom(nearPortal.targetRoom);
    }
  });

  // RENDER
  return null;
}