"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { signOut } from "next-auth/react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") return <div>Loading...</div>;
  if (!session) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">
          Welcome, {session.user.name || session.user.username}
        </h1>
        <p className="mb-2">Email: {session.user.email}</p>
        <p className="mb-6">Username: {session.user.username}</p>

        <Link
          href="/account"
          className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 text-center block mb-4"
        >
          Manage Account
        </Link>

        <button
          onClick={() =>
            signOut({ callbackUrl: "/auth/signin" }).then(() =>
              toast.success("Signed out successfully!")
            )
          }
          className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
