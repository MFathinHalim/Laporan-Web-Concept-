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
  MapPin,
  Plus,
  XCircle
} from "lucide-react";
import TagComponent from "@/components/TagComponent";

const MapReadOnly = dynamic(() => import("../components/MapReadOnly"), { ssr: false });

type Post = {
  _id: string;
  title: string;
  image?: string;
  tags: string[];
  completed: [];
  location?: any;
};

type userType = {
  _id: any;
  name: string;
  email: string;
  atmin: boolean;
};

export default function LaporanPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [tag, setTag] = useState("");
  const [user, setUser] = useState<userType | null>(null);
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userKabupaten, setUserKabupaten] = useState<string | null>(null);
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (err) => {
          console.error("Gagal mendapatkan lokasi:", err);
        },
        { enableHighAccuracy: true }  // ← ini!
      );
    }
  }, []);
  useEffect(() => {
    async function fetchKabupaten(lat: number, lng: number) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&extratags=1`,
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
    const endpoint = showCompletedOnly ? "/api/post/completed" : "/api/post";
    const res = await fetch(`${endpoint}?page=${pageNumber}&limit=5`);
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

  async function getTag() {
    const res = await fetch(`/api/post/getTag`);
    const data = await res.json();
    console.log(data)
    setTags(data);
  }
  useEffect(() => {
    getTag()
  }, [])

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
    const tokenTemp = await refreshAccessToken();
    if (!tokenTemp) return;

    const res = await fetch(`/api/post/${id}`, {
      method: "PATCH", headers: { Authorization: `Bearer ${tokenTemp}` },
    });
    await fetchPosts();

    if (res.ok) {
      //@ts-expect-error
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === id
            ? {
              ...post,
              //@ts-ignore
              completed: post.completed.includes(user!._id)
                ? post.completed.filter((uid) => uid !== user!._id) // toggle: remove user
                : [...post.completed, user!._id], // toggle: add user
            }
            : post
        )
      );
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);
  useEffect(() => {
    if (tag) {
      fetchByTag();
    }
  }, [tag]);
  return (
    <main>
      <div className="top-0 z-40">
        <div className="flex items-center justify-between pt-4 mt-3 px-4 max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800"></h1>
          {user ? (
            <div className="flex items-center gap-4">
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

      <div className="md:p-3 md:max-w-5xl mx-auto">
        <h1 className=" text-4xl font-bold text-gray-800 text-center">Laporin</h1>

        {userKabupaten ? (
          <div className="sm:px-3 px-0 flex justify-center items-center text-sm text-gray-600 mt-5 gap-1">
            <MapPin className="w-4 h-4" />
            <span>Lokasi kamu:</span>
            <strong>{userKabupaten}</strong>
          </div>
        ) : (
          <div className="sm:px-3 px-0 flex justify-center items-center text-sm text-gray-600 mt-6 gap-1">
            <MapPin className="w-4 h-4" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
        )}
        <div className="px-3 md:px-0 mt-5 mb-3 flex gap-2">
          <input
            type="text"
            placeholder="Cari tag..."
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="p-3 bg-gray-100 border border-gray-200 rounded-full px-5 w-full text-sm focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
        <TagComponent tags={tags} onSelectTag={(name) => setTag(name)} />
        <div className="flex mt-6">
          <button
            onClick={() => {
              setShowCompletedOnly((prev) => !prev);
              setPage(1);
              fetchPosts(1);
            }}
            className="mx-2 md:mx-0 text-sm px-3 py-1.5 bg-gray-100 cursor-pointer border border-gray-300 hover:bg-gray-200 text-gray-800 rounded-full transition"
          >
            {showCompletedOnly ? "Tampilkan yang Belum Selesai" : "Tampilkan yang Sudah Selesai"}
          </button>
        </div>


        <div className="grid gap-4 mt-2">
          {posts.length === 0
            ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`loading-${i}`}
                className="p-5 rounded-xl bg-gray-100 border border-gray-200 shadow-md flex flex-col gap-4 animate-pulse"
              >
                <div className="h-4 w-32 bg-gray-300 rounded" />
                <div className="h-6 w-1/2 bg-gray-300 rounded" />
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/2 h-48 bg-gray-300 rounded" />
                  <div className="w-full md:w-1/2 h-48 bg-gray-300 rounded" />
                </div>
                <div className="h-4 w-40 bg-gray-300 rounded" />
                <div className="h-8 w-full bg-gray-300 rounded" />
              </div>
            ))
            : posts
              .filter((p) => (showCompletedOnly ? p.completed.length >= 3 : true))
              .map((p) => (
                <div
                  key={p._id}
                  className="p-5 rounded-xl bg-gray-100 border border-gray-200 shadow-md flex flex-col gap-4"
                >
                  <div
                    className={`text-sm font-semibold flex items-center gap-1 ${p.completed.length > 3 ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {p.completed.length > 3 ? (
                      <span className="flex items-center font-semibold gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" /> Selesai
                      </span>
                    ) : (
                      <span className="flex items-center font-semibold gap-1 text-red-600">
                        <XCircle className="w-4 h-4" /> Belum Selesai
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-gray-800 whitespace-pre-line">
                    {p.title}
                  </p>

                  <div className="flex flex-col md:flex-row gap-4">
                    {p.image && (
                      p.image.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video
                          src={p.image}
                          controls
                          className="rounded w-full md:w-1/2 h-auto object-cover max-h-60"
                        />
                      ) : (
                        <img
                          src={p.image}
                          alt=""
                          className="rounded w-full md:w-1/2 h-auto object-cover max-h-60"
                        />
                      )
                    )}


                    {p.location && (
                      <div className="flex-1 min-h-[200px] w-full md:w-1/2 rounded overflow-hidden">
                        <MapReadOnly
                          lat={p.location.coordinates[1]}
                          lng={p.location.coordinates[0]}
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

                    {//@ts-ignore
                      p.completed.length < 3 && user && !p.completed.includes(user._id) ? (
                        <button
                          onClick={() => markAsCompleted(p._id)}
                          className="bg-green-500 cursor-pointer rounded-lg text-white px-3 py-2 hover:underline flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Selesai
                        </button>
                      ) : user ? (
                        <button
                          onClick={() => markAsCompleted(p._id)}
                          className="bg-red-500 hover:bg-red-600 cursor-pointer rounded-lg text-white px-3 py-2 hover:underline flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" /> Belum
                        </button>
                      ) : null
                    }

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
      {user && (
        <a
          href="/tambah"
          className="fixed bottom-4 right-4 bg-gray-200 border border-gray-300 hover:bg-gray-300 font-bold p-4 rounded-full shadow-lg"
        >
          <Plus />
        </a>
      )}
    </main>
  );
}
