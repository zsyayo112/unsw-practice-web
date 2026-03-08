import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface ProblemListItem {
  id: string
  slug: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard' | null
  topics: string[]
  is_published: boolean
  test_cases: { id: string }[]
}

const difficultyColor: Record<string, string> = {
  easy: 'text-green-600',
  medium: 'text-yellow-600',
  hard: 'text-red-600',
}

export default async function ProblemsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('problems')
    .select('id, slug, title, difficulty, topics, is_published, test_cases(id)')
    .order('order_index', { ascending: true })

  const problems = (data as ProblemListItem[] | null) ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Problems</h2>
        <Link
          href="/admin/problems/new"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
        >
          + 新增题目
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium w-10">#</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">标题</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium w-24">难度</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Topics</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium w-24">测试用例</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium w-24">状态</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium w-16">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {problems.map((p, i) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{p.title}</td>
                <td
                  className={`px-4 py-3 capitalize font-medium ${
                    p.difficulty ? difficultyColor[p.difficulty] : 'text-gray-400'
                  }`}
                >
                  {p.difficulty ?? '-'}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {p.topics.join(', ') || '-'}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {p.test_cases.length}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.is_published
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {p.is_published ? '已发布' : '草稿'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/problems/${p.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    编辑
                  </Link>
                </td>
              </tr>
            ))}
            {problems.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  No problems yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
