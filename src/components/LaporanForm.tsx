"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const MapForm = dynamic(() => import("./MapForm"), { ssr: false });

type Props = {
    onSuccess: () => void;
};

export default function LaporanForm({ onSuccess }: Props) {
    const [formData, setFormData] = useState({
        title: "",
        image: null as File | null,
        lat: "",
        lng: "",
        address: "",
    });

    // State untuk validasi form
    const [isFormValid, setIsFormValid] = useState(false);

    // Effect untuk mengecek validitas form setiap kali ada perubahan di formData
    useEffect(() => {
        const { title, lat, lng, address } = formData;
        const isValid = title.trim() !== "" && lat.trim() !== "" && lng.trim() !== "" && address.trim() !== "";
        setIsFormValid(isValid);
    }, [formData]);
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
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const tokenTemp = await refreshAccessToken();
        if (!tokenTemp) return;
        const body = new FormData();
        body.append("title", formData.title);
        if (formData.image) body.append("image", formData.image);
        body.append("lat", formData.lat);
        body.append("lng", formData.lng);
        body.append("address", formData.address);

        setIsFormValid(false)
        await fetch("/api/post", {
            method: "POST", body, headers: { Authorization: `Bearer ${tokenTemp}` },
        });
        setFormData({ title: "", image: null, lat: "", lng: "", address: "" });
        onSuccess();
    }

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                borderBottom: "none !important"
            }}
            className="space-y-4 py-6 bg-white border-t border-x"
        >

            <div className="px-6">
                <textarea
                    placeholder="Isi laporan (pakai #tag)"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="mb-3 w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring focus:border-blue-300"
                />
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Gambar / Video (opsional)
                </label>
                <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) =>
                        setFormData({ ...formData, image: e.target.files?.[0] || null })
                    }
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
            </div>

            <div className="h-64 rounded overflow-hidden">
                <MapForm
                    lat={parseFloat(formData.lat || "-2.5")}
                    lng={parseFloat(formData.lng || "118")}
                    onChange={(lat, lng) =>
                        setFormData((prev) => ({
                            ...prev,
                            lat: lat.toString(),
                            lng: lng.toString(),
                        }))
                    }
                />
            </div>
            <div className="px-6">
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {formData.address || "Alamat"}
                </div>
                <input
                    type="text"
                    placeholder="Alamat"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    className="w-full mb-3 p-3 border rounded-lg text-sm focus:outline-none focus:ring focus:border-blue-300"
                />

                <button
                    id="submit"
                    type="submit"
                    disabled={!isFormValid}
                    className={`px-6 py-2 rounded-lg shadow-sm text-white ${isFormValid
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-blue-600/20 cursor-not-allowed"
                        }`}
                >
                    Kirim
                </button>
            </div>
        </form>
    );
}
