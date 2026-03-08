'use client'

import { useState, type ReactNode } from 'react'
import { AdminProvider, useAdminSecret } from './AdminContext'

function SecretBanner() {
  const { secret, setSecret } = useAdminSecret()
  const [input, setInput] = useState('')

  if (secret) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-3 text-sm">
      <span className="text-amber-800 font-medium">管理员验证：</span>
      <input
        type="password"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && setSecret(input)}
        className="border border-amber-300 rounded px-2 py-1 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-amber-400"
        placeholder="输入 ADMIN_SECRET..."
      />
      <button
        onClick={() => setSecret(input)}
        className="bg-amber-500 text-white px-3 py-1 rounded text-sm hover:bg-amber-600"
      >
        确认
      </button>
    </div>
  )
}

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        <SecretBanner />
        <div className="p-8 flex-1">{children}</div>
      </main>
    </AdminProvider>
  )
}
