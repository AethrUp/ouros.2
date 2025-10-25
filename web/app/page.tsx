import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-[1200px] w-full">
        <h1 className="text-5xl font-bold font-serif">
          Ouros
        </h1>
        <p className="text-xl text-secondary">
          Explore your cosmic path with personalized astrology, tarot readings, and I Ching wisdom
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/login"
            className="px-8 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 border border-border rounded-lg hover:bg-card transition-colors font-medium"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
