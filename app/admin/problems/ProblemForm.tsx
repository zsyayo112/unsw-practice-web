'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminSecret } from '../AdminContext'
import type { Database } from '@/lib/types/database'

type CourseRow = Database['public']['Tables']['courses']['Row']

interface TestCaseInput {
  input: string
  expected_output: string
  is_hidden: boolean
}

interface InitialData {
  title: string
  slug: string
  difficulty: 'easy' | 'medium' | 'hard' | null
  topics: string[]
  course_id: string | null
  description: string
  starter_code: string
  solution_code: string | null
  hints: string[]
  is_published: boolean
  test_cases: {
    id: string
    input: string
    expected_output: string
    is_hidden: boolean
    order_index: number
  }[]
}

interface ProblemFormProps {
  problemId?: string
  initialData?: InitialData
  courses: CourseRow[]
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const inputCls =
  'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
const sectionCls = 'bg-white rounded-lg border shadow-sm p-5 mb-4'

export default function ProblemForm({ problemId, initialData, courses }: ProblemFormProps) {
  const router = useRouter()
  const { secret } = useAdminSecret()
  const isEdit = Boolean(problemId)

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  const [slugManual, setSlugManual] = useState(Boolean(initialData))
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | ''>(
    initialData?.difficulty ?? ''
  )
  const [topics, setTopics] = useState(initialData?.topics?.join(', ') ?? '')
  const [courseId, setCourseId] = useState(initialData?.course_id ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [starterCode, setStarterCode] = useState(initialData?.starter_code ?? '')
  const [solutionCode, setSolutionCode] = useState(initialData?.solution_code ?? '')
  const [hints, setHints] = useState<string[]>(
    initialData?.hints?.length ? initialData.hints : ['']
  )
  const [testCases, setTestCases] = useState<TestCaseInput[]>(
    initialData?.test_cases?.length
      ? initialData.test_cases
          .sort((a, b) => a.order_index - b.order_index)
          .map((tc) => ({
            input: tc.input,
            expected_output: tc.expected_output,
            is_hidden: tc.is_hidden,
          }))
      : [{ input: '', expected_output: '', is_hidden: false }]
  )
  const [status, setStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error'
    message: string
  }>({ type: 'idle', message: '' })

  useEffect(() => {
    if (!slugManual) {
      setSlug(slugify(title))
    }
  }, [title, slugManual])

  const buildPayload = (isPublished: boolean) => ({
    title,
    slug,
    difficulty: difficulty || null,
    topics: topics
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    course_id: courseId || null,
    description,
    starter_code: starterCode,
    solution_code: solutionCode || null,
    hints: hints.filter(Boolean),
    is_published: isPublished,
    test_cases: testCases.filter((tc) => tc.input || tc.expected_output),
  })

  const submit = async (isPublished: boolean) => {
    if (!secret) {
      setStatus({ type: 'error', message: '请先在顶部输入 Admin Secret' })
      return
    }
    setStatus({ type: 'loading', message: '保存中...' })

    try {
      const url = isEdit ? `/api/admin/problems/${problemId}` : '/api/admin/problems'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify(buildPayload(isPublished)),
      })
      const json = (await res.json()) as { data: unknown; error: string | null }

      if (!res.ok || json.error) {
        setStatus({ type: 'error', message: json.error ?? '保存失败' })
        return
      }

      setStatus({ type: 'success', message: isPublished ? '已发布！' : '草稿已保存！' })
      setTimeout(() => router.push('/admin/problems'), 1000)
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : '未知错误',
      })
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这道题目吗？此操作不可撤销。')) return
    if (!secret) {
      setStatus({ type: 'error', message: '请先在顶部输入 Admin Secret' })
      return
    }

