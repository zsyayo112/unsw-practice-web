export interface Database {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      problems: {
        Row: {
          id: string
          course_id: string | null
          slug: string
          title: string
          difficulty: 'easy' | 'medium' | 'hard' | null
          topics: string[]
          description: string
          starter_code: string
          solution_code: string | null
          hints: string[]
          order_index: number
          acceptance_rate: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id?: string | null
          slug: string
          title: string
          difficulty?: 'easy' | 'medium' | 'hard' | null
          topics?: string[]
          description: string
          starter_code: string
          solution_code?: string | null
          hints?: string[]
          order_index?: number
          acceptance_rate?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string | null
          slug?: string
          title?: string
          difficulty?: 'easy' | 'medium' | 'hard' | null
          topics?: string[]
          description?: string
          starter_code?: string
          solution_code?: string | null
          hints?: string[]
          order_index?: number
          acceptance_rate?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      test_cases: {
        Row: {
          id: string
          problem_id: string | null
          input: string
          expected_output: string
          is_hidden: boolean
          order_index: number
        }
        Insert: {
          id?: string
          problem_id?: string | null
          input: string
          expected_output: string
          is_hidden?: boolean
          order_index?: number
        }
        Update: {
          id?: string
          problem_id?: string | null
          input?: string
          expected_output?: string
          is_hidden?: boolean
          order_index?: number
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string | null
          problem_id: string | null
          status: 'attempted' | 'solved' | null
          solve_count: number
          last_submitted_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          problem_id?: string | null
          status?: 'attempted' | 'solved' | null
          solve_count?: number
          last_submitted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          problem_id?: string | null
          status?: 'attempted' | 'solved' | null
          solve_count?: number
          last_submitted_at?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
