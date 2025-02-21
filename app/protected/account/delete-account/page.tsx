"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import toast from "react-hot-toast";

export default function DeleteAccount() {
  const { data: session } = useSession();
  const [confirm, setConfirm] = useState("");
  const router = useRouter();

  const username = session?.user?.username || "";
  const expectedConfirmation = `DELETE ${username}`;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();

    if (confirm !== expectedConfirmation) {
      toast.error(`Please type "DELETE ${username}" to confirm`);
      return;
    }

    const res = await fetch("/api/account/delete-account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      toast.success("Account deletion scheduled in 15 days. Log in to cancel.");
      await signOut({ redirect: false });
      setTimeout(() => router.push("/"), 2000);
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to schedule deletion");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Delete Account</h1>
        <p className="mb-4 text-red-500">
          Warning: Your account will be permanently deleted after 15 days unless
          you log in to cancel.
        </p>

        <form onSubmit={handleDelete} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Type "DELETE {username}" to confirm
            </label>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Schedule Deletion
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
