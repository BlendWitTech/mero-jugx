import { Socket } from 'socket.io-client';

export type CallType = 'audio' | 'video';
export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export interface CallConfig {
  socket: Socket;
  localVideoElement?: HTMLVideoElement | null;
  remoteVideoElement?: HTMLVideoElement | null;
  onStateChange?: (state: CallState) => void;
  onError?: (error: Error) => void;
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private socket: Socket | null = null;
  private callType: CallType = 'audio';
  private state: CallState = 'idle';
  private localVideoElement: HTMLVideoElement | null = null;
  private remoteVideoElement: HTMLVideoElement | null = null;
  private onStateChange?: (state: CallState) => void;
  private onError?: (error: Error) => void;
  private isInitiator = false;
  private chatId: string | null = null;
  private otherUserId: string | null = null;

  // STUN/TURN servers configuration
  private rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  constructor() {
    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.rtcConfiguration);

    // Handle incoming remote stream
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        if (this.remoteVideoElement) {
          this.remoteVideoElement.srcObject = this.remoteStream;
        }
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('call:ice-candidate', {
          chatId: this.chatId,
          candidate: event.candidate,
        });
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        const state = this.peerConnection.connectionState;
        if (state === 'connected') {
          this.setState('connected');
        } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          this.setState('ended');
          this.cleanup();
        }
      }
    };
  }

  private setState(newState: CallState) {
    if (this.state !== newState) {
      this.state = newState;
      if (this.onStateChange) {
        this.onStateChange(newState);
      }
    }
  }

  async startCall(
    socket: Socket,
    chatId: string,
    otherUserId: string,
    callType: CallType,
    localVideoElement?: HTMLVideoElement | null,
    remoteVideoElement?: HTMLVideoElement | null,
    onStateChange?: (state: CallState) => void,
    onError?: (error: Error) => void,
  ): Promise<void> {
    try {
      this.socket = socket;
      this.chatId = chatId;
      this.otherUserId = otherUserId;
      this.callType = callType;
      this.localVideoElement = localVideoElement || null;
      this.remoteVideoElement = remoteVideoElement || null;
      this.onStateChange = onStateChange;
      this.onError = onError;
      this.isInitiator = true;

      // Get user media
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === 'video',
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Add tracks to peer connection
      this.localStream.getTracks().forEach((track) => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream!);
        }
      });

      // Display local stream
      if (this.localVideoElement) {
        this.localVideoElement.srcObject = this.localStream;
        if (callType === 'audio') {
          this.localVideoElement.muted = true; // Mute local audio in audio-only calls
        }
      }

      // Set up socket listeners
      this.setupSocketListeners();

      // Create offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Send offer
      this.setState('calling');
      socket.emit('call:offer', {
        chatId,
        otherUserId,
        callType,
        offer: offer.toJSON(),
      });
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async answerCall(
    socket: Socket,
    chatId: string,
    otherUserId: string,
    callType: CallType,
    offer: RTCSessionDescriptionInit,
    localVideoElement?: HTMLVideoElement | null,
    remoteVideoElement?: HTMLVideoElement | null,
    onStateChange?: (state: CallState) => void,
    onError?: (error: Error) => void,
  ): Promise<void> {
    try {
      this.socket = socket;
      this.chatId = chatId;
      this.otherUserId = otherUserId;
      this.callType = callType;
      this.localVideoElement = localVideoElement || null;
      this.remoteVideoElement = remoteVideoElement || null;
      this.onStateChange = onStateChange;
      this.onError = onError;
      this.isInitiator = false;

      // Get user media
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === 'video',
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Add tracks to peer connection
      this.localStream.getTracks().forEach((track) => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream!);
        }
      });

      // Display local stream
      if (this.localVideoElement) {
        this.localVideoElement.srcObject = this.localStream;
        if (callType === 'audio') {
          this.localVideoElement.muted = true;
        }
      }

      // Set up socket listeners
      this.setupSocketListeners();

      // Set remote description
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));

      // Create answer
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      // Send answer
      this.setState('connected');
      socket.emit('call:answer', {
        chatId,
        otherUserId,
        answer: answer.toJSON(),
      });
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    // Handle incoming answer
    this.socket.on('call:answer', async (data: { answer: RTCSessionDescriptionInit }) => {
      try {
        if (this.peerConnection && this.peerConnection.signalingState !== 'stable') {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
          this.setState('connected');
        }
      } catch (error: any) {
        this.handleError(error);
      }
    });

    // Handle incoming ICE candidate
    this.socket.on('call:ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      try {
        if (this.peerConnection && data.candidate) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (error: any) {
        this.handleError(error);
      }
    });

    // Handle call ended
    this.socket.on('call:ended', () => {
      this.setState('ended');
      this.cleanup();
    });

    // Handle call rejected
    this.socket.on('call:rejected', () => {
      this.setState('ended');
      this.cleanup();
    });
  }

  async endCall(): Promise<void> {
    if (this.socket && this.chatId) {
      this.socket.emit('call:end', {
        chatId: this.chatId,
        otherUserId: this.otherUserId,
      });
    }
    this.setState('ended');
    this.cleanup();
  }

  async rejectCall(): Promise<void> {
    if (this.socket && this.chatId) {
      this.socket.emit('call:reject', {
        chatId: this.chatId,
        otherUserId: this.otherUserId,
      });
    }
    this.setState('ended');
    this.cleanup();
  }

  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  getState(): CallState {
    return this.state;
  }

  getCallType(): CallType {
    return this.callType;
  }

  private handleError(error: Error) {
    console.error('WebRTC Error:', error);
    if (this.onError) {
      this.onError(error);
    }
    this.cleanup();
  }

  private cleanup() {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Clear video elements
    if (this.localVideoElement) {
      this.localVideoElement.srcObject = null;
    }
    if (this.remoteVideoElement) {
      this.remoteVideoElement.srcObject = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Remove socket listeners
    if (this.socket) {
      this.socket.off('call:answer');
      this.socket.off('call:ice-candidate');
      this.socket.off('call:ended');
      this.socket.off('call:rejected');
    }

    // Reset state
    this.socket = null;
    this.chatId = null;
    this.otherUserId = null;
    this.localVideoElement = null;
    this.remoteVideoElement = null;
    this.onStateChange = undefined;
    this.onError = undefined;
  }
}

export const webrtcService = new WebRTCService();

