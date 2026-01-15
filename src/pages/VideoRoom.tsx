import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  LiveKitRoom, 
  useParticipants, 
  RoomAudioRenderer,
  ControlBar,
  ParticipantTile,
  useLocalParticipant,
  useRoomContext,
  ParticipantContext,
} from '@livekit/components-react';
import { 
  RoomEvent, 
  RemoteParticipant,
  Participant,
  LocalParticipant,
} from 'livekit-client';
import '@livekit/components-styles';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, 
  Users, Crown, LogOut, Loader2, XCircle, Share2
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// --- Types for moderation messages ---
type ModerationAction = 'MUTE' | 'UNMUTE' | 'STOP_VIDEO' | 'START_VIDEO' | 'KICK';
interface ModerationMessage {
  type: 'MODERATION';
  action: ModerationAction;
  targetId?: string;
}

const VideoRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  
  // Note: These must be set to your actual LiveKit values.
  const serverUrl = 'wss://your-livekit-server-url.livekit.cloud';

  useEffect(() => {
    checkAdminStatus();
  }, [roomId]);

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

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // TODO: In production, fetch a real token from your backend.
    try {
      // Simulation placeholder
      setToken("ENTER_YOUR_LIVEKIT_TOKEN_HERE");
      setHasJoined(true);
      toast({ title: "Connecting", description: "Joining the room..." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Joining failed." });
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
    <LiveKitRoom
      video={true}
      audio={true}
      token={token!}
      serverUrl={serverUrl}
      onDisconnected={() => {
        setHasJoined(false);
        navigate(isAdmin ? '/magazine-admin' : '/');
      }}
      className="min-h-screen bg-slate-950"
    >
      <VideoRoomInternal isAdmin={isAdmin} roomId={roomId || ''} />
    </LiveKitRoom>
  );
};

const VideoRoomInternal = ({ isAdmin, roomId }: { isAdmin: boolean, roomId: string }) => {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const remoteParticipants = useParticipants(); // Reactive list of remote participants
  const { toast } = useToast();
  const navigate = useNavigate();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Reactive full list of everyone in the room
  const allParticipants = useMemo(() => [localParticipant, ...remoteParticipants], [localParticipant, remoteParticipants]);

  // --- Remote Moderation Listener ---
  useEffect(() => {
    const onData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const msg = JSON.parse(decoder.decode(payload)) as ModerationMessage;
        if (msg.type === 'MODERATION') {
          if (!msg.targetId || msg.targetId === localParticipant.identity) {
            handleModerationAction(msg.action);
          }
        }
      } catch (e) {}
    };
    room.on(RoomEvent.DataReceived, onData);
    return () => { room.off(RoomEvent.DataReceived, onData); };
  }, [room, localParticipant]);

  const handleModerationAction = (action: ModerationAction) => {
    switch(action) {
      case 'MUTE': localParticipant.setMicrophoneEnabled(false); break;
      case 'UNMUTE': localParticipant.setMicrophoneEnabled(true); break;
      case 'STOP_VIDEO': localParticipant.setCameraEnabled(false); break;
      case 'START_VIDEO': localParticipant.setCameraEnabled(true); break;
      case 'KICK': room.disconnect(); break;
    }
  };

  const sendModeration = (targetId: string, action: ModerationAction) => {
    if (!isAdmin) return;
    const msg = JSON.stringify({ type: 'MODERATION', action, targetId });
    localParticipant.publishData(encoder.encode(msg), { reliable: true, destinationIdentities: [targetId] });
  };

  // --- Strict Privacy Logic (Non-Admin Policy) ---
  // Non-admins should NOT receive media bits from other non-admins.
  useEffect(() => {
    if (!isAdmin && localParticipant) {
      const enforcePrivacy = (p: RemoteParticipant) => {
        const isPeerAdmin = p.metadata?.includes('admin') || p.identity.toLowerCase().includes('admin');
        if (!isPeerAdmin) {
          p.trackPublications.forEach(publication => {
            publication.setSubscribed(false);
          });
        }
      };
      // For existing participants
      room.remoteParticipants.forEach(enforcePrivacy);
      // For new participants
      room.on(RoomEvent.ParticipantConnected, enforcePrivacy);
      room.on(RoomEvent.TrackPublished, (_, p) => enforcePrivacy(p as RemoteParticipant));
      return () => { room.off(RoomEvent.ParticipantConnected, enforcePrivacy); };
    }
  }, [isAdmin, room]);

  const leaveRoom = () => {
    room.disconnect();
    navigate(isAdmin ? '/magazine-admin' : '/');
  };

  return (
    <div className="flex flex-col h-screen text-white overflow-hidden">
      {/* Dynamic Header */}
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

      {/* Main Multi-Layout Area */}
      <main className="flex-1 flex overflow-hidden bg-slate-950 relative">
        <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
          <ParticipantGrid isAdmin={isAdmin} allParticipants={allParticipants} localParticipant={localParticipant} />
        </div>

        {/* Dynamic Sidebar List */}
        <aside className="w-80 border-l border-white/5 bg-slate-900/30 flex flex-col hidden lg:flex shrink-0">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest">In this session</h3>
            <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded-md">{allParticipants.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
             {allParticipants.map(p => (
               <ParticipantListItem 
                 key={p.identity} 
                 participant={p} 
                 isMe={p.identity === localParticipant.identity} 
                 isAdminViewer={isAdmin} 
                 onModeration={(action: ModerationAction) => sendModeration(p.identity, action)} 
               />
             ))}
          </div>
        </aside>
      </main>

      {/* Footer Controls */}
      <footer className="h-24 bg-slate-900/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-center shrink-0">
        <ControlBar variation="minimal" controls={{ leave: false, screenShare: isAdmin }} />
      </footer>
      <RoomAudioRenderer />
    </div>
  );
};

