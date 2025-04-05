"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
  FileText
} from "lucide-react";

const MapReadOnly = dynamic(() => import("../../../components/MapReadOnly"), {
  ssr: false,
});

type Post = {
  _id: string;
  title: string;
  image?: string;
  tags: string[];
  completed: boolean;
  location?: any;
};

export default function DetailLaporanPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    async function fetchPost() {
      const res = await fetch(`/api/post/${id}`);
      const data = await res.json();
      setPost(data);
    }

    if (id) fetchPost();
  }, [id]);

  if (!post) {
    return (
      <p className="text-center py-10 text-gray-500">
        ⏳ Memuat detail laporan...
      </p>
    );
  }

  return (
    <main className="p-6 md:p-8 max-w-5xl mx-auto">
      <button
        onClick={() => router.push("/")}
        className="text-sm text-blue-600 hover:underline mb-4 flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
        <FileText className="w-6 h-6 text-blue-500" /> Detail Laporan
      </h1>

      <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
        Status:
        {post.completed ? (
          <span className="text-green-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Selesai
          </span>
        ) : (
          <span className="text-yellow-600 font-semibold flex items-center gap-1">
            <Clock className="w-4 h-4" /> Belum Selesai
          </span>
        )}
      </div>

      <div>
        <p className="text-gray-800 text-base md:text-lg whitespace-pre-line">
          {post.title}
        </p>
      </div>

      <div className="text-sm text-gray-500 mb-4 flex items-center gap-2 mt-2">
        <Tag className="w-4 h-4" />
        <span className="text-blue-600">
          {post.tags.map((t) => `#${t}`).join(" ")}
        </span>
      </div>

      {/* Gambar + Peta (Jika Keduanya Ada) */}
      {post.image && post.location ? (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="w-full h-auto aspect-video">
            <img
              src={post.image}
              alt="Gambar laporan"
              className="w-full h-full object-cover rounded-lg shadow-sm"
            />
          </div>
          <div className="w-full h-64 md:h-auto rounded-lg overflow-hidden border shadow-sm">
            <MapReadOnly
              lat={post.location.lat}
              lng={post.location.lng}
              address={post.location.address}
            />
          </div>
        </div>
      ) : post.image ? (
        <div className="w-full max-w-2xl mx-auto mb-4 aspect-video">
          <img
            src={post.image}
            alt="Gambar laporan"
            className="w-full h-full object-cover rounded-lg shadow-sm"
          />
        </div>
      ) : post.location ? (
        <div className="h-64 md:h-96 mb-6 rounded-lg overflow-hidden border shadow-sm">
          <MapReadOnly
            lat={post.location.coordinates[1]}
            lng={post.location.coordinates[0]}
            address={post.location.address}
          />
        </div>
      ) : null}

      {post.location?.address && (
        <div className="text-sm text-gray-500 mt-2 flex items-center gap-1">
          <MapPin className="w-4 h-4" /> {post.location.address}
        </div>
      )}
    </main>
  );
}
