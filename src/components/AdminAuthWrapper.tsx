import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from 'lucide-react';

interface AdminAuthWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  sessionKey: string;
  loginLogic: (identity: string, pass: string) => Promise<{ success: boolean; session?: any; message?: string }>;
  identityLabel?: string;
  requireIdentity?: boolean; // If false, identity field can be hidden or optional (but for uniformity usually shown)
}

const AdminAuthWrapper = ({ 
  children, 
  title, 
  subtitle, 
  sessionKey, 
  loginLogic, 
  identityLabel = "Identity / Email",
  requireIdentity = true
}: AdminAuthWrapperProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedSession = localStorage.getItem(sessionKey);
    if (storedSession) {
      setIsAuthenticated(true);
    }
    setLoadingInitial(false);
  }, [sessionKey]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // For some roles (like Branch), identity might be optional in UI but we pass it anyway
    const result = await loginLogic(identity, password);
    
    if (result.success) {
      setIsAuthenticated(true);
      // Determine what to store. Some logics return a session object.
      // We also store specific auxiliary keys if needed (like 'member_admin_name')
      // but standardized session storage is better.
      localStorage.setItem(sessionKey, JSON.stringify(result.session));
      
      // Special case for members to keep backward compatibility if other components read this key
      if (sessionKey === 'member_admin_session' && result.session?.user?.name) {
          localStorage.setItem('member_admin_name', result.session.user.name);
      }

      toast({ title: "Access Granted", description: result.message || "Authentication successful." });
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: result.message || "Invalid credentials." });
    }
    setLoading(false);
  };

  // If we are checking for session, show nothing or a loader
  if (loadingInitial) return null;

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
                <Label htmlFor="identity" className="text-slate-400">{identityLabel}</Label>
                <Input 
                  id="identity" 
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-white h-12 rounded-xl focus:ring-blue-500"
                  placeholder={identityLabel.includes('Email') ? "Enter credentials" : "Enter your name"}
                  required={requireIdentity}
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

  return <>{children}</>;
};

export default AdminAuthWrapper;
