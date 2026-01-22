import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/dbService/supabase';
import { Loader2, LogIn, Lock, User, ShieldCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Resolve Email from Username or Email
      const isEmail = formData.username.includes('@');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq(isEmail ? 'email' : 'username', formData.username)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: `${isEmail ? 'Email' : 'Username'} not found. Please register first.`,
        });
        setLoading(false);
        return;
      }

      // 2. Sign in with resolved email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        toast({
          title: "Success",
          description: `Welcome back, ${profile.full_name}!`,
        });
        
        // Save session if needed (though Supabase handles this in cookies/localstorage)
        localStorage.setItem('user_profile', JSON.stringify(profile));
        
        navigate('/planner');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid username or password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-12 bg-gradient-to-b from-slate-50 to-spiritual-blue/5">
      <div className="max-w-md mx-auto px-4">
        <Card className="shadow-xl border-t-4 border-t-spiritual-blue">
          <CardHeader className="text-center">
            <div className="mx-auto bg-spiritual-blue/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-spiritual-blue" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">User Login</CardTitle>
            <CardDescription>Enter your username and password to access the planner</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username or Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input id="username" name="username" placeholder="Enter username or email" className="pl-10" required value={formData.username} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input id="password" name="password" type="password" placeholder="••••••••" className="pl-10" required value={formData.password} onChange={handleChange} />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-lg bg-spiritual-blue hover:bg-spiritual-blue/90" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : <LogIn className="mr-2" />}
                Sign In
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500">
                  Don't have an account? <Link to="/register" className="text-spiritual-blue font-semibold hover:underline">Register now</Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
