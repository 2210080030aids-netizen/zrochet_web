import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-4xl font-semibold text-brown-dark">Page not found</h1>
      <p className="mt-3 text-text-muted">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-brown-dark px-6 py-3 text-sm font-medium text-white transition hover:bg-brown"
      >
        Back to Home
      </Link>
    </div>
  );
}
