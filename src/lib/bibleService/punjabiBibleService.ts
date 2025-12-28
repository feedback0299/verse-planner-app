export interface PunjabiBibleData {
  Book: {
    Chapter: {
      Verse: {
        Verse: string;
      }[];
    }[];
  }[];
}

// Complete list of 66 Punjabi book names in biblical order
const PunjabiBooks = [
    "ਪੈਦਾਇਸ਼", "ਖ਼ਰੋਜ", "ਅਹਬਾਰ", "ਗਿਣਤੀ", "ਅਸਤਸਨਾ", "ਯਸ਼ਵਾ", "ਨਿਆਂਈਆਂ ਦੀ ਪੋਥੀ", "ਰੁੱਤ",
    "੧ ਸਮੋਈਲ", "੨ ਸਮੋਈਲ", "੧ ਸਲਾਤੀਨ", "੨ ਸਲਾਤੀਨ", "੧ ਤਵਾਰੀਖ਼", "੨ ਤਵਾਰੀਖ਼",
    "ਅਜ਼ਰਾ", "ਨਹਮਿਆਹ", "ਆ ਸਤਰ", "ਅੱਯੂਬ", "ਜ਼ਬੂਰ", "ਅਮਸਾਲ", "ਵਾਈਜ਼", "ਗ਼ਜ਼ਲ ਅਲਗ਼ਜ਼ਲਾਤ",
    "ਯਸਈਆਹ", "ਯਰਮਿਆਹ", "ਨੂਹ", "ਹਿਜ਼ ਕੀ ਐਲ", "ਦਾਨੀ ਐਲ", "ਹੋ ਸੀਅ", "ਯਵਾਐਲ", "ਆਮੋਸ",
    "ਅਬਦ ਯਾਹ", "ਯਵਨਾਹ", "ਮੀਕਾਹ", "ਨਾ ਹੋਮ", "ਹਬਕੋਕ", "ਸਫ਼ਨਿਆਹ", "ਹਜਿ", "ਜ਼ਿਕਰ ਯਾਹ", "ਮਲਾਕੀ",
    "ਮੱਤੀ", "ਮਰਕੁਸ", "ਲੋਕਾ", "ਯੂਹੰਨਾ", "ਰਸੂਲਾਂ ਦੇ ਕਰਤੱਬ", "ਰੋਮੀਆਂ", "੧ ਕੁਰਿੰਥੀਆਂ", "੨ ਕੁਰਿੰਥੀਆਂ", "ਗਲਾਤੀਆਂ",
    "ਅਫ਼ਸੀਆਂ", "ਫ਼ਿਲਿੱਪੀਆਂ", "ਕੁਲੁੱਸੀਆਂ", "੧ ਥੱਸਲੁਨੀਕੀਆਂ", "੨ ਥੱਸਲੁਨੀਕੀਆਂ", "੧ ਤਿਮੋਥਿਉਸ", "੨ ਤਿਮੋਥਿਉਸ ",
    "ਤੀਤੁਸ", "ਫ਼ਿਲੇਮੋਨ", "ਇਬਰਾਨੀਆਂ", "ਯਾਕੂਬ", "੧ ਪਤਰਸ", "੨ ਪਤਰਸ", "੧ ਯੂਹੰਨਾ", "੨ ਯੂਹੰਨਾ", "੩ ਯੂਹੰਨਾ",
    "ਯਹੂ ਦਾਹ", "ਪਰਕਾਸ਼ ਦੀ ਪੋਥੀ"
];

let cachedBibleData: PunjabiBibleData | null = null;

/**
 * Load the Punjabi Bible JSON from public folder
 */
const loadPunjabiBible = async (): Promise<PunjabiBibleData | null> => {
  if (cachedBibleData) {
    return cachedBibleData;
  }

  try {
    const response = await fetch('/bible-verse-lang/bible-pu.json');
    if (!response.ok) {
      throw new Error('Failed to load Punjabi Bible');
    }
    cachedBibleData = await response.json();
    return cachedBibleData;
  } catch (error) {
    console.error('Error loading Punjabi Bible:', error);
    return null;
  }
};

/**
 * Get Punjabi Bible verses using the provided logic
 */
export const getPunjabiBibleVerses = async (
  bookName: string,
  chapterNum: string,
  verses: string
): Promise<string | null> => {
  const bibleData = await loadPunjabiBible();
  if (!bibleData) return null;

  // Find book index (case-sensitive and trim supported)
  const bookIndex = PunjabiBooks.indexOf(bookName.trim());
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
 * Get list of Punjabi book names for autocomplete
 */
export const getPunjabiBookNames = (): string[] => {
  return [...PunjabiBooks];
};

/**
 * Parse Punjabi reference format (e.g., "ਯੂਹੰਨਾ 3:16")
 */
export const parsePunjabiReference = (reference: string): {
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