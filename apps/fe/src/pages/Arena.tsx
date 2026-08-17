import React, { useCallback, useEffect, useRef, useState } from "react";
import { drawProceduralCharacter, generateProceduralDataURL } from "../utils/SpriteGenerator";
import { useAvatar } from "../contexts/AvatarsContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { drawBackground } from "../utils/MapGenerator";
// Removed lucide-react per brutalist rules

// --- Constants ---
const AVATAR_SIZE = 80;
const PARTICLE_COUNT = 100;
const TRAIL_LENGTH = 20;

// --- WebRTC Configuration ---
const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

export const Arena = () => {
  // --- Game Refs & State ---
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();
  const { avatars, fetchAvatars } = useAvatar();
  const { token, isLoading } = useAuth();
  const [loadedImages, setLoadedImages] = useState<
    Map<string, HTMLImageElement>
  >(new Map());
  const animeMaleSpriteRef = useRef<HTMLImageElement | null>(null);
  const animeFemaleSpriteRef = useRef<HTMLImageElement | null>(null);
  const defaultAvatarRef = useRef<HTMLImageElement | null>(null);

  const [currentUser, setCurrentUser] = useState<any>({});
  const [users, setUsers] = useState(new Map<string, any>());
  const [spaceId, setSpaceId] = useState("");
  const spaceVibeRef = useRef("grid");
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const blockedUsersRef = useRef<Set<string>>(new Set());
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<Set<string>>(new Set());
  const [isKicked, setIsKicked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  // --- Chat State ---
  const [globalMessages, setGlobalMessages] = useState<any[]>([]);
  const [privateMessages, setPrivateMessages] = useState<any[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<string | null>(null);
  const [globalMessageInput, setGlobalMessageInput] = useState("");
  const [privateMessageInput, setPrivateMessageInput] = useState("");
  const privateMessagesContainerRef = useRef<HTMLDivElement>(null);
  const globalMessagesContainerRef = useRef<HTMLDivElement>(null);

  // --- WebRTC / Retina State ---
  const [callStatus, setCallStatus] = useState<"idle" | "incoming" | "in-call">(
    "idle",
  );
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [incomingOffer, setIncomingOffer] = useState<any>(null);
  const [userCallStatus, setUserCallStatus] = useState<
    Map<string, string | null>
  >(new Map());

  // Media Controls State
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);

  // Video Swapping State
  const [isVideoSwapped, setIsVideoSwapped] = useState(false);

  // WebRTC Refs
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Animation Refs
  const particles = useRef<Particle[]>([]);
  const movementTrails = useRef<Map<string, any[]>>(new Map());
  const currentUserAnimationRef = useRef<any>({
    isMoving: false,
    startX: 0,
    startY: 0,
    targetX: 0,
    targetY: 0,
    visualX: 0,
    visualY: 0,
  });
  const usersAnimationRef = useRef(new Map<string, any>());
  const MOVE_SPEED = 5; // pixels per frame
  const NETWORK_SYNC_INTERVAL = 50; // ms
  const lastSyncTimeRef = useRef(0);
  const keysPressed = useRef<Set<string>>(new Set());
  
  // Animation state tracking for drawing limbs
  const userAnimState = useRef(new Map<string, { moving: boolean; walkCycle: number; direction: string }>());

  // --- Cleanup ---
  useEffect(() => {
    return () => {
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // --- Firestore: Incoming Call Listener Removed ---

  // --- Video Attachment Logic ---
  useEffect(() => {
    if (callStatus === "in-call") {
      const local = localStream.current;
      const remote = remoteStream.current;
      const mainStream = isVideoSwapped ? local : remote;
      const pipStream = isVideoSwapped ? remote : local;

      if (mainVideoRef.current && mainStream) {
        mainVideoRef.current.srcObject = mainStream;
      }
      if (pipVideoRef.current && pipStream) {
        pipVideoRef.current.srcObject = pipStream;
      }
    }
  }, [callStatus, isVideoSwapped, localStream.current, remoteStream.current]);

  // --- Helper: Start Media ---
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStream.current = stream;
      remoteStream.current = new MediaStream();
      setMicActive(true);
      setVideoActive(true);
      return stream;
    } catch (err) {
      console.error("Error accessing media:", err);
      return null;
    }
  };

  // --- Helper: Setup PC ---
  const setupPeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection(servers);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      remoteStream.current = event.streams[0];
      if (mainVideoRef.current && !isVideoSwapped) {
        mainVideoRef.current.srcObject = remoteStream.current;
      } else if (pipVideoRef.current && isVideoSwapped) {
        pipVideoRef.current.srcObject = remoteStream.current;
      }
    };
    return pc;
  };

  // --- Action: Make Call ---
  const handleCallUser = useCallback(
    async (targetUserId: string) => {
      if (blockedUsersRef.current.has(targetUserId)) return;
      if (callStatus !== "idle") return;
      const stream = await startWebcam();
      if (!stream) return;

      setCallStatus("in-call");
      setRemoteUserId(targetUserId);

      const pc = setupPeerConnection(stream);
      peerConnection.current = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          wsRef.current?.send(
            JSON.stringify({
              type: "webrtc-ice-candidate",
              payload: { candidate: event.candidate.toJSON(), recipient: targetUserId },
            }),
          );
        }
      };

      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);
      
      wsRef.current?.send(
        JSON.stringify({
          type: "webrtc-offer",
          payload: { offer: { sdp: offerDescription.sdp, type: offerDescription.type }, recipient: targetUserId },
        }),
      );
    },
    [currentUser, callStatus],
  );

  // --- Action: Accept Call ---
  const acceptCall = useCallback(async () => {
    if (!incomingOffer || !remoteUserId) return;
    const stream = await startWebcam();
    if (!stream) return;

    setCallStatus("in-call");

    const pc = setupPeerConnection(stream);
    peerConnection.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current?.send(
          JSON.stringify({
            type: "webrtc-ice-candidate",
            payload: { candidate: event.candidate.toJSON(), recipient: remoteUserId },
          }),
        );
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    wsRef.current?.send(
      JSON.stringify({
        type: "webrtc-answer",
        payload: { answer: { type: answerDescription.type, sdp: answerDescription.sdp }, recipient: remoteUserId },
      }),
    );

    wsRef.current?.send(
      JSON.stringify({
        type: "call-started",
        payload: { user1: currentUser.userId, user2: remoteUserId },
      }),
    );
  }, [incomingOffer, remoteUserId, currentUser]);

  const declineCall = useCallback(async () => {
    if (remoteUserId) {
      wsRef.current?.send(
        JSON.stringify({
          type: "webrtc-decline",
          payload: { recipient: remoteUserId },
        }),
      );
    }
    setCallStatus("idle");
    setIncomingOffer(null);
    setRemoteUserId(null);
  }, [remoteUserId]);

  // --- Action: End Call ---
  const handleEndCall = useCallback(async (skipNotify?: any) => {
    const shouldSkipNotify = skipNotify === true;
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (remoteUserId && !shouldSkipNotify) {
      wsRef.current?.send(
        JSON.stringify({
          type: "call-ended",
          payload: { user1: currentUser.userId, user2: remoteUserId },
        }),
      );
    }
    setCallStatus("idle");
    setRemoteUserId(null);
    setIncomingOffer(null);
    setScreenShareActive(false);
    setDownloadLink(null);
    setIsVideoSwapped(false);
  }, [remoteUserId, currentUser]);

  // --- Features ---
  const toggleScreenShare = async () => {
    if (screenShareActive) {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      const videoTrack = cameraStream.getVideoTracks()[0];
      if (peerConnection.current) {
        const sender = peerConnection.current
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(videoTrack);
      }
      localStream.current = cameraStream;
      setScreenShareActive(false);
      setVideoActive(true);
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        const screenTrack = displayStream.getVideoTracks()[0];
        screenTrack.onended = () => toggleScreenShare();
        if (peerConnection.current) {
          const sender = peerConnection.current
            .getSenders()
            .find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(screenTrack);
        }
        localStream.current = displayStream;
        setScreenShareActive(true);
      } catch (err) {
        console.error("Screen share cancelled", err);
      }
    }
  };

  const startRecording = () => {
    if (!localStream.current) return;
    chunksRef.current = [];
    try {
      mediaRecorder.current = new MediaRecorder(localStream.current);
    } catch (e) {
      mediaRecorder.current = new MediaRecorder(localStream.current);
    }
    mediaRecorder.current.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setDownloadLink(url);
    };
    mediaRecorder.current.start(1000);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const toggleMic = () => {
    if (localStream.current) {
      localStream.current
        .getAudioTracks()
        .forEach((track) => (track.enabled = !micActive));
      setMicActive(!micActive);
    }
  };

  const toggleVideo = () => {
    if (localStream.current && !screenShareActive) {
      localStream.current
        .getVideoTracks()
        .forEach((track) => (track.enabled = !videoActive));
      setVideoActive(!videoActive);
    }
  };


  // --- Game Loop & Effects ---
  useEffect(() => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.current.push({
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        size: Math.random() * 3,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5,
      });
    }
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = "/gAvatarV2.png";
    img.onload = () => {
      defaultAvatarRef.current = img;
      setLoadedImages((prev) => new Map(prev).set("default", img));
    };

    const maleImg = new Image();
    maleImg.src = "/anime_male.png";
    maleImg.onload = () => {
      animeMaleSpriteRef.current = maleImg;
      setLoadedImages((prev) => new Map(prev).set("anime_male", maleImg));
    };

    const femaleImg = new Image();
    femaleImg.src = "/anime_female.png";
    femaleImg.onload = () => {
      animeFemaleSpriteRef.current = femaleImg;
      setLoadedImages((prev) => new Map(prev).set("anime_female", femaleImg));
    };
  }, []);

  useEffect(() => {
    const userIds = Array.from(users.values()).map(u => u.userId);
    if (currentUser?.userId) userIds.push(currentUser.userId);
    fetchAvatars(userIds);
  }, [users, currentUser]);

  useEffect(() => {
    const loadImages = async () => {
      const imageMap = new Map<string, HTMLImageElement>();
      const loadPromises: Promise<void>[] = [];
      Array.from(avatars.entries()).forEach(([_userId, url]) => {
        if (!loadedImages.has(url)) {
          const img = new Image();
          img.src = url.startsWith("procedural:") ? generateProceduralDataURL(url) : url;
          loadPromises.push(
            new Promise((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }),
          );
          imageMap.set(url, img);
        }
      });
      await Promise.all(loadPromises);
      setLoadedImages((prev) => new Map([...prev, ...imageMap]));
    };
    loadImages();
  }, [avatars]);

  useEffect(() => {
    if (currentUser.gridX === undefined || currentUser.gridY === undefined)
      return;
    const nearby = Array.from(users.values()).filter((user) => {
      const dx = Math.abs(currentUser.gridX - user.gridX);
      const dy = Math.abs(currentUser.gridY - user.gridY);
      return dx <= 2 && dy <= 2;
    });
    const nearbyUserIds = new Set(nearby.map((u) => u.userId));
    setNearbyUsers(nearbyUserIds);
    if (activeChatUser && !nearbyUserIds.has(activeChatUser)) {
      setActiveChatUser(null);
    }
  }, [currentUser, users, activeChatUser]);

  const toggleBlockUser = (userId: string) => {
    setBlockedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
        if (activeChatUser === userId) {
          setActiveChatUser(null);
        }
      }
      blockedUsersRef.current = newSet;
      return newSet;
    });
  };
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const spaceIdFromUrl = urlParams.get("spaceId") || "";
    setSpaceId(spaceIdFromUrl);
  }, []);



  useEffect(() => {
    if (!token || !spaceId) return;
    const fetchSpaceDetails = async () => {
      try {
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.thumbnail) {
          spaceVibeRef.current = response.data.thumbnail;
        }
      } catch (err) {
        console.error("Error fetching space details:", err);
      }
    };
    fetchSpaceDetails();
  }, [spaceId, token]);

  useEffect(() => {
    if (isLoading || !token || !spaceId) return;

    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8081";
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.onopen = () => {
      wsRef.current!.send(
        JSON.stringify({ type: "join", payload: { spaceId, token } }),
      );
    };
    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessageRef.current(message);
    };
    return () => wsRef.current?.close();
  }, [isLoading, token, spaceId]);

  const handleWebSocketMessage = useCallback(
    async (message: any) => {
      switch (message.type) {
        case "space-joined":
          const initialGridX = message.payload.spawn.x;
          const initialGridY = message.payload.spawn.y;
          setCurrentUser({
            id: message.payload.id,
            userId: message.payload.userId,
            gridX: initialGridX,
            gridY: initialGridY,
          });
          currentUserAnimationRef.current = {
            isMoving: false,
            visualX: initialGridX * 50,
            visualY: initialGridY * 50,
          };
          userAnimState.current.set(message.payload.id, { moving: false, walkCycle: 0, direction: 'down' });
          const userMap = new Map();
          message.payload.users.forEach((user: any) => {
            userMap.set(user.id, {
              id: user.id,
              userId: user.userId,
              gridX: user.x,
              gridY: user.y,
            });
            usersAnimationRef.current.set(user.id, {
              isMoving: false,
              visualX: user.x * 50,
              visualY: user.y * 50,
            });
            userAnimState.current.set(user.id, { moving: false, walkCycle: 0, direction: 'down' });
          });
          setUsers(userMap);
          const ongoingCalls = message.payload.ongoingCalls || [];
          ongoingCalls.forEach(([user1, user2]: [string, string]) => {
            setUserCallStatus((prev) =>
              new Map(prev).set(user1, user2).set(user2, user1),
            );
          });
          break;
        case "user-joined":
          userAnimState.current.set(message.payload.id, { moving: false, walkCycle: 0, direction: 'down' });
          usersAnimationRef.current.set(message.payload.id, {
            isMoving: false,
            visualX: message.payload.x * 50,
            visualY: message.payload.y * 50,
          });
          setUsers((prev) => {
            const newUsers = new Map(prev);
            newUsers.set(message.payload.id, {
              id: message.payload.id,
              userId: message.payload.userId,
              gridX: message.payload.x,
              gridY: message.payload.y,
            });
            return newUsers;
          });
          setGlobalMessages((prev) => [
            ...prev,
            {
              userId: "SYSTEM",
              message: `${message.payload.userId} joined!`,
              timestamp: Date.now(),
            },
          ]);
          break;
        case "chat-message":
          if (!message.payload.isGlobal) {
            if (blockedUsersRef.current.has(message.payload.userId)) return;

            setPrivateMessages((prev) => [
              ...prev,
              {
                userId: message.payload.userId,
                message: message.payload.message,
                recipient: currentUser.userId,
              },
            ]);
            if (!activeChatUser || activeChatUser !== message.payload.userId) {
              setActiveChatUser(message.payload.userId);
            }
          } else {
            if (blockedUsersRef.current.has(message.payload.userId)) return;

            setGlobalMessages((prev) => [
              ...prev,
              {
                userId: message.payload.userId,
                message: message.payload.message,
                timestamp: Date.now(),
              },
            ]);
          }
          break;
        case "chat-warning":
          setGlobalMessages((prev) => [
            ...prev,
            {
              userId: "SYSTEM",
              message: message.payload.message,
              timestamp: Date.now(),
            },
          ]);
          break;
        case "movement":
          const { id, x, y } = message.payload;
          if (id === currentUser.id) {
            setCurrentUser((prev: any) => ({ ...prev, gridX: x, gridY: y }));
          } else {
            setUsers((prev) => {
              const newUsers = new Map(prev);
              const user = newUsers.get(id);
              if (user) {
                const animation = usersAnimationRef.current.get(id) || {};
                newUsers.set(id, { ...user, gridX: x, gridY: y });
                // We use simple linear interpolation for other users
                animation.isMoving = true;
                animation.targetX = x * 50;
                animation.targetY = y * 50;
                usersAnimationRef.current.set(id, animation);
              }
              return newUsers;
            });
          }
          break;
        case "user-left":
          setUsers((prev) => {
            const newUsers = new Map(prev);
            newUsers.delete(message.payload.id);
            return newUsers;
          });
          if (message.payload.userId === remoteUserId) {
            handleEndCall(true);
          }
          break;
        case "call-started":
          setUserCallStatus((prev) =>
            new Map(prev)
              .set(message.payload.user1, message.payload.user2)
              .set(message.payload.user2, message.payload.user1),
          );
          break;
        case "call-ended":
          setUserCallStatus((prev) => {
            const newMap = new Map(prev);
            newMap.set(message.payload.user1, null);
            newMap.set(message.payload.user2, null);
            return newMap;
          });
          if (
            (message.payload.user1 === currentUser?.userId ||
             message.payload.user2 === currentUser?.userId) &&
             remoteUserId !== null
          ) {
            handleEndCall(true);
          }
          break;
        case "webrtc-offer":
          if (blockedUsersRef.current.has(message.payload.sender)) return;
          if (callStatus === "idle") {
            setIncomingOffer(message.payload.offer);
            setRemoteUserId(message.payload.sender);
            setCallStatus("incoming");
          } else {
            wsRef.current?.send(
              JSON.stringify({
                type: "webrtc-decline",
                payload: { recipient: message.payload.sender },
              }),
            );
          }
          break;
        case "webrtc-answer":
          if (peerConnection.current && !peerConnection.current.currentRemoteDescription) {
            peerConnection.current.setRemoteDescription(new RTCSessionDescription(message.payload.answer));
            wsRef.current?.send(
              JSON.stringify({
                type: "call-started",
                payload: { user1: currentUser.userId, user2: remoteUserId },
              }),
            );
          }
          break;
        case "webrtc-ice-candidate":
          if (peerConnection.current) {
            peerConnection.current.addIceCandidate(new RTCIceCandidate(message.payload.candidate)).catch(e => console.error("Error adding ice candidate", e));
          }
          break;
        case "webrtc-decline":
          handleEndCall(true);
          break;
        case "movement-rejected":
          setCurrentUser((prev: any) => ({
            ...prev,
            gridX: message.payload.x,
            gridY: message.payload.y,
          }));
          currentUserAnimationRef.current.targetX = message.payload.x * 50;
          currentUserAnimationRef.current.targetY = message.payload.y * 50;
          break;
        case "kicked":
          setIsKicked(true);
          setGlobalMessages((prev) => [
            ...prev,
            {
              userId: "SYSTEM",
              message: `You have been kicked: ${message.payload.reason}`,
              timestamp: Date.now(),
            },
          ]);
          break;
      }
    },
    [currentUser, remoteUserId, handleEndCall],
  );

  const handleWebSocketMessageRef = useRef(handleWebSocketMessage);
  useEffect(() => {
    handleWebSocketMessageRef.current = handleWebSocketMessage;
  }, [handleWebSocketMessage]);




  const sendPrivateMessage = (recipient: string, message: string) => {
    if (!message.trim() || !wsRef.current) return;
    setPrivateMessages((prev) => [
      ...prev,
      { userId: currentUser.userId, message, recipient },
    ]);
    wsRef.current.send(
      JSON.stringify({
        type: "chat-message",
        payload: { message, recipient, isGlobal: false },
      }),
    );
  };

  const sendGlobalMessage = (message: string) => {
    if (!message.trim() || !wsRef.current) return;
    wsRef.current.send(
      JSON.stringify({
        type: "chat-message",
        payload: { message, isGlobal: true },
      }),
    );
  };

  // --- Auto Focus for Controls ---
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  const handleCanvasHover = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let hovered = null;
    users.forEach((user, id) => {
      const visualX = user.gridX * 50;
      const visualY = user.gridY * 50;
      const dist = Math.sqrt(
        Math.pow(mouseX - visualX, 2) + Math.pow(mouseY - visualY, 2),
      );
      if (dist < 50 / 2) {
        hovered = id;
      }
    });
    setHoveredUser(hovered);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    keysPressed.current.add(e.key.toLowerCase());
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    keysPressed.current.delete(e.key.toLowerCase());
  };

  // --- Canvas Render ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationFrameId: number;

      const render = () => {
      const currentTime = Date.now();

      // Update Current User Position locally via keys
      let { visualX: currentVisualX = 0, visualY: currentVisualY = 0 } = currentUserAnimationRef.current || {};
      
      let dx = 0;
      let dy = 0;
      if (keysPressed.current.has("arrowup") || keysPressed.current.has("w")) dy -= MOVE_SPEED;
      if (keysPressed.current.has("arrowdown") || keysPressed.current.has("s")) dy += MOVE_SPEED;
      if (keysPressed.current.has("arrowleft") || keysPressed.current.has("a")) dx -= MOVE_SPEED;
      if (keysPressed.current.has("arrowright") || keysPressed.current.has("d")) dx += MOVE_SPEED;

      // Normalize diagonal speed
      if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx = (dx / length) * MOVE_SPEED;
        dy = (dy / length) * MOVE_SPEED;
      }

      const isLocalMoving = dx !== 0 || dy !== 0;
      let animState = userAnimState.current.get(currentUser.id) || { moving: false, walkCycle: 0, direction: 'down' };
      
      if (isLocalMoving) {
        currentVisualX += dx;
        currentVisualY += dy;
        // Restrict to canvas bounds
        currentVisualX = Math.max(AVATAR_SIZE/2, Math.min(canvas.width - AVATAR_SIZE/2, currentVisualX));
        currentVisualY = Math.max(AVATAR_SIZE/2, Math.min(canvas.height - AVATAR_SIZE/2, currentVisualY));
        
        currentUserAnimationRef.current.visualX = currentVisualX;
        currentUserAnimationRef.current.visualY = currentVisualY;
        
        animState.moving = true;
        animState.walkCycle += 0.15; // Speed of walking animation
        if (Math.abs(dx) > Math.abs(dy)) {
           animState.direction = dx > 0 ? 'right' : 'left';
        } else {
           animState.direction = dy > 0 ? 'down' : 'up';
        }

        // Sync with network periodically
        if (currentTime - lastSyncTimeRef.current > NETWORK_SYNC_INTERVAL) {
           wsRef.current?.send(JSON.stringify({
              type: "move",
              payload: { x: currentVisualX / 50, y: currentVisualY / 50, userId: currentUser.userId }
           }));
           lastSyncTimeRef.current = currentTime;
        }
      } else {
        animState.moving = false;
        animState.walkCycle = 0;
      }
      userAnimState.current.set(currentUser.id, animState);

      // Interpolate Other Users
      const usersVisual = new Map<string, { visualX: number; visualY: number }>();
      users.forEach((user, userId) => {
        const animation = usersAnimationRef.current.get(userId) || { visualX: user.gridX * 50, visualY: user.gridY * 50 };
        let { visualX, visualY } = animation;
        let otherAnimState = userAnimState.current.get(userId) || { moving: false, walkCycle: 0, direction: 'down' };

        if (animation.targetX !== undefined && animation.targetY !== undefined) {
          const tdx = animation.targetX - visualX;
          const tdy = animation.targetY - visualY;
          const dist = Math.sqrt(tdx * tdx + tdy * tdy);
          
          if (dist > 1) {
            visualX += tdx * 0.2; // Interpolation factor
            visualY += tdy * 0.2;
            otherAnimState.moving = true;
            otherAnimState.walkCycle += 0.15;
            if (Math.abs(tdx) > Math.abs(tdy)) {
               otherAnimState.direction = tdx > 0 ? 'right' : 'left';
            } else {
               otherAnimState.direction = tdy > 0 ? 'down' : 'up';
            }
          } else {
            visualX = animation.targetX;
            visualY = animation.targetY;
            otherAnimState.moving = false;
            otherAnimState.walkCycle = 0;
          }
        }
        
        animation.visualX = visualX;
        animation.visualY = visualY;
        usersAnimationRef.current.set(userId, animation);
        userAnimState.current.set(userId, otherAnimState);
        usersVisual.set(userId, { visualX, visualY });
      });

      // Draw Background
      drawBackground(ctx, canvas.width, canvas.height, spaceVibeRef.current, currentTime);

      // Draw Main User
      if (currentUser.gridX !== undefined) {
        const avatarStr = avatars.get(currentUser.userId);
        const image = avatarStr && !avatarStr.startsWith("procedural:")
          ? loadedImages.get(avatarStr)
          : defaultAvatarRef.current;
        
        const myState = userAnimState.current.get(currentUser.id) || { moving: false, walkCycle: 0, direction: 'down' };

        if (avatarStr && avatarStr.startsWith("procedural:")) {
          drawProceduralCharacter(ctx, currentVisualX, currentVisualY, avatarStr, AVATAR_SIZE, myState.walkCycle, myState.direction);
        } else {
          // Fallback to DiceBear images if still used
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          const hologramGradient = ctx.createRadialGradient(currentVisualX, currentVisualY, 0, currentVisualX, currentVisualY, AVATAR_SIZE * 1.5);
          hologramGradient.addColorStop(0, "hsla(210, 100%, 50%, 0.4)");
          hologramGradient.addColorStop(1, "hsla(180, 100%, 50%, 0)");
          ctx.fillStyle = hologramGradient;
          ctx.beginPath();
          ctx.arc(currentVisualX, currentVisualY, AVATAR_SIZE + 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";

          ctx.beginPath();
          ctx.arc(currentVisualX, currentVisualY, AVATAR_SIZE / 2, 0, Math.PI * 2);
          ctx.clip();
          if (image) ctx.drawImage(image, currentVisualX - AVATAR_SIZE / 2, currentVisualY - AVATAR_SIZE / 2, AVATAR_SIZE, AVATAR_SIZE);
          ctx.restore();
        }

        ctx.fillStyle = "#fff";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("You", currentVisualX, currentVisualY + 50);
      }

      // Draw Other Users
      usersVisual.forEach((visual, id) => {
        const user = users.get(id);
        if (!user) return;
        const username = user.userId;
        const avatarStr = avatars.get(username);
        const image = avatarStr && !avatarStr.startsWith("procedural:")
          ? loadedImages.get(avatarStr)
          : defaultAvatarRef.current;
        
        if (usersAnimationRef.current.get(id)?.isMoving) {
          const trail = movementTrails.current.get(id) || [];
          trail.push({ x: visual.visualX, y: visual.visualY, opacity: 1 });
          if (trail.length > TRAIL_LENGTH) trail.shift();
          movementTrails.current.set(id, trail);
          ctx.globalCompositeOperation = "screen";
          trail.forEach((pos) => {
            ctx.fillStyle = `rgba(100, 200, 255, ${pos.opacity})`;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
            ctx.fill();
            pos.opacity -= 0.05;
          });
          ctx.globalCompositeOperation = "source-over";
        }

        const otherState = userAnimState.current.get(id) || { moving: false, walkCycle: 0, direction: 'down' };

        if (avatarStr && avatarStr.startsWith("procedural:")) {
          drawProceduralCharacter(ctx, visual.visualX, visual.visualY, avatarStr, AVATAR_SIZE, otherState.walkCycle, otherState.direction);
        } else {
          ctx.save();
          ctx.beginPath();
          ctx.arc(visual.visualX, visual.visualY, AVATAR_SIZE / 2, 0, Math.PI * 2);
          ctx.clip();
          if (image) ctx.drawImage(image, visual.visualX - AVATAR_SIZE / 2, visual.visualY - AVATAR_SIZE / 2, AVATAR_SIZE, AVATAR_SIZE);
          ctx.restore();
        }
        if (hoveredUser === id) {
          ctx.strokeStyle = "#00ffd5";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(
            visual.visualX,
            visual.visualY,
            AVATAR_SIZE / 2 + 5,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
        }
        ctx.fillStyle = hoveredUser === id ? "#00ffd5" : "#a0e5ff";
        ctx.font = '14px "Poppins", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(
          username,
          visual.visualX,
          visual.visualY + AVATAR_SIZE / 2 + 25,
        );
      });

      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const scrollLeft = currentVisualX - container.clientWidth / 2;
        const scrollTop = currentVisualY - container.clientHeight / 2;
        container.scrollLeft = scrollLeft;
        container.scrollTop = scrollTop;
      }
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentUser, users, loadedImages, avatars, hoveredUser]);

  useEffect(() => {
    if (globalMessagesContainerRef.current)
      globalMessagesContainerRef.current.scrollTop =
        globalMessagesContainerRef.current.scrollHeight;
    if (privateMessagesContainerRef.current)
      privateMessagesContainerRef.current.scrollTop =
        privateMessagesContainerRef.current.scrollHeight;
  }, [globalMessages, privateMessages, activeChatUser]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-[#FDFBF7] text-black overflow-hidden outline-none flex flex-col font-sans"
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      tabIndex={0}
      autoFocus
      data-lenis-prevent
    >
      <div className="relative w-full h-full flex flex-col z-10 p-4 gap-4">
        {/* Flat Header */}
        <div className="flex justify-between items-center bg-[#FFD700] border-[6px] border-black p-4 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-4xl font-black text-black uppercase tracking-tighter">
            Pixel Arena
          </h1>
          <div className="flex gap-4 items-center">
            <div className="bg-white px-4 py-2 border-[4px] border-black text-sm font-black uppercase text-black">
              SPACE: {spaceId}
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden relative">
          {/* LEFT PANEL: Chat */}
          <div className="w-80 flex flex-col gap-4 z-10">
            <div className="bg-[#1E90FF] border-[6px] border-black rounded-none p-4 flex-1 flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-black text-white mb-4 text-xl tracking-tighter uppercase border-b-[4px] border-black pb-2">Global Chat</h3>
              <div
                ref={globalMessagesContainerRef}
                className="flex-1 overflow-y-auto mb-4 space-y-2 pr-2"
              >
                {globalMessages
                  .filter((m) => !blockedUsers.has(m.userId))
                  .map((msg, i) => (
                    <div key={i} className="text-sm bg-white p-3 border-[4px] border-black break-words rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <span className="font-black text-black uppercase">
                        {msg.userId}:
                      </span>{" "}
                      <span className="text-black font-medium">{msg.message}</span>
                    </div>
                  ))}
              </div>
              <input
                value={globalMessageInput}
                onChange={(e) => setGlobalMessageInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  (sendGlobalMessage(globalMessageInput),
                  setGlobalMessageInput(""))
                }
                className="w-full bg-[#FDFBF7] border-[4px] border-black p-4 text-xl font-black text-black focus:outline-none placeholder-gray-500 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                placeholder="TYPE A MESSAGE..."
                disabled={isKicked}
              />
            </div>

            {activeChatUser && (
              <div className="bg-[#FF00FF] border-[6px] border-black rounded-none p-4 h-64 flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between mb-2 border-b-[4px] border-black pb-2">
                  <h3 className="font-black text-white text-xl tracking-tighter uppercase">
                    DM: {activeChatUser}
                  </h3>
                  <button onClick={() => setActiveChatUser(null)} className="font-black text-white text-2xl hover:text-black">✕</button>
                </div>
                <div
                  ref={privateMessagesContainerRef}
                  className="flex-1 overflow-y-auto mb-2 space-y-2 pr-2"
                >
                  {privateMessages
                    .filter((msg) => msg.userId === activeChatUser || msg.recipient === activeChatUser)
                    .map((msg, i) => (
                    <div
                      key={i}
                      className={`text-sm p-3 border-[4px] border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${msg.userId === currentUser.userId ? "bg-[#FFD700] text-black text-right" : "bg-white text-black"}`}
                    >
                      <span className="font-black uppercase text-xs block mb-1">
                        {msg.userId === currentUser.userId ? "You" : msg.userId}:
                      </span>
                      <span className="font-bold">{msg.message}</span>
                    </div>
                  ))}
                </div>
                <input
                  value={privateMessageInput}
                  onChange={(e) => setPrivateMessageInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (sendPrivateMessage(activeChatUser, privateMessageInput),
                    setPrivateMessageInput(""))
                  }
                  className="w-full bg-[#FDFBF7] border-[4px] border-black p-3 text-lg font-black text-black focus:outline-none placeholder-gray-500 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  placeholder="MESSAGE..."
                />
              </div>
            )}
          </div>

          {/* MIDDLE: Canvas Game */}
          <div className="flex-1 relative border-[6px] border-black bg-white rounded-none overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-0">
            <div
              ref={scrollContainerRef}
              className="w-full h-full overflow-auto cursor-crosshair bg-[#f0f0f0]"
              onMouseMove={handleCanvasHover}
            >
              <canvas ref={canvasRef} width={2000} height={2000} className="bg-transparent" />
            </div>

            {/* In-Call Overlay */}
            {callStatus === "in-call" && (
              <div
                className={`absolute z-50 flex flex-col gap-3 bg-white border-4 border-black rounded-none p-4
                  ${
                    isExpanded
                      ? "top-0 left-0 w-full h-full" 
                      : "bottom-6 right-6 w-[480px]"
                  }
                `}
              >
                {/* Main Video Area */}
                <div
                  className={`relative overflow-hidden group bg-gray-200 border-2 border-black rounded-none ${
                    isExpanded ? "flex-1 w-full" : "aspect-video"
                  }`}
                >
                  <video
                    ref={mainVideoRef}
                    autoPlay
                    playsInline
                    muted={isVideoSwapped}
                    className={`w-full h-full ${
                      isExpanded ? "object-contain" : "object-cover"
                    } ${isVideoSwapped ? "scale-x-[-1]" : ""}`}
                  />

                  {/* Label */}
                  <div className="absolute top-2 left-2 bg-white border-2 border-black px-2 py-1 text-sm font-black uppercase text-black rounded-none">
                    {isVideoSwapped ? "YOU" : remoteUserId}
                  </div>

                  {/* PIP Video Area */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsVideoSwapped(!isVideoSwapped);
                    }}
                    className={`absolute cursor-pointer bg-white border-2 border-black rounded-none overflow-hidden z-10
                      ${
                        isExpanded
                          ? "bottom-4 right-4 w-64 aspect-video"
                          : "top-4 right-4 w-32 aspect-video"
                      }
                    `}
                  >
                    <video
                      ref={pipVideoRef}
                      autoPlay
                      playsInline
                      muted={!isVideoSwapped}
                      className={`w-full h-full object-cover ${
                        !isVideoSwapped && !screenShareActive
                          ? "scale-x-[-1]"
                          : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Controls Bar */}
                <div
                  className={`flex flex-wrap justify-center gap-2 ${isExpanded ? "py-2" : ""}`}
                >
                  <button
                    onClick={toggleMic}
                    className={`px-3 py-2 font-black uppercase border-2 border-black rounded-none text-xs ${
                      micActive
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {micActive ? "[MIC ON]" : "[MIC OFF]"}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className={`px-3 py-2 font-black uppercase border-2 border-black rounded-none text-xs ${
                      videoActive
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {videoActive ? "[CAM ON]" : "[CAM OFF]"}
                  </button>
                  <button
                    onClick={toggleScreenShare}
                    className={`px-3 py-2 font-black uppercase border-2 border-black rounded-none text-xs ${
                      screenShareActive
                        ? "bg-green-500 text-black"
                        : "bg-white text-black hover:bg-gray-200"
                    }`}
                  >
                    {screenShareActive ? "[STOP SHARE]" : "[SHARE SCR]"}
                  </button>

                  <button
                    onClick={() => setIsVideoSwapped(!isVideoSwapped)}
                    className="px-3 py-2 font-black uppercase border-2 border-black rounded-none text-xs bg-white text-black hover:bg-gray-200"
                  >
                    [SWAP]
                  </button>

                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-3 py-2 font-black uppercase border-2 border-black rounded-none text-xs ${
                      isRecording
                        ? "bg-red-600 text-white"
                        : "bg-white text-black hover:bg-gray-200"
                    }`}
                  >
                    {isRecording ? "[STOP REC]" : "[RECORD]"}
                  </button>

                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-3 py-2 font-black uppercase border-2 border-black rounded-none text-xs bg-white text-black hover:bg-gray-200"
                  >
                    {isExpanded ? "[MIN]" : "[MAX]"}
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="px-3 py-2 font-black uppercase border-2 border-black rounded-none text-xs bg-red-600 text-white hover:bg-red-700"
                  >
                    [END CALL]
                  </button>
                </div>
              </div>
            )}

            {/* Recording Download Popup */}
            {downloadLink && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border-4 border-black p-4 rounded-none flex items-center gap-4 z-50">
                <div className="bg-green-200 border-2 border-black font-black p-2 rounded-none text-xs">
                  [SAVED]
                </div>
                <div>
                  <p className="text-sm font-black uppercase">Recording Saved</p>
                  <a
                    href={downloadLink}
                    download="recording.webm"
                    className="text-xs text-blue-700 font-bold hover:underline uppercase"
                  >
                    Download File
                  </a>
                </div>
                <button
                  onClick={() => setDownloadLink(null)}
                  className="font-black text-black ml-4 hover:bg-gray-200 p-1 border-2 border-transparent hover:border-black rounded-none"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Incoming Call Modal */}
            {callStatus === "incoming" && (
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white border-4 border-black p-6 rounded-none z-50">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-600 border-2 border-black mx-auto flex items-center justify-center mb-4 text-white font-black text-sm">
                    [CALL]
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest text-black">Incoming Call</h3>
                  <p className="text-black font-bold text-sm uppercase">FROM: {remoteUserId}</p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={acceptCall}
                    className="flex-1 bg-green-500 hover:bg-green-600 border-2 border-black py-3 px-6 rounded-none font-black text-black uppercase"
                  >
                    [ACCEPT]
                  </button>
                  <button
                    onClick={declineCall}
                    className="flex-1 bg-red-600 hover:bg-red-700 border-2 border-black py-3 px-6 rounded-none font-black text-white uppercase"
                  >
                    [DECLINE]
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Nearby Users */}
          <div className="w-72 bg-[#FF4500] border-[6px] border-black rounded-none p-4 flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10">
            <h3 className="font-black text-white mb-4 text-xl tracking-tighter uppercase flex items-center gap-2 border-b-[4px] border-black pb-2">
              <span className="w-4 h-4 bg-[#32CD32] border-[4px] border-black inline-block"></span>
              Nearby Players
            </h3>
            {nearbyUsers.size === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-white border-[4px] border-black mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-12 h-12 border-[4px] border-black rounded-none mb-2 bg-[#FFD700] flex items-center justify-center font-black text-2xl">?</div>
                <p className="text-xl font-black uppercase text-black tracking-tighter">NOBODY HERE</p>
              </div>
            )}

            <div className="space-y-4 overflow-y-auto mt-2">
              {Array.from(nearbyUsers).map((userId) => (
                <div
                  key={userId}
                  className="bg-white border-[4px] border-black p-3 rounded-none flex flex-col gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex justify-between items-center border-b-[4px] border-black pb-2">
                    <span className="font-black text-black text-lg uppercase truncate">{userId}</span>
                    {userCallStatus.get(userId) && (
                      <span className="text-xs uppercase font-black bg-[#FFD700] text-black px-2 py-1 border-[4px] border-black">
                        BUSY
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Call Button */}
                    <button
                      onClick={() => handleCallUser(userId)}
                      disabled={
                        callStatus !== "idle" || !!userCallStatus.get(userId)
                      }
                      className={`w-full py-2 rounded-none text-sm font-black uppercase border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                        callStatus !== "idle"
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-[#32CD32] text-black hover:bg-black hover:text-white"
                      }`}
                    >
                      [CALL]
                    </button>

                    <div className="flex gap-2">
                      {/* Chat Button */}
                      <button
                        onClick={() => setActiveChatUser(userId)}
                        className="flex-1 bg-[#1E90FF] hover:bg-black hover:text-white text-black border-[4px] border-black px-2 py-2 rounded-none text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      >
                        [MSG]
                      </button>

                      {/* Block Button */}
                      <button
                        onClick={() => toggleBlockUser(userId)}
                        className={`flex-1 px-2 py-2 rounded-none text-sm font-black uppercase border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${blockedUsers.has(userId) ? "bg-black text-white" : "bg-white text-black hover:bg-[#FF4500]"}`}
                      >
                        [BLK]
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
