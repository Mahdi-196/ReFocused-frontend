import Link from 'next/link';

export default function LegalOverviewPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 text-gray-300">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Legal Documents</h1>
        <p className="text-sm text-gray-400">Effective date: 2025-08-20</p>
        <p className="text-sm text-gray-400">
          This repository includes draft legal documents suitable for a production application. Update contact details, jurisdiction,
          and business information to match your company before going live.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/privacy" className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 hover:bg-gray-800/60 transition-colors">
          <h2 className="text-xl font-semibold text-white">Privacy Policy</h2>
          <p className="text-sm text-gray-400 mt-2">How we collect, use, share, and protect your information.</p>
        </Link>
        <Link href="/terms" className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 hover:bg-gray-800/60 transition-colors">
          <h2 className="text-xl font-semibold text-white">Terms of Service</h2>
          <p className="text-sm text-gray-400 mt-2">Rules for using ReFocused and your responsibilities.</p>
        </Link>
        <Link href="/cookies" className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 hover:bg-gray-800/60 transition-colors">
          <h2 className="text-xl font-semibold text-white">Cookie Policy</h2>
          <p className="text-sm text-gray-400 mt-2">Types of cookies we use and your choices.</p>
        </Link>
        <Link href="/data-protection" className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-6 hover:bg-gray-800/60 transition-colors">
          <h2 className="text-xl font-semibold text-white">Data Protection</h2>
          <p className="text-sm text-gray-400 mt-2">Your rights, security measures, and international transfers.</p>
        </Link>
      </div>
    </div>
  );
}



