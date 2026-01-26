import React, { useState, useEffect } from 'react';
import { branchService, ChurchBranch } from '@/lib/commonService/branchService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Search, MapPin, Phone, Trash2, 
  Loader2, Globe, Building2, Crown, Check, X
} from 'lucide-react';


const BranchAdmin = () => {
  const [branches, setBranches] = useState<ChurchBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Form State
  const [newBranch, setNewBranch] = useState({
    name: '',
    address: '',
    phone: '',
    latitude: '',
    longitude: '',
    is_headquarters: false
  });

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const data = await branchService.getBranches();
      setBranches(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load branches", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddress = async (address: string) => {
    // Strategy 0: Check if it's a Google Maps URL and extract coordinates
    // Support formats: @10.8,78.6 OR ll=10.8,78.6 OR q=10.8,78.6
    const urlPatterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/
    ];

    for (const pattern of urlPatterns) {
      const match = address.match(pattern);
      if (match) {
        console.log('Extracted coordinates from URL/Pattern:', match[1], match[2]);
        return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) };
      }
    }

    const fetchCoords = async (query: string) => {
      try {
        console.log(`Geocoding query (Nominatim): "${query}"`);
        const encodedAddress = encodeURIComponent(query);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`;
        const response = await fetch(url, {
          headers: { 'Accept-Language': 'en' }
        });
        const data = await response.json();
        return (data && data.length > 0) ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) } : null;
      } catch (e) {
        console.error('Fetch error:', e);
        return null;
      }
    };

    // Strategy 1: Try full address
    let coords = await fetchCoords(address);
    if (coords) return coords;

    // Strategy 2: Clean and try parts
    const parts = address.split(/,|\n/).map(p => p.trim()).filter(p => p.length > 0);
    
    // Strategy 2a: Strip the first part (usually the name)
    if (parts.length > 1) {
      coords = await fetchCoords(parts.slice(1).join(', '));
      if (coords) return coords;
    }

    // Strategy 2b: Try identifying the city and searching for that + state/country
    if (parts.length > 2) {
      coords = await fetchCoords(parts.slice(-2).join(', '));
      if (coords) return coords;
      
      coords = await fetchCoords(parts.slice(-3).join(', '));
      if (coords) return coords;
    }

    // Strategy 3: Try stripping out common church prefixes for a cleaner query
    const cleanedQuery = address
      .replace(/Athuma\s*Nesar\s*Church/gi, '')
      .replace(/AthumaNesar\s*Church/gi, '')
      .replace(/No\.\s*\d+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleanedQuery && cleanedQuery !== address) {
      coords = await fetchCoords(cleanedQuery);
      if (coords) return coords;
    }

    // Strategy 4: Try searching specifically for Geetha Nagar Tiruchirappalli
    if (address.toLowerCase().includes('tiruchirappalli') || address.toLowerCase().includes('trichy')) {
      coords = await fetchCoords('Geetha Nagar, Tiruchirappalli, Tamil Nadu');
      if (coords) return coords;
    }

    // Strategy 5: Last resort - try just the last part
    if (parts.length > 0) {
      let lastPart = parts[parts.length - 1].replace(/Tiruchchirappalli/gi, 'Tiruchirappalli');
      coords = await fetchCoords(lastPart);
      if (coords) return coords;
    }

    return null;
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let finalLat = parseFloat(newBranch.latitude.trim());
      let finalLon = parseFloat(newBranch.longitude.trim());

      // If lat/lon are missing (not numbers or empty strings), attempt geocoding
      if (isNaN(finalLat) || isNaN(finalLon) || newBranch.latitude.trim() === '' || newBranch.longitude.trim() === '') {
        const foundCoords = await geocodeAddress(newBranch.address);
        if (foundCoords) {
          finalLat = foundCoords.lat;
          finalLon = foundCoords.lon;
          toast({ title: "Auto-Geocoded", description: `Found coordinates: ${finalLat.toFixed(4)}, ${finalLon.toFixed(4)}` });
        } else {
          toast({ 
            title: "Geocoding Failed", 
            description: "Could not find coordinates for this address. Please ensure Latitude and Longitude are entered correctly.", 
            variant: "destructive" 
          });
          setSubmitting(false);
          return;
        }
      }

      // Construct the branch data carefully to ensure types are correct
      const branchToSave = {
        name: newBranch.name,
        address: newBranch.address,
        phone: newBranch.phone,
        is_headquarters: newBranch.is_headquarters,
        latitude: finalLat,
        longitude: finalLon
      };

      await branchService.addBranch(branchToSave);

      toast({ title: "Success", description: "Branch added successfully" });
      setNewBranch({ name: '', address: '', phone: '', latitude: '', longitude: '', is_headquarters: false });
      loadBranches();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add branch", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    try {
      await branchService.deleteBranch(id);
      setBranches(prev => prev.filter(b => b.id !== id));
      toast({ title: "Deleted", description: "Branch removed" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete branch" });
    }
  };

  const loginLogic = async (email: string, password: string) => {
    if (password === 'branch2024') {
      return { success: true, session: { user: { name: email || 'Admin' } }, message: 'Welcome to Branch Registry' };
    }
    return { success: false, message: 'Invalid Credentials' };
  };

  return (
      <div className="min-h-screen bg-slate-50 p-6 pt-24">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
               <Button 
                 variant="ghost" 
                 size="sm" 
                 onClick={() => { localStorage.removeItem('branch_admin_session'); window.location.reload(); }}
                 className="text-slate-400 hover:text-red-500 font-bold flex items-center gap-2"
               >
                 <X className="h-4 w-4" /> Sign Out
               </Button>
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                 <Building2 className="text-blue-600 h-8 w-8" />
                 International Branch Registry
              </h1>
              <p className="text-slate-500 mt-1 font-medium italic">Managing {branches.length} locations worldwide</p>
            </div>
            <div className="flex gap-2">
               <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs flex items-center gap-2 border border-blue-100">
                  <Globe className="h-4 w-4" /> LIVE ON MAP
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Side */}
            <div className="lg:col-span-1">
              <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 overflow-hidden sticky top-8">
                <CardHeader className="bg-slate-900 text-white p-6">
                  <CardTitle className="flex items-center gap-2 text-xl font-bold">
                    <Plus className="h-5 w-5" /> Add New Branch
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleAddBranch} className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Branch Name</label>
                       <Input 
                         placeholder="e.g. Athumanesar London" 
                         value={newBranch.name} 
                         onChange={e => setNewBranch({...newBranch, name: e.target.value})}
                         className="h-12 rounded-xl border-slate-200 focus:ring-blue-500"
                         required
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Address (for Map)</label>
                       <Input 
                         placeholder="City, State, Country" 
                         value={newBranch.address} 
                         onChange={e => setNewBranch({...newBranch, address: e.target.value})}
                         className="h-12 rounded-xl border-slate-200 focus:ring-blue-500"
                         required
                       />
                       <p className="text-[10px] text-slate-400 mt-1 italic">Tip: You can also paste a Google Maps link here!</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                         <Input 
                           placeholder="e.g. 10.8174" 
                           value={newBranch.latitude} 
                           onChange={e => setNewBranch({...newBranch, latitude: e.target.value})}
                           className="h-10 rounded-xl border-slate-200 focus:ring-blue-500 text-xs"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                         <Input 
                           placeholder="e.g. 78.6654" 
                           value={newBranch.longitude} 
                           onChange={e => setNewBranch({...newBranch, longitude: e.target.value})}
                           className="h-10 rounded-xl border-slate-200 focus:ring-blue-500 text-xs"
                         />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                       <Input 
                         placeholder="+123..." 
                         value={newBranch.phone} 
                         onChange={e => setNewBranch({...newBranch, phone: e.target.value})}
                         className="h-12 rounded-xl border-slate-200 focus:ring-blue-500"
                       />
                    </div>
                    <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setNewBranch({...newBranch, is_headquarters: !newBranch.is_headquarters})}>
                       <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${newBranch.is_headquarters ? 'bg-red-500 border-red-500' : 'bg-white border-slate-300'}`}>
                          {newBranch.is_headquarters && <Check className="h-3 w-3 text-white" />}
                       </div>
                       <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <Crown className={`h-4 w-4 ${newBranch.is_headquarters ? 'text-amber-500' : 'text-slate-400'}`} />
                          Set as Headquarters
                       </span>
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg transition-all shadow-lg shadow-blue-200 flex gap-2">
                      {submitting ? <Loader2 className="animate-spin" /> : <Plus className="h-5 w-5" />}
                      Register Branch
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* List Side */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                ) : branches.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                     No branches registered yet.
                  </div>
                ) : (
                  branches.map((branch) => (
                    <div key={branch.id} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex gap-4">
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${branch.is_headquarters ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                           {branch.is_headquarters ? <Crown className="h-7 w-7" /> : <Building2 className="h-7 w-7" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-900 text-lg">{branch.name}</h3>
                            {branch.is_headquarters && <span className="px-2 py-0.5 bg-red-500 text-white text-[8px] font-black rounded uppercase tracking-tighter">HQ</span>}
                          </div>
                          <p className="text-slate-500 text-sm flex items-center gap-2 mt-0.5">
                            <MapPin className="h-3 w-3 text-slate-400" /> {branch.address}
                          </p>
                          <div className="flex gap-4 mt-2">
                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> LAT: {branch.latitude.toFixed(4)}
                             </div>
                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> LON: {branch.longitude.toFixed(4)}
                             </div>
                             {branch.phone && (
                               <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                  <Phone className="h-3 w-3" /> {branch.phone}
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(branch.id)} className="rounded-full h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default BranchAdmin;
