import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/dbService/supabase';
import { Loader2, CheckCircle2, Calendar, Trophy, User, Clock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ChallengeCalendar from '@/components/ChallengeCalendar';
import BranchSelectionPopup from '@/components/BranchSelectionPopup';

const Planner = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Helper to get current time in IST
  const getISTDate = () => {
    const now = new Date();
    const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    return new Date(istString);
  };

  // February 1, 2026
  const START_DATE = new Date('2026-02-01T00:00:00');
  
  const getCurrentDay = () => {
    const todayIST = getISTDate();
    const todayUTC = Date.UTC(todayIST.getFullYear(), todayIST.getMonth(), todayIST.getDate());
    const startUTC = Date.UTC(START_DATE.getFullYear(), START_DATE.getMonth(), START_DATE.getDate());
    const diffTime = todayUTC - startUTC;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const currentDay = getCurrentDay();

  // Query: User Profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['plannerProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    retry: false,
    meta: {
      onError: () => navigate('/login')
    }
  });

  // Query: Contest Progress
  const { data: progress = '0'.repeat(70), isLoading: progressLoading } = useQuery({
    queryKey: ['plannerProgress', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contest_progress')
        .select('progress_mask')
        .eq('user_id', profile.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        const mask = '0'.repeat(70);
        await supabase.from('contest_progress').insert([{
          user_id: profile.id,
          category: profile.category || 'adult',
          progress_mask: mask
        }]);
        return mask;
      }
      return data.progress_mask;
    }
  });

  // Query: Contest Readings
  const { data: readings = [], isLoading: readingsLoading } = useQuery({
    queryKey: ['contestReadings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contest_readings')
        .select('*')
        .order('day', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Mutation: Check-in with Optimistic Updates
  const checkInMutation = useMutation({
    mutationFn: async (day: number) => {
      // Calculate new state based on current
      const currentVal = progress[day - 1];
      const newVal = currentVal === '1' ? '0' : '1';
      
      const newMask = progress.split('');
      newMask[day - 1] = newVal;
      const updatedMask = newMask.join('');

      const { error } = await supabase
        .from('contest_progress')
        .update({ 
          progress_mask: updatedMask,
          last_check_in_date: new Date().toISOString().split('T')[0]
        })
        .eq('user_id', profile.id);

      if (error) throw error;
      return updatedMask;
    },
    onMutate: async (day) => {
      await queryClient.cancelQueries({ queryKey: ['plannerProgress', profile?.id] });
      const previousProgress = queryClient.getQueryData(['plannerProgress', profile?.id]);
      
      const currentString = (previousProgress as string || '0'.repeat(70));
      const currentVal = currentString[day - 1];
      const newVal = currentVal === '1' ? '0' : '1';

      const newMask = currentString.split('');
      newMask[day - 1] = newVal;
      queryClient.setQueryData(['plannerProgress', profile?.id], newMask.join(''));
      
      return { previousProgress };
    },
    onError: (err, day, context) => {
      queryClient.setQueryData(['plannerProgress', profile?.id], context?.previousProgress);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: (err as Error).message,
      });
    },
    onSuccess: (data, day) => {
      toast({
        title: "Check-in Successful!",
        description: `Day ${day} progress saved. Great job!`,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['plannerProgress', profile?.id] });
    }
  });

  const getTimingInfo = () => {
    const todayIST = getISTDate();
    const day = todayIST.getDay();
    const hours = todayIST.getHours();
    
    // Sunday (0) logic
    if (day === 0) return "After 14:00 (After 3rd Service)";
    
    // Mon-Sat logic
    return "12:00 - 14:00";
  };

  const isCompleted = (day: number) => progress[day - 1] === '1';

  const isLoading = profileLoading || progressLoading || readingsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-spiritual-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border">
          <div className="relative">
            <h1 className="text-3xl font-bold text-gray-900">70-Day Bible reading contest</h1>
            <p className="text-gray-500 mt-1 flex flex-col md:flex-row md:items-center gap-2">
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Start Date: Feb 1, 2026</span>
              <span className="hidden md:inline text-slate-300">|</span>
              <span className="flex items-center gap-2 font-semibold text-spiritual-blue">
                {currentDay < 1 ? `Starts in ${Math.abs(currentDay)+1} days` : 
                 currentDay > 70 ? 'Contest Ended' : `Today is Day ${currentDay}`}
              </span>
              <span className="hidden md:inline text-slate-300">|</span>
              <span className="flex items-center gap-2 text-spiritual-gold">
                <Clock className="w-4 h-4" /> {getTimingInfo()}
              </span>
            </p>
            {checkInMutation.isPending && (
              <div className="absolute -top-2 -right-2 flex items-center gap-1 text-[10px] text-spiritual-blue bg-spiritual-blue/10 px-2 py-0.5 rounded-full animate-pulse">
                <RefreshCw className="w-2 h-2 animate-spin" /> Syncing...
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 bg-spiritual-blue/5 px-4 py-2 rounded-full border border-spiritual-blue/10">
            <div className="bg-spiritual-blue text-white p-2 rounded-full">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium leading-none">Logged in as</p>
              <p className="font-bold text-spiritual-blue">{profile?.full_name}</p>
            </div>
          </div>
        </div>

        {/* Instructions Note */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-xl shadow-sm space-y-3">
          <p className="text-amber-900 font-bold text-sm leading-relaxed" style={{ fontFamily: 'Noto Sans Tamil, sans-serif' }}>
            📌 குறிப்பு: தொடர்ச்சியாக 70 நாட்களுக்கு ஒவ்வொரு நாளும் உள்நுழைந்து, வாசிப்புப் பகுதியைச் சுருக்கமாக விவரித்து, பாப்-அப் சாளரத்தில் உள்ள செக்பாக்ஸை தேர்வு செய்து உங்கள் தினசரி முன்னேற்றத்தை பதிவு செய்ய வேண்டும். இதன் மூலம் மட்டுமே உங்கள் 70 நாள் பைபிள் வாசிப்பு சவால் முடிவடையும்.
          </p>
          <p className="text-amber-800 font-medium text-sm leading-relaxed italic border-t border-amber-200/50 pt-2">
            📌 Note: You must log in every day for 70 consecutive days, provide a short description of the reading portion, and select the check-box in the popup window to record your daily progress. Your 70-day Bible reading challenge will be officially completed only through these daily check-ins.
          </p>
          <p className="text-amber-800 font-medium text-xs leading-relaxed italic border-t border-amber-200/50 pt-2">
            Important: If you don't see the welcome email or daily updates, please check your Spam/Junk folder.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-spiritual-blue to-blue-700 text-white border-none">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Your Progress</p>
                  <h3 className="text-3xl font-bold">{progress.split('1').length - 1} / 70 Days</h3>
                </div>
                <Trophy className="w-12 h-12 text-spiritual-gold/40" />
              </div>
              <div className="mt-4 bg-white/20 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-spiritual-gold h-full transition-all duration-500" 
                  style={{ width: `${((progress.split('1').length - 1) / 70) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-spiritual-gold/20 bg-spiritual-gold/5">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="bg-spiritual-gold/20 p-3 rounded-xl">
                 <CheckCircle2 className="w-6 h-6 text-spiritual-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Today's Goal</p>
                <p className="font-bold text-lg">{currentDay > 0 && currentDay <= 70 ? `Complete Day ${currentDay}` : 'Wait for Start'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="bg-slate-100 p-3 rounded-xl">
                 <User className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Category</p>
                <p className="font-bold text-lg capitalize">{profile?.category?.replace('_', ' & ')}</p>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Calendar View */}
        <Tabs defaultValue={profile?.category || "adult"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white p-1 rounded-xl shadow-inner border max-w-md mx-auto">
            <TabsTrigger value="kids_teens" className="rounded-lg data-[state=active]:bg-spiritual-blue data-[state=active]:text-white">
              Kids & Teens (Upto 17)
            </TabsTrigger>
            <TabsTrigger value="adult" className="rounded-lg data-[state=active]:bg-spiritual-blue data-[state=active]:text-white">
              Adults (Above 18)
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="kids_teens">
             <ChallengeCalendar 
                startDate={START_DATE}
                progress={progress}
                readings={readings}
                onCheckIn={(day) => checkInMutation.mutate(day)}
                isCheckingIn={checkInMutation.isPending}
                userCategory="kids_teens"
             />
          </TabsContent>
          
          <TabsContent value="adult">
             <ChallengeCalendar 
                startDate={START_DATE}
                progress={progress}
                readings={readings}
                onCheckIn={(day) => checkInMutation.mutate(day)}
                isCheckingIn={checkInMutation.isPending}
                userCategory="adult"
             />
          </TabsContent>
        </Tabs>
      </div>

      {/* Mandatory Profile Update Popup */}
      {profile && !profile.church_branch && (
        <BranchSelectionPopup 
          userId={profile.id} 
          onComplete={() => queryClient.invalidateQueries({ queryKey: ['plannerProfile'] })} 
        />
      )}
    </div>
  );
};

export default Planner;
