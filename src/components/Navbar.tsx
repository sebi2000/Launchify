export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
      <h1 className="text-xl font-bold">MyStore</h1>
      <div className="space-x-6">
        <a href="/" className="hover:text-blue-600">Home</a>
        <a href="/create-products" className="hover:text-blue-600">Create your products</a>
        <a href="/products" className="hover:text-blue-600">View your products</a>
      </div>
    </nav>
  );
}
