
export type CellValue = number | null;

export interface Cell {
  value: CellValue;
  initial: boolean;
  notes: number[];
}

export type Grid = Cell[][];





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
