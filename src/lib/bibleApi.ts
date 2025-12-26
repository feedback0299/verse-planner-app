import { getTamilBibleVerses, parseTamilReference, getTamilBookNames } from "./tamilBibleService";
import { getEnglishBibleVerses, parseEnglishReference, getEnglishBookNames } from "./englishBibleService";
import { getKannadaBibleVerses, parseKannadaReference, getKannadaBookNames } from "./kannadaBibleService";

export { getTamilBibleVerses, parseTamilReference, getTamilBookNames };
export { getEnglishBibleVerses, parseEnglishReference, getEnglishBookNames };
export { getKannadaBibleVerses, parseKannadaReference, getKannadaBookNames };

export interface BibleVerse {
  reference: string;
  text: string;
  translation_id: string;
  translation_name: string;
}

const searchTamilVerse = async (reference: string): Promise<BibleVerse | null> => {
  // Parse Tamil reference format (e.g., "யோவான் 3:16")
  const parsed = parseTamilReference(reference);
  if (!parsed) return null;

  const { book, chapter, verses } = parsed;
  
  // Use the Tamil Bible service to get verses
  const text = await getTamilBibleVerses(book, chapter, verses);
  
  if (!text) return null;
  
  return {
    reference: reference,
    text: text,
    translation_id: 'tamil',
    translation_name: 'Tamil Bible'
  };
};

const searchEnglishVerse = async (reference: string): Promise<BibleVerse | null> => {
  // Parse English reference format (e.g., "John 3:16")
  const parsed = parseEnglishReference(reference);
  if (!parsed) return null;

  const { book, chapter, verses } = parsed;
  
  // Use the English Bible service to get verses
  const text = await getEnglishBibleVerses(book, chapter, verses);
  
  if (!text) return null;
  
  return {
    reference: reference,
    text: text,
    translation_id: 'english',
    translation_name: 'English Bible'
  };
};


const searchKannadaVerse = async (reference: string): Promise<BibleVerse | null> => {
  // Parse Kannada reference format (e.g., "John 3:16")
  const parsed = parseKannadaReference(reference);
  if (!parsed) return null;

  const { book, chapter, verses } = parsed;
  
  // Use the Kannada Bible service to get verses
  const text = await getKannadaBibleVerses(book, chapter, verses);
  
  if (!text) return null;
  
  return {
    reference: reference,
    text: text,
    translation_id: 'kannada',
    translation_name: 'Kannada Bible'
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



// ... existing code ...

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
  }
};