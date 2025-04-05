"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

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

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const body = new FormData();
        body.append("title", formData.title);
        if (formData.image) body.append("image", formData.image);
        if (formData.lat) body.append("lat", formData.lat);
        if (formData.lng) body.append("lng", formData.lng);
        if (formData.address) body.append("address", formData.address);

        await fetch("/api/post", { method: "POST", body });
        setFormData({ title: "", image: null, lat: "", lng: "", address: "" });
        onSuccess();
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 border p-6 rounded-xl bg-white shadow-md"
        >
            <textarea
                placeholder="Isi laporan (pakai #tag)"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring focus:border-blue-300"
            />
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Gambar
                </label>
                <input
                    type="file"
                    accept="image/*"
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

            <input
                type="text"
                placeholder="Alamat"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring focus:border-blue-300"
            />
            <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-sm"
            >
                Kirim
            </button>
        </form>
    );
}
