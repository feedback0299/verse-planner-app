import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/dbService/supabase';
import { Loader2, LogIn, Lock, User, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  
  /* New State for Forgot Password */
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const email = formData.username; // In this mode, username field acts as email input

    if (!email || !email.includes('@')) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address.",
      });
      setLoading(false);
      return;
    }

    try {
      // 1. Check if email exists in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (!profile) {
        // Email not registered -> Redirect to Register
        toast({
          title: "Account Not Found",
          description: "This email is not registered. Redirecting to registration...",
        });
        setTimeout(() => navigate('/register'), 2000);
        return;
      }

      // 2. Email registered -> Send Reset Link
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Reset Link Sent",
        description: "Check your email for the password reset link.",
      });
      setIsForgotPassword(false); // Go back to login

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset email.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If we are in Forgot Password mode, use a separate handler
    if (isForgotPassword) {
      handleForgotPassword(e);
      return;
    }

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
      if (!isForgotPassword) setLoading(false);
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
            <CardTitle className="text-3xl font-bold text-gray-900">
              {isForgotPassword ? "Reset Password" : "User Login"}
            </CardTitle>
            <CardDescription>
              {isForgotPassword 
                ? "Enter your registered email to receive a reset link" 
                : "Enter your username and password to access the planner"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">{isForgotPassword ? "Email Address" : "Username or Email"}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="username" 
                    name="username" 
                    placeholder={isForgotPassword ? "Enter your email" : "Enter username or email"} 
                    className="pl-10" 
                    required 
                    value={formData.username} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              {!isForgotPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button 
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-spiritual-blue hover:text-blue-700 font-medium hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="password" 
                      name="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="pl-10 pr-10" 
                      required 
                      value={formData.password} 
                      onChange={handleChange} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-12 text-lg bg-spiritual-blue hover:bg-spiritual-blue/90" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : (isForgotPassword ? "Send Reset Link" : <LogIn className="mr-2" />)}
                {isForgotPassword ? "" : "Sign In"}
              </Button>

              <div className="text-center space-y-2">
                {isForgotPassword ? (
                   <p className="text-sm text-gray-500">
                     Remember your password? <button type="button" onClick={() => setIsForgotPassword(false)} className="text-base text-spiritual-blue font-bold hover:underline">Back to Login</button>
                   </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Don't have an account? <Link to="/register" className="text-base text-green-800 font-bold hover:underline hover:text-green-900 transition-colors">Register now</Link>
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
