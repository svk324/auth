export default function About() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">About Page</h1>
        <p className="mb-6">
          This is a public about page accessible to everyone.
        </p>
        <a
          href="/"
          className="inline-block py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
