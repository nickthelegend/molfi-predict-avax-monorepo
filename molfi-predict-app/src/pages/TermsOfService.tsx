import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Terms of Service - Molfi"
        description="Read the terms and conditions for using Molfi's prediction market platform."
      />
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
            <p>
              By accessing or using Molfi, you agree to be bound by these Terms of Service and all
              applicable laws and regulations. If you do not agree with any of these terms, you are
              prohibited from using this platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Age Requirement</h2>
            <p>
              You must be at least 18 years old to use Molfi. By using this platform, you represent
              and warrant that you meet this age requirement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Disclaimer</h2>
            <p className="font-semibold text-destructive">
              IMPORTANT: Prediction markets involve significant risk. You may lose all funds you invest.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Trading on prediction markets is speculative and carries risk</li>
              <li>Past performance does not guarantee future results</li>
              <li>You should only invest funds you can afford to lose</li>
              <li>Molfi does not provide financial, investment, or legal advice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Wallet Connection</h2>
            <p>
              To use Molfi, you must connect a compatible cryptocurrency wallet. You are solely
              responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintaining the security of your wallet and private keys</li>
              <li>All transactions initiated from your wallet</li>
              <li>Any fees associated with blockchain transactions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Prohibited Activities</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Manipulate markets or engage in fraudulent trading</li>
              <li>Use bots or automated systems without permission</li>
              <li>Attempt to circumvent security measures</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Interfere with other users' access to the platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
            <p>
              All content on Molfi, including text, graphics, logos, and software, is the property
              of Molfi or its licensors and is protected by copyright and trademark laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
            <p>
              Molfi and its affiliates shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages resulting from your use of the platform, including
              but not limited to loss of profits, data, or other intangible losses.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Service Availability</h2>
            <p>
              We do not guarantee that the platform will be available at all times. We may suspend,
              withdraw, or restrict access to the platform without notice for maintenance or other
              reasons.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Modifications to Service</h2>
            <p>
              We reserve the right to modify or discontinue any part of the service at any time
              without notice. We shall not be liable to you or any third party for any modification,
              suspension, or discontinuance of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws,
              without regard to conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
            <p>
              We reserve the right to update these Terms at any time. We will notify you of any
              changes by posting the new Terms on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at{" "}
              <a href="mailto:legal@molfi.com" className="text-primary hover:underline">
                legal@molfi.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
