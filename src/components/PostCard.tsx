import { CheckCircle2, Eye, MapPin, MoreVertical, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import MapReadOnly from "./MapReadOnly";

//@ts-ignore
function PostCard({ p, user, markAsCompleted }) {
    const [showMenu, setShowMenu] = useState(false);
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
    const handleDelete = async () => {
        const tokenTemp = await refreshAccessToken();
        if (!tokenTemp) return;
        const confirmDelete = window.confirm("Yakin ingin menghapus laporan ini?");
        if (!confirmDelete) return;

        try {
            const res = await fetch(`/api/post?postId=${p._id}`, {
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

    return (
        <div
            key={p._id}
            className="relative py-5 rounded-xl bg-gray-100 border-t border-b md:border-r md:border-l border-gray-200 shadow-md flex flex-col gap-4"
        >
            {user && (p.userId === user._id || user.atmin) && (
                <div className="absolute top-2 right-2">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1 rounded hover:bg-gray-200 cursor-pointer"
                    >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 mt-1 bg-white border rounded shadow z-10">
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-500 hover:underline cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" /> Hapus
                            </button>
                        </div>
                    )}
                </div>
            )}



            {/* Rest of your content */}
            <div
                className={`px-5 text-sm font-semibold flex items-center gap-1 ${p.completed.length > 10 ? "text-green-600" : "text-red-600"
                    }`}
            >
                {p.completed.includes(p.userId) || p.completed.length > 10 ? (
                    <span className="flex items-center font-semibold gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" /> Selesai
                    </span>
                ) : (
                    <span className="flex items-center font-semibold gap-1 text-red-600">
                        <XCircle className="w-4 h-4" /> Belum Terkonfirmasi
                    </span>
                )}
            </div>

            <p className="px-5 text-sm font-bold text-gray-800 whitespace-pre-line">
                {p.title}
            </p>

            <div className="md:px-5 px-0 w-full flex flex-col md:flex-row md:gap-4">
                {p.image &&
                    (p.image.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video
                            src={p.image}
                            controls
                            className="md:rounded w-full md:w-1/2 h-auto object-cover max-h-60"
                        />
                    ) : (
                        <img
                            src={p.image}
                            alt=""
                            className="md:rounded w-full md:w-1/2 h-auto object-cover max-h-60"
                        />
                    ))}

                {p.location && (
                    <div className="hidden md:block md:flex-1 min-h-[200px] w-full md:w-1/2 overflow-hidden">
                        <MapReadOnly
                            lat={p.location.coordinates[1]}
                            lng={p.location.coordinates[0]}
                        />
                    </div>
                )}
            </div>

            {p.location?.address && (
                <div className="px-5 text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {p.location.address}
                </div>
            )}

            <div className="px-5 text-sm text-gray-500">
                Tags: {p.tags.map((t: any) => `#${t}`).join(" ")}
            </div>

            <div className="px-5 flex flex-wrap gap-3 text-sm">
                <a
                    href={`/laporan/${p._id}`}
                    className="bg-black rounded-lg text-white px-3 py-2 hover:underline flex items-center gap-1"
                >
                    <Eye className="w-4 h-4" /> Lihat Detail
                </a>

                {user && (!p.completed.includes(user._id)) ? (
                    <button
                        onClick={() => markAsCompleted(p._id)}
                        className="bg-green-500 cursor-pointer rounded-lg text-white px-3 py-2 hover:underline flex items-center gap-1"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Selesai
                    </button>
                ) : user && p.completed.includes(user._id) ? (
                    <button
                        onClick={() => markAsCompleted(p._id)}
                        className="bg-red-500 hover:bg-red-600 cursor-pointer rounded-lg text-white px-3 py-2 hover:underline flex items-center gap-1"
                    >
                        <XCircle className="w-4 h-4" /> Belum
                    </button>
                ) : null}

            </div>
        </div>
    );
}

export default PostCard;
