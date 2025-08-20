export default function CookiePolicyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 text-gray-300">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Cookie Policy</h1>
        <p className="text-sm text-gray-400">Effective date: 2025-08-20</p>
      </header>

      <section className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold text-white">What Are Cookies?</h2>
        <p>Cookies are small text files stored on your device. We use them to operate secure sessions and remember your preferences.</p>
      </section>

      <section className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white">Cookies We Use</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <span className="font-medium text-gray-200">Strictly Necessary (Authentication)</span>:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><code className="bg-gray-900 px-1 py-0.5 rounded">access_token</code> (HTTP-only): authenticates requests; short-lived.</li>
              <li><code className="bg-gray-900 px-1 py-0.5 rounded">refresh_token</code> (HTTP-only): refreshes sessions; longer-lived.</li>
              <li><code className="bg-gray-900 px-1 py-0.5 rounded">auth_session</code>: indicates an active session for UX; not HTTP-only.</li>
            </ul>
          </li>
          <li>Functionality: may remember preferences in-app.</li>
          <li>Third-party: Google OAuth may set cookies when authenticating.</li>
        </ul>
        <p>
          Cookie attributes include Path=/, SameSite (Lax/None depending on environment), and Secure (enabled in production). Exact lifetimes follow our
          security settings (e.g., access tokens ~30 minutes, refresh tokens ~7–30 days).
        </p>
      </section>

      <section className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold text-white">Your Choices</h2>
        <p>
          Browser settings allow you to block or delete cookies. Blocking strictly necessary cookies may break login or core features. Where required, we
          will present a consent banner for non-essential cookies.
        </p>
      </section>
    </div>
  );
}



