export interface KannadaBibleData {
  Book: {
    Chapter: {
      Verse: {
        Verse: string;
      }[];
    }[];
  }[];
}

// Complete list of 66 Kannada book names in biblical order
const KannadaBooks = [
  // Old Testament (39 books)
    "ಆದಿಕಾಂಡ", "ವಿಮೋಚನಕಾಂಡ", "ಯಾಜಕಕಾಂಡ", "ಅರಣ್ಯಕಾಂಡ", "ಧರ್ಮೋಪದೇಶಕಾಂಡ", "ಯೆಹೋಶುವ", "ನ್ಯಾಯಸ್ಥಾಪಕರು",
    "ರೂತಳು", "1 ಸಮುವೇಲನು", "2 ಸಮುವೇಲನು", "1 ಅರಸುಗಳು", "2 ಅರಸುಗಳು", "1 ಪೂರ್ವಕಾಲವೃತ್ತಾ", "2 ಪೂರ್ವಕಾಲವೃತ್ತಾ",
    "ಎಜ್ರನು", "ನೆಹೆಮಿಯ", "ಎಸ್ತೇರಳು", "ಯೋಬನು", "ಕೀರ್ತನೆಗಳು", "ಙ್ಞಾನೋಕ್ತಿಗಳು", "ಪ್ರಸಂಗಿ", "ಪರಮ ಗೀತ", "ಯೆಶಾಯ",
    "ಯೆರೆಮಿಯ", "ಪ್ರಲಾಪಗಳು", "ಯೆಹೆಜ್ಕೇಲನು", "ದಾನಿಯೇಲನು", "ಹೋಶೇ", "ಯೋವೇಲ", "ಆಮೋಸ", "ಓಬದ್ಯ", "ಯೋನ", "ಮಿಕ",
    "ನಹೂಮ", "ಹಬಕ್ಕೂಕ್ಕ", "ಚೆಫನ್ಯ", "ಹಗ್ಗಾಯ", "ಜೆಕರ್ಯ", "ಮಲಾಕಿಯ", "ಮತ್ತಾಯನು", "ಮಾರ್ಕನು", "ಲೂಕನು", "ಯೋಹಾನನು",
    "ಅಪೊಸ್ತಲರ ಕೃತ್ಯಗ", "ರೋಮಾಪುರದವರಿಗೆ", "1 ಕೊರಿಂಥದವರಿಗೆ", "2 ಕೊರಿಂಥದವರಿಗೆ", "ಗಲಾತ್ಯದವರಿಗೆ", "ಎಫೆಸದವರಿಗೆ",
    "ಫಿಲಿಪ್ಪಿಯವರಿಗೆ", "ಕೊಲೊಸ್ಸೆಯವರಿಗೆ", "1 ಥೆಸಲೊನೀಕದವರಿಗೆ", "2 ಥೆಸಲೊನೀಕದವರಿಗೆ", "1 ತಿಮೊಥೆಯನಿಗೆ", "2 ತಿಮೊಥೆಯನಿಗೆ",
    "ತೀತನಿಗೆ", "ಫಿಲೆಮೋನನಿಗೆ", "ಇಬ್ರಿಯರಿಗೆ", "ಯಾಕೋಬನು", "1 ಪೇತ್ರನು", "2 ಪೇತ್ರನು", "1 ಯೋಹಾನನು", "2 ಯೋಹಾನನು",
    "3 ಯೋಹಾನನು", "ಯೂದನು", "ಪ್ರಕಟನೆ"
];

let cachedBibleData: KannadaBibleData | null = null;

/**
 * Load the Kannada Bible JSON from public folder
 */
const loadKannadaBible = async (): Promise<KannadaBibleData | null> => {
  if (cachedBibleData) {
    return cachedBibleData;
  }

  try {
    const response = await fetch('/bible-verse-lang/bible-ka.json');
    if (!response.ok) {
      throw new Error('Failed to load Kannada Bible');
    }
    cachedBibleData = await response.json();
    return cachedBibleData;
  } catch (error) {
    console.error('Error loading Kannada Bible:', error);
    return null;
  }
};

/**
 * Get Kannada Bible verses using the provided logic
 */
export const getKannadaBibleVerses = async (
  bookName: string,
  chapterNum: string,
  verses: string
): Promise<string | null> => {
  const bibleData = await loadKannadaBible();
  if (!bibleData) return null;

  // Find book index (case-sensitive and trim supported)
  const bookIndex = KannadaBooks.indexOf(bookName.trim());
  if (bookIndex === -1) return null;

  // Chapter is zero-based in JSON, so subtract 1
  const chapterIndex = parseInt(chapterNum, 10) - 1;
  if (isNaN(chapterIndex) || chapterIndex < 0) return null;

  // Check if chapter exists
  const chapter = bibleData.Book[bookIndex]?.Chapter[chapterIndex];
  if (!chapter) return null;

  // If verses is empty, get all verses in the chapter
  if (!verses || verses.trim() === "") {
    const allVerses = chapter.Verse.map((v, i) => `${i + 1}. ${v.Verse}`);
    return allVerses.join('\n');
  }

  // Verse indices (handle comma-separated input)
  const verseIndices = verses.split(',').map(v => {
    // Handle ranges like "1-3"
    if (v.includes('-')) {
      const [start, end] = v.split('-').map(p => parseInt(p.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        return Array.from({ length: end - start + 1 }, (_, i) => start + i - 1);
      }
    }
    return parseInt(v.trim(), 10) - 1;
  }).flat();

  // Retrieve verses
  const selectedVerses = verseIndices.map(idx => {
    const verseText = chapter.Verse[idx]?.Verse;
    return verseText ? `${idx + 1}. ${verseText}` : "";
  }).filter(v => v);

  return selectedVerses.length > 0 ? selectedVerses.join('\n') : null;
};

/**
 * Get list of Kannada book names for autocomplete
 */
export const getKannadaBookNames = (): string[] => {
  return [...KannadaBooks];
};

/**
 * Parse Kannada reference format (e.g., "ಯೋವಾನನು 3:16")
 */
export const parseKannadaReference = (reference: string): {
  book: string;
  chapter: string;
  verses: string;
} | null => {
  const trimmed = reference.trim();
  
  // Split by space to separate book name from chapter:verse or chapter
  const lastSpaceIndex = trimmed.lastIndexOf(' ');
  if (lastSpaceIndex === -1) return null;

  const bookName = trimmed.substring(0, lastSpaceIndex).trim();
  const chapterVerse = trimmed.substring(lastSpaceIndex + 1).trim();

  // Split chapter:verse or just chapter
  if (chapterVerse.includes(':')) {
    const [chapter, verses] = chapterVerse.split(':');
    return {
      book: bookName,
      chapter: chapter.trim(),
      verses: verses.trim()
    };
  } else {
    // Chapter only search
    return {
      book: bookName,
      chapter: chapterVerse.trim(),
      verses: ""
    };
  }
};