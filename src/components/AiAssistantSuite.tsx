import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  sources?: any[];
}

export const AiAssistantSuite: React.FC = () => {
  const [subTab, setSubTab] = useState<'CHAT' | 'MUSIC' | 'VISUAL' | 'LIVE'>('CHAT');

  // --- 1. CHAT & GROUNDING STATE ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content: '⚡ Guardian AI Co-Pilot online. Space weather telemetry, scalar field acoustics, and geospatial defense nodes synchronized. How may I assist your mission?',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  const [activeGrounding, setActiveGrounding] = useState<'none' | 'googleSearch' | 'googleMaps'>('none');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');

    const newHistory: ChatMessage[] = [...chatMessages, { role: 'user', content: userMsg }];
    setChatMessages(newHistory);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          model: selectedModel,
          tool: activeGrounding,
          systemInstruction:
            'You are the 2099 Grid Guardian Hub Tactical AI Co-Pilot. You specialize in space weather monitoring, bio-coherence stabilization, scalar 12D tonal shielding, and Gatesville Texas infrastructure defense. Provide clear, precise, and scientifically grounded responses.',
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: data.text,
          sources: data.groundingChunks || [],
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', content: `⚠️ Error processing query: ${err.message}` },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Mic Audio Transcription via gemini-3.5-transcribe
  const handleToggleMicRecord = async () => {
    if (isRecordingMic) {
      mediaRecorderRef.current?.stop();
      setIsRecordingMic(false);
      setRecordingStatus('Transcribing with gemini-3.5-transcribe...');
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            try {
              const res = await fetch('/api/gemini/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  audioBase64: base64Audio,
                  mimeType: 'audio/webm',
                }),
              });
              const data = await res.json();
              if (data.text) {
                setChatInput((prev) => (prev ? `${prev} ${data.text}` : data.text));
              }
              setRecordingStatus(null);
            } catch (err) {
              setRecordingStatus('Transcription failed.');
            }
          };
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecordingMic(true);
        setRecordingStatus('Recording audio from microphone...');
      } catch (err: any) {
        setRecordingStatus(`Mic error: ${err.message}`);
      }
    }
  };

  // --- 2. LYRIA MUSIC STATE ---
  const [musicPrompt, setMusicPrompt] = useState('432Hz meditative scalar harmonic tone with ethereal synth pads');
  const [musicModel, setMusicModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [musicLyrics, setMusicLyrics] = useState<string | null>(null);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [musicError, setMusicError] = useState<string | null>(null);

  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim() || isGeneratingMusic) return;
    setIsGeneratingMusic(true);
    setMusicError(null);
    setGeneratedAudioUrl(null);

    try {
      const res = await fetch('/api/gemini/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: musicPrompt,
          model: musicModel,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Convert base64 audio to Blob URL
      const byteCharacters = atob(data.audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.mimeType || 'audio/wav' });
      const url = URL.createObjectURL(blob);

      setGeneratedAudioUrl(url);
      setMusicLyrics(data.lyrics || null);
    } catch (err: any) {
      setMusicError(err.message || 'Failed to generate music');
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  // --- 3. VEO VIDEO & IMAGE STATE ---
  const [visualPrompt, setVisualPrompt] = useState('Futuristic bio-coherence scalar shield over Gatesville grid array');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isVisualProcessing, setIsVisualProcessing] = useState(false);
  const [visualStatus, setVisualStatus] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setUploadedImageBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateOrEditImage = async () => {
    if (!visualPrompt && !uploadedImageBase64) return;
    setIsVisualProcessing(true);
    setVisualStatus('Generating image with gemini-3.1-flash-image...');
    setGeneratedImageUrl(null);

    try {
      const res = await fetch('/api/gemini/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: visualPrompt,
          imageBase64: uploadedImageBase64,
          mimeType: 'image/png',
          aspectRatio: aspectRatio,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setGeneratedImageUrl(`data:${data.mimeType};base64,${data.imageBase64}`);
      setVisualStatus('Image generation complete.');
    } catch (err: any) {
      setVisualStatus(`Image error: ${err.message}`);
    } finally {
      setIsVisualProcessing(false);
    }
  };

  const handleGenerateVeoVideo = async () => {
    setIsVisualProcessing(true);
    setVisualStatus('Submitting Veo video generation job (veo-3.1-fast-generate-preview)...');
    setGeneratedVideoUrl(null);

    try {
      const startRes = await fetch('/api/gemini/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: visualPrompt,
          imageBase64: uploadedImageBase64,
          mimeType: 'image/png',
          aspectRatio: aspectRatio,
        }),
      });

      const startData = await startRes.json();
      if (startData.error) throw new Error(startData.error);
      const opName = startData.operationName;

      // Poll status every 5 seconds
      setVisualStatus('Rendering video frames with Veo 3.1... Please wait.');
      let completed = false;
      let attempts = 0;

      while (!completed && attempts < 60) {
        attempts++;
        await new Promise((r) => setTimeout(r, 5000));
        setVisualStatus(`Rendering video frames with Veo 3.1 (${attempts * 5}s)...`);

        const pollRes = await fetch('/api/gemini/video/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName: opName }),
        });
        const pollData = await pollRes.json();
        if (pollData.error) throw new Error(pollData.error.message || 'Video generation failed');

        if (pollData.done) {
          completed = true;
          setVisualStatus('Downloading rendered video stream...');

          const downloadRes = await fetch('/api/gemini/video/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName: opName }),
          });

          const videoBlob = await downloadRes.blob();
          const videoUrl = URL.createObjectURL(videoBlob);
          setGeneratedVideoUrl(videoUrl);
          setVisualStatus('Veo video generation complete.');
        }
      }
    } catch (err: any) {
      setVisualStatus(`Video error: ${err.message}`);
    } finally {
      setIsVisualProcessing(false);
    }
  };

  // --- 4. LIVE API VOICE CONVERSATION STATE ---
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('Disconnected');
  const liveWsRef = useRef<WebSocket | null>(null);
  const liveAudioCtxRef = useRef<AudioContext | null>(null);

  const handleToggleLiveApi = async () => {
    if (isLiveConnected) {
      liveWsRef.current?.close();
      liveAudioCtxRef.current?.close();
      setIsLiveConnected(false);
      setLiveStatus('Disconnected');
    } else {
      try {
        setLiveStatus('Connecting to gemini-3.8-live stream...');
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/api/gemini/live`);
        liveWsRef.current = ws;

        const audioCtx = new AudioContext({ sampleRate: 24000 });
        liveAudioCtxRef.current = audioCtx;

        ws.onopen = async () => {
          setIsLiveConnected(true);
          setLiveStatus('🟢 Connected to Gemini Live 3.8. Voice channel active.');

          // Setup mic stream at 16kHz
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const micCtx = new AudioContext({ sampleRate: 16000 });
          const source = micCtx.createMediaStreamSource(micStream);
          const processor = micCtx.createScriptProcessor(4096, 1, 1);
          source.connect(processor);
          processor.connect(micCtx.destination);

          processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
              const inputData = e.inputBuffer.getChannelData(0);
              // Convert Float32 to 16-bit PCM
              const pcmBuffer = new ArrayBuffer(inputData.length * 2);
              const pcmView = new DataView(pcmBuffer);
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                pcmView.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
              }
              const base64Audio = btoa(
                String.fromCharCode.apply(null, Array.from(new Uint8Array(pcmBuffer)))
              );
              ws.send(JSON.stringify({ audio: base64Audio }));
            }
          };
        };

        ws.onmessage = async (event) => {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            // Decode raw PCM from base64 and play back
            const binary = atob(msg.audio);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const int16 = new Int16Array(bytes.buffer);
            const float32 = new Float32Array(int16.length);
            for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

            const buffer = audioCtx.createBuffer(1, float32.length, 24000);
            buffer.copyToChannel(float32, 0);
            const audioSource = audioCtx.createBufferSource();
            audioSource.buffer = buffer;
            audioSource.connect(audioCtx.destination);
            audioSource.start();
          }
        };

        ws.onclose = () => {
          setIsLiveConnected(false);
          setLiveStatus('Live stream ended.');
        };
      } catch (err: any) {
        setLiveStatus(`Connection error: ${err.message}`);
      }
    }
  };

  return (
    <div style={{ backgroundColor: '#060a13', borderTop: '1px solid #1a2636', fontFamily: 'monospace' }}>
      {/* Header Deck */}
      <div
        style={{
          padding: '12px 20px',
          backgroundColor: '#0a0f1d',
          borderBottom: '1px solid #1a2636',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.1em' }}>🤖</span>
            <h3 style={{ color: '#00ffcc', margin: 0, fontSize: '0.96em' }}>
              GEMINI AI INTEL SUITE // TACTICAL CO-PILOT
            </h3>
          </div>
          <span style={{ fontSize: '0.68em', color: '#8fa0ba' }}>
            GENAI ENGINE // MULTI-TURN CHAT, LYRIA MUSIC, VEO VIDEO & LIVE AUDIO
          </span>
        </div>

        {/* Sub-Tabs */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'CHAT', label: 'CHAT & SEARCH' },
            { id: 'MUSIC', label: 'LYRIA MUSIC' },
            { id: 'VISUAL', label: 'VEO & IMAGES' },
            { id: 'LIVE', label: 'LIVE VOICE' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              style={{
                padding: '4px 10px',
                fontSize: '0.7em',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                backgroundColor: subTab === tab.id ? '#00ffcc' : '#101726',
                color: subTab === tab.id ? '#0a0f1d' : '#8fa0ba',
                border: '1px solid #1a2636',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. CHAT & GROUNDING TAB */}
      {subTab === 'CHAT' && (
        <div style={{ padding: '16px 20px' }}>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              fontSize: '0.72em',
              color: '#8fa0ba',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>MODEL:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as any)}
                style={{
                  backgroundColor: '#101726',
                  color: '#00ffcc',
                  border: '1px solid #1a2636',
                  borderRadius: '2px',
                  padding: '2px 6px',
                  fontFamily: 'monospace',
                  fontSize: '0.95em',
                }}
              >
                <option value="gemini-3.5-flash">gemini-3.5-flash (General)</option>
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>GROUNDING:</span>
              <button
                onClick={() => setActiveGrounding((prev) => (prev === 'googleSearch' ? 'none' : 'googleSearch'))}
                style={{
                  padding: '2px 8px',
                  backgroundColor: activeGrounding === 'googleSearch' ? '#00ffcc' : '#101726',
                  color: activeGrounding === 'googleSearch' ? '#0a0f1d' : '#8fa0ba',
                  border: '1px solid #1a2636',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                🔍 Google Search
              </button>
              <button
                onClick={() => setActiveGrounding((prev) => (prev === 'googleMaps' ? 'none' : 'googleMaps'))}
                style={{
                  padding: '2px 8px',
                  backgroundColor: activeGrounding === 'googleMaps' ? '#00ffcc' : '#101726',
                  color: activeGrounding === 'googleMaps' ? '#0a0f1d' : '#8fa0ba',
                  border: '1px solid #1a2636',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                📍 Google Maps
              </button>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div
            ref={chatScrollRef}
            style={{
              height: '240px',
              overflowY: 'auto',
              backgroundColor: '#0a0f1d',
              border: '1px solid #1a2636',
              borderRadius: '4px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '10px',
            }}
          >
            {chatMessages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  backgroundColor: m.role === 'user' ? 'rgba(0, 255, 204, 0.12)' : '#101726',
                  border: `1px solid ${m.role === 'user' ? '#00ffcc' : '#1a2636'}`,
                  borderRadius: '4px',
                  padding: '8px 12px',
                  fontSize: '0.78em',
                  lineHeight: 1.4,
                  color: m.role === 'user' ? '#00ffcc' : '#ffffff',
                }}
              >
                <div style={{ fontSize: '0.7em', color: '#8fa0ba', marginBottom: '4px' }}>
                  {m.role === 'user' ? 'OPERATOR' : 'GUARDIAN AI'}
                </div>
                <div>{m.content}</div>

                {/* Grounding Source Attribution Badges */}
                {m.sources && m.sources.length > 0 && (
                  <div style={{ marginTop: '6px', borderTop: '1px solid #1a2636', paddingTop: '4px' }}>
                    <span style={{ fontSize: '0.65em', color: '#8fa0ba' }}>VERIFIED SOURCES:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                      {m.sources.map((s, sIdx) => (
                        <a
                          key={sIdx}
                          href={s.web?.uri || '#'}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '0.65em',
                            color: '#00d2ff',
                            textDecoration: 'underline',
                          }}
                        >
                          [{sIdx + 1}] {s.web?.title || 'Web Grounding Reference'}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isChatLoading && (
              <div style={{ color: '#00ffcc', fontSize: '0.74em' }}>
                ⚡ Processing response from {selectedModel}...
              </div>
            )}
          </div>

          {/* Input Box & Transcription Controls */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleToggleMicRecord}
              style={{
                padding: '6px 12px',
                backgroundColor: isRecordingMic ? '#ff0033' : '#101726',
                color: isRecordingMic ? '#ffffff' : '#00ffcc',
                border: '1px solid #1a2636',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '0.85em',
              }}
              title="Record and transcribe speech (gemini-3.5-transcribe)"
            >
              {isRecordingMic ? '⏹️ Stop' : '🎙️ Mic'}
            </button>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="Query space weather metrics, scalar acoustics, or local infrastructure..."
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: '#0a0f1d',
                color: '#ffffff',
                border: '1px solid #1a2636',
                borderRadius: '3px',
                fontFamily: 'monospace',
                fontSize: '0.78em',
              }}
            />
            <button
              onClick={handleSendChat}
              disabled={isChatLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#00ffcc',
                color: '#0a0f1d',
                border: 'none',
                borderRadius: '3px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '0.78em',
              }}
            >
              TRANSMIT
            </button>
          </div>
          {recordingStatus && (
            <div style={{ fontSize: '0.68em', color: '#ffaa00', marginTop: '4px' }}>
              {recordingStatus}
            </div>
          )}
        </div>
      )}

      {/* 2. LYRIA MUSIC GENERATION TAB */}
      {subTab === 'MUSIC' && (
        <div style={{ padding: '16px 20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '0.72em', color: '#8fa0ba', display: 'block', marginBottom: '4px' }}>
              LYRIA MODEL SELECTION:
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <button
                onClick={() => setMusicModel('lyria-3-clip-preview')}
                style={{
                  padding: '4px 10px',
                  backgroundColor: musicModel === 'lyria-3-clip-preview' ? '#00ffcc' : '#101726',
                  color: musicModel === 'lyria-3-clip-preview' ? '#0a0f1d' : '#8fa0ba',
                  border: '1px solid #1a2636',
                  borderRadius: '2px',
                  fontSize: '0.7em',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                lyria-3-clip-preview (30s Short Clip)
              </button>
              <button
                onClick={() => setMusicModel('lyria-3-pro-preview')}
                style={{
                  padding: '4px 10px',
                  backgroundColor: musicModel === 'lyria-3-pro-preview' ? '#00ffcc' : '#101726',
                  color: musicModel === 'lyria-3-pro-preview' ? '#0a0f1d' : '#8fa0ba',
                  border: '1px solid #1a2636',
                  borderRadius: '2px',
                  fontSize: '0.7em',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                lyria-3-pro-preview (Full Track)
              </button>
            </div>

            <label style={{ fontSize: '0.72em', color: '#8fa0ba', display: 'block', marginBottom: '4px' }}>
              SCALAR AUDIO GENERATION PROMPT:
            </label>
            <textarea
              value={musicPrompt}
              onChange={(e) => setMusicPrompt(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                backgroundColor: '#0a0f1d',
                color: '#ffffff',
                border: '1px solid #1a2636',
                borderRadius: '3px',
                padding: '8px',
                fontFamily: 'monospace',
                fontSize: '0.76em',
                marginBottom: '10px',
              }}
            />

            <button
              onClick={handleGenerateMusic}
              disabled={isGeneratingMusic}
              style={{
                padding: '8px 16px',
                backgroundColor: '#00ffcc',
                color: '#0a0f1d',
                border: 'none',
                borderRadius: '3px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '0.78em',
              }}
            >
              {isGeneratingMusic ? '⚡ SYNTHESIZING HARMONIC TRACK...' : '🎵 GENERATE WITH LYRIA'}
            </button>
          </div>

          {musicError && (
            <div style={{ color: '#ff0033', fontSize: '0.74em', marginTop: '8px' }}>
              ⚠️ {musicError}
            </div>
          )}

          {generatedAudioUrl && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: '#0a0f1d',
                border: '1px solid #00ffcc',
                borderRadius: '4px',
              }}
            >
              <div style={{ fontSize: '0.75em', color: '#00ffcc', fontWeight: 'bold', marginBottom: '6px' }}>
                🎧 SYNTHESIZED SCALAR TRACK READY
              </div>
              <audio controls src={generatedAudioUrl} style={{ width: '100%' }} />
              {musicLyrics && (
                <div style={{ marginTop: '8px', fontSize: '0.7em', color: '#8fa0ba' }}>
                  <strong>LYRICS / METADATA:</strong> {musicLyrics}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. VEO VIDEO & IMAGE TAB */}
      {subTab === 'VISUAL' && (
        <div style={{ padding: '16px 20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '0.72em', color: '#8fa0ba', display: 'block', marginBottom: '4px' }}>
              VISUAL SCAN PROMPT:
            </label>
            <input
              type="text"
              value={visualPrompt}
              onChange={(e) => setVisualPrompt(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0a0f1d',
                color: '#ffffff',
                border: '1px solid #1a2636',
                borderRadius: '3px',
                padding: '8px',
                fontFamily: 'monospace',
                fontSize: '0.76em',
                marginBottom: '8px',
              }}
            />

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.7em', color: '#8fa0ba', marginRight: '6px' }}>ASPECT RATIO:</span>
                {(['16:9', '9:16'] as const).map((ar) => (
                  <button
                    key={ar}
                    onClick={() => setAspectRatio(ar)}
                    style={{
                      padding: '3px 8px',
                      backgroundColor: aspectRatio === ar ? '#00ffcc' : '#101726',
                      color: aspectRatio === ar ? '#0a0f1d' : '#8fa0ba',
                      border: '1px solid #1a2636',
                      borderRadius: '2px',
                      fontSize: '0.7em',
                      marginRight: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {ar}
                  </button>
                ))}
              </div>

              <div>
                <label
                  style={{
                    padding: '4px 10px',
                    backgroundColor: '#101726',
                    color: '#00d2ff',
                    border: '1px solid #1a2636',
                    borderRadius: '2px',
                    fontSize: '0.7em',
                    cursor: 'pointer',
                  }}
                >
                  📷 Upload Source Photo
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
                {uploadedImageBase64 && (
                  <span style={{ fontSize: '0.68em', color: '#00ffcc', marginLeft: '6px' }}>Photo Attached</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleGenerateOrEditImage}
                disabled={isVisualProcessing}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#101726',
                  color: '#00ffcc',
                  border: '1px solid #00ffcc',
                  borderRadius: '3px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.74em',
                }}
              >
                🖼️ CREATE / EDIT IMAGE
              </button>

              <button
                onClick={handleGenerateVeoVideo}
                disabled={isVisualProcessing}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#00ffcc',
                  color: '#0a0f1d',
                  border: 'none',
                  borderRadius: '3px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.74em',
                }}
              >
                🎬 GENERATE VEO VIDEO
              </button>
            </div>
          </div>

          {visualStatus && (
            <div style={{ fontSize: '0.72em', color: '#ffaa00', marginBottom: '8px' }}>
              {visualStatus}
            </div>
          )}

          {/* Generated Artifact Display */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {generatedImageUrl && (
              <div style={{ maxWidth: '280px', border: '1px solid #00ffcc', padding: '4px', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.68em', color: '#00ffcc', marginBottom: '4px' }}>GENERATED IMAGE</div>
                <img src={generatedImageUrl} alt="Generated" style={{ width: '100%', borderRadius: '2px' }} />
              </div>
            )}
            {generatedVideoUrl && (
              <div style={{ maxWidth: '340px', border: '1px solid #00ffcc', padding: '4px', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.68em', color: '#00ffcc', marginBottom: '4px' }}>VEO VIDEO RENDER</div>
                <video controls src={generatedVideoUrl} style={{ width: '100%', borderRadius: '2px' }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. LIVE API VOICE CONVERSATION TAB */}
      {subTab === 'LIVE' && (
        <div style={{ padding: '16px 20px' }}>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#0a0f1d',
              border: `1px solid ${isLiveConnected ? '#00ffcc' : '#1a2636'}`,
              borderRadius: '4px',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '0.85em', color: '#00ffcc', fontWeight: 'bold' }}>
                  🎙️ GEMINI LIVE 3.8 TWO-WAY VOICE CHANNEL
                </span>
                <div style={{ fontSize: '0.68em', color: '#8fa0ba', marginTop: '2px' }}>
                  Low-latency real-time voice streaming with model: gemini-3.8-live
                </div>
              </div>

              <button
                onClick={handleToggleLiveApi}
                style={{
                  padding: '6px 14px',
                  backgroundColor: isLiveConnected ? '#ff0033' : '#00ffcc',
                  color: isLiveConnected ? '#ffffff' : '#0a0f1d',
                  border: 'none',
                  borderRadius: '3px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.75em',
                }}
              >
                {isLiveConnected ? 'DISCONNECT' : 'CONNECT LIVE VOICE'}
              </button>
            </div>

            <div style={{ fontSize: '0.72em', color: isLiveConnected ? '#00ffcc' : '#8fa0ba' }}>
              STATUS: {liveStatus}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
