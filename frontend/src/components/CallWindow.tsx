import { useState, useEffect, useRef } from 'react';
import { X, Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { webrtcService, CallType, CallState } from '../services/webrtcService';
import { Socket } from 'socket.io-client';

interface CallWindowProps {
  chatId: string;
  otherUserId: string;
  otherUserName: string;
  callType: CallType;
  socket: Socket;
  onClose: () => void;
  isIncoming?: boolean;
  offer?: RTCSessionDescriptionInit;
}

export default function CallWindow({
  chatId,
  otherUserId,
  otherUserName,
  callType,
  socket,
  onClose,
  isIncoming = false,
  offer,
}: CallWindowProps) {
  const [callState, setCallState] = useState<CallState>(isIncoming ? 'ringing' : 'calling');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const handleStateChange = (state: CallState) => {
      setCallState(state);
      if (state === 'ended') {
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    };

    const handleError = (error: Error) => {
      setError(error.message);
      setTimeout(() => {
        onClose();
      }, 2000);
    };

    const startCall = async () => {
      try {
        if (isIncoming && offer) {
          // Don't auto-answer - wait for user to click answer button
          setCallState('ringing');
        } else if (!isIncoming) {
          // Start outgoing call immediately
          await webrtcService.startCall(
            socket,
            chatId,
            otherUserId,
            callType,
            localVideoRef.current,
            remoteVideoRef.current,
            handleStateChange,
            handleError,
          );
          setHasStarted(true);
        }
      } catch (error: any) {
        setError(error.message || 'Failed to start call');
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    };

    if (!isIncoming) {
      startCall();
    }

    return () => {
      if (hasStarted) {
        webrtcService.endCall();
      }
    };
  }, []);

  const handleAnswerCall = async () => {
    if (!offer) return;
    
    try {
      const handleStateChange = (state: CallState) => {
        setCallState(state);
        if (state === 'ended') {
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      };

      const handleError = (error: Error) => {
        setError(error.message);
        setTimeout(() => {
          onClose();
        }, 2000);
      };

      await webrtcService.answerCall(
        socket,
        chatId,
        otherUserId,
        callType,
        offer,
        localVideoRef.current,
        remoteVideoRef.current,
        handleStateChange,
        handleError,
      );
      setHasStarted(true);
    } catch (error: any) {
      setError(error.message || 'Failed to answer call');
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  const handleEndCall = async () => {
    await webrtcService.endCall();
    onClose();
  };

  const handleRejectCall = async () => {
    await webrtcService.rejectCall();
    onClose();
  };

  const handleToggleMute = () => {
    const newMuteState = webrtcService.toggleMute();
    setIsMuted(!newMuteState);
  };

  const handleToggleVideo = () => {
    if (callType === 'video') {
      const newVideoState = webrtcService.toggleVideo();
      setIsVideoOff(!newVideoState);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center">
      <div className="relative w-full h-full flex flex-col">
        {/* Remote video (full screen when connected) */}
        {callType === 'video' && (
          <div className="absolute inset-0">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {callState === 'ringing' || callState === 'calling' ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <div className="text-white text-2xl font-semibold mb-2">{otherUserName}</div>
                  <div className="text-[#b9bbbe] text-sm">
                    {callState === 'ringing' ? 'Incoming call...' : 'Calling...'}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Local video (small overlay when video call) */}
        {callType === 'video' && callState === 'connected' && (
          <div className="absolute top-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-[#5865f2] bg-black">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Audio call UI */}
        {callType === 'audio' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-[#5865f2] flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-4xl font-semibold">
                  {otherUserName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2)}
                </span>
              </div>
              <div className="text-white text-2xl font-semibold mb-2">{otherUserName}</div>
              <div className="text-[#b9bbbe] text-sm">
                {callState === 'ringing'
                  ? 'Incoming call...'
                  : callState === 'calling'
                  ? 'Calling...'
                  : callState === 'connected'
                  ? 'Connected'
                  : 'Call ended'}
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
          {callState === 'ringing' && isIncoming ? (
            <>
              <button
                onClick={handleRejectCall}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
                title="Reject"
              >
                <PhoneOff className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={handleAnswerCall}
                className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors"
                title="Answer"
              >
                <Phone className="h-6 w-6 text-white" />
              </button>
            </>
          ) : callState === 'connected' ? (
            <>
              {callType === 'video' && (
                <button
                  onClick={handleToggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isVideoOff
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-[#2f3136] hover:bg-[#393c43]'
                  }`}
                  title={isVideoOff ? 'Turn on video' : 'Turn off video'}
                >
                  {isVideoOff ? (
                    <VideoOff className="h-5 w-5 text-white" />
                  ) : (
                    <Video className="h-5 w-5 text-white" />
                  )}
                </button>
              )}
              <button
                onClick={handleToggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isMuted
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#2f3136] hover:bg-[#393c43]'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <MicOff className="h-5 w-5 text-white" />
                ) : (
                  <Mic className="h-5 w-5 text-white" />
                )}
              </button>
              <button
                onClick={handleEndCall}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
                title="End call"
              >
                <PhoneOff className="h-6 w-6 text-white" />
              </button>
            </>
          ) : (
            <button
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
              title="Cancel call"
            >
              <PhoneOff className="h-6 w-6 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

