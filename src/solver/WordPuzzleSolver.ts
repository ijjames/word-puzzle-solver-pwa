import { DictionaryService } from '../services/DictionaryService';
import { knownGoodWords, bannedWords } from '../data/wordLists';

interface PuzzleConfig {
  left: string;
  top: string;
  right: string;
  bottom: string;
}

type Solution = string[];

export class WordPuzzleSolver {
  private config: PuzzleConfig | null = null;
  private allLetters: Set<string> = new Set();
  private solutions: string[][] = [];
  private dictionary: DictionaryService;

  constructor() {
    console.log('Creating WordPuzzleSolver instance');
    this.dictionary = new DictionaryService();
  }

  /**
   * Initialize the solver by loading the dictionary
   * @param onProgress Optional callback for tracking loading progress (0-1)
   */
  async initialize(onProgress?: (progress: number) => void): Promise<void> {
    console.log('Initializing solver...');
    await this.dictionary.loadDictionary(onProgress);
    console.log('Dictionary loaded with', this.dictionary.getWordCount(), 'words');
  }

  /**
   * Set up the puzzle configuration with letters for each side
   */
  setupPuzzle(left: string, top: string, right: string, bottom: string): void {
    console.log('Setting up puzzle with sides:', { left, top, right, bottom });
    this.config = { left, top, right, bottom };
    this.allLetters = new Set([...left, ...top, ...right, ...bottom]);
    this.solutions = [];
    console.log('Available letters:', [...this.allLetters]);
  }

  /**
   * Find all possible words that can be formed with the given letters
   */
  findPossibleWords(startLetter: string): string[] {
    console.log('Finding possible words starting with', startLetter);
    if (!this.allLetters.size) {
      console.log('No letters available');
      return [];
    }
    const words = this.dictionary.findPossibleWords(startLetter, this.allLetters);
    console.log(`Found ${words.length} possible words starting with ${startLetter}`);
    return words;
  }

  /**
   * Find all possible solutions for the current puzzle configuration
   */
  findSolution(maxWords: number = 7): string[][] {
    console.log('Finding solutions with max words:', maxWords);
    if (!this.config) {
      console.error('Puzzle not configured');
      throw new Error("Puzzle not configured");
    }

    this.solutions = [];
    const sides = [this.config.left, this.config.top, this.config.right, this.config.bottom];
    const startTime = Date.now();
    let solutionsChecked = 0;
    
    // Try starting with each letter
    for (const side of sides) {
      for (const letter of side) {
        console.log('Finding solutions starting with letter:', letter);
        // Find all possible words starting with this letter
        const possibleWords = this.dictionary.findPossibleWords(letter, this.allLetters);
        console.log(`Found ${possibleWords.length} possible words starting with ${letter}`);
        
        // Try each possible word as the starting word
        for (const word of possibleWords) {
          solutionsChecked++;
          if (solutionsChecked % 1000 === 0) {
            console.log(`Checked ${solutionsChecked} potential solutions...`);
            // If we've been running for more than 10 seconds, return what we have
            if (Date.now() - startTime > 10000) {
              console.log('Search time limit reached, returning current solutions');
              return this.solutions;
            }
          }

          if (bannedWords.hasWord(word)) {
            continue;
          }

          const currentSolution: string[] = [word];
          const usedLetters = new Set(word.split(''));
          
          // Try to find more words that can be formed with remaining letters
          this.findAdditionalWords(currentSolution, usedLetters, maxWords);
        }
      }
    }

    // Sort solutions by score
    this.solutions.sort((a, b) => this.scoreSolution(b) - this.scoreSolution(a));
    console.log(`Found ${this.solutions.length} solutions`);
    return this.solutions;
  }

  private findAdditionalWords(
    currentSolution: string[],
    usedLetters: Set<string>,
    maxWords: number
  ): void {
    // If we've reached max words or used most letters, evaluate this solution
    if (currentSolution.length >= maxWords || usedLetters.size >= this.allLetters.size * 0.8) {
      this.evaluateSolution([...currentSolution]);
      return;
    }

    // Get available letters
    const availableLetters = new Set([...this.allLetters].filter(l => !usedLetters.has(l)));
    if (availableLetters.size === 0) {
      this.evaluateSolution([...currentSolution]);
      return;
    }

    // Try each available letter as the start of the next word
    for (const letter of availableLetters) {
      const possibleWords = this.dictionary.findPossibleWords(letter, this.allLetters);
      
      // Try each possible word
      for (const word of possibleWords) {
        // Skip if word is banned or already in solution
        if (bannedWords.hasWord(word) || currentSolution.includes(word)) {
          continue;
        }

        // Check if we can form this word with remaining letters
        const wordLetters = new Set(word.split(''));
        let canUseWord = true;
        const remainingLetters = new Map<string, number>();
        
        // Count available letters
        for (const l of this.allLetters) {
          if (!usedLetters.has(l)) {
            remainingLetters.set(l, (remainingLetters.get(l) || 0) + 1);
          }
        }

        // Check if we have enough letters for this word
        for (const l of word) {
          const count = remainingLetters.get(l) || 0;
          if (count === 0) {
            canUseWord = false;
            break;
          }
          remainingLetters.set(l, count - 1);
        }

        if (canUseWord) {
          // Add this word to the solution and continue searching
          currentSolution.push(word);
          const newUsedLetters = new Set(usedLetters);
          for (const l of word) {
            newUsedLetters.add(l);
          }
          this.findAdditionalWords(currentSolution, newUsedLetters, maxWords);
          currentSolution.pop();
        }
      }
    }
  }

