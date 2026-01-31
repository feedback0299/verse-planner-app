import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building2, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/dbService/supabase';
import { useToast } from "@/hooks/use-toast";

interface BranchSelectionPopupProps {
  userId: string;
  onComplete: () => void;
}

const BranchSelectionPopup: React.FC<BranchSelectionPopupProps> = ({ userId, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [branchType, setBranchType] = useState<'main' | 'branch'>('main');
  const [customBranchName, setCustomBranchName] = useState('');
  const { toast } = useToast();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (branchType === 'branch' && !customBranchName.trim()) {
      toast({
        variant: "destructive",
        title: "Branch Name Required",
        description: "Please specify the name of your Athumanesar Branch.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          church_branch: branchType === 'main' ? '1' : '2',
          church_branch_name: branchType === 'branch' ? customBranchName.trim() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your church branch information has been saved.",
      });
      
      onComplete();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md pointer-events-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-spiritual-blue" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Please select your church branch to continue to the planner.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Select your Branch</Label>
            <RadioGroup 
              defaultValue="main" 
              className="grid grid-cols-1 gap-4"
              onValueChange={(v) => setBranchType(v as 'main' | 'branch')}
            >
              <div>
                <RadioGroupItem value="main" id="loc-main-popup" className="peer sr-only" />
                <Label
                  htmlFor="loc-main-popup"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-spiritual-blue [&:has([data-state=checked])]:border-spiritual-blue cursor-pointer transition-all"
                >
                  <Building2 className="mb-3 h-6 w-6" />
                  <span className="font-semibold text-center">Athumanesar Thanjavur Main</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="branch" id="loc-branch-popup" className="peer sr-only" />
                <Label
                  htmlFor="loc-branch-popup"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-spiritual-blue [&:has([data-state=checked])]:border-spiritual-blue cursor-pointer transition-all"
                >
                  <MapPin className="mb-3 h-6 w-6" />
                  <span className="font-semibold text-center">Athumanesar Branch</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {branchType === 'branch' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="branchNamePopup">Branch Name</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="branchNamePopup" 
                  placeholder="Enter Branch Name (e.g. Kumbakonam)" 
                  className="pl-10" 
                  value={customBranchName} 
                  onChange={(e) => setCustomBranchName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full h-12 text-lg bg-spiritual-blue hover:bg-spiritual-blue/90" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
            Save & Continue
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BranchSelectionPopup;
