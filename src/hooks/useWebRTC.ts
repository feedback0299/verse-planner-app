import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/dbService/supabase';
import { useToast } from "@/hooks/use-toast";

export interface Participant {
  id: string;
  name: string;
  isAdmin: boolean;
  stream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  connectionState?: RTCPeerConnectionState;
}

export const useWebRTC = (roomId: string, name: string, isAdmin: boolean, localStream: MediaStream | null, hasJoined: boolean) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [signalingError, setSignalingError] = useState<string | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidate[]>>(new Map());
  const channelRef = useRef<any>(null);
  const myIdRef = useRef<string>(Math.random().toString(36).substring(2, 11));
  const nameRef = useRef(name);
  const isAdminRef = useRef(isAdmin);
  const { toast } = useToast();

  useEffect(() => {
    nameRef.current = name;
  }, [name]);

  useEffect(() => {
    isAdminRef.current = isAdmin;
  }, [isAdmin]);

  const createPeer = useCallback((targetId: string, stream: MediaStream, initiator: boolean) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local tracks to peer
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { targetId, senderId: myIdRef.current, candidate: event.candidate }
        });
      }
    };

    peer.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setParticipants(prev => prev.map(p => 
        p.id === targetId ? { ...p, stream: remoteStream } : p
      ));
    };

    peer.onconnectionstatechange = () => {
      setParticipants(prev => prev.map(p => 
        p.id === targetId ? { ...p, connectionState: peer.connectionState } : p
      ));
    };

    return peer;
  }, []);

  useEffect(() => {
    if (!roomId || !hasJoined) return;

    const channel = supabase.channel(`room_${roomId}`, {
      config: { broadcast: { self: false, ack: true } }
    });
    channelRef.current = channel;

    const sendIdentity = () => {
      if (!channelRef.current) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'participant-info',
        payload: { 
          id: myIdRef.current, 
          name: nameRef.current || 'User', 
          isAdmin: isAdminRef.current 
        }
      });
    };

    const startNegotiation = async (targetId: string) => {
      if (peersRef.current.has(targetId)) return;
      if (myIdRef.current <= targetId) return; // Deterministic initiator

      try {
        const peer = createPeer(targetId, localStream || new MediaStream(), true);
        peersRef.current.set(targetId, peer);
        
        const offer = await peer.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await peer.setLocalDescription(offer);
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'offer',
            payload: { 
              targetId: targetId, 
              senderId: myIdRef.current, 
              offer, 
              name: nameRef.current || 'User', 
              isAdmin: isAdminRef.current 
            }
          });
        }
      } catch (err) {
        console.error("Failure starting negotiation:", err);
      }
    };

    channel
      .on('broadcast', { event: 'join' }, async ({ payload }) => {
        if (!payload || !payload.id) return;
        sendIdentity();
        startNegotiation(payload.id);
      })
      .on('broadcast', { event: 'participant-info' }, ({ payload }) => {
        if (!payload || !payload.id) return;
        setParticipants(prev => {
          if (prev.find(p => p.id === payload.id)) {
            return prev.map(p => p.id === payload.id ? { ...p, ...payload } : p);
          }
          return [...prev, { ...payload, stream: null }];
        });
        // Catch-up negotiation
        startNegotiation(payload.id);
      })
      .on('broadcast', { event: 'leave' }, ({ payload }) => {
        setParticipants(prev => prev.filter(p => p.id !== payload.id));
        const peer = peersRef.current.get(payload.id);
        if (peer) {
          peer.close();
          peersRef.current.delete(payload.id);
          pendingCandidatesRef.current.delete(payload.id);
        }
      })
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (!payload || payload.targetId !== myIdRef.current) return;
        
        setParticipants(prev => {
          if (prev.find(p => p.id === payload.senderId)) return prev;
          return [...prev, { id: payload.senderId, name: payload.name || 'User', isAdmin: !!payload.isAdmin, stream: null, isMuted: false, isVideoOff: false }];
        });

        try {
          let peer = peersRef.current.get(payload.senderId);
          if (!peer) {
            peer = createPeer(payload.senderId, localStream || new MediaStream(), false);
            peersRef.current.set(payload.senderId, peer);
          }

          await peer.setRemoteDescription(new RTCSessionDescription(payload.offer));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          
          channel.send({
            type: 'broadcast',
            event: 'answer',
            payload: { targetId: payload.senderId, senderId: myIdRef.current, answer }
          });

          // Flush pending candidates
          const pending = pendingCandidatesRef.current.get(payload.senderId) || [];
          for (const cand of pending) {
            if (cand) await peer.addIceCandidate(new RTCIceCandidate(cand));
          }
          pendingCandidatesRef.current.delete(payload.senderId);
        } catch (err) {
          console.error("Error handling offer:", err);
        }
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (payload.targetId !== myIdRef.current) return;
        const peer = peersRef.current.get(payload.senderId);
        if (peer) {
          try {
            await peer.setRemoteDescription(new RTCSessionDescription(payload.answer));
            
            // Flush pending candidates
            const pending = pendingCandidatesRef.current.get(payload.senderId) || [];
            for (const cand of pending) {
              if (cand) await peer.addIceCandidate(new RTCIceCandidate(cand));
            }
            pendingCandidatesRef.current.delete(payload.senderId);
          } catch (err) {
            console.error("Error setting remote description from answer:", err);
          }
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (!payload || !payload.candidate || payload.targetId !== myIdRef.current) return;
        const peer = peersRef.current.get(payload.senderId);
        
        if (peer && peer.remoteDescription) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (err) {
            console.error("Error adding ice candidate:", err);
          }
        } else {
          const pending = pendingCandidatesRef.current.get(payload.senderId) || [];
          pendingCandidatesRef.current.set(payload.senderId, [...pending, payload.candidate]);
        }
      })
      .on('broadcast', { event: 'command' }, ({ payload }) => {
         if (payload.targetId === myIdRef.current || payload.targetId === 'all') {
            handleAdminCommand(payload.action);
         }
      })
      .subscribe(async (status) => {
        try {
          if (status === 'SUBSCRIBED') {
            const status = await channel.send({
              type: 'broadcast',
              event: 'join',
              payload: { 
                id: myIdRef.current, 
                name: nameRef.current || 'User', 
                isAdmin: isAdminRef.current 
              }
            });
            if (status !== 'ok') throw new Error(`Join failed with status: ${status}`);
          } else if (status === 'CHANNEL_ERROR') {
             setSignalingError("Signaling channel disconnected. Please check your internet.");
          }
        } catch (err: any) {
          console.error("Signaling subscription error:", err);
          setSignalingError("Failed to connect to signaling server.");
        }
      });

    // Redundancy interval: catch users who missed the 'join' event
    const infoInterval = setInterval(sendIdentity, 5000);

    const handleAdminCommand = (action: string) => {
      if (!localStream) return;
      if (action === 'MUTE') {
        localStream.getAudioTracks().forEach(t => t.enabled = false);
        toast({ title: "Muted by Admin", description: "Your microphone was disabled by host." });
      } else if (action === 'UNMUTE') {
        localStream.getAudioTracks().forEach(t => t.enabled = true);
        toast({ title: "Unmuted by Admin", description: "Your microphone was enabled by host." });
      } else if (action === 'STOP_VIDEO') {
        localStream.getVideoTracks().forEach(t => t.enabled = false);
        toast({ title: "Video Stopped", description: "Your camera was disabled by host." });
      } else if (action === 'START_VIDEO') {
        localStream.getVideoTracks().forEach(t => t.enabled = true);
        toast({ title: "Video Started", description: "Your camera was enabled by host." });
      } else if (action === 'KICK') {
        localStream.getTracks().forEach(t => t.stop());
        window.location.href = '/';
      }
    };

    channelRef.current = channel;

    return () => {
      clearInterval(infoInterval);
      channel.send({
        type: 'broadcast',
        event: 'leave',
        payload: { id: myIdRef.current }
      });
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      peersRef.current.forEach(peer => {
        try { peer.close(); } catch (e) {}
      });
      peersRef.current.clear();
    };
  }, [roomId, localStream, hasJoined]); // Added hasJoined to dependencies

  const sendCommand = (targetId: string | 'all', action: string) => {
    if (!isAdmin) return;
    channelRef.current?.send({
      type: 'broadcast',
      event: 'command',
      payload: { targetId, action }
    });
  };

  const updateMediaState = (isMuted: boolean, isVideoOff: boolean) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'participant-info',
      payload: { 
        id: myIdRef.current, 
        name: nameRef.current || 'User', 
        isAdmin: isAdminRef.current,
        isMuted,
        isVideoOff
      }
    });
  };

  return { participants, sendCommand, updateMediaState, myId: myIdRef.current, signalingError };
};
