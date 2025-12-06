import { useEffect, useRef, useMemo, type RefObject } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useGameStore } from '../hooks/useGameStore';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { RoomConfig } from '../types';
import type { ThemeColors } from '../hooks/useTheme';
import { Portal } from './Portal';
import { MiniGameZone } from './MiniGameZone';
import { DiceGame } from './DiceGame';
import { BasketballGame } from './BasketballGame';
import { SimonGame } from './SimonGame';
import { MINIGAME_ZONE_CONFIG } from '../config/rooms';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface RoomProps {
  config: RoomConfig;
  addBody: (body: CANNON.Body) => void;
  removeBody: (body: CANNON.Body) => void;
  clearBodies: () => void;
  groundMaterial: RefObject<CANNON.Material | null>;
  wallMaterial: RefObject<CANNON.Material | null>;
}

// ============================================================================
// ROOM COMPONENT
// ============================================================================
export function Room({ 
  config, 
  addBody, 
  clearBodies, 
  groundMaterial, 
  wallMaterial 
}: RoomProps) {
  
  // PROPS DESTRUCTURING
  const { size, portals } = config; // Removed floorColor and wallColor from props
  
  // REFERENCES
  const bodiesRef = useRef<CANNON.Body[]>([]);
  
  // THEME
  const { colors } = useTheme();
  
  // GAME STORE
  const { spawnedBoxes, collectedBoxes } = useGameStore();
  
  // THEME-BASED COLORS (Memoize to prevent unnecessary re-renders)
  const themeFloorColor = useMemo(
    () => getRoomColor(config.id, 'floor', colors),
    [config.id, colors]
  );
  const themeWallColor = useMemo(
    () => getRoomColor(config.id, 'wall', colors),
    [config.id, colors]
  );

  // ==========================================================================
  // PHYSICS SETUP EFFECT
  // ==========================================================================
  useEffect(() => {
    clearBodies();
    bodiesRef.current = [];

    if (!groundMaterial.current || !wallMaterial.current) return;

    const WALL_THICKNESS = 0.5;

    // ========================================================================
    // FLOOR PHYSICS
    // ========================================================================
    const floorShape = new CANNON.Box(new CANNON.Vec3(size.width / 2, 0.5, size.depth / 2));
    const floorBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, -0.5, 0),
      shape: floorShape,
      material: groundMaterial.current,
    });
    addBody(floorBody);
    bodiesRef.current.push(floorBody);

    // ========================================================================
    // CEILING PHYSICS
    // ========================================================================
    const ceilingBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, size.height + 0.5, 0),
      shape: floorShape,
      material: wallMaterial.current,
    });
    addBody(ceilingBody);
    bodiesRef.current.push(ceilingBody);

    // ========================================================================
    // MAIN WALL PHYSICS
    // ========================================================================
    
    // North Wall (negative Z)
    const northWallShape = new CANNON.Box(new CANNON.Vec3(size.width / 2, size.height / 2, WALL_THICKNESS / 2));
    const northWallBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, size.height / 2, -size.depth / 2 - WALL_THICKNESS / 2),
      shape: northWallShape,
      material: wallMaterial.current,
    });
    addBody(northWallBody);
    bodiesRef.current.push(northWallBody);

    // South Wall (positive Z)
    const southWallBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, size.height / 2, size.depth / 2 + WALL_THICKNESS / 2),
      shape: northWallShape,
      material: wallMaterial.current,
    });
    addBody(southWallBody);
    bodiesRef.current.push(southWallBody);

    // East Wall (positive X)
    const eastWallShape = new CANNON.Box(new CANNON.Vec3(WALL_THICKNESS / 2, size.height / 2, size.depth / 2));
    const eastWallBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(size.width / 2 + WALL_THICKNESS / 2, size.height / 2, 0),
      shape: eastWallShape,
      material: wallMaterial.current,
    });
    addBody(eastWallBody);
    bodiesRef.current.push(eastWallBody);

    // West Wall (negative X)
    const westWallBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(-size.width / 2 - WALL_THICKNESS / 2, size.height / 2, 0),
      shape: eastWallShape,
      material: wallMaterial.current,
    });
    addBody(westWallBody);
    bodiesRef.current.push(westWallBody);

    // ========================================================================
    // MINIGAME ZONE PHYSICS (Dice & Basketball games only)
    // ========================================================================
    const zoneConfig = MINIGAME_ZONE_CONFIG[config.id as keyof typeof MINIGAME_ZONE_CONFIG];
    if (zoneConfig && (config.id === 'minigame1' || config.id === 'minigame2')) {
      const zonePos = zoneConfig.position;
      const zoneSize = zoneConfig.size;
      const zoneWallHeight = config.id === 'minigame2' ? 4 : 2; // Higher walls for basketball
      const zoneWallThickness = 0.1;

      // Zone North Wall
      const zoneNorthWallShape = new CANNON.Box(new CANNON.Vec3(zoneSize[0] / 2, zoneWallHeight / 2, zoneWallThickness / 2));
      const zoneNorthWall = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(zonePos[0], zoneWallHeight / 2, zonePos[2] - zoneSize[2] / 2),
        shape: zoneNorthWallShape,
        material: wallMaterial.current,
      });
      addBody(zoneNorthWall);
      bodiesRef.current.push(zoneNorthWall);

      // Zone South Wall
      const zoneSouthWall = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(zonePos[0], zoneWallHeight / 2, zonePos[2] + zoneSize[2] / 2),
        shape: zoneNorthWallShape,
        material: wallMaterial.current,
      });
      addBody(zoneSouthWall);
      bodiesRef.current.push(zoneSouthWall);

      // Zone East Wall
      const zoneEastWallShape = new CANNON.Box(new CANNON.Vec3(zoneWallThickness / 2, zoneWallHeight / 2, zoneSize[2] / 2));
      const zoneEastWall = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(zonePos[0] + zoneSize[0] / 2, zoneWallHeight / 2, zonePos[2]),
        shape: zoneEastWallShape,
        material: wallMaterial.current,
      });
      addBody(zoneEastWall);
      bodiesRef.current.push(zoneEastWall);

      // Zone West Wall
      const zoneWestWall = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(zonePos[0] - zoneSize[0] / 2, zoneWallHeight / 2, zonePos[2]),
        shape: zoneEastWallShape,
        material: wallMaterial.current,
      });
      addBody(zoneWestWall);
      bodiesRef.current.push(zoneWestWall);
    }

  }, [config, addBody, clearBodies, groundMaterial, wallMaterial, size]);

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <group>
      {/* FLOOR */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size.width, size.depth]} />
        <meshBasicMaterial color={themeFloorColor} />
      </mesh>

      {/* FLOOR GRID */}
      <gridHelper 
        args={[size.width, size.width / 2, '#888888', '#666666']} 
        position={[0, 0.01, 0]} 
      />

      {/* CEILING */}
      <mesh position={[0, size.height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size.width, size.depth]} />
        <meshBasicMaterial color={themeWallColor} side={THREE.DoubleSide} />
      </mesh>

      {/* NORTH WALL (negative Z) */}
      <mesh position={[0, size.height / 2, -size.depth / 2]}>
        <planeGeometry args={[size.width, size.height]} />
        <meshBasicMaterial color={themeWallColor} side={THREE.DoubleSide} />
      </mesh>

      {/* SOUTH WALL (positive Z) */}
      <mesh position={[0, size.height / 2, size.depth / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[size.width, size.height]} />
        <meshBasicMaterial color={themeWallColor} side={THREE.DoubleSide} />
      </mesh>

      {/* EAST WALL (positive X) */}
      <mesh position={[size.width / 2, size.height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[size.depth, size.height]} />
        <meshBasicMaterial color={themeWallColor} side={THREE.DoubleSide} />
      </mesh>

      {/* WEST WALL (negative X) */}
      <mesh position={[-size.width / 2, size.height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[size.depth, size.height]} />
        <meshBasicMaterial color={themeWallColor} side={THREE.DoubleSide} />
      </mesh>

      {/* PORTALS */}
      {portals.map((portal) => (
        <Portal key={portal.id} portal={portal} />
      ))}

      {/* REWARD BOXES (Main Lobby Only) */}
      {config.id === 'main' && portals.map((portal) => {
        const minigameId = portal.targetRoom as 'minigame1' | 'minigame2' | 'minigame3';
        
        // Only show box if spawned and not collected
        if (!spawnedBoxes[minigameId] || collectedBoxes[minigameId]) {
          return null;
        }
        
        // Calculate box position (in front of portal, slightly lower)
        const boxPosition = new THREE.Vector3(
          portal.position.x,
          portal.position.y - 0.5,
          portal.position.z
        );
        
        // Move box forward from portal (towards center of room)
        const direction = new THREE.Vector3(
          -portal.position.x,
          0,
          -portal.position.z
        ).normalize();
        boxPosition.add(direction.multiplyScalar(1.5));
        
        return (
          <mesh key={`reward-box-${portal.id}`} position={[boxPosition.x, boxPosition.y, boxPosition.z]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshBasicMaterial color={portal.color} />
          </mesh>
        );
      })}

      {/* =====================================================================
         MINIGAME ZONES
      ===================================================================== */}
      
      {/* MINIGAME 1: DICE GAME */}
      {config.id === 'minigame1' && (
        <>
          <MiniGameZone 
            position={MINIGAME_ZONE_CONFIG.minigame1.position}
            size={MINIGAME_ZONE_CONFIG.minigame1.size}
            color="#ff6666"
            label="Dice Game"
          />
          <DiceGame 
            position={MINIGAME_ZONE_CONFIG.minigame1.position}
            zoneSize={MINIGAME_ZONE_CONFIG.minigame1.size}
          />
        </>
      )}

      {/* MINIGAME 2: BASKETBALL GAME */}
      {config.id === 'minigame2' && (
        <>
          <MiniGameZone 
            position={MINIGAME_ZONE_CONFIG.minigame2.position}
            size={MINIGAME_ZONE_CONFIG.minigame2.size}
            color="#66ffff"
            label="Basketball Game"
          />
          <BasketballGame 
            position={MINIGAME_ZONE_CONFIG.minigame2.position}
            zoneSize={MINIGAME_ZONE_CONFIG.minigame2.size}
          />
        </>
      )}

      {/* MINIGAME 3: SIMON GAME */}
      {config.id === 'minigame3' && (
        <>
          <MiniGameZone 
            position={MINIGAME_ZONE_CONFIG.minigame3.position}
            size={MINIGAME_ZONE_CONFIG.minigame3.size}
            color="#9966ff"
            label="Simon Game"
          />
          <SimonGame 
            position={MINIGAME_ZONE_CONFIG.minigame3.position}
            zoneSize={MINIGAME_ZONE_CONFIG.minigame3.size}
          />
        </>
      )}

      {/* MINIGAME 4: COMING SOON */}
      {config.id === 'minigame4' && (
        <MiniGameZone 
          position={MINIGAME_ZONE_CONFIG.minigame4.position}
          size={MINIGAME_ZONE_CONFIG.minigame4.size}
          color="#aa66ff"
          label="Coming Soon"
        />
      )}
    </group>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// GET ROOM COLOR FROM THEME
function getRoomColor(roomId: string, type: 'floor' | 'wall', colors: ThemeColors): string {
  switch (roomId) {
    case 'main':
      return type === 'floor' ? colors.roomMainFloor : colors.roomMainWall;
    case 'minigame1':
      return type === 'floor' ? colors.roomDiceFloor : colors.roomDiceWall;
    case 'minigame2':
      return type === 'floor' ? colors.roomBasketballFloor : colors.roomBasketballWall;
    case 'minigame3':
      return type === 'floor' ? colors.roomSimonFloor : colors.roomSimonWall;
    case 'minigame4':
      return type === 'floor' ? colors.roomPurpleFloor : colors.roomPurpleWall;
    default:
      return type === 'floor' ? '#555566' : '#444455';
  }
}