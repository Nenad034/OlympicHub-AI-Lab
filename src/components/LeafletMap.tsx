import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet + React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

interface LeafletMapProps {
    lat: number;
    lng: number;
    zoom?: number;
    height?: string;
    borderRadius?: string;
}

// Component to handle map centering when coordinates change
const ChangeView = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
};

const LeafletMap: React.FC<LeafletMapProps> = ({
    lat,
    lng,
    zoom = 13,
    height = '100%',
    borderRadius = '0px'
}) => {
    const position: [number, number] = [lat, lng];

    return (
        <div style={{ width: '100%', height, borderRadius, overflow: 'hidden' }}>
            <MapContainer
                center={position}
                zoom={zoom}
                style={{ width: '100%', height: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position} />
                <ChangeView center={position} />
            </MapContainer>
        </div>
    );
};

export default LeafletMap;
