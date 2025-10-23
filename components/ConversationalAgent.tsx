import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { CloseIcon, MicrophoneIcon, WaveIcon } from './Icons';

// --- Audio Utility Functions ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


// --- Component ---
interface ConversationalAgentProps {
  onClose: () => void;
}
type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';
type Transcript = { author: 'user' | 'model'; text: string; isFinal: boolean };

const ConversationalAgent: React.FC<ConversationalAgentProps> = ({ onClose }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  const stopSession = useCallback(async () => {
    try {
      if (sessionPromiseRef.current) {
        const session = await sessionPromiseRef.current;
        session.close();
      }
    } catch(e) { console.error("Error closing session", e); }
    
    scriptProcessorRef.current?.disconnect();
    scriptProcessorRef.current = null;
    
    audioContextRef.current?.close();
    audioContextRef.current = null;
    
    outputAudioContextRef.current?.close();
    outputAudioContextRef.current = null;
    
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    
    sessionPromiseRef.current = null;
    setConnectionState('idle');
    setIsModelSpeaking(false);
  }, []);

  const startSession = useCallback(async () => {
    setConnectionState('connecting');
    setTranscripts([]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // FIX: Cast window to `any` to access non-standard `webkitAudioContext` for Safari compatibility.
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = inputAudioContext;

      // FIX: Cast window to `any` to access non-standard `webkitAudioContext` for Safari compatibility.
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioContextRef.current = outputAudioContext;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setConnectionState('connected');
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
                const { text, isFinal } = message.serverContent.inputTranscription;
                setTranscripts(prev => {
                    const last = prev[prev.length - 1];
                    if (last?.author === 'user' && !last.isFinal) {
                        return [...prev.slice(0, -1), { author: 'user', text, isFinal }];
                    }
                    return [...prev, { author: 'user', text, isFinal }];
                });
            }
            if (message.serverContent?.outputTranscription) {
                const { text, isFinal } = message.serverContent.outputTranscription;
                setTranscripts(prev => {
                    const last = prev[prev.length - 1];
                    if (last?.author === 'model' && !last.isFinal) {
                        return [...prev.slice(0, -1), { author: 'model', text, isFinal }];
                    }
                    return [...prev, { author: 'model', text, isFinal }];
                });
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsModelSpeaking(true);
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                outputAudioContext,
                24000,
                1,
              );
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                    setIsModelSpeaking(false);
                }
              });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Session error', e);
            setConnectionState('error');
            stopSession();
          },
          onclose: () => {
            console.debug('Session closed');
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      });

    } catch (err) {
      console.error('Failed to start session:', err);
      setConnectionState('error');
    }
  }, [stopSession]);

  useEffect(() => {
    // Scroll to bottom of transcript
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [transcripts]);

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      stopSession();
    };
  }, [stopSession]);
  
  const handleToggleSession = () => {
    if (connectionState === 'connected') {
        stopSession();
    } else {
        startSession();
    }
  };

  const getStatusText = () => {
    switch(connectionState) {
        case 'idle': return 'Click the mic to start';
        case 'connecting': return 'Connecting...';
        case 'connected': return isModelSpeaking ? 'AI is speaking...' : 'Listening...';
        case 'error': return 'Connection error. Please try again.';
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="chat-title">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg h-[80vh] max-h-[700px] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="chat-title" className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h2>
          <button onClick={onClose} aria-label="Close assistant" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <div ref={transcriptContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
            {transcripts.map((t, i) => (
                <div key={i} className={`flex ${t.author === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <p className={`max-w-[80%] px-4 py-2 rounded-2xl ${t.author === 'user' ? 'bg-primary text-white rounded-br-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md'}`}>
                        {t.text}
                    </p>
                </div>
            ))}
            {transcripts.length === 0 && connectionState !== 'connecting' && (
                 <div className="text-center text-gray-500 dark:text-gray-400 pt-16">
                    <MicrophoneIcon className="w-16 h-16 mx-auto mb-4" />
                    <p>Click the microphone button below to start a conversation with the AI assistant.</p>
                </div>
            )}
        </div>
        <footer className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <button onClick={handleToggleSession} disabled={connectionState === 'connecting'} className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-colors text-white ${connectionState === 'connected' ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary-focus'} disabled:bg-gray-400`}>
               {connectionState === 'connected' && isModelSpeaking ? <WaveIcon className="w-7 h-7 animate-pulse"/> : <MicrophoneIcon className="w-7 h-7"/>}
            </button>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 h-5">{getStatusText()}</p>
        </footer>
      </div>
    </div>
  );
};

export default ConversationalAgent;