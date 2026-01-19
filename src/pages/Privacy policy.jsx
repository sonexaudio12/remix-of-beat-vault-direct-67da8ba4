import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function Privacy() {
  return (
    <>
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Effective Date: [Add date]</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            Sonex respects your privacy and is committed to protecting your
            personal data.
          </p>

          <h2 className="text-xl font-semibold">Information We Collect</h2>
          <p>Name, email, and purchase-related information.</p>

          <h2 className="text-xl font-semibold">How We Use Data</h2>
          <p>To provide services, process payments, and improve the platform.</p>

          <h2 className="text-xl font-semibold">Payments</h2>
          <p>Payments are handled by third-party providers like PayPal.</p>

          <h2 className="text-xl font-semibold">Contact</h2>
          <p>Email: support@sonex.com</p>
        </div>
      </main>

      <Footer />
    </>
  );
}