  /**
   * Evaluate a solution and add it if it's valid
   */
  private evaluateSolution(solution: string[]): void {
    // Only consider solutions that use a good portion of available letters
    const usedLetters = new Set<string>();
    for (const word of solution) {
      for (const char of word) {
        usedLetters.add(char);
      }
    }

    // Calculate what percentage of total letters are used
    const totalLetters = this.allLetters.size;
    const usedLetterCount = usedLetters.size;
    const letterUsageRatio = usedLetterCount / totalLetters;

    // Only add solutions that use at least 60% of available letters
    if (letterUsageRatio >= 0.6) {
      // Check if this solution is unique
      const solutionKey = solution.sort().join(',');
      if (!this.solutions.some(existing => existing.sort().join(',') === solutionKey)) {
        this.solutions.push(solution);
      }
    }
  }

  private scoreSolution(solution: string[]): number {
    let score = 0;
    const usedLetters = new Set<string>();

    // Add points for known good words
    for (const word of solution) {
      if (knownGoodWords.hasWord(word)) {
        score += 100;  // High bonus for known good words
      }

      // Add points for unique letters
      for (const char of word) {
        if (!usedLetters.has(char)) {
          usedLetters.add(char);
          score += 1;
        }
      }
    }

    // Add points for using more of the available letters
    score += (usedLetters.size / this.allLetters.size) * 50;

    return score;
  }

  /**
   * Find solutions that begin with a specific word
   */
  findSolutionWithStartWord(startWord: string): Solution[] {
    console.log('Finding solutions starting with word:', startWord);
    if (!this.config) {
      throw new Error('Puzzle not configured. Call setupPuzzle first.');
    }

    // Validate start word
    if (!this.isValidWord(startWord)) {
      throw new Error(`Invalid start word: ${startWord}`);
    }

    // Clear previous solutions
    this.solutions = [];

    // Initialize with start word
    const currentSolution: string[] = [startWord];
    const usedLetters = new Set(startWord.split(''));

    // Find additional words that can be formed with remaining letters
    this.findAdditionalWords(currentSolution, usedLetters, 7);

    // Sort solutions by score
    this.solutions.sort((a, b) => this.scoreSolution(b) - this.scoreSolution(a));
    console.log(`Found ${this.solutions.length} solutions starting with ${startWord}`);
    
    return this.solutions;
  }

  /**
   * Check if a word is valid for the current puzzle configuration
   */
  private isValidWord(word: string): boolean {
    // Convert word to uppercase
    word = word.toUpperCase();

    // Check if word is banned
    if (bannedWords.hasWord(word)) {
      return false;
    }

    // Check if word exists in dictionary
    if (!this.dictionary.isValidWord(word)) {
      return false;
    }

    // Check if all letters in word are available
    const usedLetters = new Set<string>();
    for (const char of word) {
      if (!this.allLetters.has(char)) {
        return false;
      }
      usedLetters.add(char);
    }

    // Check if we're not using too many of any letter
    for (const char of usedLetters) {
      const availableCount = this.countAvailableLetters(char);
      const usedCount = this.countUsedLetters(word, char);
      if (usedCount > availableCount) {
        return false;
      }
    }

    return true;
  }

  /**
   * Add a word to the known good words list
   */
  addKnownGoodWord(word: string): void {
    knownGoodWords.addWord(word);
  }

  /**
   * Remove a word from the known good words list
   */
  removeKnownGoodWord(word: string): void {
    knownGoodWords.removeWord(word.toUpperCase());
  }

  /**
   * Check if a word is in the known good words list
   */
  isKnownGoodWord(word: string): boolean {
    return knownGoodWords.hasWord(word.toUpperCase());
  }

  /**
   * Count how many times a letter is available in the puzzle
   */
  countAvailableLetters(letter: string): number {
    if (!this.config) {
      throw new Error('Puzzle not configured. Call setupPuzzle first.');
    }

    let count = 0;
    letter = letter.toUpperCase();

    // Count occurrences in each side
    count += (this.config.left.match(new RegExp(letter, 'g')) || []).length;
    count += (this.config.top.match(new RegExp(letter, 'g')) || []).length;
    count += (this.config.right.match(new RegExp(letter, 'g')) || []).length;
    count += (this.config.bottom.match(new RegExp(letter, 'g')) || []).length;

    return count;
  }

  /**
   * Count how many times a letter appears in a word
   */
  countUsedLetters(word: string, letter: string): number {
    letter = letter.toUpperCase();
    return (word.toUpperCase().match(new RegExp(letter, 'g')) || []).length;
  }
} 