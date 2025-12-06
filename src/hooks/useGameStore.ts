import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { RoomType, Portal } from '../types';
import { ROOM_CONFIGS, PLAYER_CONFIG } from '../config/rooms';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface DiceResult {
  dice1: number;
  dice2: number;
  dice3: number;
  total: number;
}

interface SaveSlot {
  id: string;
  name: string;
  timestamp: number;
}

interface SaveData {
  id: string;
  name: string;
  timestamp: number;
  currentRoom: RoomType;
  money: number;
  position: { x: number; y: number; z: number };
  lastAutoSave: number;
}

interface GameStore {
  // ========================================================================
  // CORE GAME STATE
  // ========================================================================
  currentRoom: RoomType;
  isPlaying: boolean;
  nearPortal: Portal | null;
  isLocked: boolean;
  playerTeleportTarget: { x: number; y: number; z: number } | null;
  
  // ECONOMY STATE
  money: number;

  // SAVE SYSTEM STATE
  currentSaveId: string | null;
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // in seconds
  lastAutoSaveTime: number;
  saveSlots: SaveSlot[];
  
  // ========================================================================
  // DICE GAME STATE
  // ========================================================================
  isNearMiniGame: boolean;
  isMiniGameActive: boolean;
  diceResult: DiceResult | null;
  isRolling: boolean;
  shouldTriggerRoll: boolean;
  currentBet: number | null;
  betAmount: number;
  lastBetForResult: number | null;
  lastBetAmountForResult: number;
  
  // ========================================================================
  // BASKETBALL GAME STATE
  // ========================================================================
  isNearBasketball: boolean;
  isBasketballActive: boolean;
  isHoldingBall: boolean;
  throwPower: number;
  isChargingThrow: boolean;
  basketballScore: number;
  basketballAttempts: number;
  basketballBetAmount: number;
  basketballBetPlaced: boolean;
  lastBasketballResult: 'win' | 'lose' | null;
  
  // ========================================================================
  // SIMON GAME STATE
  // ========================================================================
  isNearSimon: boolean;
  isSimonActive: boolean;
  simonBetAmount: number;
  simonBetPlaced: boolean;
  simonPattern: number[];
  simonPlayerPattern: number[];
  simonScore: number;
  simonGameMessage: string;
  simonIsShowingPattern: boolean;
  simonCanClick: boolean;
  simonLitButton: number | null;
  simonIsGameOver: boolean;
  
  // ========================================================================
  // CORE GAME ACTIONS
  // ========================================================================
  saveGame: (position: { x: number; y: number; z: number }, mode?: 'manual' | 'auto' | 'quick', slotName?: string) => string | null;
  loadGame: (saveId: string) => boolean;
  quickSave: () => string | null;
  deleteSave: (saveId: string) => boolean;
  getSaveSlotName: (mode: 'manual' | 'auto' | 'quick') => string;
  listSaves: () => SaveSlot[];
  clearAllSaves: () => void;
  toggleAutoSave: () => void;
  setAutoSaveInterval: (seconds: number) => void;
  checkAutoSave: () => void;

  setCurrentRoom: (room: RoomType) => void;
  setIsPlaying: (playing: boolean) => void;
  setNearPortal: (portal: Portal | null) => void;
  setIsLocked: (locked: boolean) => void;
  teleportToRoom: (room: RoomType) => void;
  
  // ========================================================================
  // ECONOMY ACTIONS
  // ========================================================================
  setMoney: (amount: number) => void;
  addMoney: (amount: number) => void;
  removeMoney: (amount: number) => boolean;
  
  // ========================================================================
  // DICE GAME ACTIONS
  // ========================================================================
  setIsNearMiniGame: (near: boolean) => void;
  setIsMiniGameActive: (active: boolean) => void;
  setDiceResult: (result: DiceResult | null) => void;
  setIsRolling: (rolling: boolean) => void;
  triggerRoll: () => void;
  clearTriggerRoll: () => void;
  setCurrentBet: (bet: number | null) => void;
  setBetAmount: (amount: number) => void;
  placeBet: (predictedSum: number, amount: number) => boolean;
  
