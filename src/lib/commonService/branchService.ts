import { supabase } from '../dbService/supabase';

export interface ChurchBranch {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  is_headquarters: boolean;
  phone?: string;
  created_at: string;
}

export const branchService = {
  async getBranches(): Promise<ChurchBranch[]> {
    const { data, error } = await supabase
      .from('church_branches')
      .select('*')
      .order('is_headquarters', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addBranch(branch: Omit<ChurchBranch, 'id' | 'created_at'>): Promise<ChurchBranch> {
    const { data, error } = await supabase
      .from('church_branches')
      .insert([branch])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBranch(id: string, branch: Partial<ChurchBranch>) {
    const { error } = await supabase
      .from('church_branches')
      .update(branch)
      .eq('id', id);

    if (error) throw error;
  },

  async deleteBranch(id: string) {
    const { error } = await supabase
      .from('church_branches')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
