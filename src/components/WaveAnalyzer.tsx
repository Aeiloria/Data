import React, { useEffect, useRef } from 'react';

interface WaveAnalyzerProps {
  analyserNode: AnalyserNode | null;
  isAudioActive: boolean;
  frequency?: number;
}

export const WaveAnalyzer: React.FC<WaveAnalyzerProps> = ({
  analyserNode,
  isAudioActive,
  frequency = 432
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 512;
    const dataArray = new Uint8Array(bufferLength);
    let standbyPhase = 0;

    const drawFrame = () => {
      animationRef.current = requestAnimationFrame(drawFrame);
      const width = canvas.width;
      const height = canvas.height;

      // Wipe current layout frame slate clean
      ctx.fillStyle = '#060a13';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle calibration grid lines
      ctx.strokeStyle = 'rgba(26, 38, 54, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Center horizontal line
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      // Vertical quadrant ticks
      for (let x = 0; x < width; x += 40) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      ctx.stroke();

      if (isAudioActive && analyserNode) {
        // Pull raw real-time time-domain sound-wave arrays from the audio engine
        analyserNode.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00ffcc'; // Synchronized Neon Teal line color
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 8;
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0; // Normalize input values (128 is center)
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Draw gently undulating standby baseline
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffaa00'; // Standby Amber
        ctx.beginPath();

        standbyPhase += 0.04;
        const amplitude = 3;
        for (let x = 0; x <= width; x += 4) {
          const y = height / 2 + Math.sin(x * 0.03 + standbyPhase) * amplitude;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
    };

    drawFrame();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyserNode, isAudioActive, frequency]);

  return (
    <div style={{ padding: '14px 20px', backgroundColor: '#060a13', borderTop: '1px solid #1a2636', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.78em' }}>
        <span style={{ color: '#c5d1e0' }}>📈 WAVEFORM REAL-TIME OSCILLOSCOPE MEASURE</span>
        <span style={{ color: isAudioActive ? '#00ffcc' : '#ffaa00', fontWeight: 'bold' }}>
          {isAudioActive ? 'CHANNEL_STREAMING_LIVE' : 'STANDBY_EMPTY'}
        </span>
      </div>
      <div style={{ border: '1px solid #1a2636', borderRadius: '4px', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={560}
          height={90}
          style={{ width: '100%', height: '90px', display: 'block', backgroundColor: '#0a0f1d' }}
        />
      </div>
    </div>
  );
};
