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
        <main className="pt-6 md:px-8 md:pt-8 max-w-4xl mx-auto">
            <button
                onClick={() => router.push("/")}
                className="mx-6 md:mx-0 text-2xl text-sm text-blue-600 hover:underline"
            >
                ← Kembali ke Beranda
            </button>
            <h1 className="text-2xl font-bold text-gray-800 mb-4 mt-2 text-center md:text-left">📝 Buat Laporan</h1>
            <LaporanForm onSuccess={handleSuccess} />
        </main>
    );
}
