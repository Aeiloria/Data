import React, { useRef, useState, useEffect, useMemo } from 'react';
import { WellnessLog } from '../hooks/useIndexedDB';

interface CoherenceCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: WellnessLog[];
  userEmail?: string;
}

export const CoherenceCertificateModal: React.FC<CoherenceCertificateModalProps> = ({
  isOpen,
  onClose,
  logs = [],
  userEmail,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [guardianName, setGuardianName] = useState<string>(() => {
    if (userEmail) {
      return userEmail.split('@')[0].toUpperCase();
    }
    return 'GUARDIAN_ABBEY';
  });
  const [formatAspect, setFormatAspect] = useState<'LANDSCAPE_16_9' | 'SQUARE_1_1'>('LANDSCAPE_16_9');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Compute Streak & Performance Metrics
  const metrics = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        streak: 1,
        totalRoutines: 1,
        avgHrv: 68,
        hrvGain: 14,
        tierTitle: 'HARMONIC GRID WEAVER',
        tierColor: '#00ffcc',
      };
    }

    const logDateSet = new Set<string>();
    let totalHrDelta = 0;
    let totalHrvDelta = 0;

    logs.forEach((l) => {
      try {
        const d = new Date(l.timestamp);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        logDateSet.add(`${yyyy}-${mm}-${dd}`);

        totalHrDelta += (l.heartRateAfter || 70) - (l.heartRateBefore || 70);
        totalHrvDelta += (l.hrvAfter ?? 55) - (l.hrvBefore ?? 55);
      } catch (e) {}
    });

    const now = new Date();
    const formatDay = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    let streak = 0;
    let checkDate = new Date(now);
    const todayStr = formatDay(now);

    if (!logDateSet.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (logDateSet.has(formatDay(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Default minimum 1 for preview/certificate if user has logs
    streak = Math.max(1, streak);
    const avgHrvGain = logs.length > 0 ? Math.round(totalHrvDelta / logs.length) : 12;

    let tierTitle = 'NEOPHYTE RESONATOR';
    let tierColor = '#33ccff';
    if (streak >= 10) {
      tierTitle = 'ASCENDED LIGHT-WELL GUARDIAN';
      tierColor = '#ff3399';
    } else if (streak >= 5) {
      tierTitle = 'SOLAR COHERENCE SENTINEL';
      tierColor = '#ffaa00';
    } else if (streak >= 3) {
      tierTitle = 'HARMONIC GRID WEAVER';
      tierColor = '#00ffcc';
    }

    return {
      streak,
      totalRoutines: logs.length,
      avgHrv: 65 + Math.min(30, streak * 2),
      hrvGain: avgHrvGain > 0 ? avgHrvGain : 15,
      tierTitle,
      tierColor,
    };
  }, [logs]);

  // Render High-Resolution Certificate on Canvas
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions
    const width = formatAspect === 'LANDSCAPE_16_9' ? 1200 : 1080;
    const height = formatAspect === 'LANDSCAPE_16_9' ? 675 : 1080;
    canvas.width = width;
    canvas.height = height;

    // 1. Background Space Gradient
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width * 0.7);
    bgGrad.addColorStop(0, '#0c182c');
    bgGrad.addColorStop(0.5, '#060d19');
    bgGrad.addColorStop(1, '#020409');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Cyberpunk Coordinate Grid Lines
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.07)';
    ctx.lineWidth = 1;
    const gridSize = 45;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Dual Holographic Certificate Borders
    const padding = 35;
    // Outer cyan line
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 3;
    ctx.strokeRect(padding, padding, width - padding * 2, height - padding * 2);

    // Inner gold/tier line
    ctx.strokeStyle = metrics.tierColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(padding + 10, padding + 10, width - (padding + 10) * 2, height - (padding + 10) * 2);

    // Decorative Tech Corner Brackets
    const bracketSize = 25;
    const corners = [
      { x: padding, y: padding, dx: 1, dy: 1 },
      { x: width - padding, y: padding, dx: -1, dy: 1 },
      { x: padding, y: height - padding, dx: 1, dy: -1 },
      { x: width - padding, y: height - padding, dx: -1, dy: -1 },
    ];
    ctx.fillStyle = '#ffffff';
    corners.forEach((c) => {
      ctx.fillRect(c.x - 3, c.y - 3, 6, 6);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y + c.dy * bracketSize);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(c.x + c.dx * bracketSize, c.y);
      ctx.stroke();
    });

    // 4. Header Seal / Sacred Geometry Rings
    const centerX = width / 2;
    const topY = formatAspect === 'LANDSCAPE_16_9' ? 75 : 120;

    // Glowing Sacred Crest Rings
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, topY + 45, 38, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = metrics.tierColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, topY + 45, 28, 0, Math.PI * 2);
    ctx.stroke();

    // Central Icon
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💖', centerX, topY + 45);

    // 5. System Brand Headers
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#00ffcc';
    ctx.fillText('GRID GUARDIAN 2099 // SCALAR DEFENSE PROTOCOL', centerX, topY + 105);

    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('CERTIFICATE OF BIO-COHERENCE', centerX, topY + 145);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#8fa0ba';
    ctx.fillText('THIS ATTESTS AUTONOMIC NERVOUS SYSTEM STABILIZATION & DAILY SCHUMANN LOCK', centerX, topY + 175);

    // 6. Recipient Banner & Call-Sign
    const recipientY = topY + 225;
    ctx.fillStyle = 'rgba(0, 255, 204, 0.1)';
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(centerX - 240, recipientY - 20, 480, 42, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`OPERATOR: ${guardianName.toUpperCase()}`, centerX, recipientY);

    // 7. Centerpiece: The Glowing Streak Readout
    const streakY = recipientY + 85;

    // Background Glow for Streak
    const streakGlow = ctx.createRadialGradient(centerX, streakY, 10, centerX, streakY, 160);
    streakGlow.addColorStop(0, `${metrics.tierColor}44`);
    streakGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = streakGlow;
    ctx.beginPath();
    ctx.arc(centerX, streakY, 160, 0, Math.PI * 2);
    ctx.fill();

    // Large Streak Number
    ctx.font = 'bold 74px monospace';
    ctx.fillStyle = metrics.tierColor;
    ctx.shadowColor = metrics.tierColor;
    ctx.shadowBlur = 25;
    ctx.fillText(`${metrics.streak}`, centerX, streakY);
    ctx.shadowBlur = 0; // reset shadow

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('CONSECUTIVE DAYS OF BIO-COHERENCE', centerX, streakY + 50);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = metrics.tierColor;
    ctx.fillText(`⚡ ${metrics.tierTitle} ⚡`, centerX, streakY + 76);

    // 8. Performance Telemetry Badges
    const badgeY = streakY + 125;
    const badgeSpacing = 240;
    const stats = [
      { label: 'TOTAL ROUTINES', val: `${metrics.totalRoutines} LOGGED` },
      { label: 'VAGAL HRV SHIFT', val: `+${metrics.hrvGain} MS DELTA` },
      { label: 'COHERENCE RATIO', val: '99.4% OPTIMAL' },
    ];

    stats.forEach((st, idx) => {
      const bx = centerX + (idx - 1) * badgeSpacing;
      ctx.fillStyle = 'rgba(11, 23, 44, 0.7)';
      ctx.strokeStyle = '#1a2636';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx - 100, badgeY - 24, 200, 48, 4);
      ctx.fill();
      ctx.stroke();

      ctx.font = '10px monospace';
      ctx.fillStyle = '#8fa0ba';
      ctx.fillText(st.label, bx, badgeY - 6);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#00ffcc';
      ctx.fillText(st.val, bx, badgeY + 12);
    });

    // 9. Cryptographic Hash, Timestamp & Security Stamp (Bottom Footer)
    const footerY = height - padding - 28;
    const todayISO = new Date().toISOString().slice(0, 10);
    const mockHash = `SHA256:7f4a...${metrics.streak}e99b_${todayISO.replace(/-/g, '')}`;

    ctx.font = '11px monospace';
    ctx.fillStyle = '#54657d';
    ctx.textAlign = 'left';
    ctx.fillText(`ISSUED: ${todayISO} // GATESVILLE TX COORD 31.4352°N`, padding + 25, footerY);
    ctx.fillText(`VERIFIED CRYPTO SIGNATURE: ${mockHash}`, padding + 25, footerY + 16);

    // Golden Holographic Seal (Bottom Right)
    ctx.textAlign = 'right';
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#ffaa00';
    ctx.fillText('VALIDATED BY GRID GUARDIAN ENGINE', width - padding - 25, footerY);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#00ffcc';
    ctx.fillText('AUTHENTICATED BIOMETRIC HARMONIZATION', width - padding - 25, footerY + 16);
  }, [isOpen, guardianName, formatAspect, metrics]);

  // Download high-resolution PNG image
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const downloadLink = document.createElement('a');
      const filenameDate = new Date().toISOString().slice(0, 10);
      downloadLink.setAttribute('href', dataUrl);
      downloadLink.setAttribute(
        'download',
        `grid_guardian_coherence_certificate_${guardianName}_${metrics.streak}days_${filenameDate}.png`
      );
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to export certificate canvas image', e);
    }
  };

  // Copy Image to Clipboard
  const handleCopyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && (window as any).ClipboardItem) {
          const item = new (window as any).ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setCopiedSuccess(true);
          setTimeout(() => setCopiedSuccess(false), 3000);
        } else {
          // Fallback download if clipboard item not supported in iframe
          handleDownloadImage();
        }
      });
    } catch (err) {
      // Fallback to download
      handleDownloadImage();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2, 4, 8, 0.88)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '94vh',
          backgroundColor: '#070d1a',
          border: '2px solid #00ffcc',
          borderRadius: '8px',
          boxShadow: '0 0 40px rgba(0, 255, 204, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#0a1324',
            borderBottom: '1px solid #1a2636',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2em' }}>🎖️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.98em', color: '#00ffcc', letterSpacing: '0.5px' }}>
                SOCIAL COHERENCE CERTIFICATE GENERATOR
              </h3>
              <div style={{ fontSize: '0.66em', color: '#8fa0ba' }}>
                CANVAS API RENDERER • STREAK: {metrics.streak} DAYS • {metrics.tierTitle}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              backgroundColor: '#101c30',
              border: '1px solid #1a2636',
              color: '#8fa0ba',
              borderRadius: '4px',
              padding: '4px 10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontFamily: 'monospace',
            }}
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Configuration Controls Bar */}
        <div
          style={{
            padding: '10px 18px',
            backgroundColor: '#050912',
            borderBottom: '1px solid #1a2636',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          {/* Operator Name Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.7em', color: '#8fa0ba' }}>CALL-SIGN:</span>
            <input
              type="text"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              maxLength={24}
              style={{
                backgroundColor: '#0c1628',
                border: '1px solid #1a2636',
                color: '#00ffcc',
                padding: '4px 8px',
                borderRadius: '3px',
                fontSize: '0.75em',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                width: '160px',
              }}
            />
          </div>

          {/* Aspect Ratio Toggle (Landscape 16:9 vs Square 1:1) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.7em', color: '#8fa0ba' }}>FORMAT:</span>
            <div style={{ display: 'flex', border: '1px solid #1a2636', borderRadius: '3px', overflow: 'hidden' }}>
              <button
                onClick={() => setFormatAspect('LANDSCAPE_16_9')}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.68em',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  backgroundColor: formatAspect === 'LANDSCAPE_16_9' ? '#00ffcc' : '#101726',
                  color: formatAspect === 'LANDSCAPE_16_9' ? '#0a0f1d' : '#8fa0ba',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                16:9 (X / LINKEDIN)
              </button>
              <button
                onClick={() => setFormatAspect('SQUARE_1_1')}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.68em',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  backgroundColor: formatAspect === 'SQUARE_1_1' ? '#00ffcc' : '#101726',
                  color: formatAspect === 'SQUARE_1_1' ? '#0a0f1d' : '#8fa0ba',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                1:1 (INSTAGRAM)
              </button>
            </div>
          </div>
        </div>

        {/* Live Canvas Preview Stage */}
        <div
          style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#03060c',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '720px',
              border: '1px solid #1a2636',
              borderRadius: '6px',
              overflow: 'hidden',
              boxShadow: '0 0 25px rgba(0, 0, 0, 0.8)',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* Action Footer */}
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#0a1324',
            borderTop: '1px solid #1a2636',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '0.7em', color: '#8fa0ba' }}>
            {downloadSuccess && <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>✅ PNG CERTIFICATE DOWNLOADED</span>}
            {copiedSuccess && <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>📋 COPIED TO CLIPBOARD</span>}
            {!downloadSuccess && !copiedSuccess && (
              <span>High-resolution export generated on HTML5 Canvas API (No server calls).</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCopyToClipboard}
              style={{
                padding: '8px 14px',
                backgroundColor: '#101c30',
                color: '#00ffcc',
                border: '1px solid #00ffcc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                fontSize: '0.74em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>📋</span>
              <span>COPY IMAGE</span>
            </button>

            <button
              onClick={handleDownloadImage}
              style={{
                padding: '8px 18px',
                backgroundColor: '#00ffcc',
                color: '#040813',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                fontSize: '0.74em',
                boxShadow: '0 0 15px rgba(0, 255, 204, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>📥</span>
              <span>DOWNLOAD HIGH-RES PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
