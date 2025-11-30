import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  Building2,
  Zap,
  Users,
  Shield,
  Award,
  Github,
  ArrowRight,
  HelpCircle,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const plans = [
  {
    name: "Starter",
    description: "Perfect for small teams getting started",
    price: "Free",
    priceDetail: "forever",
    cta: "Get Started",
    ctaVariant: "outline" as const,
    features: [
      "Up to 5 team members",
      "GitHub integration",
      "Basic skill detection",
      "5 certificates per month",
      "Email support",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    description: "For growing teams that need more",
    price: "€29",
    priceDetail: "per month",
    cta: "Start Free Trial",
    ctaVariant: "default" as const,
    features: [
      "Up to 25 team members",
      "GitHub + GitLab integration",
      "Advanced skill detection",
      "Unlimited certificates",
      "Team analytics dashboard",
      "Priority email support",
      "Custom certificate branding",
    ],
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    description: "For large organizations with custom needs",
    price: "Custom",
    priceDetail: "contact us",
    cta: "Contact Sales",
    ctaVariant: "outline" as const,
    features: [
      "Unlimited team members",
      "All integrations (GitHub, GitLab, Jira, Slack)",
      "AI-powered skill insights",
      "Unlimited certificates",
      "Advanced analytics & reporting",
      "Dedicated account manager",
      "SSO & SAML authentication",
      "Custom integrations",
      "SLA guarantee",
    ],
    highlighted: false,
  },
]

const faqs = [
  {
    question: "Can I switch plans later?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated amount for the remainder of your billing cycle. When downgrading, the new rate will apply at the start of your next billing cycle."
  },
  {
    question: "Is there a free trial for paid plans?",
    answer: "Yes! All paid plans come with a 14-day free trial. No credit card required to start. You'll have full access to all features during the trial period."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, MasterCard, American Express) and can arrange invoicing for Enterprise customers. All payments are processed securely through Stripe."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Absolutely. You can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period."
  },
  {
    question: "Do you offer discounts for nonprofits or education?",
    answer: "Yes! We offer special pricing for registered nonprofits, educational institutions, and open source projects. Contact us to learn more about our discount programs."
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "Your data remains available for 30 days after cancellation. You can export all your data, including certificates and analytics, during this period. After 30 days, data is permanently deleted."
  },
]

export default function PricingPage() {
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
            <div className="hidden md:flex items-center gap-8">
              <Link href="/#how-it-works" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                How it works?
              </Link>
              <Link href="/#features" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Features
              </Link>
              <Link href="/#testimonials" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Reviews
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="text-sm">
                <Link href="/auth/signin?type=company">Sign In</Link>
              </Button>
              <Button asChild className="rounded-full shadow-md hover:shadow-lg transition-all">
                <Link href="/auth/signup?type=company">
                  Try for Free
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Simple, transparent pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose the plan that fits your team
            </h1>
            <p className="text-xl text-gray-600">
              Start free and scale as you grow. All plans include core features to track your team's growth.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl p-8 ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-blue-500 to-indigo-500 text-white shadow-2xl scale-105"
                    : "bg-white border border-gray-200 shadow-sm"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white px-4 py-1">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${plan.highlighted ? "text-blue-100" : "text-gray-600"}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-bold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.highlighted ? "text-blue-100" : "text-gray-500"}`}>
                      {plan.priceDetail}
                    </span>
                  </div>
                </div>

                <Button
                  asChild
                  variant={plan.highlighted ? "secondary" : plan.ctaVariant}
                  className={`w-full mb-8 ${plan.highlighted ? "bg-white text-blue-600 hover:bg-gray-100" : ""}`}
                >
                  <Link href="/auth/signup?type=company">
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? "text-blue-200" : "text-green-500"}`} />
                      <span className={`text-sm ${plan.highlighted ? "text-blue-50" : "text-gray-600"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Compare all features
            </h2>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Features</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-900">Starter</th>
                    <th className="text-center py-4 px-4 font-semibold text-blue-600">Pro</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <FeatureRow feature="Team members" starter="5" pro="25" enterprise="Unlimited" />
                  <FeatureRow feature="GitHub integration" starter={true} pro={true} enterprise={true} />
                  <FeatureRow feature="GitLab integration" starter={false} pro={true} enterprise={true} />
                  <FeatureRow feature="Jira integration" starter={false} pro={false} enterprise={true} />
                  <FeatureRow feature="Slack integration" starter={false} pro={false} enterprise={true} />
                  <FeatureRow feature="Skill detection" starter="Basic" pro="Advanced" enterprise="AI-Powered" />
                  <FeatureRow feature="Certificates per month" starter="5" pro="Unlimited" enterprise="Unlimited" />
                  <FeatureRow feature="Custom branding" starter={false} pro={true} enterprise={true} />
                  <FeatureRow feature="Team analytics" starter={false} pro={true} enterprise={true} />
                  <FeatureRow feature="API access" starter={false} pro={true} enterprise={true} />
                  <FeatureRow feature="SSO / SAML" starter={false} pro={false} enterprise={true} />
                  <FeatureRow feature="Dedicated support" starter={false} pro={false} enterprise={true} />
                  <FeatureRow feature="SLA guarantee" starter={false} pro={false} enterprise={true} />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Secure</h4>
                <p className="text-sm text-gray-600">Enterprise-grade security</p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Fast</h4>
                <p className="text-sm text-gray-600">Setup in 5 minutes</p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">5,000+ Teams</h4>
                <p className="text-sm text-gray-600">Trust WorkLedger</p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                  <Award className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">100K+</h4>
                <p className="text-sm text-gray-600">Certificates issued</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <HelpCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Frequently asked questions
              </h2>
              <p className="text-gray-600">
                Everything you need to know about our pricing
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-white rounded-2xl px-6 border border-gray-200"
                >
                  <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-500 to-indigo-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to track your team's growth?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Start free today. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <Link href="/auth/signup?type=company">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Link href="mailto:sales@workledger.com">
                  Contact Sales
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-8 bg-gray-50 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">WorkLedger</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
              <Link href="/#faq" className="hover:text-blue-600 transition-colors">FAQ</Link>
            </div>
            <p className="text-sm text-gray-500">© 2025 WorkLedger. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureRow({
  feature,
  starter,
  pro,
  enterprise,
}: {
  feature: string
  starter: boolean | string
  pro: boolean | string
  enterprise: boolean | string
}) {
  const renderValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="h-5 w-5 text-green-500 mx-auto" />
      ) : (
        <span className="text-gray-300">—</span>
      )
    }
    return <span className="text-sm text-gray-700">{value}</span>
  }

  return (
    <tr>
      <td className="py-4 px-6 text-sm text-gray-700">{feature}</td>
      <td className="py-4 px-4 text-center">{renderValue(starter)}</td>
      <td className="py-4 px-4 text-center bg-blue-50/50">{renderValue(pro)}</td>
      <td className="py-4 px-4 text-center">{renderValue(enterprise)}</td>
    </tr>
  )
}
