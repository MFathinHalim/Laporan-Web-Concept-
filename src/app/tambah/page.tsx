"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import LaporanForm from "@/components/LaporanForm";

export default function BuatLaporanPage() {
    const router = useRouter();

    const handleSuccess = () => {
        router.push("/");
    };

    return (
        <main className="p-6 md:p-8 max-w-4xl mx-auto">
            <button
                onClick={() => router.push("/")}
                className="text-2xl text-sm text-blue-600 hover:underline"
            >
                ← Kembali ke Beranda
            </button>
            <h1 className="text-2xl font-bold text-gray-800 mb-4 mt-2">📝 Buat Laporan</h1>
            <LaporanForm onSuccess={handleSuccess} />
        </main>
    );
}
