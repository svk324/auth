"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  // Password strength: min 8 chars, 1 upper, 1 lower, 1 number, 1 special
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

  const validateForm = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return false;
    }
    if (!passwordRegex.test(newPassword)) {
      toast.error(
        "New password must be 8+ characters with uppercase, lowercase, number, and special character"
      );
      return false;
    }
    if (newPassword === currentPassword) {
      toast.error("New password must differ from current password");
      return false;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return false;
    }
    return true;
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const res = await fetch("/api/account/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        toast.success("Password reset successfully!");
        setTimeout(() => router.push("/account"), 2000);
      } else {
        const data = await res.json();
        switch (res.status) {
          case 400:
            toast.error(data.error || "Invalid request");
            break;
          case 401:
            toast.error("Unauthorized");
            break;
          default:
            toast.error("Failed to reset password");
        }
      }
    } catch (error: any) {
      console.error("Reset password client error:", error.message);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Reset Password</h1>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Reset Password
          </button>
        </form>

        <button
          onClick={() => router.push("/account")}
          className="w-full mt-4 py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
