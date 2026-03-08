-- ============================================================
-- 001_initial_schema.sql
-- 执行方式：在 Supabase Dashboard → SQL Editor 中直接粘贴执行
-- 执行顺序：
--   1. 建表（courses → problems → test_cases → user_progress）
--   2. 创建 updated_at 触发器函数
--   3. 为 problems 表绑定触发器
--   4. 创建索引
--   5. 禁用 RLS（阶段二启用时再开启）
--   6. 种子数据（courses → problems → test_cases）
-- ============================================================


-- ============================================================
-- 1. 建表
-- ============================================================

CREATE TABLE courses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  name        text NOT NULL,
  description text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE problems (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       uuid REFERENCES courses(id),
  slug            text NOT NULL UNIQUE,
  title           text NOT NULL,
  difficulty      text CHECK (difficulty IN ('easy','medium','hard')),
  topics          text[] DEFAULT '{}',
  description     text NOT NULL,
  starter_code    text NOT NULL,
  solution_code   text,
  hints           text[] DEFAULT '{}',
  order_index     integer DEFAULT 0,
  acceptance_rate numeric DEFAULT 0,
  is_published    boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE test_cases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id      uuid REFERENCES problems(id) ON DELETE CASCADE,
  input           text NOT NULL,
  expected_output text NOT NULL,
  is_hidden       boolean DEFAULT false,
  order_index     integer DEFAULT 0
);

-- 阶段二启用（user_id 预留，未来对接 Supabase Auth 的 auth.users.id）
CREATE TABLE user_progress (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid,
  problem_id        uuid REFERENCES problems(id),
  status            text CHECK (status IN ('attempted','solved')),
  solve_count       integer DEFAULT 0,
  last_submitted_at timestamptz,
  UNIQUE(user_id, problem_id)
);


-- ============================================================
-- 2. updated_at 自动触发器
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_problems_updated_at
BEFORE UPDATE ON problems
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- 3. 索引
-- ============================================================

CREATE INDEX idx_problems_course_id    ON problems(course_id);
CREATE INDEX idx_problems_slug         ON problems(slug);
CREATE INDEX idx_problems_is_published ON problems(is_published);
CREATE INDEX idx_test_cases_problem_id  ON test_cases(problem_id);
CREATE INDEX idx_test_cases_order_index ON test_cases(order_index);


-- ============================================================
-- 4. 禁用 RLS（阶段二加用户系统时再开启）
-- ============================================================

ALTER TABLE courses       DISABLE ROW LEVEL SECURITY;
ALTER TABLE problems      DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases    DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;


-- ============================================================
-- 5. 种子数据
-- ============================================================

-- 5.1 课程
INSERT INTO courses (code, name, description, is_active)
VALUES (
  'COMP9021',
  'Principles of Programming',
  'Introduces the fundamental principles of programming using Python. Topics include data structures, algorithms, recursion, and object-oriented programming.',
  true
);

-- 5.2 题目（引用上方插入的课程 id）
WITH course AS (
  SELECT id FROM courses WHERE code = 'COMP9021'
)
INSERT INTO problems
  (course_id, slug, title, difficulty, topics, description, starter_code, solution_code, hints, order_index, is_published)
SELECT
  course.id,
  prob.slug,
  prob.title,
  prob.difficulty,
  prob.topics,
  prob.description,
  prob.starter_code,
  prob.solution_code,
  prob.hints,
  prob.order_index,
  true
