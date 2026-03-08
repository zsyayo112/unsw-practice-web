import { createClient } from '@/lib/supabase/server'
import ProblemForm from '../ProblemForm'
import type { Database } from '@/lib/types/database'

type CourseRow = Database['public']['Tables']['courses']['Row']

export default async function NewProblemPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('is_active', true)
    .order('code')

  const courses = (data as CourseRow[] | null) ?? []

  return <ProblemForm courses={courses} />
}
