
export type CellValue = number | null;

export interface Cell {
  value: CellValue;
  initial: boolean;
  notes: number[];
}

export type Grid = Cell[][];

export function generateSolution(): number[][] {
  const grid: number[][] = Array(6).fill(0).map(() => Array(6).fill(0));

  function isValid(r: number, c: number, val: number): boolean {
    // Row
    for (let i = 0; i < 6; i++) if (grid[r][i] === val) return false;
    // Col
    for (let i = 0; i < 6; i++) if (grid[i][c] === val) return false;
    // Block (2x3)
    const startRow = Math.floor(r / 2) * 2;
    const startCol = Math.floor(c / 3) * 3;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[startRow + i][startCol + j] === val) return false;
      }
    }
    return true;
  }

  function solve(): boolean {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (grid[r][c] === 0) {
          const nums = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
          for (const num of nums) {
            if (isValid(r, c, num)) {
              grid[r][c] = num;
              if (solve()) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve();
  return grid;
}

export function generatePuzzle(solution: number[][], difficulty: number = 18): Grid {
  const puzzle: Grid = solution.map(row => 
    row.map(val => ({ value: val, initial: true, notes: [] }))
  );

  let attempts = 36 - difficulty;
  while (attempts > 0) {
    const r = Math.floor(Math.random() * 6);
    const c = Math.floor(Math.random() * 6);
    if (puzzle[r][c].value !== null) {
      puzzle[r][c].value = null;
      puzzle[r][c].initial = false;
      attempts--;
    }
  }

  return puzzle;
}

export function isComplete(grid: Grid): boolean {
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (grid[r][c].value === null) return false;
    }
  }
  return true;
}

export function checkConflicts(grid: Grid, r: number, c: number, val: number): boolean {
  if (val === null) return false;
  
  // Row
  for (let i = 0; i < 6; i++) {
    if (i !== c && grid[r][i].value === val) return true;
  }
  // Col
  for (let i = 0; i < 6; i++) {
    if (i !== r && grid[i][c].value === val) return true;
  }
  // Block (2x3)
  const startRow = Math.floor(r / 2) * 2;
  const startCol = Math.floor(c / 3) * 3;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 3; j++) {
      const currR = startRow + i;
      const currC = startCol + j;
      if ((currR !== r || currC !== c) && grid[currR][currC].value === val) return true;
    }
  }
  return false;
}
