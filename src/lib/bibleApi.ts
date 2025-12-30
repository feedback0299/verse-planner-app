import { getTamilBibleVerses, parseTamilReference, getTamilBookNames } from "./bibleService/tamilBibleService";
import { getEnglishBibleVerses, parseEnglishReference, getEnglishBookNames } from "./bibleService/englishBibleService";
import { getKannadaBibleVerses, parseKannadaReference, getKannadaBookNames } from "./bibleService/kannadaBibleService";
import { getHindiBibleVerses, parseHindiReference, getHindiBookNames } from "./bibleService/hindiBibleService";
import { getTeluguBibleVerses, parseTeluguReference, getTeluguBookNames } from "./bibleService/teluguBibleService";
import { getMalayalamBibleVerses, parseMalayalamReference, getMalayalamBookNames } from "./bibleService/malayalamBibleService";
import { getPunjabiBibleVerses, parsePunjabiReference, getPunjabiBookNames } from "./bibleService/punjabiBibleService";

export { getTamilBibleVerses, parseTamilReference, getTamilBookNames };
export { getEnglishBibleVerses, parseEnglishReference, getEnglishBookNames };
export { getKannadaBibleVerses, parseKannadaReference, getKannadaBookNames };
export { getHindiBibleVerses, parseHindiReference, getHindiBookNames };
export { getTeluguBibleVerses, parseTeluguReference, getTeluguBookNames };
export { getMalayalamBibleVerses, parseMalayalamReference, getMalayalamBookNames };
export { getPunjabiBibleVerses, parsePunjabiReference, getPunjabiBookNames };

export interface BibleVerse {
  reference: string;
  text: string;
  translation_id: string;
  translation_name: string;
}

const formatBibleReference = (book: string, chapter: string, verses: string, language: string): string => {
  let chapterLabel = "Chapter";
  let verseLabel = "Verse";
  let versesLabel = "Verses";
  let displayBook = book;

  // For non-English languages, append English book name in parentheses
  if (language !== 'en') {
    const bookNum = getBookNumber(book, language);
    if (bookNum) {
      const englishBookName = getEnglishBookNames()[bookNum - 1];
      if (englishBookName && englishBookName.toLowerCase() !== book.toLowerCase()) {
        displayBook = `${book} (${englishBookName})`;
      }
    }
  }

  switch (language) {
    case 'ta':
      chapterLabel = "அதிகாரம்";
      verseLabel = "வசனம்";
      versesLabel = "வசனங்கள்";
      break;
    case 'hi':
      chapterLabel = "अध्याय";
      verseLabel = "आयत";
      versesLabel = "आयतों";
      break;
    case 'ka':
      chapterLabel = "ಅಧ್ಯಾಯ";
      verseLabel = "ವಚನ";
      versesLabel = "ವಚನಗಳು";
      break;
    case 'te':
      chapterLabel = "అధ్యాయము";
      verseLabel = "వచనము";
      versesLabel = "వచనములు";
      break;
    case 'ma':
    case 'ml':
      chapterLabel = "അധ്യായം";
      verseLabel = "വാക്യം";
      versesLabel = "വാക്യങ്ങൾ";
      break;
    case 'pu':
      chapterLabel = "ਅਧਿਆਇ";
      verseLabel = "ਆਇਤ";
      versesLabel = "ਆਇਤਾਂ";
      break;
  }

  if (!verses || verses.trim() === "") {
    return `${displayBook} ${chapterLabel} ${chapter}`;
  }

  const isPlural = verses.includes(',') || verses.includes('-');
  const label = isPlural ? versesLabel : verseLabel;
  
  return `${displayBook} ${chapterLabel} ${chapter} ${label} ${verses}`;
};

const searchTamilVerse = async (reference: string): Promise<BibleVerse | null> => {
  const parsed = parseTamilReference(reference);
  if (!parsed) return null;

  const { book, chapter, verses } = parsed;
  const text = await getTamilBibleVerses(book, chapter, verses);
  if (!text) return null;
  
  return {
    reference: formatBibleReference(book, chapter, verses, 'ta'),
    text: text,
    translation_id: 'tamil',
    translation_name: 'Tamil Bible'
  };
};

const searchEnglishVerse = async (reference: string): Promise<BibleVerse | null> => {
  const parsed = parseEnglishReference(reference);
  if (!parsed) return null;

  const { book, chapter, verses } = parsed;
  const text = await getEnglishBibleVerses(book, chapter, verses);
  if (!text) return null;
  
  return {
    reference: formatBibleReference(book, chapter, verses, 'en'),
    text: text,
    translation_id: 'english',
    translation_name: 'English Bible'
  };
};


