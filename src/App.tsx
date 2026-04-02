/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Pencil, Eraser, RotateCcw, CheckCircle2, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  checkConflicts,
  isComplete,
  Grid
} from './lib/sudoku';
import PREDEFINED_PUZZLES from './lib/puzzles.json';

const DEBUG_ENABLED = false; // Set to true to enable debug features like loading specific puzzles
const AVAILABLE_DIFFICULTIES = Array.from(new Set(PREDEFINED_PUZZLES.map(p => p.difficulty))).sort();

export default function App() {
  const [solution, setSolution] = useState<number[][]>([]);
  const [grid, setGrid] = useState<Grid>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [highlightNumber, setHighlightNumber] = useState<number | null>(null);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [history, setHistory] = useState<Grid[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won'>('playing');

  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [recentPuzzleIds, setRecentPuzzleIds] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [currentPuzzleInfo, setCurrentPuzzleInfo] = useState<{ difficulty: string } | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [incorrectCells, setIncorrectCells] = useState<Set<string>>(new Set());
  const [checkFeedback, setCheckFeedback] = useState<'none' | 'success'>('none');
  const [hintCell, setHintCell] = useState<{ r: number; c: number } | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [debugPuzzleId, setDebugPuzzleId] = useState<string>(PREDEFINED_PUZZLES[0].id);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive && gameStatus === 'playing') {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else if (!isTimerActive && seconds !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, gameStatus, seconds]);

  // Pause timer on focus loss
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTimerActive(false);
      } else if (gameStatus === 'playing') {
        setIsTimerActive(true);
      }
    };

    const handleBlur = () => setIsTimerActive(false);
    const handleFocus = () => {
      if (gameStatus === 'playing') setIsTimerActive(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [gameStatus]);

  // Initialize game
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    // Filter puzzles based on selection
    const filteredPuzzles = PREDEFINED_PUZZLES.filter(p => {
      const diffMatch = selectedDifficulty === 'All' || p.difficulty === selectedDifficulty;
      return p.validated && diffMatch;
    });

    if (filteredPuzzles.length === 0) {
      // Fallback if no puzzles match filters
      setGrid([]);
      return;
    }

    // Exclude recently played puzzles, falling back to full list if needed
    const candidates = filteredPuzzles.filter(p => !recentPuzzleIds.includes(p.id));
    const pool = candidates.length > 0 ? candidates : filteredPuzzles;
    const predefined = pool[Math.floor(Math.random() * pool.length)];
    const sol = predefined.solution;
    const puzzle: Grid = predefined.puzzle.map(row => 
      row.map(val => ({
        value: val,
        initial: val !== 0,
        notes: []
      }))
    );

    setRecentPuzzleIds(prev => [...prev.slice(-19), predefined.id]);
    setSolution(sol);
    setGrid(puzzle);
    setCurrentPuzzleInfo({ difficulty: predefined.difficulty });
    setHistory([]);
    setSelectedCell(null);
    setGameStatus('playing');
    setIsNotesMode(false);
    setSeconds(0);
    setIsTimerActive(true);
    setIncorrectCells(new Set());
    setCheckFeedback('none');
    setHintCell(null);
    setShowWinModal(false);
  };

  const loadPuzzleById = (id: string) => {
    const predefined = PREDEFINED_PUZZLES.find(p => p.id === id);
    if (!predefined) return;
    const sol = predefined.solution;
    const puzzle: Grid = predefined.puzzle.map(row =>
      row.map(val => ({
        value: val,
        initial: val !== 0,
        notes: []
      }))
    );
    setSolution(sol);
    setGrid(puzzle);
    setCurrentPuzzleInfo({ difficulty: predefined.difficulty });
    setHistory([]);
    setSelectedCell(null);
    setGameStatus('playing');
    setIsNotesMode(false);
    setSeconds(0);
    setIsTimerActive(true);
    setIncorrectCells(new Set());
    setCheckFeedback('none');
    setHintCell(null);
    setShowWinModal(false);
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameStatus === 'won') return;
    if (selectedCell?.r === r && selectedCell?.c === c) {
      setHighlightNumber(grid[r][c].value);
    } else {
      setHighlightNumber(null);
      setSelectedCell({ r, c });
    }
    setHintCell(null); // Clear hint on interaction
  };

  const handleCheck = useCallback(() => {
    if (gameStatus === 'won') return;
    setHintCell(null); // Clear hint on interaction
    const nextIncorrect = new Set<string>();
    let hasUserEntries = false;
    grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell.value !== 0 && !cell.initial) {
          hasUserEntries = true;
          if (cell.value !== solution[r][c]) {
            nextIncorrect.add(`${r}-${c}`);
          }
        }
      });
    });
    
    setIncorrectCells(nextIncorrect);

    if (nextIncorrect.size === 0 && hasUserEntries) {
      setCheckFeedback('success');
      setTimeout(() => setCheckFeedback('none'), 1000); // 1 second for better visibility
    }
  }, [gameStatus, grid, solution]);

  const handleHint = useCallback(() => {
    if (gameStatus === 'won') return;
    
    const emptyCells: { r: number; c: number }[] = [];
    grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        // Find cells that are either empty or have an incorrect user entry
        if (!cell.initial && (cell.value === 0 || cell.value !== solution[r][c])) {
          emptyCells.push({ r, c });
        }
      });
    });

    if (emptyCells.length === 0) return;

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const { r, c } = randomCell;

    // Save to history
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(grid))]);

    const newGrid = [...grid.map(row => [...row.map(cell => ({ ...cell, notes: [...cell.notes] }))])];
    newGrid[r][c].value = solution[r][c];
    newGrid[r][c].notes = [];
    
    setGrid(newGrid);
    setHintCell(randomCell);
    setIncorrectCells(prev => {
      const next = new Set(prev);
      next.delete(`${r}-${c}`);
      return next;
    });

    if (isComplete(newGrid)) {
      const won = newGrid.every((row, ri) => 
        row.every((cell, ci) => cell.value === solution[ri][ci])
      );
      if (won) {
        setGameStatus('won');
        setIsTimerActive(false);
        setShowWinModal(true);
      } else {
        // Automatically trigger check to show errors if complete but incorrect
        handleCheck();
      }
    }
  }, [gameStatus, grid, solution, handleCheck]);

  const handleUndo = () => {
    if (history.length === 0 || gameStatus === 'won') return;
    const previousGrid = history[history.length - 1];
    setGrid(previousGrid);
    setHistory(prev => prev.slice(0, -1));
    setIncorrectCells(new Set()); // Reset incorrect highlights on undo
  };

  const updateCell = useCallback((val: number) => {
    if (!selectedCell || gameStatus === 'won') return;
    const { r, c } = selectedCell;
    if (grid[r][c].initial) return;

    // Save to history before change
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(grid))]);
    setHintCell(null); // Clear hint on interaction

    // Clear incorrect highlight for this cell
    const cellKey = `${r}-${c}`;
    if (incorrectCells.has(cellKey)) {
      const nextIncorrect = new Set(incorrectCells);
      nextIncorrect.delete(cellKey);
      setIncorrectCells(nextIncorrect);
    }

    const newGrid = [...grid.map(row => [...row.map(cell => ({ ...cell, notes: [...cell.notes] }))])];
    
    if (isNotesMode && val !== 0) {
      const currentNotes = newGrid[r][c].notes;
      if (currentNotes.includes(val)) {
        newGrid[r][c].notes = currentNotes.filter(n => n !== val);
      } else {
        newGrid[r][c].notes = [...currentNotes, val].sort();
      }
      newGrid[r][c].value = 0; // Clear value if adding notes
    } else {
      newGrid[r][c].value = val;
      newGrid[r][c].notes = []; // Clear notes if setting value
    }

    setGrid(newGrid);

    if (!isNotesMode && val !== 0 && isComplete(newGrid)) {
      // Check if all values match solution
      const won = newGrid.every((row, ri) => 
        row.every((cell, ci) => cell.value === solution[ri][ci])
      );
      if (won) {
        setGameStatus('won');
        setIsTimerActive(false);
        setShowWinModal(true);
      } else {
        // Automatically trigger check to show errors if complete but incorrect
        handleCheck();
      }
    }
  }, [selectedCell, grid, isNotesMode, gameStatus, solution, handleCheck, incorrectCells]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameStatus === 'won') return;
    
    if (e.key === 'Escape') {
      setSelectedCell(null);
      setHighlightNumber(null);
    } else if (e.ctrlKey && e.key === 'z') {
      handleUndo();
    } else if (e.key >= '1' && e.key <= '6') {
      updateCell(parseInt(e.key));
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      updateCell(0);
    } else if (e.key === 'n' || e.key === 'N') {
      setIsNotesMode(prev => !prev);
    } else if (e.key === 'ArrowUp' && selectedCell) {
      setSelectedCell(prev => prev ? { r: Math.max(0, prev.r - 1), c: prev.c } : null);
    } else if (e.key === 'ArrowDown' && selectedCell) {
      setSelectedCell(prev => prev ? { r: Math.min(5, prev.r + 1), c: prev.c } : null);
    } else if (e.key === 'ArrowLeft' && selectedCell) {
      setSelectedCell(prev => prev ? { r: prev.r, c: Math.max(0, prev.c - 1) } : null);
    } else if (e.key === 'ArrowRight' && selectedCell) {
      setSelectedCell(prev => prev ? { r: prev.r, c: Math.min(5, prev.c + 1) } : null);
    }
  }, [updateCell, handleUndo, selectedCell, gameStatus]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getNumberCount = (num: number) => {
    let count = 0;
    grid.forEach(row => row.forEach(cell => {
      if (cell.value === num) count++;
    }));
    return count;
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (grid.length === 0) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] flex flex-col items-center justify-center p-4 font-sans text-[#191919]">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-6 flex flex-col gap-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Mini Sudoku</h1>
          <p className="text-[#5C5C5C]">No puzzles found for the selected filters.</p>
          <div className="text-left">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-[#5C5C5C] tracking-wider">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => {
                  setSelectedDifficulty(e.target.value);
                }}
                className="bg-[#F3F2EF] border-none rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="All">All Difficulties</option>
                {AVAILABLE_DIFFICULTIES.map(diff => (
                  <option key={diff} value={diff}>{diff}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-4">
            <button 
              onClick={startNewGame}
              className="py-3 bg-[#191919] text-white rounded-full font-bold hover:bg-[#333333] transition-colors"
            >
              Apply & Start New Game
            </button>
            <button 
              onClick={() => {
                setSelectedDifficulty('All');
                setTimeout(startNewGame, 0);
              }}
              className="py-3 bg-[#F3F2EF] text-[#5C5C5C] rounded-full font-bold hover:bg-[#E0E0E0] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] flex flex-col items-center justify-center p-4 font-sans text-[#191919]">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-6 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Mini Sudoku</h1>
          {DEBUG_ENABLED && (
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#5C5C5C] cursor-pointer">
              <input
                type="checkbox"
                checked={showDebug}
                onChange={(e) => setShowDebug(e.target.checked)}
                className="cursor-pointer"
              />
              Debug
            </label>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Current Game */}
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-bold uppercase text-[#5C5C5C] tracking-wider">Current Game</span>
            <div className="text-sm font-mono text-[#5C5C5C] font-medium">
              Time: {formatTime(seconds)}
            </div>
            {currentPuzzleInfo && (
              <span className="text-[10px] font-bold uppercase text-[#5C5C5C]">
                Difficulty: <span className="bg-[#F3F2EF] px-1.5 py-0.5 rounded">{currentPuzzleInfo.difficulty}</span>
              </span>
            )}
          </div>

          {/* New Game */}
          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-bold uppercase text-[#5C5C5C] tracking-wider">New Game</span>
            <div className="flex gap-2">
              <select
                value={selectedDifficulty}
                onChange={(e) => {
                  setSelectedDifficulty(e.target.value);
                }}
                className="flex-1 bg-[#F3F2EF] border-none rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="All">All Difficulties</option>
                {AVAILABLE_DIFFICULTIES.map(diff => (
                  <option key={diff} value={diff}>{diff}</option>
                ))}
              </select>
              <button
                onClick={startNewGame}
                className="px-3 py-2 bg-[#191919] text-white rounded-lg text-sm font-semibold hover:bg-[#333333] transition-colors"
              >
                Start
              </button>
            </div>
            {showDebug && (
              <div className="flex gap-2">
                <select
                  value={debugPuzzleId}
                  onChange={(e) => setDebugPuzzleId(e.target.value)}
                  className="flex-1 bg-[#F3F2EF] border-none rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  {PREDEFINED_PUZZLES.map(p => (
                    <option key={p.id} value={p.id}>{p.id}{p.validated ? '' : ' (unvalidated)'}</option>
                  ))}
                </select>
                <button
                  onClick={() => loadPuzzleById(debugPuzzleId)}
                  className="px-3 py-2 bg-[#191919] text-white rounded-lg text-sm font-semibold hover:bg-[#333333] transition-colors"
                >
                  Load
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="relative aspect-square w-full grid grid-cols-6 grid-rows-6 bg-white overflow-hidden border-2 border-black">
          {grid.map((row, r) => (
              row.map((cell, c) => {
                const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                const isSameNumber = !isSelected && highlightNumber !== null && highlightNumber !== 0 && cell.value === highlightNumber;
                const cellKey = `${r}-${c}`;
                const isIncorrect = incorrectCells.has(cellKey);
                const isHint = hintCell?.r === r && hintCell?.c === c;
                const hasConflict = cell.value !== 0 && checkConflicts(grid, r, c, cell.value);
                const isInitial = cell.initial;
                
                // Block borders (2x3 blocks: 2 rows high, 3 columns wide)
                const isBlockTop = r % 2 === 0;
                const isBlockBottom = r % 2 === 1;
                const isBlockLeft = c % 3 === 0;
                const isBlockRight = c % 3 === 2;

                const blockBorder = 'border-black'; // Standard black color
                
                const borderClasses = [
                  isBlockTop ? `border-t-2 ${blockBorder}` : 'border-t border-[#E0E0E0]',
                  isBlockBottom ? `border-b-2 ${blockBorder}` : 'border-b border-[#E0E0E0]',
                  isBlockLeft ? `border-l-2 ${blockBorder}` : 'border-l border-[#E0E0E0]',
                  isBlockRight ? `border-r-2 ${blockBorder}` : 'border-r border-[#E0E0E0]',
                ].join(' ');

                return (
                  <div
                    key={cellKey}
                    onClick={() => handleCellClick(r, c)}
                    className={`
                      relative flex items-center justify-center cursor-pointer select-none
                      ${borderClasses}
                      ${isSelected || isSameNumber ? 'bg-[#E8F3FF]' : 'hover:bg-[#F8F8F8]'}
                      ${hasConflict || isIncorrect ? 'bg-red-50' : isHint ? 'bg-green-100' : ''}
                    `}
                  >
                    {cell.value ? (
                      <span className={`
                        text-2xl font-medium
                        ${isInitial ? 'text-[#8C8C8C]' : isHint ? 'text-green-700' : 'text-[#191919]'}
                        ${hasConflict || isIncorrect ? 'text-red-600' : ''}
                      `}>
                        {cell.value}
                      </span>
                    ) : (
                      <div className="grid grid-cols-3 grid-rows-2 w-full h-full p-0.5 pointer-events-none">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <div key={n} className="flex items-center justify-center text-[10px] leading-none text-[#191919] font-bold">
                            {cell.notes.includes(n) ? n : ''}
                          </div>
                        ))}
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none z-10" />
                    )}
                  </div>
                );
              })
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 items-center py-2">
          <button 
            onClick={handleHint}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[#5C5C5C] hover:bg-[#F3F2EF] transition-all"
          >
            <Lightbulb size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">
              Hint
            </span>
          </button>
          <button 
            onClick={handleCheck}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${checkFeedback === 'success' ? 'bg-green-100 text-green-700' : 'text-[#5C5C5C] hover:bg-[#F3F2EF]'}`}
          >
            <CheckCircle2 size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">
              Check
            </span>
          </button>
          <button 
            onClick={() => setIsNotesMode(!isNotesMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${isNotesMode ? 'bg-[#191919] text-white' : 'text-[#5C5C5C] hover:bg-[#F3F2EF]'}`}
          >
            <Pencil size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">
              Notes {isNotesMode ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3].map(num => {
            const count = getNumberCount(num);
            const isDisabled = count >= 6;
            return (
              <button
                key={num}
                disabled={isDisabled}
                onClick={() => updateCell(num)}
                className={`
                  h-14 rounded-lg flex flex-col items-center justify-center transition-all
                  ${isDisabled ? 'bg-[#F3F2EF] text-[#D0D0D0] cursor-not-allowed' : 'bg-[#F3F2EF] text-[#191919] hover:bg-[#E0E0E0] active:scale-95'}
                `}
              >
                <span className="text-xl font-bold">{num}</span>
              </button>
            );
          })}
          <button
            onClick={() => updateCell(0)}
            className="h-14 rounded-lg bg-[#F3F2EF] text-[#191919] hover:bg-[#E0E0E0] active:scale-95 flex flex-col items-center justify-center gap-0.5"
          >
            <Eraser size={20} />
            <span className="text-[10px] font-bold uppercase">Erase</span>
          </button>
          {[4, 5, 6].map(num => {
            const count = getNumberCount(num);
            const isDisabled = count >= 6;
            return (
              <button
                key={num}
                disabled={isDisabled}
                onClick={() => updateCell(num)}
                className={`
                  h-14 rounded-lg flex flex-col items-center justify-center transition-all
                  ${isDisabled ? 'bg-[#F3F2EF] text-[#D0D0D0] cursor-not-allowed' : 'bg-[#F3F2EF] text-[#191919] hover:bg-[#E0E0E0] active:scale-95'}
                `}
              >
                <span className="text-xl font-bold">{num}</span>
              </button>
            );
          })}
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`
              h-14 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all
              ${history.length === 0 ? 'bg-[#F3F2EF] text-[#D0D0D0] cursor-not-allowed' : 'bg-[#F3F2EF] text-[#191919] hover:bg-[#E0E0E0] active:scale-95'}
            `}
          >
            <RotateCcw size={20} />
            <span className="text-[10px] font-bold uppercase">Undo</span>
          </button>
        </div>
      </div>

      {/* Win Modal */}
      <AnimatePresence>
        {showWinModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-8 flex flex-col items-center gap-6 max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#191919]">Puzzle Solved!</h2>
                <p className="text-[#5C5C5C] mt-2">Great job! You've completed the Sudoku puzzle in {formatTime(seconds)}.</p>
              </div>
              <div className="w-full">
                <button
                  onClick={() => setShowWinModal(false)}
                  className="w-full py-3 bg-[#191919] text-white rounded-full font-bold hover:bg-[#333333] transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
