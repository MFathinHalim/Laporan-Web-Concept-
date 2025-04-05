"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMapEvents } from "react-leaflet";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type MapFormProps = {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number, address: string) => void;
};

function LocationPicker({ onChange }: { onChange: (lat: number, lng: number, address: string) => void }) {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      const address = await reverseGeocode(lat, lng);
      onChange(lat, lng, address);
    },
  });
  return null;
}

function GeolocationHandler({
  setPosition,
  onChange,
}: {
  setPosition: (pos: [number, number]) => void;
  onChange: (lat: number, lng: number, address: string) => void;
}) {
  const map = useMap();
  const [hasFetchedLocation, setHasFetchedLocation] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation || hasFetchedLocation) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const address = await reverseGeocode(lat, lng);
      setPosition([lat, lng]);
      onChange(lat, lng, address);
      map.setView([lat, lng], 13); // Zoom ke lokasi user
      setHasFetchedLocation(true); // ✅ Hindari fetching ulang
    });
  }, [hasFetchedLocation, map, onChange, setPosition]);

  return null;
}


async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    return data.display_name || "Alamat tidak ditemukan";
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return "Gagal mengambil alamat";
  }
}

export default function MapForm({ lat, lng, onChange }: MapFormProps) {
  const [position, setPosition] = useState<[number, number] | null>([lat, lng]);

  const handleUpdate = (newLat: number, newLng: number, address: string) => {
    setPosition([newLat, newLng]);
    onChange(newLat, newLng, address);
  };

  return position ? (
    <MapContainer center={position} zoom={5} className="w-full h-full rounded">
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeolocationHandler setPosition={setPosition} onChange={handleUpdate} />
      <LocationPicker onChange={handleUpdate} />
      <Marker position={position} icon={markerIcon}>
        <Popup>Lokasi dipilih</Popup>
      </Marker>
    </MapContainer>
  ) : (
    <div className="text-center py-4 text-gray-500">⏳ Memuat peta...</div>
  );
}
