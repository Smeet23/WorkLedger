export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            WorkLedger
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Corporate Skill Certification Platform - Track employee growth, generate verified certificates
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-16">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-semibold mb-4">For Companies</h2>
              <p className="text-gray-600 mb-6">
                Track employee skill development, automate performance insights, and issue verified certificates.
              </p>
              <div className="space-y-2 text-left">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Automated skill tracking from GitHub</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Team skill matrix & analytics</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>Privacy-first data controls</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-semibold mb-4">For Employees</h2>
              <p className="text-gray-600 mb-6">
                Receive verified certificates showcasing your professional growth and achievements.
              </p>
              <div className="space-y-2 text-left">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Verified skill certificates</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Professional growth timeline</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Portable career credentials</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-gray-500">
              🚧 Platform in development - MVP coming soon
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}