  // ========================================================================
  // BASKETBALL GAME ACTIONS
  // ========================================================================
  setIsNearBasketball: (near: boolean) => void;
  setIsBasketballActive: (active: boolean) => void;
  setIsHoldingBall: (holding: boolean) => void;
  setThrowPower: (power: number) => void;
  setIsChargingThrow: (charging: boolean) => void;
  incrementBasketballScore: () => void;
  incrementBasketballAttempts: () => void;
  resetBasketballGame: () => void;
  placeBasketballBet: (amount: number) => boolean;
  resolveBasketballBet: (scored: boolean) => void;
  setPlayerTeleportTarget: (target: { x: number; y: number; z: number } | null) => void;
  enterBasketballZone: () => void;
  exitBasketballZone: () => void;
  
  // ========================================================================
  // SIMON GAME ACTIONS
  // ========================================================================
  setIsNearSimon: (near: boolean) => void;
  setIsSimonActive: (active: boolean) => void;
  startSimonGame: (betAmount: number) => boolean;
  exitSimonGame: () => void;
  addToSimonPattern: () => void;
  simonButtonClick: (button: number) => void;
  setSimonLitButton: (button: number | null) => void;
  setSimonShowingPattern: (showing: boolean) => void;
  setSimonCanClick: (canClick: boolean) => void;
  setSimonGameMessage: (message: string) => void;
}

