import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const JUDGE0_URL = 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true'
const LANGUAGE_ID_PYTHON = 71
const REQUEST_TIMEOUT_MS = 10_000
const CONCURRENCY = 3

interface Judge0Response {
  status: { id: number; description: string }
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  time: string | null
}

interface TestCase {
  id: string
  input: string
  expected_output: string
  is_hidden: boolean
  order_index: number
}

type OverallStatus = 'accepted' | 'wrong_answer' | 'runtime_error' | 'time_limit_exceeded'

async function runJudge0(sourceCode: string, testCase: TestCase): Promise<Judge0Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(JUDGE0_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: sourceCode + '\n' + testCase.input,
        language_id: LANGUAGE_ID_PYTHON,
        expected_output: testCase.expected_output,
        cpu_time_limit: 3,
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      throw new Error(`Judge0 returned ${res.status}`)
    }

    return (await res.json()) as Judge0Response
  } finally {
    clearTimeout(timer)
  }
}

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = []
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency)
    const batchResults = await Promise.allSettled(batch.map((t) => t()))
    results.push(...batchResults)
  }
  return results
}

function mapJudge0Status(statusId: number): { passed: boolean; status: OverallStatus } {
  switch (statusId) {
    case 3:
      return { passed: true, status: 'accepted' }
    case 5:
      return { passed: false, status: 'time_limit_exceeded' }
    case 6: // compilation error
    case 11: // runtime error NZEC
    case 12: // runtime error SIGSEGV
    case 13: // runtime error SIGFPE
    case 14: // runtime error SIGBUS
    case 15: // runtime error SIGSEGV
      return { passed: false, status: 'runtime_error' }
    default:
      return { passed: false, status: 'wrong_answer' }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      problemId: string
      code: string
      language: string
    }

    const { problemId, code, language } = body

    if (!problemId || !code || language !== 'python') {
      return NextResponse.json(
        { data: null, error: 'Invalid request: problemId, code, and language=python required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: rawTestCases, error: dbError } = await supabase
      .from('test_cases')
      .select('id, input, expected_output, is_hidden, order_index')
      .eq('problem_id', problemId)
      .order('order_index', { ascending: true })

    const testCases = rawTestCases as TestCase[] | null

    if (dbError) {
      return NextResponse.json({ data: null, error: dbError.message }, { status: 500 })
    }

    if (!testCases || testCases.length === 0) {
      return NextResponse.json({ data: null, error: 'No test cases found for this problem' }, { status: 404 })
    }

    const tasks = testCases.map((tc) => () => runJudge0(code, tc as TestCase))
    const settled = await runWithConcurrency(tasks, CONCURRENCY)

    let totalRuntimeMs = 0
    let overallStatus: OverallStatus = 'accepted'

    const testResults = settled.map((result, i) => {
      const tc = testCases[i]

      if (result.status === 'rejected') {
        if (overallStatus === 'accepted') overallStatus = 'runtime_error'
        return {
          passed: false,
          input: tc.input,
          expectedOutput: tc.expected_output,
          actualOutput: '',
          error: result.reason instanceof Error ? result.reason.message : 'Request failed',
        }
      }

      const j0 = result.value
      const { passed, status } = mapJudge0Status(j0.status.id)

      if (!passed) {
        // Priority: runtime_error > time_limit_exceeded > wrong_answer
        if (status === 'runtime_error' || overallStatus === 'accepted' || overallStatus === 'wrong_answer') {
          if (
            status === 'runtime_error' ||
            (status === 'time_limit_exceeded' && overallStatus !== 'runtime_error') ||
            (status === 'wrong_answer' && overallStatus === 'accepted')
          ) {
            overallStatus = status
          }
        }
      }

      if (j0.time) {
        totalRuntimeMs += Math.round(parseFloat(j0.time) * 1000)
      }

      const actualOutput = (j0.stdout ?? '').trimEnd()
      const errorOutput = j0.stderr ?? j0.compile_output ?? null

      return {
        passed,
        input: tc.input,
        expectedOutput: tc.expected_output,
        actualOutput,
        error: errorOutput && errorOutput.trim() ? errorOutput.trim() : null,
      }
    })

    const passedCount = testResults.filter((r) => r.passed).length
    const total = testResults.length

    return NextResponse.json({
      data: {
        status: overallStatus,
        testResults,
        runtimeMs: totalRuntimeMs,
        message: `${passedCount} / ${total} Tests Passed`,
      },
      error: null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
