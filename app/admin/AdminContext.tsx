'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface AdminContextValue {
  secret: string
  setSecret: (s: string) => void
}

const AdminContext = createContext<AdminContextValue>({ secret: '', setSecret: () => {} })

export function useAdminSecret(): AdminContextValue {
  return useContext(AdminContext)
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [secret, setSecretState] = useState('')

  useEffect(() => {
    setSecretState(sessionStorage.getItem('admin-secret') ?? '')
  }, [])

  const setSecret = (s: string) => {
    setSecretState(s)
    sessionStorage.setItem('admin-secret', s)
  }

  return (
    <AdminContext.Provider value={{ secret, setSecret }}>
      {children}
    </AdminContext.Provider>
  )
}
