import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/dbService/supabase';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, LogOut, UserPlus, Users } from 'lucide-react';
import DailyVerseCalendar from '@/components/DailyVerseCalendar';
import MonthlyPlanner from '@/components/MonthlyPlanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Admin = () => {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  
  // Event Form State
  const [events, setEvents] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', location: '', description: '' });

  useEffect(() => {
    // Check local session key
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
      setSession(JSON.parse(adminSession));
      fetchEvents();
    }
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) console.error('Error fetching events:', error);
    else setEvents(data || []);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Query the admin_data table
    const { data, error } = await supabase
      .from('admin_data')
      .select('*')
      .eq('email', email)
      .eq('password', password) // In production, verify hash!
      .single();

    if (error || !data) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid credentials.",
      });
    } else {
      // 2. Set Custom Session
      const newSession = { user: { email: data.email, name: data.name, role: 'admin', id: data.id } };
      setSession(newSession);
      localStorage.setItem('admin_session', JSON.stringify(newSession));
      
      toast({
        title: "Welcome Back",
        description: `Logged in as ${data.name}`,
      });
      fetchEvents();
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    setSession(null);
    localStorage.removeItem('admin_session');
  };

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

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-spiritual-blue">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                 <Label htmlFor="email">Email</Label>
                 <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@athumanesar.com" 
                    required
                 />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="password">Password</Label>
                 <Input 
                    id="password" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} 
                    required
                 />
              </div>
              <Button type="submit" className="w-full bg-spiritual-blue hover:bg-blue-700" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4 pb-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-spiritual-blue">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Sign Out</Button>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="events">Church Events</TabsTrigger>
            <TabsTrigger value="verses">Daily Verses</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Create Event Form */}
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

                {/* Event List */}
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
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
