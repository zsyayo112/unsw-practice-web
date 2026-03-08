import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapProblemRow, type ProblemRow } from '@/lib/types/problem-row'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('problems')
      .select(
        `id, slug, title, difficulty, topics, description,
         starter_code, hints, order_index, acceptance_rate, course_id,
         test_cases(id, input, expected_output, is_hidden, order_index)`
      )
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ data: null, error: 'Problem not found' }, { status: 404 })
    }

    return NextResponse.json({ data: mapProblemRow(data as unknown as ProblemRow), error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
