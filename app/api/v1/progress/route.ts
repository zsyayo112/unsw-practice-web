import { NextResponse } from 'next/server'

// Phase 1: No user system yet — return empty array.
//
// Phase 2 implementation plan:
// 1. Authenticate the user via Supabase Auth (JWT from Authorization header or session cookie).
// 2. Query user_progress table: SELECT * FROM user_progress WHERE user_id = <authenticated_user_id>
// 3. Join with problems to include slug/title for richer response.
// 4. Map snake_case → camelCase and return { data: progressArray, error: null }.
//
// The user_progress table already has user_id, problem_id, status, solve_count, last_submitted_at
// reserved for this purpose.

export async function GET() {
  return NextResponse.json({ data: [], error: null })
}
