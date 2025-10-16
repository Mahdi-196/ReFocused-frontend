"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Mail, ArrowUp, Heart, Send } from "./icons";
import { emailSubscriptionService } from "@/api/services/emailSubscriptionService";
import LegalModal from "./LegalModal";
import { usePathname } from "next/navigation";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  useEffect(() => {
    // Component initialization
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribing(true);
      try {
        await emailSubscriptionService.subscribe(email);
        setIsSubscribed(true);
        setEmail("");
        setTimeout(() => setIsSubscribed(false), 3000);
      } catch (error: any) {
        // Silently fail - don't show error
      } finally {
        setIsSubscribing(false);
      }
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const legalLinks = [
    { name: "Privacy Policy", onClick: () => setIsLegalModalOpen(true) },
    { name: "Terms of Service", onClick: () => setIsLegalModalOpen(true) },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Data Protection", href: "/data-protection" },
  ];

  return (
    <footer className="bg-[#0F1419] border-t border-gray-800" suppressHydrationWarning>
      {/* Back to Top Button */}
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-end">
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-blue-400 transition-colors hover:scale-105"
          >
            <ArrowUp className="w-4 h-4" />
            <span className="text-sm">Back to top</span>
          </button>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-3">
            <div className="flex items-center space-x-2 mb-4">
              <img
                src="/favicon.svg"
                alt="ReFocused Logo"
                className="w-8 h-8"
              />
              <span className="text-xl font-bold text-white">ReFocused</span>
            </div>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-md">
              Your comprehensive platform for mindfulness, productivity, and
              personal growth. Track your progress, build healthy habits, and
              achieve your goals with ReFocused.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>support@refocused.app</span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-semibold mb-4">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to our newsletter for tips, updates, and mindfulness
              content.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="space-y-3" autoComplete="off" data-lpignore="true">
              <div className="relative" data-lpignore="true">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  autoComplete="off"
                  inputMode="email"
                  name="newsletter-email"
                  id="newsletter-email"
                  data-lpignore="true"
                  disabled={isSubscribing}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors hover:scale-110"
                  disabled={isSubscribing}
                >
                  {isSubscribing ? (
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>

              {isSubscribed && (
                <p className="text-green-400 text-sm">
                  ✓ Successfully subscribed! Thank you.
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          {/* Legal Links & Copyright */}
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap justify-center md:justify-start gap-6">
              {legalLinks.map((link) => (
                'href' in link && link.href ? (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-gray-400 hover:text-blue-400 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                ) : 'onClick' in link ? (
                  <button
                    key={link.name}
                    onClick={link.onClick}
                    className="text-gray-400 hover:text-blue-400 transition-colors text-sm"
                  >
                    {link.name}
                  </button>
                ) : null
              ))}
            </div>

            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span suppressHydrationWarning>
                © {new Date().getFullYear()} ReFocused. Made for your growth.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Modal */}
      <LegalModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} />
    </footer>
  );
};

export default Footer;
