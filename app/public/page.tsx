export default function PublicHome() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Home Page</h1>
        <p className="mb-6">This is a public page accessible to everyone.</p>
        <a
          href="/auth/signin"
          className="inline-block py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Sign In
        </a>
        <a
          href="/about"
          className="inline-block ml-2 py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          About
        </a>
      </div>
    </div>
  );
}
