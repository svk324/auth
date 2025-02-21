"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AccountManagement() {
  const { data: session, update, status } = useSession();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState(session?.user?.name || "");
  const [username, setUsername] = useState(session?.user?.username || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && session?.user) {
      setName(session.user.name || "");
      setUsername(session.user.username || "");
      setEmail(session.user.email || "");
    }
  }, [status, session, router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/account/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, email, currentPassword }),
    });

    if (res.ok) {
      await update({ name, username, email });
      toast.success("Profile updated successfully!");
      setIsModalOpen(false);
      setCurrentPassword("");
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to update profile");
    }
  };

  if (status === "loading") return <div>Loading...</div>;
  if (!session || !session.user) return null;

  const isOAuthUser = session.user.emails.some(
    (e) => e.provider !== "credentials"
  );
  const loginMethod = session.user.emails[0]?.provider || "Unknown";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Account Management</h1>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-gray-600">
              <strong>Name:</strong> {session.user.name || "Not set"}
            </p>
            <p className="text-gray-600">
              <strong>Username:</strong> {session.user.username}
            </p>
            <p className="text-gray-600">
              <strong>Email:</strong> {session.user.email}
            </p>
            <p className="text-gray-600">
              <strong>Login Method:</strong>{" "}
              {loginMethod.charAt(0).toUpperCase() + loginMethod.slice(1)}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Update Profile
          </button>
          {!isOAuthUser && (
            <Link
              href="/reset-password"
              className="block w-full py-2 px-4 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-center"
            >
              Reset Password
            </Link>
          )}
          <Link
            href="/delete-account"
            className="block w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 text-center"
          >
            Delete Account
          </Link>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Edit Profile
              </h2>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2 px-4 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
