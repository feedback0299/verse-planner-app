import { supabase } from '../dbService/supabase';

export interface PeriodicVerse {
  id?: string;
  type: 'monthly' | 'annual';
  period: string; // 'YYYY-MM' or 'YYYY'
  book_number: number;
  verse_numbers: string; // Format "Chapter:Verse"
  note1?: string;
  note2?: string;
  note3?: string;
  last_updated?: string;
}

export const getPeriodicVerse = async (type: 'monthly' | 'annual', period: string): Promise<PeriodicVerse | null> => {
  const { data, error } = await supabase
    .from('periodic_verses')
    .select('*')
    .eq('type', type)
    .eq('period', period)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching ${type} verse for period ${period}:`, error);
    return null;
  }

  return data;
};

export const savePeriodicVerse = async (verse: PeriodicVerse): Promise<{ error: any }> => {
  const { error } = await supabase
    .from('periodic_verses')
    .upsert(verse, { onConflict: 'type,period' });

  if (error) {
    console.error(`Error saving ${verse.type} verse:`, error);
  }

  return { error };
};
