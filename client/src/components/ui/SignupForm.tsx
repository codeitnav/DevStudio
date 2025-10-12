"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const SignupForm = ({ onSwitchToLogin }: { onSwitchToLogin: () => void }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signup, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signup({ username, email, password });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Create Account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#166EC1]"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#166EC1]"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#166EC1]"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#166EC1] text-white py-2 rounded-md hover:bg-[#145ca5] transition-colors disabled:bg-gray-400"
        >
          {isLoading ? "Creating..." : "Sign Up"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-4">
        Already have an account?{" "}
        <button onClick={onSwitchToLogin} className="text-[#166EC1] hover:underline font-semibold">
          Login
        </button>
      </p>
    </div>
  );
};

export default SignupForm;