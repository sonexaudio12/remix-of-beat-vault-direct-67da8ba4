import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function Refund() {
  return (
    <>
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-6">Refund Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Effective Date: [Add date]</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            Due to the digital nature of our products, all sales are final.
          </p>

          <h2 className="text-xl font-semibold">No Refunds</h2>
          <p>Once files are downloaded, refunds are not available.</p>

          <h2 className="text-xl font-semibold">Exceptions</h2>
          <p>
            Refunds may be considered for duplicate charges or technical errors.
          </p>

          <h2 className="text-xl font-semibold">License Revocation</h2>
          <p>Refunds revoke all associated licenses.</p>

          <h2 className="text-xl font-semibold">Contact</h2>
          <p>Email: support@sonex.com</p>
        </div>
      </main>

      <Footer />
    </>
  );
}