// ============================================================================
// GAME STORE CREATION
// ============================================================================
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // INITIAL STATE
      // ------------------------------------------------------------------------
      
      // CORE GAME STATE
      currentRoom: 'main',
      isPlaying: false,
      nearPortal: null,
      isLocked: false,
      playerTeleportTarget: null,
      
      // ECONOMY STATE
      money: 100,

      // SAVE SYSTEM STATE
      currentSaveId: null,
      autoSaveEnabled: true,
      autoSaveInterval: 300,
      lastAutoSaveTime: 0,
      saveSlots: [],
      
      // DICE GAME STATE
      isNearMiniGame: false,
      isMiniGameActive: false,
      diceResult: null,
      isRolling: false,
      shouldTriggerRoll: false,
      currentBet: null,
      betAmount: 0,
      lastBetForResult: null,
      lastBetAmountForResult: 0,
      
      // BASKETBALL GAME STATE
      isNearBasketball: false,
      isBasketballActive: false,
      isHoldingBall: false,
      throwPower: 0,
      isChargingThrow: false,
      basketballScore: 0,
      basketballAttempts: 0,
      basketballBetAmount: 0,
      basketballBetPlaced: false,
      lastBasketballResult: null,
      
      // SIMON GAME STATE
      isNearSimon: false,
      isSimonActive: false,
      simonBetAmount: 10,
      simonBetPlaced: false,
      simonPattern: [],
      simonPlayerPattern: [],
      simonScore: 0,
      simonGameMessage: '',
      simonIsShowingPattern: false,
      simonCanClick: false,
      simonLitButton: null,
      simonIsGameOver: false,

      // ========================================================================
      // CORE GAME ACTIONS
      // ========================================================================
      
      // SAVE SYSTEM ACTIONS
      // ------------------------------------------------------------------------
      saveGame: (position, mode = 'manual', slotName?: string) => {
        const state = get();
        const timestamp = Date.now();
        const saveId = `${mode}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
        
        const saveData: SaveData = {
          id: saveId,
          name: slotName || state.getSaveSlotName(mode),
          timestamp,
          currentRoom: state.currentRoom,
          money: state.money,
          position,
          lastAutoSave: mode === 'auto' ? timestamp : state.lastAutoSaveTime,
        };
        
        try {
          // Save to localStorage
          localStorage.setItem(`mini3d_save_${saveId}`, JSON.stringify(saveData));
          
          // Update save slot list
          const existingIndex = state.saveSlots.findIndex(slot => slot.id === saveId);
          const newSlot: SaveSlot = {
            id: saveId,
            name: saveData.name,
            timestamp,
          };
          
          let updatedSlots = [...state.saveSlots];
          if (existingIndex >= 0) {
            updatedSlots[existingIndex] = newSlot;
          } else {
            updatedSlots.push(newSlot);
            // Keep only last 20 saves
            if (updatedSlots.length > 20) {
              updatedSlots = updatedSlots.slice(-20);
            }
          }
          
          // Sort by timestamp (newest first)
          updatedSlots.sort((a, b) => b.timestamp - a.timestamp);
          
          set({ 
            currentSaveId: saveId,
            saveSlots: updatedSlots,
            lastAutoSaveTime: mode === 'auto' ? timestamp : state.lastAutoSaveTime,
          });
          
          // If quick save, also store as last quick save
          if (mode === 'quick') {
            localStorage.setItem('mini3d_last_quicksave', saveId);
          }
          
          console.log(`Game saved (${mode}): ${saveData.name}`);
          return saveId;
        } catch (error) {
          console.error('Failed to save game:', error);
          return null;
        }
      },
      
      loadGame: (saveId) => {
        try {
          const raw = localStorage.getItem(`mini3d_save_${saveId}`);
          if (!raw) return false;
          
          const saveData = JSON.parse(raw) as SaveData;
          
          set({
            currentSaveId: saveId,
            currentRoom: saveData.currentRoom,
            money: saveData.money,
            playerTeleportTarget: saveData.position,
            isNearMiniGame: false,
            isMiniGameActive: false,
            isNearBasketball: false,
            isBasketballActive: false,
            isHoldingBall: false,
            throwPower: 0,
            isChargingThrow: false,
            basketballScore: 0,
            basketballAttempts: 0,
            basketballBetAmount: 0,
            basketballBetPlaced: false,
            lastBasketballResult: null,
            diceResult: null,
            currentBet: null,
            betAmount: 0,
            shouldTriggerRoll: false,
          });
          
          console.log(`Game loaded: ${saveData.name}`);
          return true;
        } catch (error) {
          console.error('Failed to load game:', error);
          return false;
        }
      },
      
      quickSave: () => {
        const state = get();
        const roomConfig = ROOM_CONFIGS[state.currentRoom];
        const spawnPos = roomConfig.spawnPosition || { x: 0, y: PLAYER_CONFIG.spawnHeight, z: 0 };
        const position = state.playerTeleportTarget || { 
          x: spawnPos.x, 
          y: spawnPos.y, 
          z: spawnPos.z 
        };
        
        return state.saveGame(position, 'quick');
      },
      
      deleteSave: (saveId) => {
        try {
          const state = get();
          localStorage.removeItem(`mini3d_save_${saveId}`);
          
          // Remove from save slots
          const updatedSlots = state.saveSlots.filter(slot => slot.id !== saveId);
          
          set({ saveSlots: updatedSlots });
          
          // If deleting current save, clear currentSaveId
          if (state.currentSaveId === saveId) {
            set({ currentSaveId: null });
          }
          
          return true;
        } catch (error) {
          console.error('Failed to delete save:', error);
          return false;
        }
      },
      
      getSaveSlotName: (mode) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString();
        
        switch (mode) {
          case 'auto':
            return `Auto Save (${timeStr})`;
          case 'quick':
            return `Quick Save (${timeStr})`;
          case 'manual':
          default:
            return `Manual Save (${dateStr} ${timeStr})`;
        }
      },
      
      listSaves: () => {
        const state = get();
        return state.saveSlots;
      },
      
      clearAllSaves: () => {
        try {
          // Remove all save data from localStorage
          const state = get();
          state.saveSlots.forEach(slot => {
            localStorage.removeItem(`mini3d_save_${slot.id}`);
          });
          
          set({
            saveSlots: [],
            currentSaveId: null,
            lastAutoSaveTime: 0,
          });
          
          return true;
        } catch (error) {
          console.error('Failed to clear saves:', error);
          return false;
        }
      },
      
      toggleAutoSave: () => {
        set((state) => ({ autoSaveEnabled: !state.autoSaveEnabled }));
      },
      
      setAutoSaveInterval: (seconds) => {
        set({ autoSaveInterval: Math.max(30, Math.min(3600, seconds)) }); // 30s to 1h
      },
      
      checkAutoSave: () => {
        const state = get();
        const now = Date.now();
        const timeSinceLastAutoSave = (now - state.lastAutoSaveTime) / 1000; // in seconds
        
        if (state.autoSaveEnabled && timeSinceLastAutoSave >= state.autoSaveInterval) {
          console.log('Auto-save triggered');
          return true;
        }
        return false;
      },

      // ROOM MANAGEMENT
      // ------------------------------------------------------------------------
      setCurrentRoom: (room) => {
        const config = ROOM_CONFIGS[room];
        const spawn = config.spawnPosition;
        const position = spawn
          ? { x: spawn.x, y: spawn.y, z: spawn.z }
          : { x: 0, y: PLAYER_CONFIG.spawnHeight, z: 0 };

        set({ 
          currentRoom: room, 
          diceResult: null,
          isNearMiniGame: false,
          isNearBasketball: false,
          currentBet: null,
          betAmount: 0,
          shouldTriggerRoll: false,
        });

        // Auto-save when changing rooms
        get().saveGame(position, 'auto');
      },
      
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setNearPortal: (portal) => set({ nearPortal: portal }),
      setIsLocked: (locked) => set({ isLocked: locked }),
      
      teleportToRoom: (room) => {
        const config = ROOM_CONFIGS[room];
        const spawn = config.spawnPosition;
        const position = spawn
          ? { x: spawn.x, y: spawn.y, z: spawn.z }
          : { x: 0, y: PLAYER_CONFIG.spawnHeight, z: 0 };

        set({ 
          currentRoom: room, 
          nearPortal: null,
          isNearMiniGame: false,
          isMiniGameActive: false,
          isNearBasketball: false,
          isBasketballActive: false,
          isHoldingBall: false,
          throwPower: 0,
          isChargingThrow: false,
          basketballScore: 0,
          basketballAttempts: 0,
          basketballBetAmount: 0,
          basketballBetPlaced: false,
          lastBasketballResult: null,
          diceResult: null,
          currentBet: null,
          betAmount: 0,
          shouldTriggerRoll: false,
        });

        // Auto-save when teleporting
        get().saveGame(position, 'auto');
      },
      
      // ========================================================================
      // ECONOMY ACTIONS
      // ========================================================================
      setMoney: (amount) => {
        set({ money: Math.max(0, amount) });
      },
      
      addMoney: (amount) => {
        set((state) => ({ money: state.money + amount }));
      },
      
      removeMoney: (amount) => {
        const state = get();
        if (state.money >= amount) {
          set({ money: state.money - amount });
          return true;
        }
        return false;
      },
      
      // ========================================================================
      // DICE GAME ACTIONS
      // ========================================================================
      setIsNearMiniGame: (near) => set({ isNearMiniGame: near }),
      setIsMiniGameActive: (active) => set({ isMiniGameActive: active }),
      setDiceResult: (result) => set({ diceResult: result }),
      setIsRolling: (rolling) => set({ isRolling: rolling }),
      
      triggerRoll: () => {
        const state = get();
        if (state.isRolling || state.currentBet === null || state.betAmount <= 0) return;
        set({ 
          shouldTriggerRoll: true,
          lastBetForResult: state.currentBet,
          lastBetAmountForResult: state.betAmount,
        });
      },
      
      clearTriggerRoll: () => set({ shouldTriggerRoll: false }),
      
      setCurrentBet: (bet) => set({ currentBet: bet }),
      setBetAmount: (amount) => set({ betAmount: amount }),
      
      placeBet: (predictedSum, amount) => {
        const state = get();
        if (state.money < amount || amount <= 0) return false;
        if (predictedSum < 2 || predictedSum > 12) return false;
        
        set({ 
          money: state.money - amount,
          currentBet: predictedSum,
          betAmount: amount,
        });
        return true;
      },
      
      // ========================================================================
      // BASKETBALL GAME ACTIONS
      // ========================================================================
      setIsNearBasketball: (near) => set({ isNearBasketball: near }),
      setIsBasketballActive: (active) => set({ isBasketballActive: active }),
      setIsHoldingBall: (holding) => set({ isHoldingBall: holding }),
      setThrowPower: (power) => set({ throwPower: Math.min(100, Math.max(0, power)) }),
      setIsChargingThrow: (charging) => set({ isChargingThrow: charging }),
      incrementBasketballScore: () => set((state) => ({ basketballScore: state.basketballScore + 1 })),
      incrementBasketballAttempts: () => set((state) => ({ basketballAttempts: state.basketballAttempts + 1 })),
      
      resetBasketballGame: () => set({
        basketballScore: 0,
        basketballAttempts: 0,
        isHoldingBall: false,
        throwPower: 0,
        isChargingThrow: false,
        basketballBetAmount: 0,
        basketballBetPlaced: false,
        lastBasketballResult: null,
      }),
      
      placeBasketballBet: (amount) => {
        const state = get();
        if (state.money < amount || amount <= 0) return false;
        set({ 
          money: state.money - amount,
          basketballBetAmount: amount,
          basketballBetPlaced: true,
          lastBasketballResult: null,
        });
        return true;
      },
      
      resolveBasketballBet: (scored) => {
        const state = get();
        if (!state.basketballBetPlaced) return;
        
        if (scored) {
          set({ 
            money: state.money + state.basketballBetAmount * 2,
            lastBasketballResult: 'win',
            basketballBetPlaced: false,
          });
        } else {
          set({ 
            lastBasketballResult: 'lose',
            basketballBetPlaced: false,
          });
        }
      },
      
      setPlayerTeleportTarget: (target) => set({ playerTeleportTarget: target }),
      
      enterBasketballZone: () => {
        set({ 
          playerTeleportTarget: { x: 0, y: 1.8, z: 1.5 },
          isBasketballActive: true,
        });
      },
      
      exitBasketballZone: () => {
        set({ 
          playerTeleportTarget: { x: 0, y: 1.8, z: 7 },
          isBasketballActive: false,
          isHoldingBall: false,
          throwPower: 0,
          isChargingThrow: false,
          basketballBetPlaced: false,
          basketballBetAmount: 0,
          lastBasketballResult: null,
        });
      },
      
      // ========================================================================
      // SIMON GAME ACTIONS
      // ========================================================================
      setIsNearSimon: (near) => set({ isNearSimon: near }),
      setIsSimonActive: (active) => set({ isSimonActive: active }),
      
      startSimonGame: (betAmount) => {
        const state = get();
        if (state.money < betAmount || betAmount <= 0) return false;
        
        set({
          money: state.money - betAmount,
          simonBetAmount: betAmount,
          simonBetPlaced: true,
          simonPattern: [],
          simonPlayerPattern: [],
          simonScore: 0,
          simonIsGameOver: false,
          simonGameMessage: 'Game started!',
        });
        return true;
      },
      
      exitSimonGame: () => set({
        isSimonActive: false,
        simonBetPlaced: false,
        simonPattern: [],
        simonPlayerPattern: [],
        simonScore: 0,
        simonIsShowingPattern: false,
        simonCanClick: false,
        simonLitButton: null,
        simonIsGameOver: false,
        simonGameMessage: '',
      }),
      
      addToSimonPattern: () => {
        const newButton = Math.floor(Math.random() * 5); // 0~4 (5 buttons)
        set((state) => ({
          simonPattern: [...state.simonPattern, newButton],
          simonPlayerPattern: [],
          simonIsShowingPattern: true,
          simonCanClick: false,
          simonGameMessage: 'Memorize the pattern!',
        }));
      },
      
      simonButtonClick: (button) => {
        const state = get();
        if (!state.simonCanClick || state.simonIsShowingPattern || state.simonIsGameOver) return;
        
        const newPlayerPattern = [...state.simonPlayerPattern, button];
        const currentIndex = newPlayerPattern.length - 1;
        
        // Wrong button
        if (state.simonPattern[currentIndex] !== button) {
          set({
            simonPlayerPattern: newPlayerPattern,
            simonIsGameOver: true,
            simonCanClick: false,
            simonGameMessage: `Game over! Final score: ${state.simonScore}`,
          });
          return;
        }
        
        // Pattern completed
        if (newPlayerPattern.length === state.simonPattern.length) {
          const newScore = state.simonScore + 1;
          const reward = state.simonBetAmount * newScore;
          
          if (newScore >= 10) {
            set({
              simonPlayerPattern: newPlayerPattern,
              simonScore: newScore,
              money: state.money + reward,
              simonGameMessage: `Cleared 10 rounds! Reward: +${reward}`,
              simonCanClick: false,
              simonIsGameOver: true,
            });
          } else {
            set({
              simonPlayerPattern: newPlayerPattern,
              simonScore: newScore,
              money: state.money + reward,
              simonGameMessage: `Correct! +${reward}`,
              simonCanClick: false,
            });
          }
        } else {
          set({ simonPlayerPattern: newPlayerPattern });
        }
      },
      
      setSimonLitButton: (button) => set({ simonLitButton: button }),
      setSimonShowingPattern: (showing) => set({ simonIsShowingPattern: showing }),
      setSimonCanClick: (canClick) => set({ simonCanClick: canClick }),
      setSimonGameMessage: (message) => set({ simonGameMessage: message }),
    }),
    {
      name: 'mini3d-game-settings',
      partialize: (state) => ({
        // Only persist these fields from the save system
        saveSlots: state.saveSlots,
        currentSaveId: state.currentSaveId,
        autoSaveEnabled: state.autoSaveEnabled,
        autoSaveInterval: state.autoSaveInterval,
        lastAutoSaveTime: state.lastAutoSaveTime,
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);