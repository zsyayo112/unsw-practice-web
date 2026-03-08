import { NextRequest, NextResponse } from 'next/server'

export function isAdminAuthenticated(req: NextRequest): boolean {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET
}

export function unauthorizedResponse() {
  return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
}
