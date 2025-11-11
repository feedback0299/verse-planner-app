// Free Bible API service using bible-api.com
import { getTamilBibleVerses, parseTamilReference } from "./tamilBibleService";

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

export const searchBibleVerse = async (
  reference: string, 
  language: string = 'en'
): Promise<BibleVerse | null> => {
  // If Tamil, use local JSON
  if (language === 'ta') {
    return searchTamilVerse(reference);
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