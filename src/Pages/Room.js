import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { Mic, MicOff, Video as VideoIcon, VideoOff, MonitorUp, PhoneOff } from "lucide-react";

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const name = queryParams.get("name") || "Guest";
  const role = queryParams.get("role") || "viewer";
  const serverUrl = queryParams.get("serverUrl") || "/";

  const [peers, setPeers] = useState({});
  const [users, setUsers] = useState([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef({});
  const myStream = useRef();
  const myId = useRef(Math.random().toString(36).substring(7));

  useEffect(() => {
    socketRef.current = io(serverUrl);
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      myStream.current = stream;
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }

      socketRef.current.emit("join-room", roomId, myId.current, name, role);

      socketRef.current.on("room-users-update", (usersList) => {
        setUsers(usersList);
      });

      socketRef.current.on("user-connected", (payload) => {
        let userId, socketId;
        if (typeof payload === "string") {
          userId = payload;
        } else {
          userId = payload.userId;
          socketId = payload.socketId;
        }
        
        // When someone else joins, THEY will initiate the offer to us. We wait for their offer.
        // Or, we can be the initiator. Let's make the ESTABLISHED participants initiate the call to the NEW participant.
        if (socketId && !peersRef.current[userId] && myStream.current) {
          const peer = createPeer(socketId, userId);
          peersRef.current[userId] = peer;
          peer.createOffer().then(offer => {
            return peer.setLocalDescription(offer).then(() => {
              socketRef.current.emit("offer", {
                target: socketId,
                caller: socketRef.current.id,
                callerId: myId.current,
                sdp: offer
              });
            });
          }).catch(e => console.error("Error creating offer:", e));
        }
      });

      socketRef.current.on("offer", handleReceiveOffer);
      socketRef.current.on("answer", handleReceiveAnswer);
      socketRef.current.on("ice-candidate", handleNewICECandidateMsg);
      
      socketRef.current.on("meeting-ended", () => {
        alert("The host has ended the meeting.");
        navigate("/");
      });

      socketRef.current.on("user-disconnected", (userId) => {
        if (peersRef.current[userId]) {
          peersRef.current[userId].close();
          delete peersRef.current[userId];
          setPeers((prev) => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        }
      });
    }).catch(err => {
      console.error("Failed to get local stream", err);
      alert("Could not access camera/microphone");
    });

    return () => {
      socketRef.current.disconnect();
      if (myStream.current) {
        myStream.current.getTracks().forEach(track => track.stop());
      }
      Object.keys(peersRef.current).forEach(peerId => {
        peersRef.current[peerId].close();
      });
    };
  }, []);

  // Remove the problematic users-based offer initiation to prevent glare completely.
  // The 'user-connected' event listener above is the Sole Initiator for outbound calls.

  function createPeer(targetSocketId, targetUserId) {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    myStream.current.getTracks().forEach((track) => {
      peer.addTrack(track, myStream.current);
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", {
          target: targetSocketId,
          caller: socketRef.current.id,
          callerId: myId.current,
          candidate: event.candidate,
        });
      }
    };

    peer.ontrack = (event) => {
      setPeers((prev) => ({
        ...prev,
        [targetUserId]: event.streams[0],
      }));
    };

    return peer;
  }

  async function handleReceiveOffer(incoming) {
    let peer = peersRef.current[incoming.callerId];
    if (!peer) {
       peer = createPeer(incoming.caller, incoming.callerId);
       peersRef.current[incoming.callerId] = peer;
    }
    try {
      await peer.setRemoteDescription(incoming.sdp);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socketRef.current.emit("answer", {
        target: incoming.caller,
        callerId: myId.current,
        sdp: peer.localDescription,
      });
    } catch (e) {
      console.error("Error handling offer:", e);
    }
  }

  async function handleReceiveAnswer(incoming) {
    const peer = peersRef.current[incoming.callerId];
    if (peer) {
      await peer.setRemoteDescription(incoming.sdp);
    }
  }

  async function handleNewICECandidateMsg(incoming) {
    const peer = peersRef.current[incoming.callerId];
    if (peer && incoming.candidate) {
      await peer.addIceCandidate(new RTCIceCandidate(incoming.candidate)).catch(e => console.error(e));
    }
  }

  const toggleMute = () => {
    if (myStream.current) {
      const audioTrack = myStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (myStream.current) {
      const videoTrack = myStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        screenTrack.onended = () => {
          stopScreenShare();
        };

        Object.keys(peersRef.current).forEach(peerId => {
          const sender = peersRef.current[peerId].getSenders().find(s => s.track.kind === "video");
          if (sender) sender.replaceTrack(screenTrack);
        });

        if (userVideo.current) {
          userVideo.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Failed to share screen", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    const videoTrack = myStream.current.getVideoTracks()[0];
    Object.keys(peersRef.current).forEach(peerId => {
      const sender = peersRef.current[peerId].getSenders().find(s => s.track.kind === "video");
      if (sender) sender.replaceTrack(videoTrack);
    });

    if (userVideo.current) {
      userVideo.current.srcObject = myStream.current;
    }
    setIsScreenSharing(false);
  };

  const hangUp = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4 pt-20 flex flex-col items-center justify-between">
      <div className="w-full max-w-6xl mx-auto flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-xl border border-gray-700 relative flex items-center justify-center">
           <video 
              ref={userVideo} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover" 
            />
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white">
                <span className="bg-black/50 px-3 py-1 rounded-full text-sm font-medium">{name} (You) - {role}</span>
            </div>
        </div>

        {Object.entries(peers).map(([peerId, stream]) => {
          const user = users.find(u => u.id === peerId);
          return (
            <PeerVideo key={peerId} stream={stream} name={user?.name || "User"} role={user?.role || "viewer"} />
          );
        })}
      </div>

      <div className="mt-8 mb-4">
        <div className="flex items-center gap-4 bg-gray-800 px-8 py-4 rounded-full border border-gray-700 shadow-xl">
          <button onClick={toggleMute} className={`p-4 rounded-full transition-colors ${!isAudioEnabled ? "bg-red-500 hover:bg-red-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"}`}>
            {!isAudioEnabled ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <button onClick={toggleVideo} className={`p-4 rounded-full transition-colors ${!isVideoEnabled ? "bg-red-500 hover:bg-red-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"}`}>
            {!isVideoEnabled ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
          </button>
          {role === 'host' && (
            <button onClick={toggleScreenShare} className={`p-4 rounded-full transition-colors ${isScreenSharing ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"}`}>
               <MonitorUp className="w-6 h-6" />
            </button>
          )}
          <button onClick={hangUp} className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white ml-8 shadow-lg shadow-red-500/20">
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

const PeerVideo = ({ stream, name, role }) => {
  const ref = useRef();
  
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-xl border border-gray-700 relative flex items-center justify-center">
      <video
        ref={ref}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white">
          <span className="bg-black/50 px-3 py-1 rounded-full text-sm font-medium">{name} - {role}</span>
      </div>
    </div>
  );
};

export default Room;
