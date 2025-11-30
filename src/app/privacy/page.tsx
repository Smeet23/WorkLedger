import Link from "next/link"
import { Building2 } from "lucide-react"
import { BackButton } from "@/components/navigation/back-button"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                WorkLedger
              </span>
            </Link>
            <BackButton fallbackUrl="/" />
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
              <p className="text-gray-600">Last updated: November 30, 2025</p>
            </div>

            <div className="prose prose-gray max-w-none">
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  WorkLedger ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  By using WorkLedger, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Information You Provide</h3>
                <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
                  <li><strong>Account Information:</strong> Name, email address, company name, and password when you create an account.</li>
                  <li><strong>Profile Information:</strong> Job title, profile picture, and other details you choose to add.</li>
                  <li><strong>Payment Information:</strong> Billing address and payment method details (processed securely by our payment provider).</li>
                  <li><strong>Communications:</strong> Information you provide when contacting us for support.</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Information from Integrations</h3>
                <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
                  <li><strong>GitHub/GitLab Data:</strong> Repository metadata, commit history, pull requests, and contribution statistics (we do not access or store your source code).</li>
                  <li><strong>Development Activity:</strong> Programming languages used, frameworks detected, and development patterns.</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Automatically Collected Information</h3>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li><strong>Usage Data:</strong> Pages visited, features used, and actions taken within the platform.</li>
                  <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers.</li>
                  <li><strong>Log Data:</strong> IP address, access times, and referring URLs.</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
                <p className="text-gray-600 leading-relaxed mb-4">We use the information we collect to:</p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Detect and analyze skills from your development activity</li>
                  <li>Generate certificates based on verified skills</li>
                  <li>Provide team analytics and insights to administrators</li>
                  <li>Process payments and send transaction notifications</li>
                  <li>Send service-related communications and updates</li>
                  <li>Respond to your requests and provide customer support</li>
                  <li>Detect, prevent, and address technical issues and security threats</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Sharing and Disclosure</h2>
                <p className="text-gray-600 leading-relaxed mb-4">We do not sell your personal information. We may share your information in the following circumstances:</p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li><strong>With Your Organization:</strong> If you're part of a company account, your employer/administrator may access your skill data and certificates.</li>
                  <li><strong>Service Providers:</strong> Third-party vendors who help us operate our platform (hosting, analytics, payment processing).</li>
                  <li><strong>Certificate Verification:</strong> Limited information is shared when someone verifies a certificate you've issued.</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety.</li>
                  <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Encryption in transit (TLS 1.3) and at rest (AES-256)</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Secure data centers with physical security measures</li>
                  <li>Employee security training and access restrictions</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
                <p className="text-gray-600 leading-relaxed">
                  We retain your information for as long as your account is active or as needed to provide services. If you delete your account, we will delete or anonymize your personal information within 30 days, except where retention is required by law or for legitimate business purposes (such as maintaining audit logs).
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights (GDPR)</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  If you are in the European Economic Area (EEA), you have the following rights:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
                  <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                  <li><strong>Restriction:</strong> Request limitation of processing</li>
                  <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                  <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                  <li><strong>Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  To exercise these rights, contact us at <a href="mailto:privacy@workledger.com" className="text-blue-600 hover:underline">privacy@workledger.com</a>.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies and Tracking</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We use cookies and similar tracking technologies to:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li><strong>Essential Cookies:</strong> Required for the platform to function properly</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how you use our services</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  You can control cookies through your browser settings. Note that disabling certain cookies may affect functionality.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
                <p className="text-gray-600 leading-relaxed">
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including Standard Contractual Clauses approved by the European Commission, to protect your data during international transfers.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
                <p className="text-gray-600 leading-relaxed">
                  WorkLedger is not intended for individuals under 16 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Policy</h2>
                <p className="text-gray-600 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  If you have questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-gray-700 mb-2"><strong>WorkLedger</strong></p>
                  <p className="text-gray-600">Email: <a href="mailto:privacy@workledger.com" className="text-blue-600 hover:underline">privacy@workledger.com</a></p>
                  <p className="text-gray-600">Support: <a href="mailto:support@workledger.com" className="text-blue-600 hover:underline">support@workledger.com</a></p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-8 bg-gray-50 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© 2025 WorkLedger. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link>
              <Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
              <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
