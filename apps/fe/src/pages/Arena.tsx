import React, { useCallback, useEffect, useRef, useState } from "react";
import { drawProceduralCharacter } from "../utils/SpriteGenerator";
import { useAvatar } from "../contexts/AvatarsContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  MonitorUp,
  MonitorOff,
  Circle,
  Square,
  Download,
  ArrowLeftRight,
  Maximize2,
  Minimize2,
} from "lucide-react";

// --- Constants ---
const GRID_SIZE = 50;
const AVATAR_SIZE = 80;
const PARTICLE_COUNT = 100;
const TRAIL_LENGTH = 20;

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
  const [incomingCallDocId, setIncomingCallDocId] = useState<string | null>(
    null,
  );
  const [currentCallDocId, setCurrentCallDocId] = useState<string | null>(null);
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

  // --- Firestore: Incoming Call Listener ---
  useEffect(() => {
    if (!currentUser?.userId) return;

    const q = query(
      collection(db, "calls"),
      where("receiverId", "==", currentUser.userId),
      where("status", "==", "offering"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();

          if (blockedUsersRef.current.has(data.callerId)) {
            console.log(`Blocked incoming call from ${data.callerId}`);

            deleteDoc(change.doc.ref).catch((err) =>
              console.error("Error auto-rejecting blocked call", err),
            );
            return;
          }

          if (callStatus === "idle") {
            setIncomingCallDocId(change.doc.id);
            setRemoteUserId(data.callerId);
            setCallStatus("incoming");
          }
        }
      });
    });
    return () => unsubscribe();
  }, [currentUser?.userId, callStatus]);

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
      event.streams[0].getTracks().forEach((track) => {
        if (remoteStream.current) {
          remoteStream.current.addTrack(track);
        }
      });
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

      const callDoc = doc(collection(db, "calls"));
      const offerCandidates = collection(callDoc, "offerCandidates");
      const answerCandidates = collection(callDoc, "answerCandidates");

      setCurrentCallDocId(callDoc.id);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(offerCandidates, event.candidate.toJSON());
        }
      };

      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);
      const offer = { sdp: offerDescription.sdp, type: offerDescription.type };

      await setDoc(callDoc, {
        callerId: currentUser.userId,
        receiverId: targetUserId,
        offer,
        status: "offering",
      });

      onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (!pc.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          pc.setRemoteDescription(answerDescription);
          wsRef.current?.send(
            JSON.stringify({
              type: "call-started",
              payload: { user1: currentUser.userId, user2: targetUserId },
            }),
          );
        }
      });

      onSnapshot(answerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.addIceCandidate(candidate);
          }
        });
      });
    },
    [currentUser],
  );

  // --- Action: Accept Call ---
  const acceptCall = useCallback(async () => {
    if (!incomingCallDocId) return;
    const stream = await startWebcam();
    if (!stream) return;

    setCallStatus("in-call");
    setCurrentCallDocId(incomingCallDocId);

    const pc = setupPeerConnection(stream);
    peerConnection.current = pc;

    const callDoc = doc(db, "calls", incomingCallDocId);
    const answerCandidates = collection(callDoc, "answerCandidates");
    const offerCandidates = collection(callDoc, "offerCandidates");

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(answerCandidates, event.candidate.toJSON());
      }
    };

    const callSnapshot = await getDoc(callDoc);
    const callData = callSnapshot.data();
    if (!callData) return;

    await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
    await updateDoc(callDoc, { answer, status: "answered" });

    onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });

    wsRef.current?.send(
      JSON.stringify({
        type: "call-started",
        payload: { user1: currentUser.userId, user2: callData.callerId },
      }),
    );
  }, [incomingCallDocId, currentUser]);

  const declineCall = useCallback(async () => {
    if (incomingCallDocId) {
      await deleteDoc(doc(db, "calls", incomingCallDocId));
    }
    setCallStatus("idle");
    setIncomingCallDocId(null);
    setRemoteUserId(null);
  }, [incomingCallDocId]);

  // --- Action: End Call ---
  const handleEndCall = useCallback(async () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    if (remoteUserId) {
      wsRef.current?.send(
        JSON.stringify({
          type: "call-ended",
          payload: { user1: currentUser.userId, user2: remoteUserId },
        }),
      );
    }
    if (currentCallDocId) {
      try {
        await deleteDoc(doc(db, "calls", currentCallDocId));
      } catch (e) {}
    }
    setCallStatus("idle");
    setRemoteUserId(null);
    setCurrentCallDocId(null);
    setIncomingCallDocId(null);
    setScreenShareActive(false);
    setDownloadLink(null);
    setIsVideoSwapped(false);
  }, [currentCallDocId, remoteUserId, currentUser]);

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

  const handleExitSpace = () => {
    if (wsRef.current) wsRef.current.close();
    navigate("/");
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
          img.src = url;
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

  const handleWebSocketMessageRef = useRef(handleWebSocketMessage);
  useEffect(() => {
    handleWebSocketMessageRef.current = handleWebSocketMessage;
  }, [handleWebSocketMessage]);

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
            handleEndCall();
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

      // Draw
      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height,
      );
      gradient.addColorStop(0, "#0a192f");
      gradient.addColorStop(1, "#172a45");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      particles.current.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        if (
          particle.x < 0 ||
          particle.x > canvas.width ||
          particle.y < 0 ||
          particle.y > canvas.height
        ) {
          particle.x = Math.random() * canvas.width;
          particle.y = Math.random() * canvas.height;
        }
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.strokeStyle = `hsla(210, 60%, 50%, ${0.2 + Math.sin(Date.now() / 1000) * 0.1})`;
      ctx.lineWidth = 1;
      for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

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
      className="h-screen w-screen bg-[#0a0a0f] text-white overflow-hidden outline-none flex flex-col font-sans"
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      tabIndex={0}
      autoFocus
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#0a0a0f] to-[#05050a] pointer-events-none -z-10" />
      <div className="relative w-full h-full flex flex-col z-10 p-4 gap-4">
        {/* Floating Header */}
        <div className="flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 tracking-tight">
            Pixel Arena
          </h1>
          <div className="flex gap-4 items-center">
            <div className="bg-black/40 px-5 py-2 rounded-xl text-sm font-medium tracking-wide text-cyan-100 border border-white/5">
              <span className="opacity-50 mr-2">SPACE</span> {spaceId}
            </div>
            <button
              onClick={handleExitSpace}
              className="px-6 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all duration-300 font-semibold"
            >
              Disconnect
            </button>
          </div>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden relative">
          {/* LEFT PANEL: Chat */}
          <div className="w-80 flex flex-col gap-4">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex-1 flex flex-col shadow-2xl">
              <h3 className="font-bold text-white/70 mb-4 text-sm tracking-widest uppercase">Global Chat</h3>
              <div
                ref={globalMessagesContainerRef}
                className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 scrollbar-hide"
              >
                {globalMessages
                  .filter((m) => !blockedUsers.has(m.userId))
                  .map((msg, i) => (
                    <div key={i} className="text-sm bg-black/20 p-3 rounded-xl border border-white/5 break-words">
                      <span
                        className={
                          msg.userId === "SYSTEM"
                            ? "text-yellow-400 font-bold"
                            : "text-cyan-400 font-bold"
                        }
                      >
                        {msg.userId}:
                      </span>{" "}
                      <span className="text-gray-300 leading-relaxed">{msg.message}</span>
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
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors text-white placeholder-white/30"
                placeholder="Type a message..."
                disabled={isKicked}
              />
            </div>

            {activeChatUser && (
              <div className="bg-gray-800 rounded-xl p-4 shadow-lg h-64 flex flex-col">
                <div className="flex justify-between mb-2">
                  <h3 className="font-bold text-purple-400">
                    DM: {activeChatUser}
                  </h3>
                  <button onClick={() => setActiveChatUser(null)}>✕</button>
                </div>
                <div
                  ref={privateMessagesContainerRef}
                  className="flex-1 overflow-y-auto mb-2 space-y-2 pr-2"
                >
                  {privateMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`text-sm p-2 rounded ${msg.userId === currentUser.userId ? "bg-purple-900/30 text-right" : "bg-gray-700/50"}`}
                    >
                      {msg.message}
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
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm"
                  placeholder="Message..."
                />
              </div>
            )}
          </div>

          {/* MIDDLE: Canvas Game */}
          <div className="flex-1 relative border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-black/50 backdrop-blur-sm">
            <div
              ref={scrollContainerRef}
              className="w-full h-full overflow-auto scrollbar-hide cursor-crosshair"
              onMouseMove={handleCanvasHover}
            >
              <canvas ref={canvasRef} width={2000} height={2000} />
            </div>

            {/* In-Call Overlay */}
            {callStatus === "in-call" && (
              <div
                className={`absolute transition-all duration-300 ease-in-out z-50 flex flex-col gap-3 shadow-2xl
                  ${
                    isExpanded
                      ? "top-0 left-0 w-full h-full bg-gray-900 p-4 rounded-none" // Expanded Styles
                      : "bottom-6 right-6 w-[480px] bg-slate-900/95 border border-slate-700 rounded-2xl p-4" // Minimized Styles
                  }
                `}
              >
                {/* Main Video Area */}
                <div
                  className={`relative overflow-hidden group bg-black rounded-xl ${
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
                  <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                    {isVideoSwapped ? "You" : remoteUserId}
                  </div>

                  {/* PIP Video Area (Draggable conceptually, but absolute for now) */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsVideoSwapped(!isVideoSwapped);
                    }}
                    className={`absolute cursor-pointer hover:border-indigo-500 transition-all bg-slate-800 rounded-lg overflow-hidden border border-slate-600 shadow-xl z-10
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
                  className={`flex justify-center gap-2 ${isExpanded ? "py-2" : ""}`}
                >
                  <button
                    onClick={toggleMic}
                    className={`p-3 rounded-full transition ${
                      micActive
                        ? "bg-slate-700 hover:bg-slate-600"
                        : "bg-red-500/20 text-red-500"
                    }`}
                    title="Toggle Mic"
                  >
                    {micActive ? <Mic size={20} /> : <MicOff size={20} />}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full transition ${
                      videoActive
                        ? "bg-slate-700 hover:bg-slate-600"
                        : "bg-red-500/20 text-red-500"
                    }`}
                    title="Toggle Camera"
                  >
                    {videoActive ? <Video size={20} /> : <VideoOff size={20} />}
                  </button>
                  <button
                    onClick={toggleScreenShare}
                    className={`p-3 rounded-full transition ${
                      screenShareActive
                        ? "bg-green-500/20 text-green-500"
                        : "bg-slate-700 hover:bg-slate-600"
                    }`}
                    title="Share Screen"
                  >
                    {screenShareActive ? (
                      <MonitorOff size={20} />
                    ) : (
                      <MonitorUp size={20} />
                    )}
                  </button>

                  {/* Video Swap Button */}
                  <button
                    onClick={() => setIsVideoSwapped(!isVideoSwapped)}
                    className="p-3 rounded-full bg-slate-700 hover:bg-slate-600"
                    title="Swap Views"
                  >
                    <ArrowLeftRight size={20} />
                  </button>

                  {/* Recording Button */}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-3 rounded-full transition ${
                      isRecording
                        ? "bg-red-600 text-white animate-pulse"
                        : "bg-slate-700 hover:bg-slate-600"
                    }`}
                    title="Record Call"
                  >
                    {isRecording ? <Square size={20} /> : <Circle size={20} />}
                  </button>

                  {/* Maximize/Minimize Button */}
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 text-blue-400"
                    title={isExpanded ? "Minimize" : "Maximize"}
                  >
                    {isExpanded ? (
                      <Minimize2 size={20} />
                    ) : (
                      <Maximize2 size={20} />
                    )}
                  </button>

                  {/* End Call Button */}
                  <button
                    onClick={handleEndCall}
                    className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white"
                    title="End Call"
                  >
                    <PhoneOff size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* Recording Download Popup */}
            {downloadLink && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800 p-4 rounded-xl shadow-xl flex items-center gap-4 z-50 animate-in slide-in-from-top-4">
                <div className="bg-green-500/20 text-green-500 p-2 rounded-lg">
                  <Download size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Recording Saved</p>
                  <a
                    href={downloadLink}
                    download="recording.webm"
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Click to Download
                  </a>
                </div>
                <button
                  onClick={() => setDownloadLink(null)}
                  className="text-gray-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Incoming Call Modal */}
            {callStatus === "incoming" && (
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-slate-800/95 backdrop-blur border border-slate-600 p-6 rounded-2xl shadow-2xl z-50 animate-bounce">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-indigo-500 rounded-full mx-auto flex items-center justify-center mb-2 animate-pulse">
                    <Video size={32} />
                  </div>
                  <h3 className="text-xl font-bold">Incoming Call</h3>
                  <p className="text-slate-400 text-sm">from {remoteUserId}</p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={acceptCall}
                    className="flex-1 bg-green-600 hover:bg-green-700 py-3 px-6 rounded-xl font-bold flex items-center gap-2"
                  >
                    <Video size={18} /> Accept
                  </button>
                  <button
                    onClick={declineCall}
                    className="flex-1 bg-red-600 hover:bg-red-700 py-3 px-6 rounded-xl font-bold flex items-center gap-2"
                  >
                    <PhoneOff size={18} /> Decline
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Nearby Users */}
          <div className="w-72 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl overflow-y-auto scrollbar-hide flex flex-col">
            <h3 className="font-bold text-white/70 mb-4 text-sm tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Nearby Players
            </h3>
            {nearbyUsers.size === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center p-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                <p className="text-sm">It's quiet... too quiet.</p>
              </div>
            )}

            <div className="space-y-3">
              {Array.from(nearbyUsers).map((userId) => (
                <div
                  key={userId}
                  className="bg-black/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3 transition-transform hover:scale-[1.02]"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-cyan-50">{userId}</span>
                    {userCallStatus.get(userId) && (
                      <span className="text-[10px] uppercase font-bold bg-rose-500/20 text-rose-400 px-2 py-1 rounded-full border border-rose-500/20">
                        In Call
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {/* Call Button */}
                    <button
                      onClick={() => handleCallUser(userId)}
                      disabled={
                        callStatus !== "idle" || !!userCallStatus.get(userId)
                      }
                      className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 ${
                        callStatus !== "idle"
                          ? "bg-gray-600 text-gray-400"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      <Video size={14} /> Call
                    </button>

                    {/* Chat Button */}
                    <button
                      onClick={() => setActiveChatUser(userId)}
                      className="bg-blue-600 hover:bg-blue-700 p-1.5 rounded text-white"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </button>

                    {/* Block Button */}
                    <button
                      onClick={() => toggleBlockUser(userId)}
                      className={`p-1.5 rounded ${blockedUsers.has(userId) ? "bg-red-600 text-white" : "bg-gray-600 text-gray-300 hover:bg-gray-500"}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                      </svg>
                    </button>
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
