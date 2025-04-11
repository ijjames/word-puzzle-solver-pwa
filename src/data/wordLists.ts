export interface WordList {
  addWord(word: string): void;
  removeWord(word: string): void;
  hasWord(word: string): boolean;
  getWords(): string[];
}

class KnownGoodWords implements WordList {
  private words: Set<string> = new Set();

  addWord(word: string): void {
    this.words.add(word.toUpperCase());
  }

  removeWord(word: string): void {
    this.words.delete(word.toUpperCase());
  }

  hasWord(word: string): boolean {
    return this.words.has(word.toUpperCase());
  }

  getWords(): string[] {
    return Array.from(this.words).sort();
  }
}

class BannedWords implements WordList {
  private words: Set<string> = new Set();

  addWord(word: string): void {
    this.words.add(word.toUpperCase());
  }

  removeWord(word: string): void {
    this.words.delete(word.toUpperCase());
  }

  hasWord(word: string): boolean {
    return this.words.has(word.toUpperCase());
  }

  getWords(): string[] {
    return Array.from(this.words).sort();
  }
}

export const knownGoodWords = new KnownGoodWords();
export const bannedWords = new BannedWords(); 