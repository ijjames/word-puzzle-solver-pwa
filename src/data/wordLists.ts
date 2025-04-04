export interface WordList {
  words: Set<string>;
  addWord(word: string): void;
  removeWord(word: string): void;
  hasWord(word: string): boolean;
  getWords(): string[];
  getWordCount(): number;
}

export class KnownGoodWords implements WordList {
  public words: Set<string> = new Set();

  constructor() {
    // Load words from file
    this.loadWords();
  }

  private async loadWords() {
    try {
      const response = await fetch('/data/known_good_words.txt');
      const text = await response.text();
      const words = text.split('\n').filter(word => word.trim());
      words.forEach(word => this.words.add(word.toLowerCase()));
    } catch (error) {
      console.error('Error loading known good words:', error);
    }
  }

  addWord(word: string): void {
    this.words.add(word.toLowerCase());
  }

  removeWord(word: string): void {
    this.words.delete(word.toLowerCase());
  }

  hasWord(word: string): boolean {
    return this.words.has(word.toLowerCase());
  }

  getWords(): string[] {
    return Array.from(this.words).sort();
  }

  getWordCount(): number {
    return this.words.size;
  }
}

export class BannedWords implements WordList {
  public words: Set<string> = new Set();

  constructor() {
    // Load words from file
    this.loadWords();
  }

  private async loadWords() {
    try {
      const response = await fetch('/data/banned_words.txt');
      const text = await response.text();
      const words = text.split('\n').filter(word => word.trim());
      words.forEach(word => this.words.add(word.toLowerCase()));
    } catch (error) {
      console.error('Error loading banned words:', error);
    }
  }

  addWord(word: string): void {
    this.words.add(word.toLowerCase());
  }

  removeWord(word: string): void {
    this.words.delete(word.toLowerCase());
  }

  hasWord(word: string): boolean {
    return this.words.has(word.toLowerCase());
  }

  getWords(): string[] {
    return Array.from(this.words).sort();
  }

  getWordCount(): number {
    return this.words.size;
  }
}

// Create singleton instances
export const knownGoodWords = new KnownGoodWords();
export const bannedWords = new BannedWords(); 