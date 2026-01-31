import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/dbService/supabase';
import { Loader2, UserPlus, Phone, Mail, Lock, User, MapPin, CheckCircle2, Globe, Building2, Church, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    city: '',
    churchBranchType: 'main',
    customBranch: '',
    participationMode: 'online',
    attendanceFrequency: 'daily',
    onlineRegularity: 'yes',
    category: 'adult'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const validatePhone = (phone: string) => {
    return /^\d{10}$/.test(phone);
  };

  const checkEmailExists = async (email: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle();
    
    return !!data;
  };

  const validateEmailContent = (email: string): string | null => {
    // 1. Basic Format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return "Invalid email format.";

    const [localPart, domain] = email.split('@');
    const lowerDomain = domain.toLowerCase();

    // 2. Domain Typos Check
    // Catch things that look like gmail but aren't
    if (lowerDomain.includes('gmail') && lowerDomain !== 'gmail.com') {
      return "Did you mean @gmail.com? Please check your email domain.";
    }
    // Catch common TLD typos
    if (lowerDomain.endsWith('.cim') || lowerDomain.endsWith('.cam') || lowerDomain.endsWith('.con') || lowerDomain.endsWith('.c0m')) {
      return "Invalid domain extension. Did you mean .com?";
    }

    // 3. Gmail Specific Rules
    if (lowerDomain === 'gmail.com') {
      // Length: 6-30 chars
      if (localPart.length < 6) return "Gmail username must be at least 6 characters long.";
      if (localPart.length > 30) return "Gmail username must be less than 30 characters long.";
      
      // Allowed chars: letters, numbers, periods
      if (!/^[a-z0-9.]+$/i.test(localPart)) return "Gmail username can only contain letters, numbers, and periods.";
      
      // Periods not at start/end
      if (localPart.startsWith('.') || localPart.endsWith('.')) return "Gmail username cannot start or end with a period.";
    }

    // 4. Inappropriate / Junk Patterns
    const blockedKeywords = ['test', 'sample', 'demo', 'fake', 'example', 'admin', 'user', 'no-reply', 'noreply', '1234'];
    const lowerLocal = localPart.toLowerCase();
    
    // Check if the username is JUST a blocked keyword + maybe some numbers
    // e.g. "sample123" -> blocked, "samplesmith" -> might be okay but risky. 
    // Let's be strict about the specific words requested.
    for (const word of blockedKeywords) {
      if (lowerLocal === word || lowerLocal.startsWith(word + '.') || lowerLocal.startsWith(word + '1') || lowerLocal === word + '123') {
         return `Please enter a valid personal email address. '${word}' is not allowed.`;
      }
    }
    
    return null;
  };

  const handleEmailBlur = async () => {
    if (!formData.email) return;

    // 1. Content Validation
    const contentError = validateEmailContent(formData.email);
    if (contentError) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: contentError,
      });
      return; // Stop here if format is wrong
    }
    
    // 2. Existence Check
    const exists = await checkEmailExists(formData.email);
    if (exists) {
      toast({
        variant: "destructive",
        title: "Email exists",
        description: "This email address is already registered.",
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!validatePhone(formData.phone)) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Please enter a 10-digit Indian phone number.",
      });
      return;
    }

    // Email Content Validation
    const emailContentError = validateEmailContent(formData.email);
    if (emailContentError) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: emailContentError,
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords mismatch",
        description: "Password and Confirm Password must match.",
      });
      return;
    }

    if (formData.churchBranchType === 'branch' && !formData.customBranch.trim()) {
      toast({
        variant: "destructive",
        title: "Branch Name Required",
        description: "Please specify the name of your Athumanesar Branch.",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if email exists in profiles
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        toast({
          variant: "destructive",
          title: "Email exists",
          description: "This email address is already registered.",
        });
        setLoading(false);
        return;
      }

      // 1. Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            full_name: formData.fullName,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Generate Custom ID (M000000001 format)
        // We'll try to use the DB function if it works, otherwise fallback to local count
        let customId = '';
        const { data: nextId, error: idError } = await supabase.rpc('generate_next_custom_id');
        
        if (idError || !nextId) {
          console.warn("RPC failed, falling back to manual ID generation", idError);
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
          customId = `M${String((count || 0) + 1).padStart(9, '0')}`;
        } else {
          customId = nextId;
        }

        // 3. Insert into profiles table
        const { error: profileError } = await supabase.from('profiles').insert([{
          id: authData.user.id,
          custom_id: customId,
          full_name: formData.fullName,
          username: formData.username,
          phone_number: formData.phone,
          email: formData.email,
          city_location: formData.city,
          church_branch: formData.churchBranchType === 'main' ? '1' : '2',
          church_branch_name: formData.churchBranchType === 'branch' ? formData.customBranch : null,
          participation_mode: formData.participationMode,
          attendance_frequency: formData.participationMode === 'offline' ? formData.attendanceFrequency : null,
          online_regularity: formData.participationMode === 'online' ? formData.onlineRegularity : null,
          category: formData.category
        }]);

        if (profileError) throw profileError;

        // 4. Initialize Contest Progress
        const { error: progressError } = await supabase.from('contest_progress').insert([{
          user_id: authData.user.id,
          category: formData.category,
          progress_mask: '0'.repeat(70)
        }]);

        if (progressError) console.error("Progress init error:", progressError);

        // 5. Send Welcome Email
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: { full_name: formData.fullName, email: formData.email }
          });
        } catch (emailErr) {
          console.error("Welcome email failed:", emailErr);
          // Non-blocking for the user
        }

        toast({
          title: "Registration Successful",
          description: `Welcome ${formData.fullName}! Your ID is ${customId}. Please check your email for verification.`,
        });

        navigate('/login');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gradient-to-b from-slate-50 to-spiritual-blue/5">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="shadow-xl border-t-4 border-t-spiritual-blue">
          <CardHeader className="text-center">
            <div className="mx-auto bg-spiritual-blue/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-spiritual-blue" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Join the 70-Day Journey</CardTitle>
            <CardDescription>Register now for the consecutive 70-day verse planner contest</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="fullName" name="fullName" placeholder="John Doe" className="pl-10" required value={formData.fullName} onChange={handleChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="username" name="username" placeholder="johndoe77" className="pl-10" required value={formData.username} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp Number (Indian)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="phone" name="phone" placeholder="9876543210" className="pl-10" required value={formData.phone} onChange={handleChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="john@example.com" 
                      className="pl-10" 
                      required 
                      value={formData.email} 
                      onChange={handleChange} 
                      onBlur={handleEmailBlur}
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="pl-10 pr-10" 
                      required 
                      value={formData.confirmPassword} 
                      onChange={handleChange} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Personal Address / City</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Textarea 
                    id="city" 
                    name="city" 
                    placeholder="Enter your full personal address" 
                    className="pl-10 min-h-[80px]" 
                    required 
                    value={formData.city} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Select your Branch</Label>
                <RadioGroup 
                  defaultValue="main" 
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  onValueChange={(v) => {
                    handleRadioChange('churchBranchType', v);
                  }}
                >
                  <div>
                    <RadioGroupItem value="main" id="loc-main" className="peer sr-only" />
                    <Label
                      htmlFor="loc-main"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-spiritual-blue [&:has([data-state=checked])]:border-spiritual-blue cursor-pointer"
                    >
                      <Building2 className="mb-3 h-6 w-6" />
                      Athumanesar Thanjavur Main
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="branch" id="loc-branch" className="peer sr-only" />
                    <Label
                      htmlFor="loc-branch"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-spiritual-blue [&:has([data-state=checked])]:border-spiritual-blue cursor-pointer"
                    >
                      <MapPin className="mb-3 h-6 w-6" />
                      Athumanesar Branch
                    </Label>
                  </div>
                </RadioGroup>
              </div>

               {/* Conditional Branch Name Input */}
               {formData.churchBranchType === 'branch' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="branchName">Branch Name</Label>
                    <div className="relative">
                       <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                       <Input 
                        id="branchName" 
                        name="customBranch"
                        placeholder="Enter Branch Name (e.g. Kumbakonam)" 
                        className="pl-10" 
                        value={formData.customBranch} 
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
               )}

              <div className="space-y-4 pt-2">
                <Label className="text-base font-semibold">How will you participate?</Label>
                <RadioGroup 
                  defaultValue="online" 
                  className="grid grid-cols-2 gap-4"
                  onValueChange={(v) => handleRadioChange('participationMode', v)}
                >
                  <div>
                    <RadioGroupItem value="offline" id="offline" className="peer sr-only" />
                    <Label
                      htmlFor="offline"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-spiritual-blue [&:has([data-state=checked])]:border-spiritual-blue cursor-pointer"
                    >
                      <Church className="mb-3 h-6 w-6" />
                      Offline (At Church)
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="online" id="online" className="peer sr-only" />
                    <Label
                      htmlFor="online"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-spiritual-blue [&:has([data-state=checked])]:border-spiritual-blue cursor-pointer"
                    >
                      <Globe className="mb-3 h-6 w-6" />
                      Online (At Home)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.participationMode === 'offline' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="text-sm font-medium">Will you attend daily or on selected days?</Label>
                  <RadioGroup 
                    defaultValue="daily" 
                    className="flex gap-4"
                    onValueChange={(v) => handleRadioChange('attendanceFrequency', v)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="daily" id="att-daily" />
                      <Label htmlFor="att-daily">Daily</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="some_days" id="att-some" />
                      <Label htmlFor="att-some">Some days</Label>
                    </div>
                  </RadioGroup>
                  <p className="text-sm text-red-500">Join with Mrs. Sheela Jims Asirvatham.</p>
                  <p className="text-sm text-red-500">Note: Mon-Sat 12:00-14:00, Sun after 3rd service.</p>
                </div>
              )}

              {formData.participationMode === 'online' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="text-sm font-medium">Will you log in daily during 12:00 to 14:00 pm?</Label>
                  <RadioGroup 
                    defaultValue="yes" 
                    className="flex flex-wrap gap-4"
                    onValueChange={(v) => handleRadioChange('onlineRegularity', v)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="reg-yes" />
                      <Label htmlFor="reg-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mostly" id="reg-mostly" />
                      <Label htmlFor="reg-mostly">Mostly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ocassionally" id="reg-ocassionally" />
                      <Label htmlFor="reg-ocassionally">Occasionally</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div className="space-y-4 pt-2 border-t mt-6">
                <Label className="text-base font-semibold">Which category will you come under?</Label>
                <RadioGroup 
                  defaultValue="adult" 
                  className="grid grid-cols-2 gap-4"
                  onValueChange={(v) => handleRadioChange('category', v)}
                >
                  <div>
                    <RadioGroupItem value="kids_teens" id="cat-kids" className="peer sr-only" />
                    <Label
                      htmlFor="cat-kids"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-spiritual-gold [&:has([data-state=checked])]:border-spiritual-gold cursor-pointer"
                    >
                      Kids & Teens (Upto 17)
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="adult" id="cat-adult" className="peer sr-only" />
                    <Label
                      htmlFor="cat-adult"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-spiritual-gold [&:has([data-state=checked])]:border-spiritual-gold cursor-pointer"
                    >
                      Adult (Above 18)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button type="submit" className="w-full h-12 text-lg bg-spiritual-blue hover:bg-spiritual-blue/90" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
                Register Now
              </Button>

              <p className="text-center text-sm text-gray-500">
                Already have an account? <Link to="/login" className="text-spiritual-blue font-semibold hover:underline">Log in</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


export default Register;
