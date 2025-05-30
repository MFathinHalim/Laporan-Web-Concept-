"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  MessageCircle,
  Send,
  Trash2,
  MoreVertical,
  XCircle,
  Flag
} from "lucide-react";
import CommentsSection from "@/components/CommentSection";

const MapReadOnly = dynamic(() => import("../../../components/MapReadOnly"), {
  ssr: false,
});

type Post = {
  _id: string;
  title: string;
  image?: string;
  tags: string[];
  completed: [];
  userId: any;
  location?: any;
  user?: string; // Tambahkan user pada post
};

type Comment = {
  _id: string;
  user: string;
  content: string;
  createdAt: string;
};

function SkeletonPage() {
  return (
    <div className="py-6 md:px-8 max-w-5xl mx-auto space-y-4">
      <div className="h-6 mx-6 md:mx-8 bg-gray-300 rounded w-40 animate-pulse" /> {/* Kembali */}
      <div className="h-8 mx-6 md:mx-8 bg-gray-300 rounded w-1/2 animate-pulse" /> {/* Title */}
      <div className="h-4 mx-6 md:mx-8 bg-gray-200 rounded w-32 animate-pulse" /> {/* Status */}

      <div className="w-full h-64 md:mx-8 bg-gray-200 rounded animate-pulse" /> {/* Gambar/Peta */}

      <div className="h-6 mx-6 md:mx-8 bg-gray-300 rounded w-32 animate-pulse" /> {/* Alamat */}

      <div className="h-8 mx-6 md:mx-8 bg-gray-300 rounded w-40 animate-pulse mt-6" /> {/* Komentar Title */}
      <div className="space-y-2 px-6 md:px-8">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="p-3 rounded animate-pulse space-y-2">
            <div className="h-4 bg-gray-300 rounded w-1/4" /> {/* User */}
            <div className="h-3 bg-gray-200 rounded w-3/4" /> {/* Timestamp */}
            <div className="h-4 bg-gray-200 rounded w-full" /> {/* Comment line */}
            <div className="h-4 bg-gray-200 rounded w-2/3" /> {/* Comment line shorter */}
          </div>
        ))}
      </div>
    </div>
  );
}


