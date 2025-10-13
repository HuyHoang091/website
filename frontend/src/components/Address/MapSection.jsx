import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AddressSearch from './AddressSearch';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
);

const MapSection = ({ onAddressSelect, markerPosition, selectedAddress }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const searchMarkerRef = useRef(null);

    useEffect(() => {
        // Initialize map
        if (!mapInstanceRef.current && mapRef.current) {
            mapInstanceRef.current = L.map(mapRef.current).setView([10.762622, 106.660172], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapInstanceRef.current);

            // Get current location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const lat = pos.coords.latitude;
                        const lon = pos.coords.longitude;

                        const blueIcon = L.icon({
                            iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                            iconSize: [32, 32],
                            iconAnchor: [16, 32]
                        });

                        L.marker([lat, lon], { icon: blueIcon })
                            .addTo(mapInstanceRef.current)
                            .bindPopup("📍 Vị trí của bạn")
                            .openPopup();
                    },
                    (err) => {
                        console.error("Geolocation error:", err);
                    }
                );
            }
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (markerPosition && mapInstanceRef.current) {
            placeMarker(markerPosition.lat, markerPosition.lon, markerPosition.name || '');
        }
    }, [markerPosition]);

    const placeMarker = (lat, lon, name) => {
        if (!mapInstanceRef.current) return;

        if (!searchMarkerRef.current) {
            searchMarkerRef.current = L.marker([lat, lon], { draggable: true })
                .addTo(mapInstanceRef.current)
                .bindPopup(name)
                .openPopup();

            searchMarkerRef.current.on('dragend', async (e) => {
                const pos = e.target.getLatLng();
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json`
                    );
                    const data = await res.json();
                    
                    searchMarkerRef.current.bindPopup(data.display_name).openPopup();
                    onAddressSelect(data.display_name, pos.lat, pos.lng);
                } catch (err) {
                    console.error("Reverse geocoding error:", err);
                }
            });
        } else {
            searchMarkerRef.current
                .setLatLng([lat, lon])
                .bindPopup(name)
                .openPopup();
        }
        
        mapInstanceRef.current.setView([lat, lon], 16);
    };

    const handleAddressSelected = (address, lat, lon) => {
        placeMarker(lat, lon, address);
        onAddressSelect(address, lat, lon);
    };

    return (
        <div className="map-section">
            <div className="section-header">
                <MapIcon />
                <h2>Bản đồ</h2>
            </div>

            <AddressSearch onAddressSelect={handleAddressSelected} selectedAddress={selectedAddress} />

            <div ref={mapRef} className="map-container" />
        </div>
    );
};

export default MapSection;