const ParticipantGrid = ({ isAdmin, allParticipants, localParticipant }: { isAdmin: boolean, allParticipants: Participant[], localParticipant: LocalParticipant }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 auto-rows-fr h-full">
      {allParticipants.map(p => {
        const isPeerAdmin = p.metadata?.includes('admin') || p.identity.toLowerCase().includes('admin');
        const isMe = p.identity === localParticipant.identity;
        
        // Logic: Viewer is Admin? Show all. Viewer is Local? Show all. Viewer is PeerAdmin? Show.
        // Rule: Non-admins ONLY see video/audio of Admins and themselves.
        const canViewMedia = isAdmin || isMe || isPeerAdmin;

        return (
          <div key={p.identity} className="relative rounded-3xl overflow-hidden border border-white/5 bg-slate-900/50 shadow-2xl transition-all hover:border-blue-500/20">
            {canViewMedia ? (
              <ParticipantContext.Provider value={p}>
                <ParticipantTile />
              </ParticipantContext.Provider>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 p-8 text-center">
                <div className="h-24 w-24 rounded-full bg-slate-800 flex items-center justify-center font-bold text-3xl mb-6 text-slate-500 shadow-inner border border-white/5">
                  {(p.name || p.identity).charAt(0).toUpperCase()}
                </div>
                <p className="text-base font-bold text-slate-100">{p.name || p.identity}</p>
                <div className="mt-2 px-3 py-1 rounded-full bg-slate-800/50 border border-white/5 inline-flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                   <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Media Restricted</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ParticipantListItem = ({ participant, isMe, isAdminViewer, onModeration }: any) => {
  const isParticipantAdmin = participant.metadata?.includes('admin') || participant.identity.toLowerCase().includes('admin');
  return (
    <div className={`p-3 rounded-2xl flex items-center gap-3 transition-all ${isMe ? 'bg-blue-600/10 border border-blue-600/20' : 'bg-slate-800/20 border border-white/5 hover:bg-slate-800/40'}`}>
      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${isParticipantAdmin ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-300'}`}>
        {(participant.name || participant.identity).charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-100 truncate flex items-center gap-1.5">
          {participant.name || participant.identity} {isMe && <span className="text-[10px] font-medium opacity-50">(Me)</span>}
        </p>
        <p className={`text-[10px] font-black uppercase tracking-tight ${isParticipantAdmin ? 'text-amber-500' : 'text-slate-500'}`}>
          {isParticipantAdmin ? 'Moderator' : 'Participant'}
        </p>
      </div>
      <div className="flex gap-1.5 items-center">
        {participant.isMicrophoneEnabled ? <Mic className="h-3.5 w-3.5 text-blue-400" /> : <MicOff className="h-3.5 w-3.5 text-red-500/70" />}
        {!isMe && isAdminViewer && (
           <div className="flex gap-1 ml-2">
             <Button variant="ghost" size="icon" title="Mute/Unmute" className="h-8 w-8 rounded-lg hover:bg-slate-700" onClick={() => onModeration(participant.isMicrophoneEnabled ? 'MUTE' : 'UNMUTE')}>
               {participant.isMicrophoneEnabled ? <MicOff className="h-3.5 w-3.5 text-red-500" /> : <Mic className="h-3.5 w-3.5 text-blue-400" />}
             </Button>
             <Button variant="ghost" size="icon" title="Stop Video" className="h-8 w-8 rounded-lg hover:bg-slate-700" onClick={() => onModeration(participant.isCameraEnabled ? 'STOP_VIDEO' : 'START_VIDEO')}>
               {participant.isCameraEnabled ? <VideoOff className="h-3.5 w-3.5 text-red-500" /> : <Video className="h-3.5 w-3.5 text-blue-400" />}
             </Button>
             <Button variant="ghost" size="icon" title="Remove Member" className="h-8 w-8 rounded-lg hover:bg-red-500/20" onClick={() => onModeration('KICK')}>
               <XCircle className="h-3.5 w-3.5 text-red-500" />
             </Button>
           </div>
        )}
      </div>
    </div>
  );
};

export default VideoRoom;
