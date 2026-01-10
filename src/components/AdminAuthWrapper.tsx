import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, LogOut, LayoutDashboard } from 'lucide-react';

interface AdminAuthWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  sessionKey: string;
  loginLogic: (email: string, pass: string) => Promise<{ success: boolean; session?: any; message?: string }>;
}

const AdminAuthWrapper = ({ children, title, subtitle, sessionKey, loginLogic }: AdminAuthWrapperProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedSession = localStorage.getItem(sessionKey);
    if (storedSession) {
      setIsAuthenticated(true);
      setSession(JSON.parse(storedSession));
    }
  }, [sessionKey]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await loginLogic(email, password);
    
    if (result.success) {
      setIsAuthenticated(true);
      setSession(result.session);
      localStorage.setItem(sessionKey, JSON.stringify(result.session));
      toast({ title: "Welcome back", description: result.message || "Authentication successful." });
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: result.message || "Invalid credentials." });
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSession(null);
    localStorage.removeItem(sessionKey);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-slate-800 bg-slate-950 text-slate-50 shadow-2xl animate-in fade-in zoom-in duration-300">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-slate-800 p-3 rounded-full w-fit mb-4">
              <Lock className="h-8 w-8 text-slate-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-100">{title}</CardTitle>
            <p className="text-sm text-slate-500 mt-2">{subtitle}</p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-400">Identity / Email</Label>
                <Input 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-white h-12 rounded-xl focus:ring-blue-500"
                  placeholder="Enter credentials" 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-400">Passkey / Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                  className="bg-slate-900 border-slate-800 text-white h-12 rounded-xl focus:ring-blue-500"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold transition-all" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enter Portal'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><LayoutDashboard className="h-5 w-5 text-blue-600" /></div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">{title}</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Logged in as {session?.user?.name || 'Admin'}</p>
          </div>
        </div>
        <Button variant="ghost" className="text-slate-500 hover:text-red-600 font-bold" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Exit
        </Button>
      </nav>
      <div className="pt-16">
        {children}
      </div>
    </div>
  );
};

export default AdminAuthWrapper;
