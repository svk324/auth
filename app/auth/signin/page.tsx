"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);
  const [deletionDaysLeft, setDeletionDaysLeft] = useState(0);
  const router = useRouter();

  const handleSubmit = async (
    e: React.FormEvent,
    breakDeletion: boolean = false
  ) => {
    e.preventDefault();
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      breakDeletion: breakDeletion.toString(),
    });

    if (result?.error) {
      if (result.error.startsWith("SCHEDULED_DELETION:")) {
        const daysLeft = parseInt(result.error.split(":")[1], 10);
        setDeletionDaysLeft(daysLeft);
        setIsDeletionModalOpen(true);
      } else {
        toast.error(result.error);
      }
    } else if (result?.ok) {
      toast.success("Logged in successfully!");
      router.push("/dashboard");
    }
  };

  const handleBreakDeletion = (e: React.FormEvent) => {
    handleSubmit(e, true); // Pass breakDeletion: true
  };

  const handleDontBreakDeletion = () => {
    setIsDeletionModalOpen(false);
    setEmail("");
    setPassword("");
    toast("Login aborted. Deletion remains scheduled.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Sign In</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
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
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Sign In
          </button>
        </form>
        <button
          onClick={() => signIn("google")}
          className="w-full mt-4 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Sign In with Google
        </button>
        <button
          onClick={() => signIn("github")}
          className="w-full mt-4 py-2 px-4 bg-gray-800 text-white rounded-md hover:bg-gray-900"
        >
          Sign In with GitHub
        </button>
      </div>

      {isDeletionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Account Scheduled for Deletion
            </h2>
            <p className="mb-4 text-gray-600">
              Your account is scheduled for deletion in {deletionDaysLeft} days.
              Logging in will cancel this. Do you want to proceed?
            </p>
            <form onSubmit={handleBreakDeletion} className="flex space-x-3">
              <button
                type="button"
                onClick={handleDontBreakDeletion}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                No, Delete It
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Yes, Continue
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
