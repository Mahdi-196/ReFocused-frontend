export default function DataProtectionPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 text-gray-300">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Data Protection</h1>
        <p className="text-sm text-gray-400">Effective date: 2025-08-20</p>
      </header>

      <section className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold text-white">Controller</h2>
        <p>ReFocused acts as the data controller for personal data processed through the app and APIs.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-3">
          <h3 className="text-lg font-semibold text-white">Your Rights</h3>
          <p>
            Subject to law, you have rights to access, rectify, delete, port, restrict, and object. You may withdraw consent at any time where processing is
            based on consent. You also have the right to lodge a complaint with your supervisory authority.
          </p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-3">
          <h3 className="text-lg font-semibold text-white">Requests</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Export data or delete activity via in-app endpoints (see User settings) or contact us.</li>
            <li>Close your account; associated content will be deleted, subject to legal retention requirements.</li>
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold text-white">Security and Safeguards</h2>
        <p>
          We implement technical and organizational measures: encryption in transit, secure credential storage, access controls, rate limiting, structured
          logging, and regular reviews.
        </p>
      </section>

      <section className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold text-white">International Transfers</h2>
        <p>Where data is transferred outside your region, we rely on appropriate safeguards (e.g., SCCs) and vetted providers.</p>
      </section>

      <section className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 space-y-3">
        <h2 className="text-xl font-semibold text-white">Subprocessors</h2>
        <p>
          Key service providers include cloud hosting, email infrastructure, cache/database, and observability platforms. A current list is available on
          request and will be published prior to launch.
        </p>
      </section>

      <section className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6">
        <h2 className="text-xl font-semibold text-white mb-2">Contact</h2>
        <p>For data protection inquiries, data requests, or DPA matters: <span className="text-blue-400">support@refocused.app</span></p>
      </section>

      <section className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6">
        <h2 className="text-xl font-semibold text-white mb-2">Updates</h2>
        <p>We will update these documents from time to time. Material changes will be announced in-app or via email when applicable.</p>
      </section>
    </div>
  );
}



