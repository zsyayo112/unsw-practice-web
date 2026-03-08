import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Database } from '@/lib/types/database'

type ProblemRow = Database['public']['Tables']['problems']['Row']
type PartialProblem = Pick<ProblemRow, 'id' | 'title' | 'difficulty' | 'is_published' | 'created_at'>

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('problems')
    .select('id, title, difficulty, is_published, created_at')
    .order('created_at', { ascending: false })

  const all = (data as PartialProblem[] | null) ?? []
  const total = all.length
  const published = all.filter((p) => p.is_published).length
  const draft = total - published
  const easy = all.filter((p) => p.difficulty === 'easy').length
  const medium = all.filter((p) => p.difficulty === 'medium').length
  const hard = all.filter((p) => p.difficulty === 'hard').length
  const recent = all.slice(0, 5)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-5 shadow-sm border">
          <p className="text-sm text-gray-500">Total Problems</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{total}</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border">
          <p className="text-sm text-gray-500">Published</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{published}</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border">
          <p className="text-sm text-gray-500">Draft</p>
          <p className="text-3xl font-bold text-gray-400 mt-1">{draft}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-5 shadow-sm border mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Difficulty Distribution</h3>
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{easy}</p>
            <p className="text-xs text-gray-500 mt-1">Easy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{medium}</p>
            <p className="text-xs text-gray-500 mt-1">Medium</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{hard}</p>
            <p className="text-xs text-gray-500 mt-1">Hard</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Recent Problems</h3>
          <Link href="/admin/problems" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y">
          {recent.map((p) => (
            <div key={p.id} className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-800">{p.title}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  p.is_published
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {p.is_published ? '已发布' : '草稿'}
              </span>
            </div>
          ))}
          {recent.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-gray-400">
              No problems yet.{' '}
              <Link href="/admin/problems/new" className="text-blue-600 hover:underline">
                Create one
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
