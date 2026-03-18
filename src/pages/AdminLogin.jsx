import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "admin123") { // Simple password for now
      localStorage.setItem("admin_auth", "true");
      navigate("/admin");
    } else {
      alert("Wrong password ❌");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <form onSubmit={handleLogin} className="p-8 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Access</h1>
        <input
          type="password"
          placeholder="Enter Admin Password"
          className="w-full p-3 bg-black border border-zinc-700 rounded-lg mb-4 focus:outline-none focus:border-indigo-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold transition-all"
        >
          Unlock Dashboard
        </button>
      </form>
    </div>
  );
}
