import { useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react"; // Assuming you're using lucide icons

//@ts-ignore
const CommentsSection = ({ p, comment, user }) => {
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
const handleDelete = async (commentId: string) => {
    const tokenTemp = await refreshAccessToken();
    if (!tokenTemp) return;

    try {
        const res = await fetch(`/api/post/${p._id}/comments?commentId=${commentId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokenTemp}`, // pastikan user.token tersedia
            },
        });

        if (res.ok) {
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
    <div>
        <div className="py-3 border-gray-300 relative">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{comment.user}</span>
            <span className="text-sm text-gray-500">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="text-gray-700 mt-2">{comment.content}</p>
          {user && (comment.user === user.username || user.atmin) && (
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
                    onClick={() => handleDelete(comment._id)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-500 hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
    </div>
  );
};

export default CommentsSection;