import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/dbService/supabase';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, UserPlus, Users, Video, ExternalLink, FileSpreadsheet, ShieldCheck, Calendar as CalendarIcon, LogOut } from 'lucide-react';
import DailyVerseCalendar from '@/components/DailyVerseCalendar';
import MonthlyPlanner from '@/components/MonthlyPlanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', location: '', description: '' });
  const { toast } = useToast();
  const navigate = useNavigate();
  


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
      <div className="p-18 max-w-7xl mx-auto space-y-10">
        {/* Dashboard Header */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Control Center</h1>
            <p className="text-slate-500 font-medium">Manage church events, contest schedules, and video rooms.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
              onClick={() => {
                localStorage.removeItem('admin_session');
                navigate('/');
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Admin Logout
            </Button>
            <div className="bg-spiritual-blue/10 p-3 rounded-xl">
               <ShieldCheck className="w-8 h-8 text-spiritual-blue" />
            </div>
          </div>
        </div>

        {/* Quick Actions / Featured Apps */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Plus className="text-spiritual-blue w-5 h-5" />
            Core Management
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card 
              className="group cursor-pointer hover:shadow-xl transition-all border-t-4 border-t-spiritual-gold bg-white relative overflow-hidden" 
              onClick={() => navigate('/admin/contest')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-3 text-slate-900">
                  <div className="bg-spiritual-gold/10 p-2 rounded-lg group-hover:bg-spiritual-gold/20 transition-colors">
                    <FileSpreadsheet className="text-spiritual-gold w-6 h-6" />
                  </div>
                  70-Day Contest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 leading-relaxed">Upload Excel reading schedules, manage portion timings, and view contest timelines.</p>
                <div className="mt-6 flex items-center text-sm font-bold text-spiritual-gold group-hover:gap-2 transition-all">
                  Open Contest Manager <span>→</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all border-t-4 border-t-spiritual-blue bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-3 text-slate-900">
                  <div className="bg-spiritual-blue/10 p-2 rounded-lg text-spiritual-blue">
                    <Users className="w-6 h-6" />
                  </div>
                  Member Registry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 leading-relaxed">View and manage church member registrations and profiles.</p>
                <Button variant="link" className="p-0 h-auto mt-4 text-spiritual-blue font-bold">Coming Soon</Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-10 bg-slate-100/50 p-1.5 rounded-2xl border max-w-2xl">
            <TabsTrigger value="events" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-spiritual-blue text-slate-500 font-bold py-3">Church Events</TabsTrigger>
            <TabsTrigger value="verses" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-spiritual-blue text-slate-500 font-bold py-3">Daily Verses</TabsTrigger>
            <TabsTrigger value="meetings" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-spiritual-blue text-slate-500 font-bold py-3">Meetings</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2">
                <Card className="border-t-4 border-t-green-500 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">Add New Church Event</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateEvent} className="space-y-4">
                      <div>
                        <Label className="text-slate-600">Event Title</Label>
                        <Input placeholder="e.g. Sunday Morning Worship" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} required className="mt-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-600">Date</Label>
                          <Input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-slate-600">Time</Label>
                          <Input type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} required className="mt-1" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-600">Location</Label>
                        <Input placeholder="Church Sanctuary" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} required className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-slate-600">Brief Description</Label>
                        <Input placeholder="Optional additional details" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="mt-1" />
                      </div>
                      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg font-bold shadow-lg shadow-green-600/20" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2" />} Create Event
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3">
                <Card className="shadow-md">
                  <CardHeader className="border-b bg-slate-50/50">
                    <CardTitle className="text-lg flex items-center justify-between">
                      Existing Events
                      <span className="text-xs font-bold bg-slate-200 px-3 py-1 rounded-full text-slate-600">{events.length} Active</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y max-h-[600px] overflow-y-auto">
                      {events.length === 0 ? (
                        <div className="p-20 text-center space-y-2">
                           <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-300">
                             <CalendarIcon className="w-8 h-8" />
                           </div>
                           <p className="text-slate-400 font-medium">No events scheduled yet.</p>
                        </div>
                      ) : (
                        events.map(event => (
                          <div key={event.id} className="flex justify-between items-center p-6 hover:bg-slate-50 transition-colors">
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900 text-lg">{event.title}</p>
                              <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                <span className="flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> {event.date}</span>
                                <span className="text-slate-300">|</span>
                                <span className="flex items-center gap-1.5 font-bold text-spiritual-blue uppercase tracking-tighter text-xs">At {event.time}</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500 transition-colors" onClick={() => handleDeleteEvent(event.id)}>
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="verses">
            <div className="bg-white rounded-2xl shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-spiritual-blue p-6 flex items-center justify-between">
                <div className="text-white">
                  <h3 className="text-xl font-bold">Daily Verse Calendar</h3>
                  <p className="text-blue-100 text-sm">Schedule verses that appear on the homepage for everyone.</p>
                </div>
                 <FileSpreadsheet className="text-blue-300/40 w-12 h-12" />
              </div>
              <div className="p-6">
                <MonthlyPlanner />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="meetings">
            <Card className="border-t-4 border-t-blue-600 shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <Video className="text-blue-500 w-8 h-8" />
                        Video Meetings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 p-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="p-8 border-2 border-dashed rounded-2xl bg-slate-50 flex flex-col items-center gap-6 text-center transform hover:scale-[1.01] transition-transform">
                          <div className="bg-blue-600/10 p-5 rounded-full">
                            <Plus className="w-8 h-8 text-blue-600" />
                          </div>
                          <div>
                              <h3 className="font-extrabold text-xl text-slate-900">Start a New Meeting</h3>
                              <p className="text-sm text-slate-500 mt-2 max-w-[250px]">Instantly create a secure video room and share the link.</p>
                          </div>
                          <div className="flex flex-col gap-3 w-full max-w-sm">
                              <Input placeholder="Room Name (e.g. Prayer Group)" id="new-room-name-admin" className="h-12 text-center text-lg" />
                              <Button className="h-12 bg-blue-600 hover:bg-blue-700 font-bold" onClick={() => {
                                  const id = Math.random().toString(36).substring(2, 9);
                                  navigate(`/room/${id}`);
                              }}>
                                  Launch Meeting Room
                              </Button>
                          </div>
                      </div>

                      <div className="p-8 border rounded-2xl bg-spiritual-blue/5 flex flex-col items-center gap-6 text-center border-spiritual-blue/20">
                          <div className="bg-spiritual-blue/10 p-5 rounded-full text-spiritual-blue">
                             <ExternalLink className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-xl text-slate-900">Join Existing Room</h3>
                            <p className="text-sm text-slate-500 mt-2 max-w-[250px]">Enter a specific room ID to moderate an ongoing meeting.</p>
                          </div>
                          <div className="flex flex-col gap-3 w-full max-w-sm">
                              <Input placeholder="Enter 7-character Room ID" id="join-room-id-admin" className="h-12 text-center text-lg font-mono tracking-widest" />
                              <Button variant="outline" className="h-12 border-spiritual-blue text-spiritual-blue hover:bg-spiritual-blue/10 font-bold" onClick={() => {
                                  const id = (document.getElementById('join-room-id-admin') as HTMLInputElement).value;
                                  if (id) navigate(`/room/${id}`);
                              }}>
                                  Join Session
                              </Button>
                          </div>
                      </div>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default Admin;
