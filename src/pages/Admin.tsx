import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/dbService/supabase';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, UserPlus, Users, Video, ExternalLink } from 'lucide-react';
import DailyVerseCalendar from '@/components/DailyVerseCalendar';
import MonthlyPlanner from '@/components/MonthlyPlanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import AdminAuthWrapper from '@/components/AdminAuthWrapper';

const Admin = () => {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', location: '', description: '' });
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const loginLogic = async (email: string, pass: string) => {
    if (email === 'admin' && pass === 'admin') {
      return { 
        success: true, 
        session: { user: { email: 'admin', name: 'Church Admin' } },
        message: "Welcome Admin"
      };
    }
    return { success: false };
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) console.error('Error fetching events:', error);
    else setEvents(data || []);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from('events')
      .insert([newEvent]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Event created successfully.",
      });
      setNewEvent({ title: '', date: '', time: '', location: '', description: '' });
      fetchEvents();
    }
    setLoading(false);
  };

  const handleDeleteEvent = async (id: number) => {
      const { error } = await supabase.from('events').delete().match({ id });
      if (error) {
          toast({ variant: "destructive", title: "Error", description: error.message });
      } else {
          toast({ title: "Deleted", description: "Event removed." });
          fetchEvents();
      }
  };

  return (
    <AdminAuthWrapper
      title="Church Administration"
      subtitle="Events & Daily Verse Management"
      sessionKey="admin_session"
      loginLogic={loginLogic}
    >
      <div className="p-10 max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-spiritual-blue uppercase">Control Center</h1>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="events">Church Events</TabsTrigger>
            <TabsTrigger value="verses">Daily Verses</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Event</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <Label>Title</Label>
                                <Input value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Date</Label>
                                    <Input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required />
                                </div>
                                <div>
                                    <Label>Time</Label>
                                    <Input type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} required />
                                </div>
                            </div>
                            <div>
                                <Label>Location</Label>
                                <Input value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} required />
                            </div>
                             <div>
                                <Label>Description</Label>
                                <Input value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
                            </div>
                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2" />} Create Event
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Existing Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {events.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No events found.</p>
                            ) : (
                                events.map(event => (
                                    <div key={event.id} className="flex justify-between items-center p-3 border rounded-lg bg-white shadow-sm">
                                        <div>
                                            <p className="font-semibold">{event.title}</p>
                                            <p className="text-sm text-gray-500">{event.date} at {event.time}</p>
                                        </div>
                                        <Button variant="destructive" size="icon" onClick={() => handleDeleteEvent(event.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
          </TabsContent>

          <TabsContent value="verses">
            <div className="bg-white rounded-xl shadow-lg border p-4">
                <MonthlyPlanner />
            </div>
          </TabsContent>

          <TabsContent value="meetings">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Video className="text-blue-500" />
                        Video Meetings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-6 border-2 border-dashed rounded-xl bg-slate-50 flex flex-col items-center gap-4">
                        <div className="text-center">
                            <h3 className="font-bold text-lg">Start a New Meeting</h3>
                            <p className="text-sm text-slate-500">Generate a new meeting room and join immediately.</p>
                        </div>
                        <div className="flex gap-2 w-full max-w-sm">
                            <Input placeholder="Room Name (Optional)" id="new-room-name-admin" />
                            <Button onClick={() => {
                                const id = Math.random().toString(36).substring(2, 9);
                                navigate(`/room/${id}`);
                            }}>
                                <Plus className="h-4 w-4 mr-2" /> Create
                            </Button>
                        </div>
                    </div>

                    <div className="p-6 border rounded-xl bg-spiritual-blue/5">
                        <h3 className="font-bold mb-4">Join Existing Room</h3>
                        <div className="flex gap-2">
                            <Input placeholder="Enter Room ID" id="join-room-id-admin" />
                            <Button variant="outline" onClick={() => {
                                const id = (document.getElementById('join-room-id-admin') as HTMLInputElement).value;
                                if (id) navigate(`/room/${id}`);
                            }}>
                                <ExternalLink className="h-4 w-4 mr-2" /> Join
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminAuthWrapper>
  );
};

export default Admin;
