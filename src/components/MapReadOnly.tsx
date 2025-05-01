"use client";
type MapFormProps = {
  lat: number;
  lng: number;
};

export default function MapReadOnly({ lat, lng }: MapFormProps) {
  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  return (
    <div className="w-full h-full rounded overflow-hidden">
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
      ></iframe>
    </div>
  );
}
