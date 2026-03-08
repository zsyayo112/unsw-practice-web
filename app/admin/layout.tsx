import Link from 'next/link'
import AdminShell from './AdminShell'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = { title: 'UNSW Practice Admin' }

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-56 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-700">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">UNSW Practice</p>
          <p className="text-white font-semibold mt-0.5">Admin</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white text-sm transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/problems"
            className="flex items-center gap-2 px-3 py-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white text-sm transition-colors"
          >
            Problems
          </Link>
          <div className="pt-4">
            <Link
              href="/admin/problems/new"
              className="flex items-center gap-2 px-3 py-2 rounded text-blue-400 hover:bg-gray-700 hover:text-blue-300 text-sm transition-colors"
            >
              + New Problem
            </Link>
          </div>
        </nav>
      </aside>
      <AdminShell>{children}</AdminShell>
    </div>
  )
}
