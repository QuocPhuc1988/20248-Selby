import { create } from 'zustand';

type Tile = {
  id: number;
  value: number;
  position: [number, number];
  mergedFrom?: [Tile, Tile];
};

type GameState = {
  grid: (number | null)[][];
  tiles: Tile[];
  score: number;
  bestScore: number;
  gameOver: boolean;
  won: boolean;
  nextId: number;
  isProcessing: boolean;
  victoryImage: string | null;
  txHash: string | null;
  feed: { id: string; score: number; image: string; address: string; timestamp: number }[];
  setProcessing: (status: boolean) => void;
  setVictoryImage: (url: string | null) => void;
  setTxHash: (hash: string | null) => void;
  addToFeed: (post: { score: number; image: string; address: string }) => void;
  initGame: () => void;
  move: (direction: 'up' | 'down' | 'left' | 'right') => void;
  reset: () => void;
};

const GRID_SIZE = 4;

const getEmptyPositions = (grid: (number | null)[][]) => {
  const positions: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) {
        positions.push([r, c]);
      }
    }
  }
  return positions;
};

export const useGameStore = create<GameState>((set, get) => ({
  grid: Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)),
  tiles: [],
  score: 0,
  bestScore: 0,
  gameOver: false,
  won: false,
  nextId: 0,
  isProcessing: false,
  victoryImage: null,
  txHash: null,
  feed: [],

  setProcessing: (isProcessing) => set({ isProcessing }),
  setVictoryImage: (victoryImage) => set({ victoryImage }),
  setTxHash: (txHash) => set({ txHash }),
  addToFeed: (post) => set((state) => ({
    feed: [
      { ...post, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() },
      ...state.feed
    ]
  })),

  initGame: () => {
    const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    const tiles: Tile[] = [];
    let nextId = 0;

    // Add two initial tiles
    for (let i = 0; i < 2; i++) {
      const emptyPositions = getEmptyPositions(grid);
      if (emptyPositions.length > 0) {
        const [r, c] = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
        const value = Math.random() < 0.9 ? 2 : 4;
        grid[r][c] = value;
        tiles.push({ id: nextId++, value, position: [r, c] });
      }
    }

    set({ grid, tiles, score: 0, gameOver: false, won: false, nextId, victoryImage: null, txHash: null, isProcessing: false });
  },

  reset: () => get().initGame(),

  move: (direction) => {
    const { grid, tiles, score, bestScore, gameOver, won, nextId } = get();
    if (gameOver) return;

    let newGrid = grid.map(row => [...row]);
    let newTiles: Tile[] = tiles.map(tile => ({ ...tile, mergedFrom: undefined }));
    let newScore = score;
    let moved = false;
    let currentNextId = nextId;

    const traverse = (callback: (r: number, c: number) => void) => {
      if (direction === 'up') {
        for (let c = 0; c < GRID_SIZE; c++) {
          for (let r = 0; r < GRID_SIZE; r++) callback(r, c);
        }
      } else if (direction === 'down') {
        for (let c = 0; c < GRID_SIZE; c++) {
          for (let r = GRID_SIZE - 1; r >= 0; r--) callback(r, c);
        }
      } else if (direction === 'left') {
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) callback(r, c);
        }
      } else if (direction === 'right') {
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = GRID_SIZE - 1; c >= 0; c--) callback(r, c);
        }
      }
    };

    const getVector = () => {
      if (direction === 'up') return [-1, 0];
      if (direction === 'down') return [1, 0];
      if (direction === 'left') return [0, -1];
      return [0, 1];
    };

    const vector = getVector();

    traverse((r, c) => {
      const value = newGrid[r][c];
      if (value === null) return;

      let currR = r;
      let currC = c;
      let nextR = r + vector[0];
      let nextC = c + vector[1];

      while (
        nextR >= 0 && nextR < GRID_SIZE &&
        nextC >= 0 && nextC < GRID_SIZE &&
        newGrid[nextR][nextC] === null
      ) {
        currR = nextR;
        currC = nextC;
        nextR += vector[0];
        nextC += vector[1];
      }

      if (
        nextR >= 0 && nextR < GRID_SIZE &&
        nextC >= 0 && nextC < GRID_SIZE &&
        newGrid[nextR][nextC] === value
      ) {
        // Merge
        const targetTile = newTiles.find(t => t.position[0] === nextR && t.position[1] === nextC && !t.mergedFrom);
        if (targetTile) {
          const movingTile = newTiles.find(t => t.position[0] === r && t.position[1] === c);
          if (movingTile) {
            const newValue = value * 2;
            newGrid[nextR][nextC] = newValue;
            newGrid[r][c] = null;
            
            // Update tiles
            newTiles = newTiles.filter(t => t.id !== movingTile.id && t.id !== targetTile.id);
            newTiles.push({
              id: currentNextId++,
              value: newValue,
              position: [nextR, nextC],
              mergedFrom: [movingTile, targetTile]
            });

            newScore += newValue;
            moved = true;
          }
        } else {
          // Can't merge yet (already merged in this turn)
          if (currR !== r || currC !== c) {
            newGrid[currR][currC] = value;
            newGrid[r][c] = null;
            const tile = newTiles.find(t => t.position[0] === r && t.position[1] === c);
            if (tile) tile.position = [currR, currC];
            moved = true;
          }
        }
      } else {
        // Move to empty
        if (currR !== r || currC !== c) {
          newGrid[currR][currC] = value;
          newGrid[r][c] = null;
          const tile = newTiles.find(t => t.position[0] === r && t.position[1] === c);
          if (tile) tile.position = [currR, currC];
          moved = true;
        }
      }
    });

    if (moved) {
      const emptyPositions = getEmptyPositions(newGrid);
      if (emptyPositions.length > 0) {
        const [r, c] = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
        const value = Math.random() < 0.9 ? 2 : 4;
        newGrid[r][c] = value;
        newTiles.push({ id: currentNextId++, value, position: [r, c] });
      }

      // Check game over
      let canMove = getEmptyPositions(newGrid).length > 0;
      if (!canMove) {
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const val = newGrid[r][c];
            if (
              (r + 1 < GRID_SIZE && newGrid[r + 1][c] === val) ||
              (c + 1 < GRID_SIZE && newGrid[r][c + 1] === val)
            ) {
              canMove = true;
              break;
            }
          }
          if (canMove) break;
        }
      }

      set({
        grid: newGrid,
        tiles: newTiles,
        score: newScore,
        bestScore: Math.max(newScore, bestScore),
        gameOver: !canMove,
        won: won || newTiles.some(t => t.value === 2048),
        nextId: currentNextId
      });
    }
  }
}));
