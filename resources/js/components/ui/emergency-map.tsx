'use client';

import L from 'leaflet';
import { useEffect, useRef, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for Leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icon for reporter (red marker)
const createReporterIcon = (category: string) => {
  const colors: Record<string, string> = {
    kecelakaan_lalu_lintas: '#ef4444',
    ibu_hamil: '#ec4899',
    serangan_jantung: '#dc2626',
    serangan_stroke: '#b91c1c',
    home_care: '#22c55e',
    ambulance: '#3b82f6',
  };
  const color = colors[category] || '#ef4444';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 14px;
          font-weight: bold;
        ">!</div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// Custom icon for officer (green marker with pulse)
const createOfficerIcon = () => {
  return L.divIcon({
    className: 'officer-marker',
    html: `
      <div style="position: relative;">
        <div style="
          width: 32px;
          height: 32px;
          background: #22c55e;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          position: relative;
        ">
          <svg style="width: 16px; height: 16px; color: white; transform: rotate(0deg);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #22c55e;
          opacity: 0.5;
          animation: pulse 2s infinite;
          z-index: 1;
        "></div>
        <style>
          @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
            100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
          }
        </style>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

export interface ReportMarker {
  report_id: string;
  status: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  sender_name: string | null;
  sender_phone: string | null;
  waiting_minutes: number;
  operator_name?: string;
  officer_location?: {
    latitude: number;
    longitude: number;
    eta_minutes: number;
    distance_meters: number;
    speed_kmh: number | null;
    updated_at: string;
  } | null;
}

export interface OfficerMarker {
  officer_id: number;
  officer_name: string;
  report_id: string;
  latitude: number;
  longitude: number;
  eta_minutes: number;
  distance_meters: number;
  speed_kmh: number | null;
  updated_at: string;
}

export interface EmergencyMapProps {
  reports: ReportMarker[];
  officers: OfficerMarker[];
  selectedReportId?: string | null;
  onReportClick?: (reportId: string) => void;
  height?: string;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

// OSRM Routing API (free, no API key)
const OSRM_BASE_URL = 'https://router.project-osrm.org';

export default function EmergencyMap({
  reports,
  officers,
  selectedReportId,
  onReportClick,
  height = '500px',
  center = [-7.265, 112.748],
  zoom = 14,
  className = '',
}: EmergencyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const officerMarkersRef = useRef<Map<number, L.Marker>>(new Map());
  const routeLinesRef = useRef<Map<string, L.Polyline>>(new Map());

  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: true,
      attributionControl: true,
    });

    // Add OpenStreetMap tiles (free, no API key)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    setIsMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      setIsMapReady(false);
    };
  }, [center, zoom]);

  // Update report markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    const map = mapInstanceRef.current;
    const currentMarkers = markersRef.current;

    // Remove markers that no longer exist
    const currentReportIds = new Set(reports.map(r => r.report_id));
    currentMarkers.forEach((marker, reportId) => {
      if (!currentReportIds.has(reportId)) {
        marker.remove();
        currentMarkers.delete(reportId);
      }
    });

    // Add/update report markers
    reports.forEach(report => {
      const existingMarker = currentMarkers.get(report.report_id);

      if (existingMarker) {
        // Update position
        existingMarker.setLatLng([report.latitude, report.longitude]);
        // Update icon if status changed
        existingMarker.setIcon(createReporterIcon(report.category));
        // Update popup
        existingMarker.setPopupContent(createReportPopup(report));
      } else {
        // Create new marker
        const marker = L.marker([report.latitude, report.longitude], {
          icon: createReporterIcon(report.category),
        });

        marker.bindPopup(createReportPopup(report), {
          maxWidth: 300,
        });

        marker.on('click', () => {
          if (onReportClick) {
            onReportClick(report.report_id);
          }
        });

        // Add pulse effect for pending reports
        if (report.status === 'pending') {
          const pulseIcon = L.divIcon({
            className: 'pulse-marker',
            html: `
              <div style="
                position: absolute;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: rgba(239, 68, 68, 0.4);
                animation: pulse-ring 2s infinite;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
              "></div>
              <style>
                @keyframes pulse-ring {
                  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
                  100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
                }
              </style>
            `,
            iconSize: [60, 60],
            iconAnchor: [30, 30],
          });
          L.marker([report.latitude, report.longitude], {
            icon: pulseIcon,
            interactive: false,
          }).addTo(map);
        }

        marker.addTo(map);
        currentMarkers.set(report.report_id, marker);
      }

      // Highlight selected report
      if (report.report_id === selectedReportId) {
        const marker = currentMarkers.get(report.report_id);
        if (marker) {
          marker.openPopup();
        }
      }
    });
  }, [reports, selectedReportId, isMapReady, onReportClick]);

  // Update officer markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    const map = mapInstanceRef.current;
    const currentOfficerMarkers = officerMarkersRef.current;

    // Remove markers for officers no longer active
    const currentOfficerIds = new Set(officers.map(o => o.officer_id));
    currentOfficerMarkers.forEach((marker, officerId) => {
      if (!currentOfficerIds.has(officerId)) {
        marker.remove();
        currentOfficerMarkers.delete(officerId);
      }
    });

    // Add/update officer markers
    officers.forEach(officer => {
      const existingMarker = currentOfficerMarkers.get(officer.officer_id);

      if (existingMarker) {
        // Update position
        existingMarker.setLatLng([officer.latitude, officer.longitude]);
        existingMarker.setPopupContent(createOfficerPopup(officer));
      } else {
        // Create new marker
        const marker = L.marker([officer.latitude, officer.longitude], {
          icon: createOfficerIcon(),
        });

        marker.bindPopup(createOfficerPopup(officer), {
          maxWidth: 250,
        });

        marker.addTo(map);
        currentOfficerMarkers.set(officer.officer_id, marker);
      }
    });
  }, [officers, isMapReady]);

  // Fetch and draw routes from OSRM
  const fetchRoute = useCallback(async (
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number,
    reportId: string
  ) => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    try {
      const response = await fetch(
        `${OSRM_BASE_URL}/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`
      );

      if (!response.ok) return;

      const data = await response.json();

      if (data.code !== 'Ok' || !data.routes?.[0]) return;

      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
      );

      // Remove existing route
      const existingRoute = routeLinesRef.current.get(reportId);
      if (existingRoute) {
        existingRoute.remove();
        routeLinesRef.current.delete(reportId);
      }

      // Draw new route
      const routeLine = L.polyline(coordinates, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10',
      });

      routeLine.addTo(map);
      routeLinesRef.current.set(reportId, routeLine);
    } catch (error) {
      console.error('Failed to fetch route:', error);
    }
  }, []);

  // Auto-center and zoom to fit all markers
  const fitBounds = useCallback(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const allPoints: L.LatLngTuple[] = [];

    reports.forEach(r => {
      allPoints.push([r.latitude, r.longitude]);
    });

    officers.forEach(o => {
      allPoints.push([o.latitude, o.longitude]);
    });

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [reports, officers]);

  return (
    <div className={className}>
      <div
        ref={mapRef}
        style={{
          height,
          borderRadius: '0.625rem',
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      />

      {/* Map Controls */}
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={fitBounds}
          className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Fit All
        </button>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            Pelapor
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Petugas
          </span>
        </div>
      </div>

      {/* Map loading indicator */}
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-sm text-muted-foreground">Loading map...</div>
        </div>
      )}
    </div>
  );
}

// Helper functions to create popup content
function createReportPopup(report: ReportMarker): string {
  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    responded: '#3b82f6',
    in_progress: '#f97316',
    arrived: '#22c55e',
    resolved: '#6b7280',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Menunggu',
    responded: 'Direspons',
    in_progress: 'Dalam Perjalanan',
    arrived: 'Sampai',
    resolved: 'Selesai',
  };

  const categoryLabels: Record<string, string> = {
    kecelakaan_lalu_lintas: 'Kec. Lalu Lintas',
    ibu_hamil: 'Ibu Hamil',
    serangan_jantung: 'Ser. Jantung',
    serangan_stroke: 'Ser. Stroke',
    home_care: 'Home Care',
    ambulance: 'Ambulance',
  };

  const eta = report.officer_location?.eta_minutes;
  const distance = report.officer_location?.distance_meters;

  return `
    <div style="min-width: 200px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="
          background: ${statusColors[report.status] || '#6b7280'};
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        ">${statusLabels[report.status] || report.status}</span>
        <span style="font-size: 11px; color: #6b7280;">${categoryLabels[report.category] || report.category}</span>
      </div>
      <div style="font-weight: 600; margin-bottom: 4px;">${report.report_id}</div>
      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${report.address || 'Alamat tidak tersedia'}</div>
      <div style="font-size: 12px; margin-bottom: 4px;">
        <strong>Pelapor:</strong> ${report.sender_name || 'Anonim'}
        ${report.sender_phone ? `<br/>📞 ${report.sender_phone}` : ''}
      </div>
      ${report.waiting_minutes > 0 ? `<div style="font-size: 12px; color: #ef4444;">⏱️ Menunggu ${report.waiting_minutes} menit</div>` : ''}
      ${eta && distance ? `
        <div style="margin-top: 8px; padding: 8px; background: #f0fdf4; border-radius: 6px;">
          <div style="font-size: 12px; color: #166534;">🚗 ETA: ~${eta} menit</div>
          <div style="font-size: 12px; color: #166534;">📍 Jarak: ${formatDistance(distance)}</div>
        </div>
      ` : ''}
    </div>
  `;
}

function createOfficerPopup(officer: OfficerMarker): string {
  return `
    <div style="min-width: 180px;">
      <div style="font-weight: 600; margin-bottom: 4px;">${officer.officer_name || 'Petugas'}</div>
      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">ID: ${officer.officer_id}</div>
      <div style="font-size: 12px; margin-bottom: 4px;">📋 Laporan: ${officer.report_id}</div>
      ${officer.speed_kmh ? `<div style="font-size: 12px; margin-bottom: 4px;">🚀 Speed: ${officer.speed_kmh} km/jam</div>` : ''}
      <div style="
        margin-top: 8px;
        padding: 8px;
        background: #f0fdf4;
        border-radius: 6px;
        font-size: 12px;
        color: #166534;
      ">
        <div>🚗 ETA: ~${officer.eta_minutes} menit</div>
        <div>📍 Jarak: ${formatDistance(officer.distance_meters)}</div>
      </div>
    </div>
  `;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
}