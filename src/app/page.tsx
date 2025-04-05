"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import {
  Search,
  LogOut,
  FilePlus,
  Eye,
  CheckCircle2,
  MapPin
} from "lucide-react";

const MapReadOnly = dynamic(() => import("../components/MapReadOnly"), { ssr: false });

type Post = {
  _id: string;
  title: string;
  image?: string;
  tags: string[];
  completed: boolean;
  location?: any;
};

type userType = {
  name: string;
  email: string;
  atmin: boolean;
};

export default function LaporanPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [tag, setTag] = useState("");
  const [user, setUser] = useState<userType | null>(null);
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userKabupaten, setUserKabupaten] = useState<string | null>(null);
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (err) => {
          console.error("Gagal mendapatkan lokasi:", err);
        }
      );
    }
  }, []);
  useEffect(() => {
    async function fetchKabupaten(lat: number, lng: number) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
          { headers: { "User-Agent": "laporpak-app" } }
        );
        const data = await res.json();
        const name = data?.address?.county || data?.address?.city || data?.address?.state;
        if (name) setUserKabupaten(name);
      } catch (error) {
        console.error("Gagal ambil kabupaten user:", error);
      }
    }

    if (userLocation) {
      fetchKabupaten(userLocation.lat, userLocation.lng);
    }
  }, [userLocation]);

  const refreshAccessToken = async () => {
    try {
      if (sessionStorage.getItem("token")) {
        return sessionStorage.getItem("token");
      }

      const response = await fetch("/api/user/session/token/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) return;

      const data = await response.json();
      sessionStorage.setItem("token", data.token);
      return data.token;
    } catch (error) {
      console.error("Error refreshing access token:", error);
      return null;
    }
  };

  const logout = async () => {
    await fetch("/api/user/session/logout", { method: "DELETE" });
    sessionStorage.removeItem("token");
    setUser(null);
    router.push("/");
  };

  useEffect(() => {
    async function fetchUserData() {
      try {
        const tokenTemp = await refreshAccessToken();
        if (!tokenTemp) return;

        const response = await fetch(`/api/user/session/token/check`, {
          method: "POST",
          headers: { Authorization: `Bearer ${tokenTemp}` },
        });

        if (!response.ok) return;

        const text = await response.text();
        if (text) {
          const check = JSON.parse(text);
          setUser(check);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(null);
      }
    }

    if (user === null) {
      fetchUserData();
    } else if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  async function fetchPosts(pageNumber = 1, append = false) {
    setLoading(true);
    const res = await fetch(`/api/post?page=${pageNumber}&limit=5`);
    const data = await res.json();

    if (data.length === 0) {
      setHasMore(false);
    } else {
      if (append) {
        setPosts((prev) => [...prev, ...data]);
      } else {
        setPosts(data);
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchPosts(1);
  }, []);

  // Scroll Listener
  useEffect(() => {
    function handleScroll() {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.scrollHeight
      ) {
        if (!loading && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPosts(nextPage, true);
        }
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [page, loading, hasMore]);

  // Tag-based search tetap
  async function fetchByTag() {
    if (!tag.trim()) return fetchPosts(1);
    const res = await fetch(`/api/post/byTag?tag=${tag}`);
    const data = await res.json();
    setPosts(data);
    setHasMore(false); // disable infinite scroll saat cari tag
  }

  async function markAsCompleted(id: string) {
    await fetch(`/api/post/${id}`, { method: "PATCH" });
    await fetchPosts();
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <main>
      <div className="bg-gray-100 sticky top-0">
      <div className="flex items-center justify-between mb-3 py-4 px-3 md:px-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800">Laporan (Concept)</h1>
        {user ? (
          <div className="flex items-center gap-4">
            <a href="/tambah" className="flex items-center gap-1 text-blue-600 hover:underline">
              <FilePlus className="w-4 h-4" /> Lapor
            </a>
            <button
              onClick={logout}
              className="text-red-600 hover:underline text-sm flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
          <a href="/login" className="flex items-center gap-1 text-green-600 hover:underline">
            Login
          </a>
        </div>
        )}
      </div>
      </div>

      <div className="p-3 py-4 md:p-8 md:pt-3 max-w-5xl mx-auto">
      {userKabupaten && (
      <div className="flex justify-center items-center text-sm text-gray-600 mb-5 gap-1">
        <MapPin className="w-4 h-4" />
        <span>Lokasi kamu:</span>
        <strong>{userKabupaten}</strong>
      </div>      
      )}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Cari tag..."
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="p-3 bg-gray-100 border border-gray-200 rounded-lg w-full text-sm focus:outline-none focus:ring focus:border-blue-300"
        />
        <button
          onClick={fetchByTag}
          className="bg-gray-100 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm flex items-center gap-1"
        >
          <Search className="w-4 h-4" /> Cari
        </button>
      </div>

      <div className="grid gap-4">
        {posts
          .filter((p) => !p.completed)
          .map((p) => (
            <div
              key={p._id}
              className="p-5 rounded-xl bg-gray-100 shadow-md flex flex-col gap-4"
            >
              <div
                className={`text-sm font-semibold flex items-center gap-1 ${p.completed ? "text-green-600" : "text-red-600"
                  }`}
              >
                {p.completed ? "✅ Selesai" : "❌ Belum Selesai"}
              </div>


              <p className="text-sm font-bold text-gray-800 whitespace-pre-line">
                {p.title}
              </p>

              <div className="flex flex-col md:flex-row gap-4">
                {p.image && (
                  <img
                    src={p.image}
                    alt=""
                    className="rounded w-full md:w-1/2 h-auto object-cover max-h-60"
                  />
                )}

                {p.location && (
                  <div className="flex-1 min-h-[200px] w-full md:w-1/2 rounded overflow-hidden">
                    <MapReadOnly
                      lat={p.location.coordinates[1]}
                      lng={p.location.coordinates[0]}
                      address={p.location.address}
                    />
                  </div>
                )}
              </div>

              {p.location?.address && (
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {p.location.address}
                </div>
              )}

              <div className="text-sm text-gray-500">
                Tags: {p.tags.map((t) => `#${t}`).join(" ")}
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <a
                  href={`/laporan/${p._id}`}
                  className="bg-black rounded-lg text-white px-3 py-2 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" /> Lihat Detail
                </a>

                {user?.atmin && !p.completed && (
                  <button
                    onClick={() => markAsCompleted(p._id)}
                    className="bg-green-500 rounded-lg text-white px-3 py-2 hover:underline flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Tandai Selesai
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
      {loading && (
        <p className="text-center text-gray-500 mt-4">⏳ Memuat data...</p>
      )}
      {!hasMore && (
        <p className="text-center text-gray-400 mt-4">✅ Semua laporan telah ditampilkan</p>
      )}
      </div>
    </main>
  );
}
