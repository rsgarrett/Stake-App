import Link from "next/link"

/**
 * Self-registration is disabled. Accounts are provisioned by stake leadership
 * from Settings → Permissions roster (invite or create with temp password).
 */
export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-6 p-8 text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Accounts are by invitation
        </h2>
        <p className="text-sm text-gray-600">
          Access to the Stake President Management App is provisioned by stake
          leadership. If you serve in the stake presidency, on the high council,
          or as a clerk or executive secretary, contact your stake clerk or
          executive secretary to receive an invitation.
        </p>
        <p className="text-sm text-gray-600">
          Already received an invitation email? Follow the link in that email to
          set your password, then sign in below.
        </p>
        <Link
          href="/login"
          className="inline-flex justify-center py-2 px-6 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Go to sign in
        </Link>
      </div>
    </div>
  )
}
