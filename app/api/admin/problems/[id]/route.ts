import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/admin/auth'
import type { Database } from '@/lib/types/database'

type ProblemUpdate = Database['public']['Tables']['problems']['Update']
type TestCaseInsert = Database['public']['Tables']['test_cases']['Insert']

type Params = { params: Promise<{ id: string }> }

interface TestCasePayload {
  input: string
  expected_output: string
  is_hidden: boolean
}

export async function GET(req: NextRequest, { params }: Params) {
  if (!isAdminAuthenticated(req)) return unauthorizedResponse()

  try {
    const { id } = await params
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('problems')
      .select('*, test_cases(*)')
      .eq('id', id)
      .single()

    if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    return NextResponse.json({ data, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!isAdminAuthenticated(req)) return unauthorizedResponse()

  try {
    const { id } = await params
    const body = (await req.json()) as { test_cases?: TestCasePayload[]; [key: string]: unknown }
    const { test_cases, ...problemData } = body
    const supabase = await createClient()

    const updatePayload: ProblemUpdate = {
      ...(problemData as ProblemUpdate),
      updated_at: new Date().toISOString(),
    }

    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (problemError)
      return NextResponse.json({ data: null, error: problemError.message }, { status: 500 })

    // Replace all test cases
    await supabase.from('test_cases').delete().eq('problem_id', id)

    if (test_cases && test_cases.length > 0) {
      const { error: tcError } = await supabase.from('test_cases').insert(
        test_cases.map((tc, i): TestCaseInsert => ({
          problem_id: id,
          input: tc.input,
          expected_output: tc.expected_output,
          is_hidden: tc.is_hidden,
          order_index: i,
        }))
      )
      if (tcError)
        return NextResponse.json({ data: null, error: tcError.message }, { status: 500 })
    }

    return NextResponse.json({ data: problem, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!isAdminAuthenticated(req)) return unauthorizedResponse()

  try {
    const { id } = await params
    const supabase = await createClient()
    const { error } = await supabase.from('problems').delete().eq('id', id)
    if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    return NextResponse.json({ data: { id }, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
