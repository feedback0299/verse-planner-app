export interface TamilBibleData {
  Book: {
    Chapter: {
      Verse: {
        Verse: string;
      }[];
    }[];
  }[];
}

// Complete list of 66 Tamil book names in biblical order
const TamilBooks = [
  // Old Testament (39 books)
  "ஆதியாகமம்", "யாத்திராகமம்", "லேவியராகமம்", "எண்ணாகமம்", "உபாகமம்",
  "யோசுவா", "நியாயாதிபதிகள்", "ரூத்", "1 சாமுவேல்", "2 சாமுவேல்",
  "1 இராஜாக்கள்", "2 இராஜாக்கள்", "1 நாளாகமம்", "2 நாளாகமம்", "எஸ்றா",
  "நெகேமியா", "எஸ்தர்", "யோபு", "சங்கீதம்", "நீதிமொழிகள்",
  "பிரசங்கி", "உன்னதப்பாட்டு", "ஏசாயா", "எரேமியா", "புலம்பல்",
  "எசேக்கியேல்", "தானியேல்", "ஓசியா", "யோவேல்", "ஆமோஸ்",
  "ஒபதியா", "யோனா", "மீகா", "நாகூம்", "ஆபகூக்",
  "செப்பனியா", "ஆகாய்", "சகரியா", "மல்கியா",
  // New Testament (27 books)
  "மத்தேயு", "மாற்கு", "லூக்கா", "யோவான்", "அப்போஸ்தலர்",
  "ரோமர்", "1 கொரிந்தியர்", "2 கொரிந்தியர்", "கலாத்தியர்", "எபேசியர்",
  "பிலிப்பியர்", "கொலோசெயர்", "1 தெசலோனிக்கேயர்", "2 தெசலோனிக்கேயர்", "1 தீமோத்தேயு",
  "2 தீமோத்தேயு", "தீத்து", "பிலேமோன்", "எபிரெயர்", "யாக்கோபு",
  "1 பேதுரு", "2 பேதுரு", "1 யோவான்", "2 யோவான்", "3 யோவான்",
  "யூதா", "வெளிப்படுத்தல்"
];

let cachedBibleData: TamilBibleData | null = null;

/**
 * Load the Tamil Bible JSON from public folder
 */
const loadTamilBible = async (): Promise<TamilBibleData | null> => {
  if (cachedBibleData) {
    return cachedBibleData;
  }

  try {
    const response = await fetch('/bible-verse-lang/bible-ta.json');
    if (!response.ok) {
      throw new Error('Failed to load Tamil Bible');
    }
    cachedBibleData = await response.json();
    return cachedBibleData;
  } catch (error) {
    console.error('Error loading Tamil Bible:', error);
    return null;
  }
};

/**
 * Get Tamil Bible verses using the provided logic
 */
export const getTamilBibleVerses = async (
  bookName: string,
  chapterNum: string,
  verses: string
): Promise<string | null> => {
  const bibleData = await loadTamilBible();
  if (!bibleData) return null;

  // Find book index (case-sensitive and trim supported)
  const bookIndex = TamilBooks.indexOf(bookName.trim());
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
 * Get list of Tamil book names for autocomplete
 */
export const getTamilBookNames = (): string[] => {
  return [...TamilBooks];
};

/**
 * Parse Tamil reference format (e.g., "யோவான் 3:16" or "யோவான் 3:16,17")
 */
export const parseTamilReference = (reference: string): {
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