const searchKannadaVerse = async (reference: string): Promise<BibleVerse | null> => {
  const parsed = parseKannadaReference(reference);
  if (!parsed) return null;

  const { book, chapter, verses } = parsed;
  const text = await getKannadaBibleVerses(book, chapter, verses);
  if (!text) return null;
  
  return {
    reference: formatBibleReference(book, chapter, verses, 'ka'),
    text: text,
    translation_id: 'kannada',
    translation_name: 'Kannada Bible'
  };
};

const searchHindiVerse = async (reference: string): Promise<BibleVerse | null> => {
  const parsed = parseHindiReference(reference);
  if (!parsed) return null;
  const { book, chapter, verses } = parsed;
  const text = await getHindiBibleVerses(book, chapter, verses);
  if (!text) return null;
  return { 
    reference: formatBibleReference(book, chapter, verses, 'hi'), 
    text, 
    translation_id: 'hindi', 
    translation_name: 'Hindi Bible' 
  };
};

const searchTeluguVerse = async (reference: string): Promise<BibleVerse | null> => {
  const parsed = parseTeluguReference(reference);
  if (!parsed) return null;
  const { book, chapter, verses } = parsed;
  const text = await getTeluguBibleVerses(book, chapter, verses);
  if (!text) return null;
  return { 
    reference: formatBibleReference(book, chapter, verses, 'te'), 
    text, 
    translation_id: 'telugu', 
    translation_name: 'Telugu Bible' 
  };
};

const searchMalayalamVerse = async (reference: string): Promise<BibleVerse | null> => {
  const parsed = parseMalayalamReference(reference);
  if (!parsed) return null;
  const { book, chapter, verses } = parsed;
  const text = await getMalayalamBibleVerses(book, chapter, verses);
  if (!text) return null;
  return { 
    reference: formatBibleReference(book, chapter, verses, 'ml'), 
    text, 
    translation_id: 'malayalam', 
    translation_name: 'Malayalam Bible' 
  };
};

const searchPunjabiVerse = async (reference: string): Promise<BibleVerse | null> => {
  const parsed = parsePunjabiReference(reference);
  if (!parsed) return null;
  const { book, chapter, verses } = parsed;
  const text = await getPunjabiBibleVerses(book, chapter, verses);
  if (!text) return null;
  return { 
    reference: formatBibleReference(book, chapter, verses, 'pu'), 
    text, 
    translation_id: 'punjabi', 
    translation_name: 'Punjabi Bible' 
  };
};

