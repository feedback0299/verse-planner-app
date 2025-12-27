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
 * Get list of Punjabi book names for autocomplete
 */
export const getPunjabiBookNames = (): string[] => {
  return [...PunjabiBooks];
};

/**
 * Parse Punjabi reference format (e.g., "யோவான் 3:16" or "யோவான் 3:16,17")
 */
export const parsePunjabiReference = (reference: string): {
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