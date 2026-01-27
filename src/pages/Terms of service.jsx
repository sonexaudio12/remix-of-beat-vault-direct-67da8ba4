import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function Terms() {
  return (
    <>
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Effective Date: 27/01/2026</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            Welcome to <strong>Sonex</strong>, a digital beat marketplace operated
            by <strong>Hit Chasers Collective</strong>.
          </p>

          <h2 className="text-xl font-semibold">1. Eligibility</h2>
          <p>You must be at least 18 years old to use Sonex.</p>

          <h2 className="text-xl font-semibold">2. Digital Products & Licensing</h2>
          <p>
            All beats are licensed, not sold. Usage rights depend on the license
            purchased.
          </p>

          <h2 className="text-xl font-semibold">3. Payments</h2>
          <p>Payments are processed securely via third-party providers.</p>

          <h2 className="text-xl font-semibold">4. Termination</h2>
          <p>We reserve the right to suspend or terminate access at any time.</p>

          <h2 className="text-xl font-semibold">5. Contact</h2>
          <p>Email: support@sonex.shop</p>
        </div>
      </main>

      <Footer />
    </>
  );
}
