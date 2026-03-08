export interface TestCaseRow {
  id: string
  input: string
  expected_output: string
  is_hidden: boolean
  order_index: number
}

export interface ProblemRow {
  id: string
  slug: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard' | null
  topics: string[]
  description: string
  starter_code: string
  hints: string[]
  order_index: number
  acceptance_rate: number
  course_id: string | null
  test_cases: TestCaseRow[]
}

export function mapProblemRow(p: ProblemRow) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    topics: p.topics,
    description: p.description,
    starterCode: p.starter_code,
    hints: p.hints,
    orderIndex: p.order_index,
    acceptanceRate: p.acceptance_rate,
    courseId: p.course_id,
    testCases: p.test_cases
      .filter((tc) => !tc.is_hidden)
      .sort((a, b) => a.order_index - b.order_index)
      .map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expected_output,
        isHidden: tc.is_hidden,
        orderIndex: tc.order_index,
      })),
  }
}
