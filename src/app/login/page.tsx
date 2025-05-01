"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react"; // opsional

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const refreshAccessToken = async () => {
    const storedToken = sessionStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      window.location.href = "/";
    }

    const response = await fetch("/api/user/session/token/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        setToken(data.token);
        sessionStorage.setItem("token", data.token);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    refreshAccessToken();
  }, []);

  if (isLoading) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const response = await fetch("/api/user/session/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        setToken(data.token);
        sessionStorage.setItem("token", data.token);
        window.location.href = "/";
      }
    } else {
      setErrorMessage(
        response.status === 401
          ? "Username atau password salah."
          : "Terjadi kesalahan server. Coba lagi nanti."
      );
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen px-4">
      <div className="w-full max-w-md  rounded-xl p-6">

        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Masuk</h2>

        {errorMessage && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block font-semibold mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan username"
              maxLength={16}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block font-semibold mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute cursor-pointer hover:text-blue-600 right-2 top-1/2 -translate-y-1/2 text-gray-500"
                aria-label="Toggle password"
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Masuk
          </button>

          <p className="text-center text-sm">
            Belum punya akun?{" "}
            <a
              href="/signup"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Daftar
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
