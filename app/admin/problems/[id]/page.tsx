import { createClient } from '@/lib/supabase/server'
import ProblemForm from '../ProblemForm'
import { notFound } from 'next/navigation'
import type { Database } from '@/lib/types/database'

type CourseRow = Database['public']['Tables']['courses']['Row']

export default async function EditProblemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: problem }, { data: coursesData }] = await Promise.all([
    supabase.from('problems').select('*, test_cases(*)').eq('id', id).single(),
    supabase.from('courses').select('*').eq('is_active', true).order('code'),
  ])

  if (!problem) notFound()

  const courses = (coursesData as CourseRow[] | null) ?? []

  return (
    <ProblemForm
      problemId={id}
      initialData={problem as Parameters<typeof ProblemForm>[0]['initialData']}
      courses={courses}
    />
  )
}
