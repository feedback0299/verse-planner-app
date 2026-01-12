import { supabase } from '../dbService/supabase';

export interface MeetingRoom {
  id: string;
  room_id: string;
  name: string;
  created_at: string;
}

export const createMeetingRoom = async (name: string, roomId: string) => {
  const { data, error } = await supabase
    .from('meeting_rooms')
    .insert([{ name, room_id: roomId }])
    .select()
    .single();
  
  return { data, error };
};

export const getMeetingRooms = async () => {
  const { data, error } = await supabase
    .from('meeting_rooms')
    .select('*')
    .order('created_at', { ascending: false });
  
  return { data, error };
};

export const deleteMeetingRoom = async (roomId: string) => {
  const { error } = await supabase
    .from('meeting_rooms')
    .delete()
    .eq('room_id', roomId);
  
  return { error };
};
