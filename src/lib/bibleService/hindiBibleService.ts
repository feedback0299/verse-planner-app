export interface HindiBibleData {
  Book: {
    Chapter: {
      Verse: {
        Verse: string;
      }[];
    }[];
  }[];
}

// Complete list of 66 Hindi book names in biblical order
const HindiBooks = [
    "उत्पत्ति","निर्गमन","लैव्यवस्था","गिनती","व्यवस्थाविवरण","यहोशू ",
    "न्यायियों","रूत","1 शमूएल","2 शमूएल","1 राजा","2 राजा",
    "1 इतिहास","2 इतिहास","एज्रा","नहेमायाह","एस्तेर","अय्यूब",
    "भजन संहिता","नीतिवचन ","सभोपदेशक","श्रेष्ठगीत","यशायाह","यिर्मयाह",
    "विलापगीत","यहेजकेल","दानिय्येल","होशे","योएल","आमोस","ओबद्दाह",
    "योना","मीका","नहूम","हबक्कूक","सपन्याह","हाग्गै","जकर्याह",
    "मलाकी","मत्ती","मरकुस","लूका","यूहन्ना","प्रेरितों के काम","रोमियो",
    "1 कुरिन्थियों","2 कुरिन्थियों","गलातियों","इफिसियों","फिलिप्पियों","कुलुस्सियों",
    "1 थिस्सलुनीकियों","2 थिस्सलुनीकियों","1 तीमुथियुस","2 तीमुथियुस","तीतुस",
    "फिलेमोन","इब्रानियों","याकूब","1 पतरस","2 पतरस","1 यूहन्ना","2 यूहन्ना",
    "3 यूहन्ना","यहूदा","प्रकाशित वाक्य"
];

let cachedBibleData: HindiBibleData | null = null;

/**
 * Load the Hindi Bible JSON from public folder
 */
const loadHindiBible = async (): Promise<HindiBibleData | null> => {
  if (cachedBibleData) {
    return cachedBibleData;
  }

  try {
    const response = await fetch('/bible-verse-lang/bible-hi.json');
    if (!response.ok) {
      throw new Error('Failed to load Hindi Bible');
    }
    cachedBibleData = await response.json();
    return cachedBibleData;
  } catch (error) {
    console.error('Error loading Hindi Bible:', error);
    return null;
  }
};

/**
 * Get Hindi Bible verses using the provided logic
 */
export const getHindiBibleVerses = async (
  bookName: string,
  chapterNum: string,
  verses: string
): Promise<string | null> => {
  const bibleData = await loadHindiBible();
  if (!bibleData) return null;

  // Find book index (case-sensitive and trim supported)
  const bookIndex = HindiBooks.indexOf(bookName.trim());
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
 * Get list of Hindi book names for autocomplete
 */
export const getHindiBookNames = (): string[] => {
  return [...HindiBooks];
};

/**
 * Parse Hindi reference format (e.g., "யோவான் 3:16" or "யோவான் 3:16,17")
 */
export const parseHindiReference = (reference: string): {
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