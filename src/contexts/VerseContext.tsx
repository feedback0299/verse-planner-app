import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface VerseEntry {
  date?: string; // Used for UI key mostly
  book_number?: number;
  chapter_number?: number;
  verse_numbers?: string;
  book_name: string; // Formerly 'book'
  verse_text: string; // Formerly 'text'
  reference: string;
  note1: string;
  note2: string;
  note3: string;
  last_updated?: string;
}

interface VerseContextType {
  verseEntries: Record<string, VerseEntry>;
  addOrUpdateEntry: (dateKey: string, entry: VerseEntry) => Promise<void>;
  deleteEntry: (dateKey: string) => Promise<void>;
  getEntry: (dateKey: string) => VerseEntry | undefined;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchVerses();
  }, []);

  const fetchVerses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_verses')
        .select('*');

      if (error) {
        console.error('Error fetching verses:', error);
        return;
      }

      if (data) {
        const entries: Record<string, VerseEntry> = {};
        data.forEach((row: any) => {
          entries[row.date] = {
            date: row.date,
            book_number: row.book_number,
            chapter_number: row.chapter_number,
            verse_numbers: row.verse_numbers,
            book_name: row.book_name,
            verse_text: row.verse_text,
            reference: row.reference,
            note1: row.note1,
            note2: row.note2,
            note3: row.note3,
            last_updated: row.last_updated,
          };
        });
        setVerseEntries(entries);
      }
    } catch (err) {
      console.error('Unexpected error fetching verses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addOrUpdateEntry = async (dateKey: string, entry: VerseEntry) => {
    // Optimistic update
    setVerseEntries(prev => ({
      ...prev,
      [dateKey]: {
        ...entry,
        last_updated: new Date().toISOString()
      }
    }));

    try {
      const payload = {
        date: dateKey,
        book_number: entry.book_number || null,
        chapter_number: entry.chapter_number || null, // Keep for backward compat if needed, but primary is verse_numbers logic
        verse_numbers: entry.verse_numbers || null,
        note1: entry.note1,
        note2: entry.note2,
        note3: entry.note3,
        last_updated: new Date().toISOString()
      };

      const { error } = await supabase
        .from('daily_verses')
        .upsert(payload, { onConflict: 'date' });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error saving verse:', error);
      toast({
        variant: "destructive",
        title: "Error saving verse",
        description: error.message
      });
      // Revert optimistic update if needed, strictly speaking we should but for now keeping it simple
    }
  };

  const deleteEntry = async (dateKey: string) => {
    setVerseEntries(prev => {
      const newEntries = { ...prev };
      delete newEntries[dateKey];
      return newEntries;
    });

    try {
      const { error } = await supabase
        .from('daily_verses')
        .delete()
        .eq('date', dateKey);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error deleting verse:', error);
      toast({
        variant: "destructive",
        title: "Error deleting verse",
        description: error.message
      });
    }
  };

  const getEntry = (dateKey: string) => {
    return verseEntries[dateKey];
  };

  return (
    <VerseContext.Provider value={{
      verseEntries,
      addOrUpdateEntry,
      deleteEntry,
      getEntry,
      isLoading
    }}>
      {children}
    </VerseContext.Provider>
  );
};