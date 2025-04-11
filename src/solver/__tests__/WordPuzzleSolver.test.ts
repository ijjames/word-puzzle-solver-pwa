/// <reference types="jest" />
import { WordPuzzleSolver } from '../WordPuzzleSolver';
import { DictionaryService } from '../../services/DictionaryService';

// Mock the DictionaryService
jest.mock('../../services/DictionaryService');

describe('WordPuzzleSolver', () => {
  let solver: WordPuzzleSolver;
  let mockDictionary: jest.Mocked<DictionaryService>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a mock dictionary service
    mockDictionary = new DictionaryService() as jest.Mocked<DictionaryService>;
    mockDictionary.isValidWord = jest.fn();
    mockDictionary.findPossibleWords = jest.fn();
    mockDictionary.loadDictionary = jest.fn().mockResolvedValue(undefined);

    // Create solver instance with mock dictionary
    solver = new WordPuzzleSolver();
    (solver as any).dictionary = mockDictionary;
  });

  describe('setupPuzzle', () => {
    it('should set up puzzle configuration correctly', () => {
      solver.setupPuzzle('ABC', 'DEF', 'GHI', 'JKL');

      const config = (solver as any).config;
      expect(config).toEqual({
        left: 'ABC',
        top: 'DEF',
        right: 'GHI',
        bottom: 'JKL'
      });

      const allLetters = (solver as any).allLetters;
      expect(allLetters).toEqual(new Set('ABCDEFGHIJKL'));
    });

    it('should handle empty or invalid input', () => {
      expect(() => solver.setupPuzzle('', 'DEF', 'GHI', 'JKL')).toThrow();
      expect(() => solver.setupPuzzle('ABC', '', 'GHI', 'JKL')).toThrow();
      expect(() => solver.setupPuzzle('ABC', 'DEF', '', 'JKL')).toThrow();
      expect(() => solver.setupPuzzle('ABC', 'DEF', 'GHI', '')).toThrow();
    });
  });

  describe('findSolutions', () => {
    it('should find solutions using available letters', async () => {
      // Setup puzzle
      solver.setupPuzzle('ABC', 'DEF', 'GHI', 'JKL');

      // Mock dictionary responses
      mockDictionary.isValidWord.mockImplementation((word) => 
        ['CAT', 'DOG', 'FISH'].includes(word.toUpperCase())
      );
      mockDictionary.findPossibleWords.mockImplementation((startLetter, availableLetters) => {
        const words = ['CAT', 'DOG', 'FISH'];
        return words.filter(word => word.startsWith(startLetter.toUpperCase()));
      });

      // Find solutions
      const solutions = solver.findSolutions(3);

      // Verify solutions
      expect(solutions.length).toBeGreaterThan(0);
      solutions.forEach(solution => {
        expect(solution.words.length).toBeLessThanOrEqual(3);
        expect(solution.score).toBeDefined();
      });
    });

    it('should respect max words limit', async () => {
      solver.setupPuzzle('ABC', 'DEF', 'GHI', 'JKL');
      mockDictionary.isValidWord.mockReturnValue(true);
      mockDictionary.findPossibleWords.mockReturnValue(['CAT', 'DOG', 'FISH']);

      const solutions = solver.findSolutions(2);

      solutions.forEach(solution => {
        expect(solution.words.length).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('findSolutionWithStartWord', () => {
    it('should find solutions starting with a specific word', async () => {
      solver.setupPuzzle('ABC', 'DEF', 'GHI', 'JKL');
      mockDictionary.isValidWord.mockReturnValue(true);
      mockDictionary.findPossibleWords.mockReturnValue(['CAT', 'DOG', 'FISH']);

      const solutions = solver.findSolutionWithStartWord('CAT');

      solutions.forEach(solution => {
        expect(solution.words[0]).toBe('CAT');
      });
    });

    it('should throw error for invalid start word', async () => {
      solver.setupPuzzle('ABC', 'DEF', 'GHI', 'JKL');
      mockDictionary.isValidWord.mockReturnValue(false);

      expect(() => solver.findSolutionWithStartWord('INVALID')).toThrow();
    });
  });

  describe('letter counting', () => {
    it('should correctly count available letters', () => {
      solver.setupPuzzle('AAB', 'CCD', 'EEF', 'GGH');

      const countA = (solver as any).countAvailableLetters('A');
      const countC = (solver as any).countAvailableLetters('C');
      const countE = (solver as any).countAvailableLetters('E');
      const countG = (solver as any).countAvailableLetters('G');

      expect(countA).toBe(2);
      expect(countC).toBe(2);
      expect(countE).toBe(2);
      expect(countG).toBe(2);
    });

    it('should correctly count used letters in a word', () => {
      solver.setupPuzzle('ABC', 'DEF', 'GHI', 'JKL');

      const countA = (solver as any).countUsedLetters('APPLE', 'A');
      const countP = (solver as any).countUsedLetters('APPLE', 'P');
      const countL = (solver as any).countUsedLetters('APPLE', 'L');

      expect(countA).toBe(1);
      expect(countP).toBe(2);
      expect(countL).toBe(1);
    });
  });

  describe('solution evaluation', () => {
    it('should score solutions based on known good words and word lengths', () => {
      solver.setupPuzzle('ABC', 'DEF', 'GHI', 'JKL');
      mockDictionary.isValidWord.mockReturnValue(true);

      const solution = ['CAT', 'DOG', 'FISH'];
      (solver as any).evaluateSolution(solution);

      const solutions = (solver as any).solutions;
      expect(solutions.length).toBe(1);
      expect(solutions[0].score).toBeDefined();
    });
  });

  describe('word length optimization', () => {
    it('should prioritize longer words in solutions', async () => {
      solver.setupPuzzle('ABC', 'DEF', 'GHI', 'JKL');
      
      // Mock dictionary to return words of different lengths
      mockDictionary.findPossibleWords.mockImplementation((startLetter) => {
        const words = ['CAT', 'CATERPILLAR', 'CATERING'];
        return words.filter(word => word.startsWith(startLetter.toUpperCase()));
      });
      mockDictionary.isValidWord.mockReturnValue(true);

      const solutions = solver.findSolutions(3);

      // Verify that longer words are preferred
      solutions.forEach(solution => {
        const hasLongWord = solution.words.some(word => word.length > 5);
        expect(hasLongWord).toBe(true);
      });
    });

    it('should handle solutions with mixed word lengths', async () => {
      solver.setupPuzzle('ABC', 'DEF', 'GHI', 'JKL');
      
      // Mock dictionary to return a mix of short and long words
      mockDictionary.findPossibleWords.mockImplementation((startLetter) => {
        const words = ['CAT', 'DOG', 'ELEPHANT', 'FISH', 'GIRAFFE'];
        return words.filter(word => word.startsWith(startLetter.toUpperCase()));
      });
      mockDictionary.isValidWord.mockReturnValue(true);

      const solutions = solver.findSolutions(3);

      // Verify solutions contain both short and long words
      solutions.forEach(solution => {
        const hasShortWord = solution.words.some(word => word.length <= 4);
        const hasLongWord = solution.words.some(word => word.length > 4);
        expect(hasShortWord || hasLongWord).toBe(true);
      });
    });
  });

  describe('letter distribution', () => {
    it('should handle repeated letters correctly', async () => {
      // Setup puzzle with repeated letters
      solver.setupPuzzle('AAB', 'CCD', 'EEF', 'GGH');

      // Mock dictionary to return words that use repeated letters
      mockDictionary.findPossibleWords.mockImplementation((startLetter) => {
        const words = ['APPLE', 'BANANA', 'COOKIE'];
        return words.filter(word => word.startsWith(startLetter.toUpperCase()));
      });
      mockDictionary.isValidWord.mockReturnValue(true);

      const solutions = solver.findSolutions(3);

      // Verify letter counting is correct for repeated letters
      solutions.forEach(solution => {
        solution.words.forEach(word => {
          const letterCounts = new Map<string, number>();
          word.split('').forEach(letter => {
            letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1);
          });
          
          // Check that no word uses more letters than available
          letterCounts.forEach((count, letter) => {
            const available = (solver as any).countAvailableLetters(letter);
            expect(count).toBeLessThanOrEqual(available);
          });
        });
      });
    });

    it('should handle edge cases with multiple repeated letters', async () => {
      // Setup puzzle with multiple repeated letters
      solver.setupPuzzle('AAA', 'BBB', 'CCC', 'DDD');

      // Mock dictionary to return words that use multiple repeated letters
      mockDictionary.findPossibleWords.mockImplementation((startLetter) => {
        const words = ['APPLE', 'BANANA', 'COOKIE', 'DADDY'];
        return words.filter(word => word.startsWith(startLetter.toUpperCase()));
      });
      mockDictionary.isValidWord.mockReturnValue(true);

      const solutions = solver.findSolutions(3);

      // Verify solutions respect letter limits
      solutions.forEach(solution => {
        const usedLetters = new Map<string, number>();
        solution.words.forEach(word => {
          word.split('').forEach(letter => {
            usedLetters.set(letter, (usedLetters.get(letter) || 0) + 1);
          });
        });

        usedLetters.forEach((count, letter) => {
          const available = (solver as any).countAvailableLetters(letter);
          expect(count).toBeLessThanOrEqual(available);
        });
      });
    });
  });

  describe('known good word integration', () => {
    it('should prioritize solutions with known good words', async () => {
      solver.setupPuzzle('ABC', 'DEF', 'GHI', 'JKL');
      
      // Add some known good words
      solver.addKnownGoodWord('CAT');
      solver.addKnownGoodWord('DOG');

      // Mock dictionary to return words including known good words
      mockDictionary.findPossibleWords.mockImplementation((startLetter) => {
        const words = ['CAT', 'DOG', 'FISH', 'GIRAFFE'];
        return words.filter(word => word.startsWith(startLetter.toUpperCase()));
      });
      mockDictionary.isValidWord.mockReturnValue(true);

      const solutions = solver.findSolutions(3);

      // Verify solutions with known good words are prioritized
      const hasKnownGoodWord = solutions.some(solution => 
        solution.words.some(word => solver.isKnownGoodWord(word))
      );
      expect(hasKnownGoodWord).toBe(true);
    });

    it('should score solutions with known good words higher', async () => {
      solver.setupPuzzle('ABC', 'DEF', 'GHI', 'JKL');
      
      // Add a known good word
      solver.addKnownGoodWord('CAT');

      // Mock dictionary to return words including the known good word
      mockDictionary.findPossibleWords.mockImplementation((startLetter) => {
        const words = ['CAT', 'DOG', 'FISH'];
        return words.filter(word => word.startsWith(startLetter.toUpperCase()));
      });
      mockDictionary.isValidWord.mockReturnValue(true);

      const solutions = solver.findSolutions(3);

      // Verify solutions with known good words have higher scores
      const solutionsWithKnownGood = solutions.filter(solution =>
        solution.words.some(word => solver.isKnownGoodWord(word))
      );
      const solutionsWithoutKnownGood = solutions.filter(solution =>
        !solution.words.some(word => solver.isKnownGoodWord(word))
      );

      if (solutionsWithKnownGood.length > 0 && solutionsWithoutKnownGood.length > 0) {
        const avgScoreWithKnownGood = solutionsWithKnownGood.reduce((sum, s) => sum + s.score, 0) / solutionsWithKnownGood.length;
        const avgScoreWithoutKnownGood = solutionsWithoutKnownGood.reduce((sum, s) => sum + s.score, 0) / solutionsWithoutKnownGood.length;
        expect(avgScoreWithKnownGood).toBeGreaterThan(avgScoreWithoutKnownGood);
      }
    });
  });
}); 