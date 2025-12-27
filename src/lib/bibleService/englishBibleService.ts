export interface EnglishBibleData {
  Book: {
    Chapter: {
      Verse: {
        Verse: string;
      }[];
    }[];
  }[];
}

// Complete list of 66 English book names in biblical order
const EnglishBooks = [
  // Old Testament (39 books)
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua",
    "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles",
    "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes",
    "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel",
    "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah",
    "Haggai", "Zechariah", "Malachi", 
    
  // New Testament (27 books)
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
    "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians",
    "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon",
    "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

let cachedBibleData: EnglishBibleData | null = null;

/**
 * Load the English Bible JSON from public folder
 */
const loadEnglishBible = async (): Promise<EnglishBibleData | null> => {
  if (cachedBibleData) {
    return cachedBibleData;
  }

  try {
    const response = await fetch('/bible-verse-lang/bible-en.json');
    if (!response.ok) {
      throw new Error('Failed to load English Bible');
    }
    cachedBibleData = await response.json();
    return cachedBibleData;
  } catch (error) {
    console.error('Error loading English Bible:', error);
    return null;
  }
};

/**
 * Get English Bible verses using the provided logic
 */
export const getEnglishBibleVerses = async (
  bookName: string,
  chapterNum: string,
  verses: string
): Promise<string | null> => {
  const bibleData = await loadEnglishBible();
  if (!bibleData) return null;

  // Find book index (case-sensitive and trim supported)
  const bookIndex = EnglishBooks.indexOf(bookName.trim());
  if (bookIndex === -1) return null;

  // Chapter is zero-based in JSON, so subtract 1
  const chapterIndex = parseInt(chapterNum, 10) - 1;
  if (isNaN(chapterIndex) || chapterIndex < 0) return null;

  // Check if chapter exists
  if (!bibleData.Book[bookIndex]?.Chapter[chapterIndex]) return null;

  // Verse indices (handle comma-separated input)
  const verseIndices = verses.split(',').map(v => parseInt(v.trim(), 10) - 1);

  // Retrieve verses
  const selectedVerses = verseIndices.map(idx => {
    return bibleData.Book[bookIndex].Chapter[chapterIndex].Verse[idx]?.Verse || "";
  }).filter(v => v); // Remove empty verses

  return selectedVerses.length > 0 ? selectedVerses.join(' ') : null;
};

/**
 * Get list of English book names for autocomplete
 */
export const getEnglishBookNames = (): string[] => {
  return [...EnglishBooks];
};

/**
 * Parse English reference format (e.g., "யோவான் 3:16" or "யோவான் 3:16,17")
 */
export const parseEnglishReference = (reference: string): {
  book: string;
  chapter: string;
  verses: string;
} | null => {
  const trimmed = reference.trim();
  
  // Split by space to separate book name from chapter:verse
  const lastSpaceIndex = trimmed.lastIndexOf(' ');
  if (lastSpaceIndex === -1) return null;

  const bookName = trimmed.substring(0, lastSpaceIndex).trim();
  const chapterVerse = trimmed.substring(lastSpaceIndex + 1).trim();

  // Split chapter:verse
  const [chapter, verses] = chapterVerse.split(':');
  if (!chapter || !verses) return null;

  return {
    book: bookName,
    chapter: chapter.trim(),
    verses: verses.trim()
  };
};