import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapProblemRow, type ProblemRow } from '@/lib/types/problem-row'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const course = searchParams.get('course')
    const difficulty = searchParams.get('difficulty')

    const supabase = await createClient()

    let query = supabase
      .from('problems')
      .select(
        `id, slug, title, difficulty, topics, description,
         starter_code, hints, order_index, acceptance_rate, course_id,
         test_cases(id, input, expected_output, is_hidden, order_index)`
      )
      .eq('is_published', true)
      .order('order_index', { ascending: true })

    if (difficulty) {
      query = query.eq('difficulty', difficulty as 'easy' | 'medium' | 'hard')
    }

    if (course) {
      const { data: courseData } = await supabase
        .from('courses')
        .select('id')
        .eq('code', course)
        .maybeSingle()
      const courseRow = courseData as { id: string } | null
      if (courseRow) {
        query = query.eq('course_id', courseRow.id)
      } else {
        return NextResponse.json({ data: [], error: null })
      }
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    const problems = (data ?? []).map((p) => mapProblemRow(p as unknown as ProblemRow))

    return NextResponse.json({ data: problems, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
