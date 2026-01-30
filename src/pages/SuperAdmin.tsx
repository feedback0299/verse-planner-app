import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/dbService/supabase';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, LogOut, UserPlus, Users, ShieldAlert, Eye, EyeOff } from 'lucide-react';

const SuperAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  
  // Admin Management State
  const [admins, setAdmins] = useState<any[]>([]);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchAdmins();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchAdmins();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAdmins = async () => {
    const { data, error } = await supabase
      .from('admin_data')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching admins:', error);
    else setAdmins(data || []);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // SUPER ADMIN CREDENTIALS HARDCODED FOR SAFETY/DEMO
    // In production, this would be a specific user role check
    if (email === 'master' && password === 'masterkey') {
      setSession({ user: { email: 'master', role: 'super_admin' } });
      toast({
        title: "Super Admin Access",
        description: "Welcome to the Master Control.",
      });
      setLoading(false);
      return;
    }

    // Also allow normal Supabase login if they happen to have an account
    // But realistically, this page should be restricted.
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    } else {
      setSession({ user: { email } });
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('admin_data')
      .insert([{
        name: newAdmin.name,
        email: newAdmin.email,
        password: newAdmin.password, 
        created_by: session?.user?.email || 'super_admin'
      }]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } else {
      toast({
        title: "Success",
        description: "Admin added successfully."
      });
      setNewAdmin({ name: '', email: '', password: '' });
      fetchAdmins();
    }
    setLoading(false);
  };

  const handleDeleteAdmin = async (id: string) => {
    const { error } = await supabase.from('admin_data').delete().eq('id', id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Deleted", description: "Admin removed." });
      fetchAdmins();
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-red-900 bg-gray-950 text-red-50">
          <CardHeader className="text-center">
            <div className="mx-auto bg-red-900/20 p-3 rounded-full w-fit mb-4">
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-red-100">Super Admin Restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                 <Label htmlFor="email">Master ID</Label>
                 <Input 
                    id="email" 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-900 border-red-900/50"
                    placeholder="Super Admin ID" 
                    required
                 />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="password">Master Key</Label>
                 <div className="relative">
                   <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)} 
                      className="bg-gray-900 border-red-900/50 pr-10"
                      required
                   />
                   <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-300 focus:outline-none"
                   >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                   </button>
                 </div>
              </div>
              <Button type="submit" className="w-full bg-red-900 hover:bg-red-800 text-white" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Access Mainframe'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-12 px-10 pb-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin Console</h1>
            <p className="text-sm text-gray-500">Managing System Administrators</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut className="mr-2 h-4 w-4" /> Secure Logout
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Admin Form */}
          <Card className="border-t-4 border-t-blue-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                Register New Admin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={newAdmin.name}
                    onChange={e => setNewAdmin({...newAdmin, name: e.target.value})}
                    placeholder="Admin Name"
                    required
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newAdmin.email}
                    onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
                    placeholder="admin@church.com"
                    required
                  />
                </div>
                <div>
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showNewAdminPassword ? "text" : "password"}
                      value={newAdmin.password}
                      onChange={e => setNewAdmin({...newAdmin, password: e.target.value})}
                      placeholder="Initial Password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewAdminPassword(!showNewAdminPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showNewAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2" />} Assign Admin Role
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Admin List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {admins.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
                    No administrators found.
                  </div>
                ) : (
                  admins.map(admin => (
                    <div key={admin.id} className="group flex justify-between items-center p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-all">
                      <div>
                        <p className="font-semibold text-gray-900">{admin.name}</p>
                        <p className="text-sm text-gray-500">{admin.email}</p>
                        <p className="text-xs text-gray-400 mt-1 font-mono">ID: {admin.id.slice(0, 8)}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteAdmin(admin.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;