export default function DetailLaporanPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null); // Menyimpan user yang sedang login
  const commentsEndRef = useRef<HTMLDivElement | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const handleDelete = async () => {
    const tokenTemp = await refreshAccessToken();
    if (!tokenTemp) return;
    const confirmDelete = window.confirm("Yakin ingin menghapus laporan ini?");
    if (!confirmDelete) return;

    try {
      //@ts-ignore
      const res = await fetch(`/api/post?postId=${post._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenTemp}`, // pastikan user.token tersedia
        },
      });

      if (res.ok) {
        alert("Laporan berhasil dihapus.");
        window.location.reload(); // atau panggil ulang fetch data
      } else {
        const error = await res.json();
        alert(`Gagal menghapus: ${error.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menghapus.");
    }
  };
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

  async function markAsCompleted(id: string) {
    const tokenTemp = await refreshAccessToken();
    if (!tokenTemp) return;

    const res = await fetch(`/api/post/${id}`, {
      method: "PATCH", headers: { Authorization: `Bearer ${tokenTemp}` },
    });
    if (!res.ok) throw new Error("Failed to fetch posts");
    const data = await res.json();
    if (res.ok) {
      setPost(data);
    }
  }

  useEffect(() => {
    async function fetchPost() {
      const res = await fetch(`/api/post/${id}`);
      const data = await res.json();
      setPost(data);
    }

    if (id) fetchPost();
  }, [id]);

  const fetchComments = async (page: number = 1) => {
    setLoading(true);
    const res = await fetch(`/api/post/${id}/comments?page=${page}`);
    const data = await res.json();
    console.log(data)
    if (data.length < 10) {
      setHasMore(false);
    }

    setComments((prevComments) => [...prevComments, ...data]);
    setLoading(false);
  };

  useEffect(() => {
    if (id) {
      fetchComments();
    }
  }, [id]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() === "") return;

    const body = JSON.stringify({ user: user, content: newComment });
    const res = await fetch(`/api/post/${id}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (res.ok) {
      setNewComment("");
      setComments([])
      fetchComments(); // Fetch new comments after submission
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    //@ts-ignore
    const bottom = e.target.scrollHeight === e.target.scrollTop + e.target.clientHeight;
    if (bottom && hasMore && !loading) {
      fetchComments(comments.length / 10 + 1); // Load next page
    }
  };

  if (!post) {
    return <SkeletonPage />;
  }

  const handleReport = async () => {
    const tokenTemp = await refreshAccessToken();
    if (!tokenTemp) return;

    try {
      const res = await fetch(`/api/report/post?postId=${post._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenTemp}`, // pastikan user.token tersedia
        },
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Gagal menghapus: ${error.error}`);
      }

    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menghapus.");
    }
  };

  return (
    <main className="py-6 max-w-5xl mx-auto">
      <button
        onClick={() => router.push("/")}
        className="text-sm px-6 md:px-8 text-blue-600 hover:underline cursor-pointer mb-4 flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
      </button>

      <div className="flex justify-between align-items-center pr-3 md:pr-6">
        <h1 className="text-2xl px-6 md:px-8 font-bold text-gray-800 mb-2 flex items-center gap-2">
          {post.title}
        </h1>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded hover:bg-gray-200 cursor-pointer"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>

          {showMenu && (
            <div className="absolute right-2 mt-1 bg-white border rounded shadow z-10">
              <button
                onClick={handleReport}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm w-full text-left"
              >
                <Flag className="w-4 h-4" /> Report
              </button>
              {user && (post.userId === user._id || user.atmin) && (
                <button
                  onClick={handleDelete}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-500 hover:text-white w-full text-left"
                >
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="text-sm px-6 md:px-8 text-gray-600 mb-3 flex items-center gap-2">
        {/*@ts-ignore*/}
        {post.completed.includes(post.userId) || post.completed.length > 10 ? (
          <span className="text-green-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Konfirmasi
          </span>
        ) : (
          <span className="text-yellow-600 font-semibold flex items-center gap-1">
            <Clock className="w-4 h-4" /> Belum Terkonfirmasi
          </span>
        )}
        {/*@ts-ignore*/}
        {user && (!post.completed.includes(user._id)) ? (
          <button
            onClick={() => markAsCompleted(post._id)}
            className="text-green-500 cursor-pointer rounded-lg px-3 py-2 hover:underline flex items-center gap-1"
          >
            Sudah selesai?
          </button>
          //@ts-ignore
        ) : user && post.completed.includes(user._id) ? (
          <button
            onClick={() => markAsCompleted(post._id)}
            className=" cursor-pointer rounded-lg text-red-500 px-3 py-2 hover:underline flex items-center gap-1"
          >
            Belum selesai?
          </button>
        ) : null}
      </div>

      {/* Gambar + Peta (Jika Keduanya Ada) */}
      {post.image && post.location ? (
        <div className="grid md:grid-cols-2 md:px-8 mb-4 md:gap-4">
          <div className="w-full h-auto aspect-video">
            {post.image.match(/\.(mp4|webm|ogg)$/i) ? (
              <video
                src={post.image}
                controls
                className="w-full h-full object-cover shadow-sm"
              />
            ) : (
              <img
                src={post.image}
                alt="Gambar laporan"
                className="w-full h-full object-cover shadow-sm"
              />
            )}
          </div>
          <div className="w-full h-64 md:h-auto overflow-hidden shadow-sm">
            <MapReadOnly
              lat={post.location.coordinates[1]}
              lng={post.location.coordinates[0]}
            />
          </div>
        </div>
      ) : post.image ? (
        <div className="w-full max-w-2xl mx-auto md:mx-8 mb-4 aspect-video">
          {post.image.match(/\.(mp4|webm|ogg)$/i) ? (
            <video
              src={post.image}
              controls
              className="w-full h-full object-cover shadow-sm"
            />
          ) : (
            <img
              src={post.image}
              alt="Gambar laporan"
              className="w-full h-full object-cover shadow-sm"
            />
          )}
        </div>
      ) : post.location ? (
        <div className="h-64 md:h-96 mb-4 md:mx-8 overflow-hidden shadow-sm">
          <MapReadOnly
            lat={post.location.coordinates[1]}
            lng={post.location.coordinates[0]}
          />
        </div>
      ) : null}


      {post.location?.address && (
        <div className="text-sm px-6 md:px-8 text-gray-500 flex items-center gap-1">
          <MapPin className="w-4 h-4" /> {post.location.address}
        </div>
      )}

      {/* Comments Section */}
      <div className="mt-4 px-6 md:px-8">
        <h2 className="text-xl font-semibold mb-4">
          <MessageCircle className="inline w-5 h-5 text-blue-500" /> Komentar
        </h2>

        {/* Cek jika user login */}
        {user ? (
          <form onSubmit={handleSubmitComment} className="flex items-center gap-4 mx-auto">
            <div className="w-full relative">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Tulis komentar..."
                className="w-full py-3 border-b  border-neutral-300 text-sm text-gray-800 focus:outline-none focus:border-b-3 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out"
              />
              <button type="submit" className="absolute top-1/2 right-4 transform -translate-y-1/2">
                <Send className="text-gray-500 hover:text-blue-600 transition-all duration-200" />
              </button>
            </div>
          </form>
        ) : (
          <p className="text-center text-gray-500">Masuk untuk menulis komentar.</p>
        )}


        <div
          className="max-h-80 overflow-y-auto space-y-2 mt-4"
          onScroll={handleScroll}
          ref={commentsEndRef}
        >
          {comments.map((comment) => (
            <CommentsSection key={comment._id + Math.random()} p={post} comment={comment} user={user} />
          ))}
          {loading && (
            <div className="space-y-2">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="p-3 rounded animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-20 h-4 bg-gray-300 rounded"></div>
                    <div className="w-32 h-3 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-full h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
