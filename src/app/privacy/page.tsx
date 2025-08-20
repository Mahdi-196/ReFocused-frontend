export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 text-gray-300">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="text-sm text-gray-400">Effective date: 2025-08-20</p>
      </header>

      <section className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white">Overview</h2>
        <p>
          This Privacy Policy explains how ReFocused ("we", "us", "our") collects, uses, shares, and
          protects your information when you use the ReFocused application and APIs.
        </p>
      </section>

      <section className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white">Information We Collect</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <span className="font-medium text-gray-200">Account data</span>: email, name, profile picture, OAuth identifiers (Google),
            timestamps (created_at, last_login).
          </li>
          <li>
            <span className="font-medium text-gray-200">App data you provide</span>: goals, habits, mood entries (happiness/focus/stress),
            journal collections/entries (which may contain sensitive information), calendars, study sets,
            mantras, voting choices, feedback, and email subscription status.
          </li>
          <li>
            <span className="font-medium text-gray-200">Technical data</span>: IP address (for security and rate limiting), user agent, device
            metadata, request metadata, security logs, monitoring metrics.
          </li>
          <li>
            <span className="font-medium text-gray-200">Authentication/session data</span>: hashed passwords (bcrypt), access/refresh tokens
            (cookies), session flags.
          </li>
          <li>
            <span className="font-medium text-gray-200">AI/chat content</span> you submit when using AI features (proxied via our backend to
            upstream services).
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white">How We Use Information</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide, operate, and improve the service (feature delivery, personalization, performance).</li>
          <li>Security and abuse prevention (rate limiting, anomaly detection, fraud prevention, authentication).</li>
          <li>Customer support and service communications.</li>
          <li>Optional marketing emails (only with your consent).</li>
          <li>Research, analytics, and product development using aggregated/anonymized data.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold text-white">Legal Bases (EEA/UK)</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Contract: to provide the service you request.</li>
          <li>Legitimate interests: security, fraud prevention, service improvement.</li>
          <li>Consent: marketing emails, certain cookies, and where required for AI or analytics.</li>
          <li>Legal obligations: compliance with applicable laws.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold text-white">Sharing and Disclosures</h2>
        <p>We do not sell your personal information. We share data with service providers under contract, strictly for service delivery, including:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Cloud hosting and infrastructure (e.g., AWS: API Gateway/Lambda, database, storage; Redis cache).</li>
          <li>Email delivery and transactional communications.</li>
          <li>Error monitoring and observability (e.g., optional Sentry/OpenTelemetry).</li>
        </ul>
        <p>We may disclose information to comply with law, protect rights and safety, or in connection with a merger/acquisition.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-3">
          <h3 className="text-lg font-semibold text-white">International Transfers</h3>
          <p>Where data is transferred internationally, we use safeguards such as Standard Contractual Clauses and provider commitments.</p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-3">
          <h3 className="text-lg font-semibold text-white">Data Retention</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account and in-app content: retained until you delete it or close your account.</li>
            <li>Security logs and audit events: typically up to 12 months unless required otherwise.</li>
            <li>Rate-limit counters and ephemeral cache: short TTLs (often reset at midnight UTC).</li>
            <li>Deleted emails: stored up to 72 hours to enforce account recreation safeguards.</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-3">
          <h3 className="text-lg font-semibold text-white">Your Rights</h3>
          <p>
            Depending on your location, you may have rights to access, correct, delete, port, restrict, or object to processing of your
            personal data, and to withdraw consent. Contact us to exercise these rights.
          </p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-3">
          <h3 className="text-lg font-semibold text-white">Children’s Privacy</h3>
          <p>The service is not intended for children under 13 (or older age as required by local law). We do not knowingly collect such data.</p>
        </div>
      </section>

      <section className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold text-white">Security</h2>
        <p>
          We employ industry-standard security measures including HTTPS/TLS, bcrypt password hashing, token-based auth, HTTP-only cookies,
          rate limiting, input validation, and defense-in-depth monitoring. No system is 100% secure; please use strong, unique passwords and
          keep credentials safe.
        </p>
      </section>

      <section className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6">
        <h2 className="text-xl font-semibold text-white mb-2">Contact</h2>
        <p>For privacy inquiries or rights requests, contact: <span className="text-blue-400">support@refocused.app</span></p>
      </section>
    </div>
  );
}



