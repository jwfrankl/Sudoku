import {describe, it, expect} from 'vitest';
import {isComplete, checkConflicts, Grid} from './sudoku';

describe('isComplete', () => {
  it('should return true for a complete grid', () => {
    const completeGrid: Grid = [
      [{value: 1, initial: true, notes: []}, {value: 2, initial: true, notes: []}, {value: 3, initial: true, notes: []}, {value: 4, initial: true, notes: []}, {value: 5, initial: true, notes: []}, {value: 6, initial: true, notes: []}],
      [{value: 4, initial: true, notes: []}, {value: 5, initial: true, notes: []}, {value: 6, initial: true, notes: []}, {value: 1, initial: true, notes: []}, {value: 2, initial: true, notes: []}, {value: 3, initial: true, notes: []}],
      [{value: 2, initial: true, notes: []}, {value: 3, initial: true, notes: []}, {value: 1, initial: true, notes: []}, {value: 5, initial: true, notes: []}, {value: 6, initial: true, notes: []}, {value: 4, initial: true, notes: []}],
      [{value: 5, initial: true, notes: []}, {value: 6, initial: true, notes: []}, {value: 4, initial: true, notes: []}, {value: 2, initial: true, notes: []}, {value: 3, initial: true, notes: []}, {value: 1, initial: true, notes: []}],
      [{value: 3, initial: true, notes: []}, {value: 1, initial: true, notes: []}, {value: 2, initial: true, notes: []}, {value: 6, initial: true, notes: []}, {value: 4, initial: true, notes: []}, {value: 5, initial: true, notes: []}],
      [{value: 6, initial: true, notes: []}, {value: 4, initial: true, notes: []}, {value: 5, initial: true, notes: []}, {value: 3, initial: true, notes: []}, {value: 1, initial: true, notes: []}, {value: 2, initial: true, notes: []}],
    ];
    expect(isComplete(completeGrid)).toBe(true);
  });

  it('should return false for an incomplete grid', () => {
    const incompleteGrid: Grid = [
      [{value: 1, initial: true, notes: []}, {value: 2, initial: true, notes: []}, {value: 3, initial: true, notes: []}, {value: 4, initial: true, notes: []}, {value: 5, initial: true, notes: []}, {value: 6, initial: true, notes: []}],
      [{value: 4, initial: true, notes: []}, {value: 5, initial: true, notes: []}, {value: 6, initial: true, notes: []}, {value: 1, initial: true, notes: []}, {value: 2, initial: true, notes: []}, {value: 3, initial: true, notes: []}],
      [{value: 2, initial: true, notes: []}, {value: 3, initial: true, notes: []}, {value: 1, initial: true, notes: []}, {value: 5, initial: true, notes: []}, {value: 6, initial: true, notes: []}, {value: 4, initial: true, notes: []}],
      [{value: 5, initial: true, notes: []}, {value: 6, initial: true, notes: []}, {value: 4, initial: true, notes: []}, {value: 2, initial: true, notes: []}, {value: 3, initial: true, notes: []}, {value: 1, initial: true, notes: []}],
      [{value: 3, initial: true, notes: []}, {value: 1, initial: true, notes: []}, {value: 2, initial: true, notes: []}, {value: 6, initial: true, notes: []}, {value: 4, initial: true, notes: []}, {value: 0, initial: false, notes: []}],
      [{value: 6, initial: true, notes: []}, {value: 4, initial: true, notes: []}, {value: 5, initial: true, notes: []}, {value: 3, initial: true, notes: []}, {value: 1, initial: true, notes: []}, {value: 2, initial: true, notes: []}],
    ];
    expect(isComplete(incompleteGrid)).toBe(false);
  });
});

describe('checkConflicts', () => {
  const grid: Grid = [
    [{value: 1, initial: true, notes: []}, {value: 2, initial: true, notes: []}, {value: 3, initial: true, notes: []}, {value: 4, initial: true, notes: []}, {value: 5, initial: true, notes: []}, {value: 6, initial: true, notes: []}],
    [{value: 4, initial: true, notes: []}, {value: 5, initial: true, notes: []}, {value: 6, initial: true, notes: []}, {value: 1, initial: true, notes: []}, {value: 2, initial: true, notes: []}, {value: 3, initial: true, notes: []}],
    [{value: 2, initial: true, notes: []}, {value: 3, initial: true, notes: []}, {value: 1, initial: true, notes: []}, {value: 5, initial: true, notes: []}, {value: 6, initial: true, notes: []}, {value: 4, initial: true, notes: []}],
    [{value: 5, initial: true, notes: []}, {value: 6, initial: true, notes: []}, {value: 4, initial: true, notes: []}, {value: 2, initial: true, notes: []}, {value: 3, initial: true, notes: []}, {value: 1, initial: true, notes: []}],
    [{value: 3, initial: true, notes: []}, {value: 1, initial: true, notes: []}, {value: 2, initial: true, notes: []}, {value: 6, initial: true, notes: []}, {value: 4, initial: true, notes: []}, {value: 5, initial: true, notes: []}],
    [{value: 6, initial: true, notes: []}, {value: 4, initial: true, notes: []}, {value: 5, initial: true, notes: []}, {value: 3, initial: true, notes: []}, {value: 1, initial: true, notes: []}, {value: 2, initial: true, notes: []}],
  ];

  it('should return true for a row conflict', () => {
    expect(checkConflicts(grid, 0, 0, 2)).toBe(true);
  });

  it('should return true for a column conflict', () => {
    expect(checkConflicts(grid, 0, 0, 4)).toBe(true);
  });

  it('should return true for a block conflict', () => {
    expect(checkConflicts(grid, 0, 0, 6)).toBe(true);
  });

  it('should return false for no conflict', () => {
    const noConflictGrid = JSON.parse(JSON.stringify(grid));
    noConflictGrid[0][0].value = 0;
    expect(checkConflicts(noConflictGrid, 0, 0, 1)).toBe(false);
  });
});
