import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-2xl font-semibold text-gray-900">Ingen tilgang</h1>
      <p className="text-gray-600">Du har ikke tilgang til denne siden.</p>
      <Link href="/" className="text-blue-600 hover:underline">
        Tilbake til forsiden
      </Link>
    </div>
  )
}
