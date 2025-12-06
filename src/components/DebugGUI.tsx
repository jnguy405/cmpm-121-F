import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import GUI from 'lil-gui';
import type { RoomType, SaveSlot } from '../types';
import { useGameStore } from '../hooks/useGameStore';
import { PLAYER_CONFIG, PHYSICS_CONFIG } from '../config/rooms';
import { useTheme } from '../hooks/useTheme';

// ============================================================================
// DEBUG GUI COMPONENT
// ============================================================================
export function DebugGUI() {
  
  // HOOKS & STATE
  const guiRef = useRef<GUI | null>(null);
  const themeStateRef = useRef<{ darkMode: boolean } | null>(null);
  const saveSlotsRef = useRef<SaveSlot[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saveListFolderRef = useRef<any>(null);
  const { camera } = useThree();
  const { 
    currentRoom, 
    setCurrentRoom, 
    money, 
    setMoney,
    saveGame,
    loadGame,
    deleteSave,
    listSaves,
    clearAllSaves,
    autoSaveEnabled,
    toggleAutoSave,
    autoSaveInterval,
    setAutoSaveInterval,
    currentSaveId,
    playerTeleportTarget,
  } = useGameStore();
  
  const { isDarkMode, toggleTheme } = useTheme();

  // GUI INITIALIZATION & SETUP
  useEffect(() => {
    // Guard: Only create GUI once
    if (guiRef.current) return;

    const gui = new GUI({ title: '🎮 Debug Panel' });
    guiRef.current = gui;

    // PLAYER SETTINGS FOLDER
    const playerFolder = gui.addFolder('Player'); 
    playerFolder.add(PLAYER_CONFIG, 'moveSpeed', 5, 30, 1).name('Move Speed');
    playerFolder.add(PLAYER_CONFIG, 'jumpForce', 1, 15, 0.5).name('Jump Force');
    playerFolder.add(PLAYER_CONFIG, 'sprintMultiplier', 1, 3, 0.1).name('Sprint Multiplier');
    playerFolder.add(PLAYER_CONFIG, 'mouseSensitivity', 0.1, 2, 0.05).name('Mouse Sensitivity');
    playerFolder.close();

    // ========================================================================
    // INVENTORY & MONEY FOLDER
    // ========================================================================
    const inventoryFolder = gui.addFolder('💰 Inventory');
    
    // Money state object for GUI
    const inventoryState = { money: money };
    
    // Money slider with live updates
    inventoryFolder.add(inventoryState, 'money', 0, 10000, 1)
      .name('Money')
      .listen() // Auto-update display
      .onChange((value: number) => {
        setMoney(value);
      });
    
    // Quick money actions
    const quickMoneyActions = {
      add100: () => {
        const newMoney = useGameStore.getState().money + 100;
        setMoney(newMoney);
        inventoryState.money = newMoney;
      },
      add1000: () => {
        const newMoney = useGameStore.getState().money + 1000;
        setMoney(newMoney);
        inventoryState.money = newMoney;
      },
      reset: () => {
        setMoney(100);
        inventoryState.money = 100;
      },
    };
    
    // Add action buttons
    inventoryFolder.add(quickMoneyActions, 'add100').name('+100');
    inventoryFolder.add(quickMoneyActions, 'add1000').name('+1000');
    inventoryFolder.add(quickMoneyActions, 'reset').name('Reset (100)');
    
    // Live money updates from store
    const updateMoney = () => {
      inventoryState.money = useGameStore.getState().money;
      requestAnimationFrame(updateMoney);
    };
    updateMoney();
    
    inventoryFolder.open();

    // ========================================================================
    // PHYSICS SETTINGS FOLDER
    // ========================================================================
    const physicsFolder = gui.addFolder('Physics');
    physicsFolder.add(PHYSICS_CONFIG, 'gravity', -50, 0, 1).name('Gravity');
    physicsFolder.add(PHYSICS_CONFIG, 'groundFriction', 0, 1, 0.1).name('Ground Friction');
    physicsFolder.close();

    // ========================================================================
    // CAMERA POSITION MONITOR FOLDER
    // ========================================================================
    const cameraFolder = gui.addFolder('Camera Position');
    const cameraPos = { x: 0, y: 0, z: 0 };
    
    // Read-only position displays
    cameraFolder.add(cameraPos, 'x').name('X').listen().disable();
    cameraFolder.add(cameraPos, 'y').name('Y').listen().disable();
    cameraFolder.add(cameraPos, 'z').name('Z').listen().disable();
    
    // Live camera position updates
    const updateCamera = () => {
      cameraPos.x = Math.round(camera.position.x * 100) / 100;
      cameraPos.y = Math.round(camera.position.y * 100) / 100;
      cameraPos.z = Math.round(camera.position.z * 100) / 100;
      requestAnimationFrame(updateCamera);
    };
    updateCamera();
    
    cameraFolder.close();

    // ========================================================================
    // ROOM NAVIGATION FOLDER
    // ========================================================================
    const roomFolder = gui.addFolder('Rooms');
    const roomOptions: { room: RoomType } = {
      room: currentRoom,
    };
    
    // Room selector dropdown
    roomFolder.add(roomOptions, 'room', ['main', 'minigame1', 'minigame2', 'minigame3', 'minigame4'])
      .name('Current Room')
      .onChange((value: RoomType) => {
        setCurrentRoom(value);
      });
    
    roomFolder.close();

    // ========================================================================
    // THEME SETTINGS FOLDER
    // ========================================================================
    const themeFolder = gui.addFolder('Theme');
    const themeState = { darkMode: isDarkMode };
    themeStateRef.current = themeState;
    
    // Theme toggle switch
    themeFolder.add(themeState, 'darkMode')
      .name('Dark Mode')
      .listen() // Auto-update display
      .onChange((value: boolean) => {
        if (value !== isDarkMode) {
          toggleTheme();
        }
      });
    
    themeFolder.close();

    // ========================================================================
    // SAVE SYSTEM FOLDER
    // ========================================================================
    const saveFolder = gui.addFolder('💾 Save System');
    
    // Auto-save settings
    const saveSettings = {
      autoSave: autoSaveEnabled,
      autoSaveInterval: autoSaveInterval,
      currentSave: currentSaveId || 'None',
      playerPosition: playerTeleportTarget 
        ? `${playerTeleportTarget.x.toFixed(1)}, ${playerTeleportTarget.y.toFixed(1)}, ${playerTeleportTarget.z.toFixed(1)}`
        : 'No position',
    };
    
    // Auto-save toggle
    saveFolder.add(saveSettings, 'autoSave')
      .name('Auto-save')
      .listen()
      .onChange((value: boolean) => {
        if (value !== autoSaveEnabled) {
          toggleAutoSave();
        }
      });
    
    // Auto-save interval slider
    saveFolder.add(saveSettings, 'autoSaveInterval', 30, 3600, 30)
      .name('Auto-save Interval (s)')
      .listen()
      .onChange((value: number) => {
        setAutoSaveInterval(value);
      });
    
    // Current save display (read-only)
    saveFolder.add(saveSettings, 'currentSave')
      .name('Current Save')
      .listen()
      .disable();
    
    // Player position display (read-only)
    saveFolder.add(saveSettings, 'playerPosition')
      .name('Player Position')
      .listen()
      .disable();
    
    // Quick save/load buttons
    const saveActions = {
      quickSave: () => {
        const position = playerTeleportTarget || { 
          x: camera.position.x, 
          y: 1.8, 
          z: camera.position.z 
        };
        
        const saveId = saveGame(position, 'quick');
        if (saveId) {
          saveSettings.currentSave = saveId;
          refreshSaveList();
          console.log('Quick save successful');
        }
      },
      quickLoad: () => {
        // Get last quick save ID from localStorage
        const lastQuickSaveId = localStorage.getItem('mini3d_last_quicksave');
        if (lastQuickSaveId) {
          if (loadGame(lastQuickSaveId)) {
            saveSettings.currentSave = currentSaveId || 'Loaded';
            console.log('Quick load successful');
          }
        } else {
          console.log('No quick save found');
        }
      },
      manualSave: () => {
        const position = playerTeleportTarget || { 
          x: camera.position.x, 
          y: 1.8, 
          z: camera.position.z 
        };
        const saveName = prompt('Save name (optional):') || undefined;
        const saveId = saveGame(position, 'manual', saveName);
        if (saveId) {
          saveSettings.currentSave = saveId;
          refreshSaveList();
        }
      },
      refreshSaves: () => {
        refreshSaveList();
      },
      clearAll: () => {
        if (confirm('Are you sure you want to delete ALL save files?')) {
          clearAllSaves();
          saveSettings.currentSave = 'None';
          refreshSaveList();
          console.log('All saves cleared');
        }
      },
    };
    
    saveFolder.add(saveActions, 'quickSave').name('Quick Save (F5)');
    saveFolder.add(saveActions, 'quickLoad').name('Quick Load (F9)');
    saveFolder.add(saveActions, 'manualSave').name('Manual Save');
    saveFolder.add(saveActions, 'refreshSaves').name('Refresh List');
    saveFolder.add(saveActions, 'clearAll').name('⚠️ Clear All Saves');
    
    // Create initial save list folder
    createSaveListFolder();
    
    // Function to create fresh save list folder
    function createSaveListFolder() {
      // Remove existing save list folder if it exists
      if (saveListFolderRef.current) {
        // We can't remove folders directly, so we'll hide it
        saveListFolderRef.current.hide();
        // Remove from parent's folders array
        const parent = saveListFolderRef.current.parent;
        if (parent && parent.folders) {
          const index = parent.folders.indexOf(saveListFolderRef.current);
          if (index > -1) {
            parent.folders.splice(index, 1);
          }
        }
      }
      
      // Create new save list folder
      saveListFolderRef.current = saveFolder.addFolder('Save Slots');
      saveListFolderRef.current.open();
      
      // Populate with current saves
      const slots = listSaves();
      saveSlotsRef.current = slots;
      
      if (slots.length === 0) {
        // Create a simple message if no saves
        const messageObj = { message: 'No save files' };
        saveListFolderRef.current.add(messageObj, 'message').disable();
      } else {
        slots.forEach((slot, index) => {
          // Create a sub-folder for each save slot
          const slotFolder = saveListFolderRef.current.addFolder(`Save ${index + 1}: ${slot.name}`);
          
          const slotObj = {
            name: slot.name,
            timestamp: new Date(slot.timestamp).toLocaleString(),
            load: () => {
              if (loadGame(slot.id)) {
                saveSettings.currentSave = slot.id;
                console.log(`Loaded save: ${slot.name}`);
              }
            },
            delete: () => {
              if (confirm(`Delete save "${slot.name}"?`)) {
                deleteSave(slot.id);
                // Recreate the save list after a short delay
                setTimeout(() => {
                  createSaveListFolder();
                }, 100);
              }
            }
          };
          
          slotFolder.add(slotObj, 'name').disable();
          slotFolder.add(slotObj, 'timestamp').disable();
          slotFolder.add(slotObj, 'load').name('Load This Save');
          slotFolder.add(slotObj, 'delete').name('Delete This Save');
          slotFolder.close();
        });
      }
    }
    
    // Function to refresh save list
    function refreshSaveList() {
      const slots = listSaves();
      
      // Only recreate if saves have actually changed
      if (JSON.stringify(slots) !== JSON.stringify(saveSlotsRef.current)) {
        saveSlotsRef.current = slots;
        createSaveListFolder();
      }
      
      // Update current save display
      saveSettings.currentSave = currentSaveId || 'None';
      
      // Update player position display
      const storeState = useGameStore.getState();
      if (storeState.playerTeleportTarget) {
        const pos = storeState.playerTeleportTarget;
        saveSettings.playerPosition = `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
      }
      
      // Update auto-save settings
      saveSettings.autoSave = autoSaveEnabled;
      saveSettings.autoSaveInterval = autoSaveInterval;
    }
    
    // Set up periodic refresh
    let frameCount = 0;
    const autoRefresh = () => {
      frameCount++;
      
      if (frameCount % 120 === 0) { // Check every 2 seconds at 60fps
        refreshSaveList();
      }
      
      requestAnimationFrame(autoRefresh);
    };
    autoRefresh();
    
    saveFolder.open();

    // ========================================================================
    // CLEANUP FUNCTION
    // ========================================================================
    return () => {
      if (guiRef.current) {
        guiRef.current.destroy();
      }
      guiRef.current = null;
      themeStateRef.current = null;
      saveListFolderRef.current = null;
    };
  }, [camera, currentRoom, setCurrentRoom, money, setMoney, toggleTheme, isDarkMode, 
    autoSaveEnabled, autoSaveInterval, clearAllSaves, currentSaveId, deleteSave, 
    listSaves, loadGame, playerTeleportTarget, saveGame, setAutoSaveInterval, toggleAutoSave]);

  // Update theme state in GUI when theme changes
  useEffect(() => {
    if (themeStateRef.current) {
      themeStateRef.current.darkMode = isDarkMode;
    }
  }, [isDarkMode]);

  // RENDER
  return null; 
}