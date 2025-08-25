import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface VerseEntry {
  book: string;
  verse: string;
  reference: string; // Full reference like "John 3:16"
  text: string; // The actual verse text from API
  note1: string;
  note2: string;
  note3: string;
  lastUpdated: string;
}

interface VerseContextType {
  verseEntries: Record<string, VerseEntry>;
  addOrUpdateEntry: (dateKey: string, entry: VerseEntry) => void;
  deleteEntry: (dateKey: string) => void;
  getEntry: (dateKey: string) => VerseEntry | undefined;
}

const VerseContext = createContext<VerseContextType | undefined>(undefined);

export const useVerseContext = () => {
  const context = useContext(VerseContext);
  if (!context) {
    throw new Error('useVerseContext must be used within a VerseProvider');
  }
  return context;
};

interface VerseProviderProps {
  children: ReactNode;
}

export const VerseProvider: React.FC<VerseProviderProps> = ({ children }) => {
  const [verseEntries, setVerseEntries] = useState<Record<string, VerseEntry>>({});

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bibleVerseEntries');
    if (saved) {
      try {
        setVerseEntries(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved verses:', error);
      }
    }
  }, []);

  // Save to localStorage whenever verseEntries changes
  useEffect(() => {
    localStorage.setItem('bibleVerseEntries', JSON.stringify(verseEntries));
  }, [verseEntries]);

  const addOrUpdateEntry = (dateKey: string, entry: VerseEntry) => {
    setVerseEntries(prev => ({
      ...prev,
      [dateKey]: {
        ...entry,
        lastUpdated: new Date().toISOString()
      }
    }));
  };

  const deleteEntry = (dateKey: string) => {
    setVerseEntries(prev => {
      const newEntries = { ...prev };
      delete newEntries[dateKey];
      return newEntries;
    });
  };

  const getEntry = (dateKey: string) => {
    return verseEntries[dateKey];
  };

  return (
    <VerseContext.Provider value={{
      verseEntries,
      addOrUpdateEntry,
      deleteEntry,
      getEntry
    }}>
      {children}
    </VerseContext.Provider>
  );
};