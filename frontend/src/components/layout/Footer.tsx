import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-12 pb-8">
      <div className="container-custom">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span className="font-bold text-white text-sm">PharmaConnect</span>
            </div>
            <p className="text-sm leading-relaxed">
              Your trusted AI-powered online pharmacy marketplace for OTC medications.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/browse" className="hover:text-white transition-colors">Browse Pharmacies</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs">&copy; 2026 PharmaConnect. All rights reserved.</p>
          <p className="text-xs text-gray-500">Built with AI-powered health technology</p>
        </div>
      </div>
    </footer>
  );
}
