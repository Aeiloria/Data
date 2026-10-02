import React, { useState, useRef, useEffect } from 'react';
import { calculateDistance } from '../hooks/useEMFCalculator';
import { CustomPin } from '../hooks/useIndexedDB';

export interface InfrastructureNode {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  baseEmissionRadiusMeters?: number;
  isShielded?: boolean;
}

interface ArcGISViewportProps {
  userLat: number;
  userLon: number;
  nearbyNodes: InfrastructureNode[];
  customPins?: CustomPin[];
  onAddPin?: (pin: CustomPin) => void;
  onSelectNode?: (node: InfrastructureNode) => void;
  onClearShield?: (nodeId: string) => void;
}

export const ArcGISViewport: React.FC<ArcGISViewportProps> = ({
  userLat,
  userLon,
  nearbyNodes,
  customPins = [],
  onAddPin,
  onSelectNode,
  onClearShield
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showVoronoi, setShowVoronoi] = useState<boolean>(true);
  const [showSatellitePlume, setShowSatellitePlume] = useState<boolean>(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('arcgis-102');
  const [newPinLabel, setNewPinLabel] = useState<string>('');
  const [isDroppingPin, setIsDroppingPin] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Radar sweep angle
  const [sweepAngle, setSweepAngle] = useState(0);

  useEffect(() => {
    const sweepInterval = setInterval(() => {
      setSweepAngle((prev) => (prev + 0.03) % (2 * Math.PI));
    }, 30);
    return () => clearInterval(sweepInterval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear canvas
    ctx.fillStyle = '#060a13';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw Holographic Polar Grid
    ctx.strokeStyle = '#1a2636';
    ctx.lineWidth = 1;

    // Rings
    const rings = [45, 90, 135, 180];
    rings.forEach((r) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r * zoomLevel, 0, 2 * Math.PI);
      ctx.stroke();
    });

    // Cross axes
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Radar Sweep Line
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, 180 * zoomLevel, sweepAngle, sweepAngle + 0.35);
    ctx.closePath();
    const sweepGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 180 * zoomLevel);
    sweepGrad.addColorStop(0, 'rgba(0, 255, 204, 0.25)');
    sweepGrad.addColorStop(1, 'rgba(0, 255, 204, 0)');
    ctx.fillStyle = sweepGrad;
    ctx.fill();
    ctx.restore();

    // 2. Draw Sentinel-5P NO2 Column Static Plume Overlay
    if (showSatellitePlume) {
      ctx.save();
      const plumeGrad = ctx.createRadialGradient(centerX + 60, centerY - 45, 15, centerX + 60, centerY - 45, 110 * zoomLevel);
      plumeGrad.addColorStop(0, 'rgba(255, 85, 0, 0.22)');
      plumeGrad.addColorStop(0.6, 'rgba(255, 170, 0, 0.08)');
      plumeGrad.addColorStop(1, 'rgba(255, 170, 0, 0)');
      ctx.fillStyle = plumeGrad;
      ctx.beginPath();
      ctx.arc(centerX + 60, centerY - 45, 110 * zoomLevel, 0, 2 * Math.PI);
      ctx.fill();

      ctx.font = '8px monospace';
      ctx.fillStyle = '#ffaa00';
      ctx.fillText('🛰️ TROPOMI NO2 PLUME [CONC: 4.8e15 molec/cm²]', centerX + 70, centerY - 55);
      ctx.restore();
    }

    // 3. Scale factor for lat/lon to canvas pixels
    const scale = 16000 * zoomLevel;

    // 4. Draw Voronoi / Delaunay Grid Vectors
    if (showVoronoi && nearbyNodes.length > 1) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 255, 204, 0.15)';
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      for (let i = 0; i < nearbyNodes.length; i++) {
        const n1 = nearbyNodes[i];
        const x1 = centerX + (n1.longitude - userLon) * scale;
        const y1 = centerY - (n1.latitude - userLat) * scale;
        for (let j = i + 1; j < nearbyNodes.length; j++) {
          const n2 = nearbyNodes[j];
          const x2 = centerX + (n2.longitude - userLon) * scale;
          const y2 = centerY - (n2.latitude - userLat) * scale;
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // 5. Draw Surrounding Infrastructure Nodes
    nearbyNodes.forEach((node) => {
      const dx = (node.longitude - userLon) * scale;
      const dy = -(node.latitude - userLat) * scale;
      const targetX = centerX + dx;
      const targetY = centerY + dy;

      if (targetX < -20 || targetX > width + 20 || targetY < -20 || targetY > height + 20) return;

      const isSelected = node.id === selectedNodeId;

      // Draw Vector Coupling Line from User to Node
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(targetX, targetY);
      ctx.strokeStyle = isSelected ? 'rgba(255, 0, 51, 0.7)' : 'rgba(255, 0, 51, 0.25)';
      ctx.lineWidth = isSelected ? 1.5 : 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();

      // Node Emission Halo
      const emissionR = ((node.baseEmissionRadiusMeters || 30) / 8) * zoomLevel;
      ctx.save();
      ctx.beginPath();
      ctx.arc(targetX, targetY, Math.max(12, emissionR), 0, 2 * Math.PI);
      ctx.fillStyle = node.isShielded ? 'rgba(0, 255, 204, 0.12)' : 'rgba(255, 0, 51, 0.12)';
      ctx.fill();
      ctx.strokeStyle = node.isShielded ? 'rgba(0, 255, 204, 0.4)' : 'rgba(255, 0, 51, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Node Marker Point
      ctx.beginPath();
      ctx.arc(targetX, targetY, isSelected ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = node.isShielded ? '#00ffcc' : '#ff0033';
      ctx.shadowColor = node.isShielded ? '#00ffcc' : '#ff0033';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();

      // Node Label
      ctx.font = '9px monospace';
      ctx.fillStyle = isSelected ? '#ffffff' : '#8fa0ba';
      ctx.fillText(`⚡ ${node.name.slice(0, 24)}`, targetX + 8, targetY + 3);
    });

    // 6. Draw Custom Dropped Pins
    customPins.forEach((pin) => {
      const dx = (pin.longitude - userLon) * scale;
      const dy = -(pin.latitude - userLat) * scale;
      const px = centerX + dx;
      const py = centerY + dy;

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffaa00';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '9px monospace';
      ctx.fillStyle = '#ffaa00';
      ctx.fillText(`📍 ${pin.label}`, px + 6, py - 4);
      ctx.restore();
    });

    // 7. Draw User Reference Center Coordinate Fix
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 12D Maharic Shield protective boundary ring around user
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 4]);
    ctx.stroke();

    ctx.font = '10px monospace';
    ctx.fillStyle = '#00ffcc';
    ctx.fillText('📍 YOU [GPS_FIX]', centerX + 12, centerY - 8);
    ctx.restore();

  }, [userLat, userLon, nearbyNodes, customPins, zoomLevel, showVoronoi, showSatellitePlume, sweepAngle, selectedNodeId]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 16000 * zoomLevel;

    // Check if clicked close to an existing node
    for (const node of nearbyNodes) {
      const nx = centerX + (node.longitude - userLon) * scale;
      const ny = centerY - (node.latitude - userLat) * scale;
      const dist = Math.hypot(clickX - nx, clickY - ny);
      if (dist < 15) {
        setSelectedNodeId(node.id);
        if (onSelectNode) onSelectNode(node);
        return;
      }
    }

    // Otherwise calculate clicked lat/lon for dropping a pin
    const clickedLon = userLon + (clickX - centerX) / scale;
    const clickedLat = userLat - (clickY - centerY) / scale;

    if (isDroppingPin && onAddPin) {
      const pinName = newPinLabel.trim() || `Pin #${customPins.length + 1}`;
      onAddPin({
        id: `pin-${Date.now()}`,
        label: pinName,
        latitude: parseFloat(clickedLat.toFixed(6)),
        longitude: parseFloat(clickedLon.toFixed(6)),
        pinnedAt: new Date().toISOString(),
        category: 'MONITOR_POINT'
      });
      setNewPinLabel('');
      setIsDroppingPin(false);
    }
  };

  const selectedNode = nearbyNodes.find((n) => n.id === selectedNodeId);
  const distanceToSelected = selectedNode
    ? calculateDistance(userLat, userLon, selectedNode.latitude, selectedNode.longitude)
    : 0;

  return (
    <div style={{ padding: '16px 20px', backgroundColor: '#060a13', borderTop: '1px solid #1a2636', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <h3 style={{ color: '#00ffcc', margin: 0, fontSize: '0.95em' }}>
            🗺️ GEO-STRATIGRAPHIC VIEWPORT // ARCGIS DATA OVERLAY
          </h3>
          <span style={{ fontSize: '0.7em', color: '#8fa0ba' }}>
            SECTOR: G6-GATESVILLE (31.4351°N, 97.7439°W)
          </span>
        </div>

        {/* Viewport Map Controls */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.2, z + 0.25))}
            style={{
              padding: '3px 8px',
              backgroundColor: '#101726',
              color: '#00ffcc',
              border: '1px solid #1a2636',
              borderRadius: '2px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85em'
            }}
          >
            +
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.25))}
            style={{
              padding: '3px 8px',
              backgroundColor: '#101726',
              color: '#00ffcc',
              border: '1px solid #1a2636',
              borderRadius: '2px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85em'
            }}
          >
            −
          </button>
          <button
            onClick={() => setShowVoronoi((v) => !v)}
            style={{
              padding: '3px 6px',
              backgroundColor: showVoronoi ? 'rgba(0, 255, 204, 0.15)' : '#101726',
              color: showVoronoi ? '#00ffcc' : '#8fa0ba',
              border: '1px solid #1a2636',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '0.7em'
            }}
          >
            Voronoi
          </button>
          <button
            onClick={() => setShowSatellitePlume((p) => !p)}
            style={{
              padding: '3px 6px',
              backgroundColor: showSatellitePlume ? 'rgba(255, 170, 0, 0.15)' : '#101726',
              color: showSatellitePlume ? '#ffaa00' : '#8fa0ba',
              border: '1px solid #1a2636',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '0.7em'
            }}
          >
            SatScan
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport Frame */}
      <div style={{ position: 'relative', border: '1px solid #1a2636', borderRadius: '4px', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={560}
          height={240}
          onClick={handleCanvasClick}
          style={{ width: '100%', height: '240px', backgroundColor: '#0a0f1d', cursor: isDroppingPin ? 'crosshair' : 'pointer' }}
        />

        {/* Overlay Telemetry Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            fontSize: '0.72em',
            color: '#8fa0ba',
            backgroundColor: 'rgba(10, 15, 29, 0.88)',
            padding: '3px 8px',
            borderRadius: '2px',
            border: '1px solid #1a2636'
          }}
        >
          🛰️ SAT TIMELINE SCAN: ACTIVE VECTOR BASELINE
        </div>

        {/* Selected target badge */}
        {selectedNode && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              fontSize: '0.72em',
              color: '#ffffff',
              backgroundColor: 'rgba(10, 15, 29, 0.92)',
              padding: '4px 10px',
              borderRadius: '2px',
              border: '1px solid #ff0033'
            }}
          >
            <span style={{ color: '#ff0033' }}>🎯 LOCKED:</span> {selectedNode.name}
            <div style={{ color: '#8fa0ba' }}>
              DIST: {distanceToSelected}m | LAT: {selectedNode.latitude.toFixed(4)} LON: {selectedNode.longitude.toFixed(4)}
            </div>
          </div>
        )}
      </div>

      {/* Pin Dropping & Target Node Inception Controls */}
      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={() => setIsDroppingPin((d) => !d)}
            style={{
              padding: '5px 10px',
              fontSize: '0.75em',
              backgroundColor: isDroppingPin ? '#ffaa00' : '#101726',
              color: isDroppingPin ? '#0a0f1d' : '#ffaa00',
              border: `1px solid ${isDroppingPin ? '#ffaa00' : '#1a2636'}`,
              borderRadius: '3px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isDroppingPin ? '🎯 Click Map to Place Pin' : '📍 Drop Custom Pin'}
          </button>
          {isDroppingPin && (
            <input
              type="text"
              placeholder="Pin label (e.g. Ridge Beacon)"
              value={newPinLabel}
              onChange={(e) => setNewPinLabel(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '0.75em',
                backgroundColor: '#101726',
                color: '#ffffff',
                border: '1px solid #1a2636',
                borderRadius: '3px',
                fontFamily: 'monospace',
                outline: 'none'
              }}
            />
          )}
        </div>

        {selectedNode && onClearShield && (
          <button
            onClick={() => onClearShield(selectedNode.id)}
            style={{
              padding: '5px 12px',
              fontSize: '0.75em',
              backgroundColor: selectedNode.isShielded ? '#101726' : '#ff0033',
              color: '#ffffff',
              border: `1px solid ${selectedNode.isShielded ? '#00ffcc' : '#ff0033'}`,
              borderRadius: '3px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {selectedNode.isShielded ? '🛡️ SHIELD RE-POLARIZED (LOCKED)' : '⚡ INITIATE 12D SHIELD LOCK'}
          </button>
        )}
      </div>
    </div>
  );
};