export const searchBibleVerse = async (
  reference: string, 
  language: string = 'ta'
): Promise<BibleVerse | null> => {
  // If Tamil, use local JSON
  if (language === 'ta') {
    return searchTamilVerse(reference);
  } else if (language === 'en') {
    return searchEnglishVerse(reference);
  } else if (language === 'ka') {
    return searchKannadaVerse(reference);
  } else if (language === 'hi') {
    return searchHindiVerse(reference);
  } else if (language === 'te') {
    return searchTeluguVerse(reference);
  } else if (language === 'ml' || language === 'ma') {
    return searchMalayalamVerse(reference);
  } else if (language === 'pu') {
    return searchPunjabiVerse(reference);
  }
  
  // Otherwise use English API for other languages
  try {
    // Clean up the reference format
    const cleanReference = reference.trim().replace(/\s+/g, ' ');
    
    const response = await fetch(`https://bible-api.com/${encodeURIComponent(cleanReference)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch verse');
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return {
      reference: data.reference,
      text: data.text.trim(),
      translation_id: data.translation_id || 'kjv',
      translation_name: data.translation_name || 'King James Version'
    };
  } catch (error) {
    console.error('Error fetching Bible verse:', error);
    return null;
  }
};

export const suggestVerseFormat = (input: string): string => {
  // Help users format their verse references correctly
  const suggestions = [
    'John 3:16',
    'Psalms 23:1',
    'Romans 8:28',
    'Philippians 4:13',
    'Genesis 1:1',
    'Matthew 5:16',
    'Proverbs 3:5-6',
    '1 Corinthians 13:4-7'
  ];
  
  return suggestions.find(s => 
    s.toLowerCase().includes(input.toLowerCase())
  ) || input;
};

// Metadata for standard 66-book Protestant Bible
export const BIBLE_CHAPTER_COUNTS = [
  50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42, 150, 31, 
  12, 8, 66, 52, 5, 48, 12, 14, 3, 9, 1, 4, 7, 3, 3, 3, 2, 14, 4, 28, 
  16, 24, 21, 28, 16, 16, 13, 6, 6, 4, 4, 5, 3, 6, 4, 3, 1, 13, 5, 5, 
  3, 5, 1, 1, 1, 22
];

/**
 * Generates random coordinates (book, chapter, verse) seeded by a number.
 * This ensures the "randomness" is consistent for the given seed (e.g., current hour).
 */
export const getRandomVerseCoordinates = (seed: number) => {
  // Use a simple Linear Congruential Generator for consistency
  const lcg = (s: number) => (s * 1664525 + 1013904223) % 4294967296;
  
  let currentSeed = lcg(seed);
  const bookIndex = currentSeed % 66;
  
  currentSeed = lcg(currentSeed);
  const maxChapters = BIBLE_CHAPTER_COUNTS[bookIndex];
  const chapter = (currentSeed % maxChapters) + 1;
  
  currentSeed = lcg(currentSeed);
  // We assume a max of 20 verses for the random pick if we don't have metadata.
  // Most chapters have >20, and if it fails, our component can retry or default.
  const verse = (currentSeed % 20) + 1; 

  return {
    bookNumber: bookIndex + 1,
    chapter,
    verse: verse.toString()
  };
};

export const getBookNumber = (bookName: string, language: string): number | null => {
  const normalizedBook = bookName.trim().toLowerCase();
  
  if (language === 'ta') {
    const books = getTamilBookNames();
    const index = books.findIndex((b: string) => b.trim().toLowerCase() === normalizedBook);
    return index !== -1 ? index + 1 : null;
  } else if (language === 'en') {
    const books = getEnglishBookNames();
    const index = books.findIndex((b: string) => b.trim().toLowerCase() === normalizedBook);
    return index !== -1 ? index + 1 : null;
  } else if (language === 'ka') {
    const books = getKannadaBookNames();
    const index = books.findIndex((b: string) => b.trim().toLowerCase() === normalizedBook);
    return index !== -1 ? index + 1 : null;
  } else if (language === 'hi') {
    const books = getHindiBookNames();
    const index = books.findIndex((b: string) => b.trim().toLowerCase() === normalizedBook);
    return index !== -1 ? index + 1 : null;
  } else if (language === 'te') {
    const books = getTeluguBookNames();
    const index = books.findIndex((b: string) => b.trim().toLowerCase() === normalizedBook);
    return index !== -1 ? index + 1 : null;
  } else if (language === 'ml' || language === 'ma') {
    const books = getMalayalamBookNames();
    const index = books.findIndex((b: string) => b.trim().toLowerCase() === normalizedBook);
    return index !== -1 ? index + 1 : null;
  } else if (language === 'pu') {
    const books = getPunjabiBookNames();
    const index = books.findIndex((b: string) => b.trim().toLowerCase() === normalizedBook);
    return index !== -1 ? index + 1 : null;
  }
};

export const detectBookNumber = (bookName: string): number | null => {
   // Try English first
   let num = getBookNumber(bookName, 'en');
   if (num) return num;
   
   // Try Tamil
   num = getBookNumber(bookName, 'ta');
    if (num) return num;
  // Try Kannada
  num = getBookNumber(bookName, 'ka');
  if (num) return num;
  // Try Hindi
  num = getBookNumber(bookName, 'hi');
  if (num) return num;
  // Try Telugu
  num = getBookNumber(bookName, 'te');
  if (num) return num;
  // Try Malayalam
  num = getBookNumber(bookName, 'ml');
  if (num) return num;
  // Try Punjabi
  num = getBookNumber(bookName, 'pu');
  return num;
};

export const getBookNameFromNumber = (bookNumber: number, language: string): string | null => {
// ... existing code ...
  const index = bookNumber - 1;
  if (index < 0 || index >= 66) return null;

  if (language === 'ta') {
    return getTamilBookNames()[index] || null;
  } else if (language === 'en') {
    return getEnglishBookNames()[index] || null;
  } else if (language === 'ka') {
    return getKannadaBookNames()[index] || null;
  } else if (language === 'hi') {
    return getHindiBookNames()[index] || null;
  } else if (language === 'te') {
    return getTeluguBookNames()[index] || null;
  } else if (language === 'ml' || language === 'ma') {
    return getMalayalamBookNames()[index] || null;
  } else if (language === 'pu') {
    return getPunjabiBookNames()[index] || null;
  }
};

export const getVerseTextByCoordinates = async (
  bookNumber: number, 
  chapter: number, 
  verseNumbers: string, 
  language: string
): Promise<string | null> => {
  const bookName = getBookNameFromNumber(bookNumber, language);
  if (!bookName) return null;

  if (language === 'ta') {
    return getTamilBibleVerses(bookName, chapter.toString(), verseNumbers);
  } else if (language === 'en') {
    return getEnglishBibleVerses(bookName, chapter.toString(), verseNumbers);
  } else if (language === 'ka') {
    return getKannadaBibleVerses(bookName, chapter.toString(), verseNumbers);
  } else if (language === 'hi') {
    return getHindiBibleVerses(bookName, chapter.toString(), verseNumbers);
  } else if (language === 'te') {
    return getTeluguBibleVerses(bookName, chapter.toString(), verseNumbers);
  } else if (language === 'ml' || language === 'ma') {
    return getMalayalamBibleVerses(bookName, chapter.toString(), verseNumbers);
  } else if (language === 'pu') {
    return getPunjabiBibleVerses(bookName, chapter.toString(), verseNumbers);
  }
};