    setStatus({ type: 'loading', message: '删除中...' })
    try {
      const res = await fetch(`/api/admin/problems/${problemId}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
      })
      const json = (await res.json()) as { data: unknown; error: string | null }
      if (!res.ok || json.error) {
        setStatus({ type: 'error', message: json.error ?? '删除失败' })
        return
      }
      router.push('/admin/problems')
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : '未知错误',
      })
    }
  }

  const updateHint = (i: number, val: string) => {
    const next = [...hints]
    next[i] = val
    setHints(next)
  }

  const updateTestCase = (i: number, field: keyof TestCaseInput, val: string | boolean) => {
    const next = [...testCases]
    next[i] = { ...next[i], [field]: val }
    setTestCases(next)
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? '编辑题目' : '新增题目'}
      </h2>

      {/* Basic info */}
      <div className={sectionCls}>
        <h3 className="font-semibold text-gray-800 mb-4">基本信息</h3>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>标题</label>
            <input
              type="text"
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="题目标题"
            />
          </div>
          <div>
            <label className={labelCls}>Slug</label>
            <input
              type="text"
              className={inputCls + ' font-mono'}
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugManual(true)
              }}
              placeholder="url-friendly-slug"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>难度</label>
              <select
                className={inputCls}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
              >
                <option value="">-- 选择难度 --</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>课程</label>
              <select
                className={inputCls}
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
              >
                <option value="">-- 选择课程 --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Topics（逗号分隔）</label>
            <input
              type="text"
              className={inputCls}
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="Loops, Functions, Recursion"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className={sectionCls}>
        <h3 className="font-semibold text-gray-800 mb-3">题目描述（Markdown）</h3>
        <textarea
          className={inputCls + ' font-mono'}
          rows={10}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={'# Problem Title\n\nDescription in Markdown...'}
        />
      </div>

      {/* Code */}
      <div className={sectionCls}>
        <h3 className="font-semibold text-gray-800 mb-4">代码</h3>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>初始代码（Python）</label>
            <textarea
              className={inputCls + ' font-mono'}
              rows={5}
              value={starterCode}
              onChange={(e) => setStarterCode(e.target.value)}
              placeholder={'def solution():\n    pass'}
            />
          </div>
          <div>
            <label className={labelCls}>解答代码（Python，仅后台可见）</label>
            <textarea
              className={inputCls + ' font-mono'}
              rows={5}
              value={solutionCode}
              onChange={(e) => setSolutionCode(e.target.value)}
              placeholder={'def solution():\n    # correct implementation'}
            />
          </div>
        </div>
      </div>

      {/* Hints */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Hints</h3>
          <button
            type="button"
            onClick={() => setHints([...hints, ''])}
            className="text-sm text-blue-600 hover:underline"
          >
            + 添加 Hint
          </button>
        </div>
        <div className="space-y-2">
          {hints.map((h, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                className={inputCls}
                value={h}
                onChange={(e) => updateHint(i, e.target.value)}
                placeholder={`Hint ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => setHints(hints.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-600 px-2 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Test Cases */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">测试用例</h3>
          <button
            type="button"
            onClick={() =>
              setTestCases([...testCases, { input: '', expected_output: '', is_hidden: false }])
            }
            className="text-sm text-blue-600 hover:underline"
          >
            + 添加测试用例
          </button>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 text-xs text-gray-500 font-medium px-1">
            <span>Input</span>
            <span>Expected Output</span>
            <span>Hidden?</span>
            <span />
          </div>
          {testCases.map((tc, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 items-center">
              <input
                type="text"
                className={inputCls + ' font-mono'}
                value={tc.input}
                onChange={(e) => updateTestCase(i, 'input', e.target.value)}
                placeholder="input"
              />
              <input
                type="text"
                className={inputCls + ' font-mono'}
                value={tc.expected_output}
                onChange={(e) => updateTestCase(i, 'expected_output', e.target.value)}
                placeholder="expected"
              />
              <label className="flex items-center justify-center gap-1 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tc.is_hidden}
                  onChange={(e) => updateTestCase(i, 'is_hidden', e.target.checked)}
                />
                Hidden
              </label>
              <button
                type="button"
                onClick={() => setTestCases(testCases.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      {status.type !== 'idle' && (
        <div
          className={`mb-4 px-4 py-2 rounded text-sm border ${
            status.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : status.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 items-center">
        <button
          type="button"
          disabled={status.type === 'loading'}
          onClick={() => submit(false)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50 transition-colors"
        >
          保存草稿
        </button>
        <button
          type="button"
          disabled={status.type === 'loading'}
          onClick={() => submit(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          发布上线
        </button>
        {isEdit && (
          <button
            type="button"
            disabled={status.type === 'loading'}
            onClick={handleDelete}
            className="px-4 py-2 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200 disabled:opacity-50 transition-colors ml-auto"
          >
            删除题目
          </button>
        )}
      </div>
    </div>
  )
}
