import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function ProtectedHome() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Protected Home Page</h1>
        <p className="mb-6">
          This is a protected page only visible to authenticated users.
        </p>
        {session && (
          <p>
            Welcome, {session.user.name} (@{session.user.username})!
          </p>
        )}
      </div>
    </div>
  );
}
