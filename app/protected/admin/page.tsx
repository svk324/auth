import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  // Example admin check
  if (session?.user.email !== "vijay@sathram.in") {
    redirect("/protected");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p className="mb-6">
          This is an admin-only page with restricted access.
        </p>
        <p>
          Welcome, Admin {session.user.name} (@{session.user.username})!
        </p>
      </div>
    </div>
  );
}
