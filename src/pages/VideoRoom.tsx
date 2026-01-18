import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Video, PhoneOff, Users, Crown, LogOut, Loader2, Share2
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const VideoRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [jitsiApi, setJitsiApi] = useState<any>(null);
  
  const [name, setName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, [roomId]);

  useEffect(() => {
    if (hasJoined && !jitsiApi) {
      const loadJitsiScript = () => {
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => initializeJitsi();
        document.body.appendChild(script);
      };

      if (window.JitsiMeetExternalAPI) {
        initializeJitsi();
      } else {
        loadJitsiScript();
      }
    }

    return () => {
      if (jitsiApi) {
        jitsiApi.dispose();
      }
    };
  }, [hasJoined]);

  const checkAdminStatus = async () => {
    setIsLoadingAuth(true);
    try {
      const adminSession = localStorage.getItem('admin_session');
      const magazineSession = localStorage.getItem('magazine_admin_session');
      
      if (adminSession || magazineSession) {
        const session = JSON.parse(adminSession || magazineSession || '{}');
        setIsAdmin(true);
        setName(session.user?.name || 'Admin');
      }
    } catch (e) {
      console.error("Auth status check failed:", e);
    }
    setIsLoadingAuth(false);
  };

  const initializeJitsi = () => {
    if (!jitsiContainerRef.current) return;

    const domain = 'meet.jit.si';
    const options = {
      roomName: roomId,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: name
      },
      configOverwrite: {
        disableDeepLinking: true,
        prejoinPageEnabled: false,
        startWithAudioMuted: false,
        startWithVideoMuted: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
          'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
          'security'
        ],
      }
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);
    
    api.addEventListeners({
      readyToClose: () => {
        setHasJoined(false);
        navigate(isAdmin ? '/magazine-admin' : '/');
      },
      participantLeft: (participant: any) => {
        console.log('Participant left:', participant);
      },
      participantJoined: (participant: any) => {
        console.log('Participant joined:', participant);
      }
    });

    setJitsiApi(api);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setHasJoined(true);
    toast({ title: "Connected", description: "Successfully joined the room via Jitsi." });
  };

  const leaveRoom = () => {
    if (jitsiApi) {
      jitsiApi.executeCommand('hangup');
    } else {
      setHasJoined(false);
      navigate(isAdmin ? '/magazine-admin' : '/');
    }
  };

  if (isLoadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900"><Loader2 className="h-12 w-12 text-blue-500 animate-spin" /></div>;
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <div className="p-2 bg-blue-500/20 rounded-lg"><Video className="text-blue-400" /></div>
              {isAdmin ? 'Admin Portal' : 'Join Video Call'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Screen Name</label>
                <Input 
                  placeholder="e.g. Samuel" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white rounded-xl h-12"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-semibold rounded-xl transition-all">
                Enter Room
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen text-white overflow-hidden bg-slate-950">
      {/* Header */}
      <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg"><Video className="h-5 w-5 text-blue-400" /></div>
          <div><h2 className="font-bold text-sm">Athumanesar Live</h2><p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Room ID: {roomId}</p></div>
          {isAdmin && <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1"><Crown className="h-3 w-3" /> HOST</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link Copied" }); }} className="h-9 rounded-full bg-slate-800 text-xs border-white/5 hover:bg-slate-700"><Share2 className="h-4 w-4 mr-2" /> Invite</Button>
          <Button variant="destructive" size="sm" onClick={leaveRoom} className="h-9 rounded-full px-4 font-bold shadow-lg shadow-red-500/10 transition-transform active:scale-95"><LogOut className="h-4 w-4 mr-2" /> Leave</Button>
        </div>
      </header>

      {/* Jitsi IFrame Area */}
      <main className="flex-1 relative">
        <div ref={jitsiContainerRef} className="absolute inset-0 w-full h-full" />
      </main>
    </div>
  );
};

export default VideoRoom;
