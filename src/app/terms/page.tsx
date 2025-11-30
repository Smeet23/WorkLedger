import Link from "next/link"
import { Building2 } from "lucide-react"
import { BackButton } from "@/components/navigation/back-button"

export default function TermsOfServicePage() {
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
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
              <p className="text-gray-600">Last updated: November 30, 2025</p>
            </div>

            <div className="prose prose-gray max-w-none">
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  By accessing or using WorkLedger ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  These Terms apply to all visitors, users, and others who access or use the Service. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  WorkLedger is a platform that helps organizations track employee skills and professional development through integration with development tools. Our services include:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Skill detection and tracking from code repositories</li>
                  <li>Certificate generation for verified skills</li>
                  <li>Team analytics and reporting</li>
                  <li>Integration with third-party development tools (GitHub, GitLab, etc.)</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  To use certain features of the Service, you must register for an account. When you register, you agree to:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Keep your password secure and confidential</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized access or security breach</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  We reserve the right to suspend or terminate accounts that violate these Terms or are inactive for extended periods.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Subscription and Payments</h2>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Billing</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Paid subscriptions are billed in advance on a monthly or annual basis. By subscribing to a paid plan, you authorize us to charge your payment method for the applicable fees.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Free Trial</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We may offer free trials for paid plans. At the end of the trial period, your subscription will automatically convert to a paid subscription unless you cancel before the trial ends.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Cancellation</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of your current billing period. We do not provide refunds for partial subscription periods.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">4.4 Price Changes</h3>
                <p className="text-gray-600 leading-relaxed">
                  We may change our prices at any time. Price changes will be communicated in advance and will apply to subsequent billing periods.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acceptable Use</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on intellectual property rights of others</li>
                  <li>Transmit malware, viruses, or other malicious code</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the Service or servers</li>
                  <li>Engage in automated data collection without permission</li>
                  <li>Impersonate another person or entity</li>
                  <li>Use the Service for fraudulent purposes</li>
                  <li>Generate false or misleading certificates</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Our Intellectual Property</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  The Service and its original content, features, and functionality are owned by WorkLedger and are protected by copyright, trademark, and other intellectual property laws.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Your Content</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  You retain ownership of any content you submit to the Service. By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, process, and display that content for the purpose of providing the Service.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">6.3 Certificates</h3>
                <p className="text-gray-600 leading-relaxed">
                  Certificates generated through the Service are owned by WorkLedger but licensed to you for personal and professional use. You may share and display certificates but may not alter, falsify, or misrepresent them.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Third-Party Integrations</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  The Service integrates with third-party platforms (such as GitHub and GitLab). Your use of these integrations is subject to the respective third party's terms of service. We are not responsible for the content, policies, or practices of third-party services.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  By connecting third-party accounts, you authorize us to access the data necessary to provide our services, in accordance with our Privacy Policy.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data and Privacy</h2>
                <p className="text-gray-600 leading-relaxed">
                  Your privacy is important to us. Our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> explains how we collect, use, and protect your information. By using the Service, you agree to our Privacy Policy.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimer of Warranties</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE</li>
                  <li>Non-infringement of third-party rights</li>
                  <li>Uninterrupted, secure, or error-free operation</li>
                  <li>Accuracy or reliability of any information obtained through the Service</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  Skill detection and certificates are based on available data and algorithms. We do not guarantee the accuracy of skill assessments or that certificates will be recognized by any particular employer or institution.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, WORKLEDGER SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Loss of profits, data, or business opportunities</li>
                  <li>Service interruptions or data loss</li>
                  <li>Unauthorized access to your account</li>
                  <li>Errors or inaccuracies in skill assessments</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  Our total liability for any claims arising from your use of the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Indemnification</h2>
                <p className="text-gray-600 leading-relaxed">
                  You agree to indemnify and hold harmless WorkLedger and its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from your use of the Service, your violation of these Terms, or your violation of any rights of a third party.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Termination</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Breach of these Terms</li>
                  <li>Request by law enforcement or government agencies</li>
                  <li>Extended periods of inactivity</li>
                  <li>Suspected fraudulent or illegal activity</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  Upon termination, your right to use the Service will immediately cease. Provisions of these Terms that should survive termination will remain in effect.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to Terms</h2>
                <p className="text-gray-600 leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the updated Terms on the Service and updating the "Last updated" date. Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Governing Law</h2>
                <p className="text-gray-600 leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of the European Union and the jurisdiction in which WorkLedger operates, without regard to conflict of law provisions.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Dispute Resolution</h2>
                <p className="text-gray-600 leading-relaxed">
                  Any disputes arising from these Terms or your use of the Service shall first be attempted to be resolved through informal negotiation. If a resolution cannot be reached, disputes shall be submitted to binding arbitration in accordance with applicable arbitration rules. You agree to waive your right to participate in class action lawsuits.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Severability</h2>
                <p className="text-gray-600 leading-relaxed">
                  If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Contact Information</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  If you have any questions about these Terms, please contact us:
                </p>
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-gray-700 mb-2"><strong>WorkLedger</strong></p>
                  <p className="text-gray-600">Email: <a href="mailto:legal@workledger.com" className="text-blue-600 hover:underline">legal@workledger.com</a></p>
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
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
              <Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
              <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