FROM course, (VALUES

  -- ── Problem 1: Fibonacci ──────────────────────────────────
  (
    'fibonacci',
    'Fibonacci Number',
    'easy',
    ARRAY['recursion', 'dynamic-programming'],
    $desc$Given a non-negative integer `n`, return the `n`-th Fibonacci number.

The Fibonacci sequence is defined as:
- F(0) = 0
- F(1) = 1
- F(n) = F(n-1) + F(n-2) for n > 1

**Example:**
```
Input:  n = 6
Output: 8
```$desc$,
    $starter$def fibonacci(n: int) -> int:
    # Your code here
    pass$starter$,
    $solution$def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b$solution$,
    ARRAY[
      'Think about the base cases first.',
      'You can solve this iteratively to avoid stack overflow for large n.',
      'Keep track of only the last two values.'
    ],
    1
  ),

  -- ── Problem 2: Stack Implementation ──────────────────────
  (
    'stack-implementation',
    'Stack Implementation',
    'medium',
    ARRAY['data-structures', 'oop'],
    $desc$Implement a `Stack` class using a Python list as the underlying storage.

Your class must support:
- `push(val)` — add an element to the top
- `pop()` — remove and return the top element; raise `IndexError` if empty
- `peek()` — return the top element without removing it; raise `IndexError` if empty
- `is_empty()` — return `True` if the stack has no elements
- `size()` — return the number of elements

**Example:**
```
s = Stack()
s.push(1)
s.push(2)
s.peek()    # 2
s.pop()     # 2
s.size()    # 1
```$desc$,
    $starter$class Stack:
    def __init__(self):
        # Your code here
        pass

    def push(self, val):
        pass

    def pop(self):
        pass

    def peek(self):
        pass

    def is_empty(self) -> bool:
        pass

    def size(self) -> int:
        pass$starter$,
    $solution$class Stack:
    def __init__(self):
        self._data = []

    def push(self, val):
        self._data.append(val)

    def pop(self):
        if self.is_empty():
            raise IndexError("pop from empty stack")
        return self._data.pop()

    def peek(self):
        if self.is_empty():
            raise IndexError("peek from empty stack")
        return self._data[-1]

    def is_empty(self) -> bool:
        return len(self._data) == 0

    def size(self) -> int:
        return len(self._data)$solution$,
    ARRAY[
      'Use a list internally — append for push, pop(-1) for pop.',
      'Remember to guard pop() and peek() against an empty stack.',
      'is_empty() can simply check if len == 0.'
    ],
    2
  ),

  -- ── Problem 3: Bank Account ───────────────────────────────
  (
    'bank-account',
    'Bank Account',
    'medium',
    ARRAY['oop', 'classes'],
    $desc$Implement a `BankAccount` class with the following behaviour:

- `__init__(owner: str, balance: float = 0.0)` — create account with owner name and optional initial balance
- `deposit(amount: float)` — add `amount` to balance; raise `ValueError` if amount ≤ 0
- `withdraw(amount: float)` — subtract `amount`; raise `ValueError` if amount ≤ 0 or insufficient funds
- `get_balance() -> float` — return current balance
- `__str__() -> str` — return `"BankAccount(owner=<name>, balance=<balance>)"`

**Example:**
```
acc = BankAccount("Alice", 100.0)
acc.deposit(50.0)
acc.withdraw(30.0)
acc.get_balance()   # 120.0
str(acc)            # "BankAccount(owner=Alice, balance=120.0)"
```$desc$,
    $starter$class BankAccount:
    def __init__(self, owner: str, balance: float = 0.0):
        # Your code here
        pass

    def deposit(self, amount: float):
        pass

    def withdraw(self, amount: float):
        pass

    def get_balance(self) -> float:
        pass

    def __str__(self) -> str:
        pass$starter$,
    $solution$class BankAccount:
    def __init__(self, owner: str, balance: float = 0.0):
        self.owner = owner
        self._balance = balance

    def deposit(self, amount: float):
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")
        self._balance += amount

    def withdraw(self, amount: float):
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")
        if amount > self._balance:
            raise ValueError("Insufficient funds")
        self._balance -= amount

    def get_balance(self) -> float:
        return self._balance

    def __str__(self) -> str:
        return f"BankAccount(owner={self.owner}, balance={self._balance})"$solution$,
    ARRAY[
      'Store the balance as a private attribute to prevent direct modification.',
      'Validate the amount before modifying the balance.',
      'Use an f-string for __str__.'
    ],
    3
  )

) AS prob(slug, title, difficulty, topics, description, starter_code, solution_code, hints, order_index);


-- 5.3 Test Cases

-- fibonacci
WITH p AS (SELECT id FROM problems WHERE slug = 'fibonacci')
INSERT INTO test_cases (problem_id, input, expected_output, is_hidden, order_index)
SELECT p.id, tc.input, tc.expected_output, tc.is_hidden, tc.order_index
FROM p, (VALUES
  ('0',  '0',  false, 1),
  ('1',  '1',  false, 2),
  ('6',  '8',  false, 3),
  ('10', '55', true,  4),
  ('20', '6765', true, 5)
) AS tc(input, expected_output, is_hidden, order_index);

-- stack-implementation
WITH p AS (SELECT id FROM problems WHERE slug = 'stack-implementation')
INSERT INTO test_cases (problem_id, input, expected_output, is_hidden, order_index)
SELECT p.id, tc.input, tc.expected_output, tc.is_hidden, tc.order_index
FROM p, (VALUES
  ('push(1); push(2); peek()',         '2',    false, 1),
  ('push(1); push(2); pop(); size()',  '1',    false, 2),
  ('is_empty()',                       'True', false, 3),
  ('push(5); pop(); is_empty()',       'True', true,  4),
  ('push(1); push(2); push(3); pop(); pop(); peek()', '1', true, 5)
) AS tc(input, expected_output, is_hidden, order_index);

-- bank-account
WITH p AS (SELECT id FROM problems WHERE slug = 'bank-account')
INSERT INTO test_cases (problem_id, input, expected_output, is_hidden, order_index)
SELECT p.id, tc.input, tc.expected_output, tc.is_hidden, tc.order_index
FROM p, (VALUES
  ('BankAccount("Alice", 100.0); deposit(50.0); get_balance()',             '150.0',  false, 1),
  ('BankAccount("Bob"); deposit(200.0); withdraw(80.0); get_balance()',     '120.0',  false, 2),
  ('BankAccount("Alice", 100.0); str()',  'BankAccount(owner=Alice, balance=100.0)', false, 3),
  ('BankAccount("Eve", 50.0); withdraw(100.0)',  'ValueError', true, 4),
  ('BankAccount("X"); deposit(-10)',             'ValueError', true, 5)
) AS tc(input, expected_output, is_hidden, order_index);
