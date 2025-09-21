import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CertificateNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-6">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Certificate Not Found
        </h1>

        <p className="text-gray-600 mb-8">
          The verification ID you provided does not match any certificate in our system.
          Please check the ID and try again.
        </p>

        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact the issuing organization.
          </p>

          <Link href="/">
            <Button variant="outline">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}