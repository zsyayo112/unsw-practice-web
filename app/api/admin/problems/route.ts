import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/admin/auth'
import type { Database } from '@/lib/types/database'

type ProblemInsert = Database['public']['Tables']['problems']['Insert']

interface TestCasePayload {
  input: string
  expected_output: string
  is_hidden: boolean
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return unauthorizedResponse()

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('problems')
      .select('*, test_cases(*)')
      .order('order_index', { ascending: true })

    if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    return NextResponse.json({ data, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return unauthorizedResponse()

  try {
    const body = (await req.json()) as { test_cases?: TestCasePayload[]; [key: string]: unknown }
    const { test_cases, ...problemData } = body
    const supabase = await createClient()

    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .insert(problemData as ProblemInsert)
      .select()
      .single()

    if (problemError)
      return NextResponse.json({ data: null, error: problemError.message }, { status: 500 })

    const problemRow = problem as { id: string }

    if (test_cases && test_cases.length > 0) {
      const { error: tcError } = await supabase.from('test_cases').insert(
        test_cases.map((tc, i) => ({
          problem_id: problemRow.id,
          input: tc.input,
          expected_output: tc.expected_output,
          is_hidden: tc.is_hidden,
          order_index: i,
        }))
      )
      if (tcError)
        return NextResponse.json({ data: null, error: tcError.message }, { status: 500 })
    }

    return NextResponse.json({ data: problem, error: null }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
