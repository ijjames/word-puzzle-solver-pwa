import React, { useState, useEffect } from 'react';
import { WordPuzzleSolver } from '../solver';
import { knownGoodWords, bannedWords } from '../data';
import './WordPuzzleSolverGUI.css';

export const WordPuzzleSolverGUI: React.FC = () => {
  const [solver] = useState(() => new WordPuzzleSolver());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sides, setSides] = useState({
    left: '',
    top: '',
    right: '',
    bottom: ''
  });
  const [solutions, setSolutions] = useState<string[][]>([]);
  const [possibleWords, setPossibleWords] = useState<string[]>([]);

  // Initialize solver on component mount
  useEffect(() => {
    const initSolver = async () => {
      try {
        console.log('Starting solver initialization...');
        setIsLoading(true);
        setError(null);
        await solver.initialize((progress) => {
          console.log('Dictionary loading progress:', progress);
          setLoadingProgress(progress);
        });
        console.log('Solver initialization complete');
        setIsInitialized(true);
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize solver. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initSolver();
  }, [solver]);

  const handleInputChange = (side: keyof typeof sides) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    setSides(prev => ({ ...prev, [side]: value }));
  };

  const solvePuzzle = async () => {
    if (!isInitialized) {
      console.log('Solver not initialized yet');
      setError('Solver not initialized yet. Please wait.');
      return;
    }

    if (isLoading) {
      console.log('Already solving or loading');
      return;
    }

    // Validate all sides have exactly 3 letters
    for (const [side, value] of Object.entries(sides)) {
      if (value.length !== 3) {
        console.log(`Invalid input for ${side}: ${value}`);
        setError(`${side.toUpperCase()} must have exactly 3 letters`);
        return;
      }
    }

    try {
      console.log('Starting puzzle solve with sides:', sides);
      setIsLoading(true);
      setError(null);

      // Setup puzzle
      solver.setupPuzzle(sides.left, sides.top, sides.right, sides.bottom);

      // Find solutions (wrap in Promise to prevent blocking)
      console.log('Finding solutions...');
      const solutions = await new Promise<string[][]>((resolve) => {
        setTimeout(() => {
          const result = solver.findSolution(7);
          console.log('Found solutions:', result);
          resolve(result);
        }, 0);
      });

      setSolutions(solutions);

      // Find possible words for each letter (in parallel)
      const allLetters = [...sides.left, ...sides.top, ...sides.right, ...sides.bottom];
      const uniqueLetters = [...new Set(allLetters)];
      console.log('Finding possible words for letters:', uniqueLetters);
      
      const wordPromises = uniqueLetters.map(letter => 
        new Promise<string[]>(resolve => {
          setTimeout(() => {
            const words = solver.findPossibleWords(letter);
            console.log(`Found ${words.length} words for letter ${letter}`);
            resolve(words);
          }, 0);
        })
      );

      const allWords = await Promise.all(wordPromises);
      const combinedWords = [...new Set(allWords.flat())];
      console.log(`Total possible words found: ${combinedWords.length}`);
      setPossibleWords(combinedWords);

    } catch (err) {
      console.error('Solving error:', err);
      setError('Error solving puzzle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const markWordAsKnownGood = async (word: string) => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      solver.addKnownGoodWord(word);
      await solvePuzzle(); // Refresh solutions with new known good word
    } finally {
      setIsLoading(false);
    }
  };

  const banWord = async (word: string) => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      bannedWords.addWord(word);
      await solvePuzzle(); // Refresh solutions with new banned word
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="word-puzzle-solver">
      <div className="header">
        <h1>Word Puzzle Solver</h1>
        <div className="word-list-buttons">
          <button onClick={() => {/* Show known good words */}}>📋 Known Good Words</button>
          <button onClick={() => {/* Show banned words */}}>⛔ Banned Words</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isLoading && (
        <div className="loading-container">
          {loadingProgress > 0 && loadingProgress < 1 ? (
            <div className="loading-progress">
              Loading dictionary... {Math.round(loadingProgress * 100)}%
            </div>
          ) : (
            <div className="loading-spinner">Solving puzzle...</div>
          )}
        </div>
      )}

      <div className="input-section">
        <div className="input-group">
          <label>Left:</label>
          <input
            type="text"
            value={sides.left}
            onChange={handleInputChange('left')}
            disabled={isLoading}
            maxLength={3}
          />
        </div>
        <div className="input-group">
          <label>Top:</label>
          <input
            type="text"
            value={sides.top}
            onChange={handleInputChange('top')}
            disabled={isLoading}
            maxLength={3}
          />
        </div>
        <div className="input-group">
          <label>Right:</label>
          <input
            type="text"
            value={sides.right}
            onChange={handleInputChange('right')}
            disabled={isLoading}
            maxLength={3}
          />
        </div>
        <div className="input-group">
          <label>Bottom:</label>
          <input
            type="text"
            value={sides.bottom}
            onChange={handleInputChange('bottom')}
            disabled={isLoading}
            maxLength={3}
          />
        </div>

        <button 
          className="solve-button" 
          onClick={solvePuzzle}
          disabled={isLoading || !isInitialized}
        >
          {isLoading ? 'Solving...' : 'Solve'}
        </button>
      </div>

      <div className="results-section">
        <div className="solutions-list">
          <h2>Solutions</h2>
          {solutions.map((solution, i) => (
            <div key={i} className="solution">
              <div className="solution-words">
                {solution.join(' > ')}
              </div>
              <div className="solution-actions">
                <button onClick={() => solution.forEach(markWordAsKnownGood)}>
                  ✓ Mark All as Known Good
                </button>
              </div>
              {solution.map((word, j) => (
                <div key={j} className="word-actions">
                  <button onClick={() => markWordAsKnownGood(word)}>
                    ✓ Mark as Known Good
                  </button>
                  <button onClick={() => banWord(word)}>
                    ⛔ Ban Word
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="possible-words">
          <h2>Possible Words</h2>
          <div className="words-list">
            {possibleWords.map((word, i) => (
              <div key={i} className="word-item">
                <span>{word}</span>
                <div className="word-actions">
                  <button onClick={() => markWordAsKnownGood(word)}>
                    ✓ Mark as Known Good
                  </button>
                  <button onClick={() => banWord(word)}>
                    ⛔ Ban Word
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 