"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { LogOut, Plus, Eye } from "lucide-react";

const MapReadOnly = dynamic(() => import("../../components/MapReadOnly"), {
  ssr: false,
});

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
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [user, setUser] = useState<userType | null>(null);
  const router = useRouter();

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

  const fetchPosts = useCallback(
    async (pageNumber = 1, append = false) => {
      setLoading(true);
      const res = await fetch(`/api/post?page=${pageNumber}&limit=5`);
      const data = await res.json();

      if (data.length === 0) {
        setReachedEnd(true);
      } else {
        setPosts((prev) => [...prev, ...data]);
        setPage(pageNumber);
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    fetchPosts(1); // initial load
  }, [fetchPosts]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useCallback(
    (node: HTMLElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          if (reachedEnd) {
            setReachedEnd(false);
            fetchPosts(1);
          } else {
            fetchPosts(page + 1);
          }
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, reachedEnd, fetchPosts, page]
  );

  const VideoComponent = ({ post }: any) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
      const currentVideo = videoRef.current;
      if (!currentVideo) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            currentVideo.play().catch(() => {});
          } else {
            currentVideo.pause();
          }
        },
        { threshold: 0.5 } // setengah layar terlihat
      );

      observer.observe(currentVideo);
      return () => observer.disconnect();
    }, []);

    return (
      <video
        ref={videoRef}
        src={post.image}
        loop
        controls  // Menambahkan controls untuk mengontrol video
        className="w-sm h-auto object-cover"
      />
    );
  };

  return (
    <main className="w-screen h-screen overflow-x-hidden bg-black snap-y snap-mandatory">
      {posts.map((post, index) => {
        const isLast = index === posts.length - 1;
        return (
          <section
            ref={isLast ? lastPostRef : null}
            key={`${post._id}-${index}`}
            className="snap-start w-screen h-screen flex justify-center items-center bg-black text-white overflow-hidden"
          >
            <div className="relative w-full h-full flex justify-center items-center">
              {/* Media: video, image, atau map */}
              {post.image ? (
                post.image.match(/\.(mp4|webm|ogg)$/i) ? (
                  <VideoComponent post={post} />
                ) : (
                  <img
                    src={post.image}
                    alt=""
                    className="w-sm h-auto object-cover"
                  />
                )
              ) : post.location ? (
                <div className="w-sm h-auto">
                  <MapReadOnly
                    lat={post.location.coordinates[1]}
                    lng={post.location.coordinates[0]}
                  />
                </div>
              ) : null}

              {/* Overlay */}
              <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end items-center p-6 text-center pointer-events-none">
                <div className="pointer-events-auto">
                  <h2 className="text-xl font-bold mb-3">{post.title}</h2>
                  <a
                    href={`/laporan/${post._id}`}
                    className="bg-white text-black px-4 py-2 rounded text-sm hover:bg-gray-200 inline-flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Lihat Detail
                  </a>
                  <p className="text-xs text-gray-300 mt-2">
                    Tags: {post.tags.map((t: string) => `#${t}`).join(" ")}
                  </p>
                </div>
              </div>
            </div>
          </section>
        );
      })}
      {loading && (
        <div className="w-full h-screen flex justify-center items-center">
          <p className="text-gray-500">⏳ Memuat data...</p>
        </div>
      )}
      {user && (
        <a
          href="/tambah"
          className="fixed bottom-4 right-4 bg-gray-200 border border-gray-300 hover:bg-gray-300 font-bold p-4 rounded-full shadow-lg"
        >
          <Plus />
        </a>
      )}
      <a
        href="/"
        className="font-bold fixed top-4 left-4 px-3 py-1 rounded-lg bg-transparent text-white mix-blend-difference">
        Laporin
      </a>
    </main>
  );
}
