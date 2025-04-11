export class DictionaryService {
  private words: Set<string> = new Set();
  private isLoaded: boolean = false;

  async loadDictionary(onProgress?: (progress: number) => void): Promise<void> {
    if (this.isLoaded) {
      console.log('Dictionary already loaded with', this.words.size, 'words');
      return;
    }

    try {
      console.log('Starting dictionary load...');
      // Load both dictionaries
      const [enableWords, sowpodsWords] = await Promise.all([
        this.loadDictionaryFile('/data/enable_dict.txt', onProgress),
        this.loadDictionaryFile('/data/sowpods.txt', onProgress)
      ]);

      console.log(`Loaded ${enableWords.length} words from enable_dict.txt`);
      console.log(`Loaded ${sowpodsWords.length} words from sowpods.txt`);

      // Combine words from both dictionaries
      enableWords.forEach(word => this.words.add(word.toUpperCase()));
      sowpodsWords.forEach(word => this.words.add(word.toUpperCase()));

      this.isLoaded = true;
      console.log(`Dictionary loaded successfully with ${this.words.size} total unique words`);
    } catch (error) {
      console.error('Error loading dictionary:', error);
      throw new Error('Failed to load dictionary');
    }
  }

  private async loadDictionaryFile(path: string, onProgress?: (progress: number) => void): Promise<string[]> {
    try {
      console.log(`Loading dictionary file from ${path}...`);
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log(`Received ${text.length} bytes from ${path}`);
      
      // Split into words and filter out empty lines
      const words = text.split('\n').filter(word => word.trim());
      console.log(`Parsed ${words.length} words from ${path}`);
      
      if (onProgress) {
        onProgress(0.5); // Simple progress indication
      }

      return words;
    } catch (error) {
      console.error(`Error loading dictionary file ${path}:`, error);
      throw error;
    }
  }

  findPossibleWords(startLetter: string, availableLetters: Set<string>): string[] {
    const possibleWords: string[] = [];
    const upperStartLetter = startLetter.toUpperCase();

    for (const word of this.words) {
      if (!word.startsWith(upperStartLetter)) {
        continue;
      }

      // Check if word can be formed using available letters
      let canForm = true;
      const letterCount = new Map<string, number>();

      // Count available letters
      for (const letter of availableLetters) {
        letterCount.set(letter, (letterCount.get(letter) || 0) + 1);
      }

      // Check each letter in the word
      for (const letter of word) {
        const count = letterCount.get(letter) || 0;
        if (count === 0) {
          canForm = false;
          break;
        }
        letterCount.set(letter, count - 1);
      }

      if (canForm) {
        possibleWords.push(word);
      }
    }

    return possibleWords;
  }

  /**
   * Check if a word exists in the dictionary
   */
  isValidWord(word: string): boolean {
    return this.words.has(word.toUpperCase());
  }

  /**
   * Get the total number of words in the dictionary
   */
  getWordCount(): number {
    return this.words.size;
  }
} 