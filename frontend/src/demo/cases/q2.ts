import { annotation, flagged, type DemoCase } from '../caseTypes'

const sp = [
  'Scoring Point 1 (Prerequisites: Bisection) f must be continuous on [a, b] with a sign change, f(a)·f(b) < 0, so that the Intermediate Value Theorem guarantees a root in the bracket; no derivative is needed.',
  'Scoring Point 2 (Prerequisites: Newton) f must be differentiable (ideally twice) near the root with f′(x_k) ≠ 0 at the iterates, and the starting guess x_0 must be sufficiently close to the root; no bracketing interval is needed.',
  'Scoring Point 3 (Convergence Rate: Bisection) Converges linearly with ratio 1/2: |c_n − x*| ≤ (b − a)/2^{n+1} (or an equivalent bound depending on indexing), i.e. about 3.3 iterations per extra decimal digit.',
  'Scoring Point 4 (Convergence Rate: Newton) Converges quadratically near a simple root, |e_{k+1}| ≈ |f″(x*)/(2f′(x*))|·|e_k|^2, so the number of correct digits roughly doubles each step; only linear at a multiple root.',
  'Scoring Point 5 (Robustness: Bisection) Globally convergent: once a valid bracket is found it is guaranteed to converge, however wide the bracket; other reasonable statements of guaranteed convergence are also acceptable.',
  'Scoring Point 6 (Robustness: Newton) Only locally convergent: from a poor x_0 it may diverge, oscillate or cycle, and it breaks down when f′(x_k) = 0 or nearly so; convergence is not guaranteed.',
  'Scoring Point 7 (Cost per Iteration: Bisection) One new function evaluation, f at the midpoint, per iteration (the endpoint values are reused); no derivative is required.',
  'Scoring Point 8 (Cost per Iteration: Newton) One evaluation of f and one of f′ per iteration, so each step costs more than a bisection step, and f′ must be available in closed form (or approximated).',
] as const

const demoCase: DemoCase = {
  question: {
    question_id: 2,
    question:
      "Compare the bisection method and Newton's method for solving f(x) = 0. (Prerequisites, Convergence Rate, Robustness, Cost per Iteration)",
    score: 8,
  },
  pointsPerCriterion: 1,
  rubric: sp,
  responses: [
    {
      studentId: 1,
      paragraphs: [
        [
          'Prerequisites.',
          annotation(
            'correct',
            'Bisection: f ∈ C[a, b] and f(a)f(b) < 0; by the IVT there is at least one root in (a, b), and the method never touches f′.',
            sp[0],
            'States continuity, the sign condition f(a)f(b) < 0 and the IVT justification, and explicitly notes that no derivative is used; matches the point completely.',
          ),
          annotation(
            'correct',
            "Newton: f differentiable near the root, f'(x_k) ≠ 0 for every iterate, and x_0 inside the region of attraction of x*.",
            sp[1],
            "All three conditions are present: differentiability, f'(x_k) ≠ 0 at the iterates, and x_0 in the region of attraction, which is the precise form of “sufficiently close”.",
          ),
        ],
        [
          'Convergence rate.',
          annotation(
            'correct',
            'Bisection is linear with constant 1/2: the midpoint satisfies |c_n − x*| ≤ (b − a)/2^{n+1}, so ten steps gain roughly three decimal digits.',
            sp[2],
            'Gives the exact bound (b − a)/2^{n+1} and the linear ratio 1/2; “ten steps per three digits” is the same as the 3.3 iterations per digit in the reference, since 2^10 ≈ 10^3.',
          ),
          annotation(
            'correct',
            "Newton: Taylor expansion about x_k gives e_{k+1} = f''(ξ)/(2f'(x_k))·e_k^2, so convergence is quadratic for a simple root; for a double root it degrades to linear with ratio 1/2.",
            sp[3],
            'Derives the quadratic error relation from Taylor’s theorem (the constant is correct) and also covers the multiple-root case, where (m − 1)/m = 1/2 for m = 2 is the right linear ratio.',
          ),
        ],
        [
          'Robustness.',
          annotation(
            'correct',
            'Bisection cannot fail once the bracket is valid; the root stays inside [a_n, b_n] at every step.',
            sp[4],
            'Guaranteed convergence from any valid bracket, justified by the invariant that the root stays inside [a_n, b_n]; this is the global-convergence point.',
          ),
          annotation(
            'unclear',
            'Newton is more sensitive to the choice of x_0 and to the shape of f.',
            sp[5],
            'Points in the right direction but never says Newton can actually diverge, cycle or break down at f′(x_k) = 0; the instructor should decide whether “more sensitive” is enough to show convergence is not guaranteed.',
          ),
        ],
        [
          'Cost per iteration.',
          annotation(
            'correct',
            'Bisection needs only f(c_n) per step since f(a_n) and f(b_n) are already known from earlier steps.',
            sp[6],
            'Correctly counts one new evaluation per step and explains why: the endpoint values are carried over, which is exactly the reuse noted in the reference.',
          ),
          annotation(
            'correct',
            "Newton needs f(x_k) and f'(x_k), so one step costs roughly two function evaluations if f' is as expensive as f.",
            sp[7],
            "Names both evaluations per Newton step and quantifies the cost relative to bisection, matching the f + f' cost in the reference.",
          ),
          'In practice the two are combined: bisect until the bracket is small, then switch to Newton.',
        ],
      ],
    },
    {
      studentId: 2,
      paragraphs: [
        [
          'Think of f(x) = x^2 − 2, root √2 ≈ 1.414214.',
          annotation(
            'correct',
            'Halving only makes sense if I can trap the root: I need two points where f has opposite signs, and the graph must be drawn without lifting the pen between them, otherwise the trap can be empty (f(x) = 1/x on [−1, 1] changes sign but has no zero).',
            sp[0],
            '“Drawn without lifting the pen” is continuity and “opposite signs at two points” is f(a)f(b) < 0; the 1/x counterexample shows exactly why the IVT needs continuity, even though the student never uses the textbook terms.',
          ),
          annotation(
            'correct',
            "Tangent-line chasing, x_{k+1} = x_k − f(x_k)/f'(x_k), divides by the slope, so a slope must exist and must not vanish on the way, and the first guess has to sit where the tangents actually lead toward √2.",
            sp[1],
            "“A slope must exist and must not vanish” is differentiability with f'(x_k) ≠ 0, and “where the tangents lead toward √2” is the basin of attraction, i.e. x_0 sufficiently close; all three conditions are covered.",
          ),
        ],
        [
          annotation(
            'correct',
            'On [1, 2] the halving gives 1.5, 1.25, 1.375, 1.4375, …; after n halvings I only know √2 within 1/2^{n+1}, and since 2^{10} ≈ 10^3 I pay about 10 halvings for every 3 more digits.',
            sp[2],
            'The midpoints are correct for x^2 − 2 on [1, 2], the bound 1/2^{n+1} is (b − a)/2^{n+1} with b − a = 1, and 10 halvings per 3 digits is the linear 3.3-steps-per-digit rate.',
          ),
          annotation(
            'correct',
            "Tangent-chasing from x_0 = 1 gives 1.5, 1.416667, 1.414216 with errors 8.6e-2, 2.5e-3, 2.1e-6; the ratio e_{k+1}/e_k^2 goes 0.33, 0.35, approaching 1/(2√2) ≈ 0.354, which is f''/(2f') at the root.",
            sp[3],
            "The iterates and errors are correct, and checking e_{k+1}/e_k^2 → f''(x*)/(2f'(x*)) = 1/(2√2) is a numerical verification of quadratic convergence at a simple root, without ever using the word “quadratic”.",
          ),
        ],
        [
          annotation(
            'correct',
            'Once trapped, the root can never escape the shrinking interval, however far apart the first two points were.',
            sp[4],
            'Says convergence is guaranteed from any valid bracket regardless of its width, which is precisely global convergence of bisection.',
          ),
          annotation(
            'correct',
            'Tangent-chasing has no such promise: for f(x) = x^3 − 2x + 2 starting at 0 it bounces 0 → 1 → 0 → 1 forever, and where the tangent is horizontal the next point is not even defined.',
            sp[5],
            "The counterexample is right (x_1 = 0 − 2/(−2) = 1, x_2 = 1 − 1/1 = 0), showing a 2-cycle, and the horizontal-tangent remark is the f'(x_k) = 0 breakdown; together they establish that Newton is only locally convergent.",
          ),
        ],
        [
          annotation(
            'correct',
            'Per step, halving asks f for one number at the new midpoint; the old endpoint values are reused.',
            sp[6],
            'One new function value per step with reuse of the endpoint values is exactly the bisection cost in the reference.',
          ),
          annotation(
            'correct',
            "Tangent-chasing asks for f(x_k) and f'(x_k), so about double the price per step, plus someone has to work out f' by hand first.",
            sp[7],
            "Counts both f and f' per step, compares the cost with bisection, and notes that f' must be derived; covers every part of the point.",
          ),
        ],
      ],
    },
    {
      studentId: 3,
      paragraphs: [
        [
          'Prerequisites:',
          annotation(
            'correct',
            'The bisection method requires f to be continuous on [a, b] with f(a) and f(b) of opposite sign; the Intermediate Value Theorem then guarantees a root in between.',
            sp[0],
            'Continuity, opposite signs at the endpoints and the IVT argument are all stated; this is the reference point almost verbatim.',
          ),
          annotation(
            'correct',
            "Newton's method requires f to be differentiable, f'(x_k) ≠ 0 along the iteration, and a starting value x_0 sufficiently close to the root, otherwise the local theory does not apply.",
            sp[1],
            "Lists differentiability, f'(x_k) ≠ 0 and a sufficiently close x_0, and correctly links the last condition to Newton's local convergence theory.",
          ),
        ],
        [
          'Convergence rate:',
          annotation(
            'correct',
            'Bisection converges linearly; the bracket length after n steps is (b − a)/2^n, so the midpoint error is at most (b − a)/2^{n+1}, and for 10^{-6} accuracy on an interval of length 1 we need about 20 iterations.',
            sp[2],
            'Linear rate with the correct bound (b − a)/2^{n+1}; the 20-iteration estimate checks out since 2^{20} ≈ 10^6.',
          ),
          annotation(
            'correct',
            "Newton converges quadratically near a simple root, |e_{k+1}| ≈ |f''(x*)/(2f'(x*))|·|e_k|^2, which in practice means only a handful of iterations for full double precision.",
            sp[3],
            'Quadratic convergence with the simple-root condition and the correct asymptotic error constant; matches the reference.',
          ),
          "At a multiple root of multiplicity m the rate drops to linear, which can be repaired with x_{k+1} = x_k − m·f(x_k)/f'(x_k).",
        ],
        [
          'Robustness:',
          'The great advantage of bisection is its reliability.',
          annotation(
            'wrong',
            'It is guaranteed to converge provided the root in [a, b] is unique; if there are several roots the sign test can point to the wrong half and the method may fail.',
            sp[4],
            'Uniqueness is not required: with several roots in [a, b] the sign change is preserved in one half at every step, so bisection still converges, just to one of the roots. The added condition and the claim that it “may fail” contradict global convergence.',
          ),
          annotation(
            'correct',
            "Newton, in contrast, is only locally convergent: a poor x_0 can lead to divergence or cycling, and if f'(x_k) is close to zero the step becomes huge.",
            sp[5],
            "Uses the exact term “locally convergent” and names divergence, cycling and the near-zero f'(x_k) breakdown; complete.",
          ),
        ],
        [
          'Cost per iteration:',
          annotation(
            'correct',
            'Bisection evaluates f once per iteration, at the new midpoint.',
            sp[6],
            'One function evaluation per iteration at the midpoint matches the reference cost for bisection.',
          ),
          annotation(
            'correct',
            "Newton evaluates both f and f', which is more expensive per step, and f' must be derived analytically (the secant method avoids this with a difference quotient).",
            sp[7],
            "Both evaluations per step, the higher cost and the need for an analytic f' are all stated; the secant remark is a correct aside.",
          ),
        ],
      ],
    },
    {
      studentId: 4,
      paragraphs: [
        [
          'Prerequisites:',
          annotation(
            'correct',
            'Bisection: f continuous on [a, b] and f(a)·f(b) < 0, nothing else.',
            sp[0],
            'Continuity and the sign condition, with “nothing else” correctly implying no derivative is needed; satisfies the point.',
          ),
          annotation(
            'correct',
            "Newton: f' must exist and stay away from zero near the root, and x_0 has to be close enough, roughly where |f''/(2f')|·|e_0| < 1.",
            sp[1],
            "Differentiability with f' bounded away from zero, plus a quantitative closeness condition C|e_0| < 1 with C = |f''/(2f')|, which is the standard local convergence condition.",
          ),
        ],
        [
          'Convergence:',
          annotation(
            'correct',
            'Bisection is linear, the bound shrinks by exactly 1/2 per step, |x_n − x*| ≤ (b − a)/2^{n+1}.',
            sp[2],
            'Linear convergence with ratio 1/2 and the correct error bound; matches the reference.',
          ),
          flagged(
            annotation(
              'wrong',
              'Newton is quadratic, and once it converges it stays quadratic for any root, e.g. for f(x) = (x − 1)^2 it still doubles the digits each step.',
              sp[3],
              'Wrong: for f(x) = (x − 1)^2 the Newton step is x_{k+1} − 1 = (x_k − 1)/2, so the error only halves each step. Quadratic convergence requires a simple root, and the student’s own example disproves the claim.',
            ),
            'unclear',
            'The quadratic rate is right for simple roots, but the student extends it to “any root” and cites a double root as evidence; whether this overreach cancels the credit needs a check of the example.',
          ),
        ],
        [
          'Robustness:',
          annotation(
            'correct',
            'Bisection cannot fail as long as the sign change is there.',
            sp[4],
            'Guaranteed convergence whenever a valid sign-change bracket exists is the global-convergence property in the reference.',
          ),
          annotation(
            'correct',
            "Newton can diverge or oscillate from a bad x_0, and it blows up when f'(x_k) = 0, e.g. when starting exactly at a local extremum.",
            sp[5],
            "Divergence and oscillation from a poor x_0, plus the f'(x_k) = 0 breakdown at an extremum; correctly establishes that convergence is not guaranteed.",
          ),
        ],
        [
          'Cost:',
          flagged(
            annotation(
              'wrong',
              'Bisection needs two function values per step, f(a_n) and f(b_n), to decide which half to keep.',
              sp[6],
              'Wrong: both endpoint values are already known from earlier steps, so the only new evaluation is f(c_n) at the midpoint; bisection costs one evaluation per step, not two.',
            ),
            'unclear',
            'The sign test does use f(a_n) and f(b_n), but it is unclear whether the student thinks both are recomputed every step or merely compared; the cost count depends on which is meant.',
          ),
          flagged(
            annotation(
              'wrong',
              "Newton only needs one evaluation of the formula x_k − f(x_k)/f'(x_k), so it is also cheaper per iteration.",
              sp[7],
              "Wrong: evaluating the update needs both f(x_k) and f'(x_k), so a Newton step costs more than a bisection step; “cheaper per iteration” is the opposite of the reference.",
            ),
            'unclear',
            "“One evaluation of the formula” might silently include f' inside the formula; the student's cost model for Newton is ambiguous and should be checked against the f + f' requirement.",
          ),
          "Overall Newton is simply the better method whenever f' is known.",
        ],
      ],
    },
    {
      studentId: 5,
      paragraphs: [
        [
          '1. Prerequisites',
          annotation(
            'correct',
            'Bisection: after n steps the error is at most (b − a)/2^{n+1}, so it is linear convergence with factor 1/2.',
            sp[2],
            'Although written under “Prerequisites”, this is the convergence-rate point for bisection: the correct bound (b − a)/2^{n+1} and linear rate with factor 1/2.',
          ),
          annotation(
            'correct',
            "Newton: x_{k+1} = x_k − f(x_k)/f'(x_k), so f must be differentiable, f'(x_k) ≠ 0, and x_0 should be near the root.",
            sp[1],
            "Derives the requirements from the update formula: differentiability, f'(x_k) ≠ 0 and x_0 near the root; all three conditions of the point are present.",
          ),
        ],
        [
          '2. Convergence rate',
          annotation(
            'correct',
            'Bisection only works if f(a) and f(b) have different signs and f is continuous, otherwise there may be no root to converge to.',
            sp[0],
            'Placed under “Convergence rate”, but the content is the bisection prerequisite: a sign change plus continuity, with the correct reason that otherwise no root is guaranteed.',
          ),
          annotation(
            'correct',
            'Newton has order 2: |e_{k+1}| ≈ C|e_k|^2 when x* is a simple root.',
            sp[3],
            'Order 2 with the error relation |e_{k+1}| ≈ C|e_k|^2 and the simple-root condition; matches the point.',
          ),
        ],
        [
          '3. Robustness',
          annotation(
            'correct',
            'Bisection is cheap and simple, one f evaluation per step and no derivative.',
            sp[6],
            'Written under “Robustness”, but it states the per-iteration cost of bisection: one f evaluation and no derivative, exactly the cost point.',
          ),
          annotation(
            'wrong',
            'Newton is more robust because it uses more information about f, namely the derivative.',
            sp[5],
            'Using derivative information makes Newton faster, not more robust; Newton is only locally convergent and can diverge or cycle, so “more robust” reverses the reference.',
          ),
        ],
        [
          '4. Cost',
          annotation(
            'correct',
            "Bisection always gets the root in the end, it can't fail if the bracket is correct.",
            sp[4],
            'Under “Cost”, but this is the robustness point: convergence is guaranteed whenever the bracket is valid.',
          ),
        ],
      ],
    },
    {
      studentId: 6,
      paragraphs: [
        [
          annotation(
            'correct',
            'Bisection you start from [a, b] with f continuous and f(a), f(b) opposite sign and take c = (a + b)/2 and keep the half where the sign still changes,',
            sp[0],
            'Inside the run-on sentence the student states continuity and opposite signs at a and b before describing the halving step; this satisfies the bisection prerequisite.',
          ),
          "while Newton you draw the tangent at x_k and go to where it hits the x-axis, x_{k+1} = x_k − f(x_k)/f'(x_k),",
          annotation(
            'correct',
            'bisection the interval is halved each time so it is linear and slow, about 3 to 4 steps per decimal digit,',
            sp[2],
            'Halving per step, the word “linear” and 3–4 steps per decimal digit (log_2 10 ≈ 3.3) together give the bisection rate.',
          ),
          annotation(
            'correct',
            'Newton is quadratic when close to a simple root so the number of correct digits doubles each step,',
            sp[3],
            'Quadratic convergence near a simple root with the digit-doubling interpretation; matches the reference.',
          ),
          annotation(
            'correct',
            "but Newton can run away from the root or jump between two points if x_0 is bad, or if f' is zero the tangent never hits the axis,",
            sp[5],
            "Divergence, a 2-cycle from a bad x_0 and the f' = 0 breakdown (horizontal tangent) all appear; Newton's lack of guaranteed convergence is established.",
          ),
          annotation(
            'correct',
            'bisection never fails if the sign change is there,',
            sp[4],
            'Guaranteed convergence given a valid sign change is the bisection robustness point.',
          ),
          annotation(
            'wrong',
            'and it also works for a double root like f(x) = (x − 2)^2 because the midpoints still approach 2,',
            sp[0],
            'f(x) = (x − 2)^2 ≥ 0 has no sign change, so no valid bracket exists and bisection cannot even start; this contradicts the f(a)f(b) < 0 condition the student stated earlier in the same sentence.',
          ),
          annotation(
            'correct',
            'and per step bisection needs only one new f value',
            sp[6],
            'One new function value per bisection step matches the reference cost.',
          ),
          annotation(
            'wrong',
            "and Newton is also one value per step since f' comes for free once you know the formula.",
            sp[7],
            "Knowing the formula for f' does not make evaluating it free: every Newton step needs f(x_k) and f'(x_k), so the step is more expensive than a bisection step.",
          ),
        ],
      ],
    },
    {
      studentId: 7,
      paragraphs: [
        [
          'Prerequisites:',
          annotation(
            'correct',
            'For bisection we need a continuous f and a bracket [a, b] with f(a)f(b) < 0; the derivative is never used.',
            sp[0],
            'Continuity, a sign-change bracket and no derivative; covers the point fully.',
          ),
          annotation(
            'correct',
            "For Newton we need f differentiable, f'(x) ≠ 0 near the root, and a starting point x_0 close to x*.",
            sp[1],
            "Differentiability, nonvanishing f' near the root and a close x_0; matches the reference.",
          ),
        ],
        [
          'Convergence rate:',
          annotation(
            'wrong',
            'Bisection converges quadratically, because each step divides the error by 2, so the errors go e, e/2, e/4, e/8, …',
            sp[2],
            'The student’s own relation e_{n+1} = e_n/2 is the definition of linear convergence with ratio 1/2; calling it quadratic swaps the rate with Newton’s.',
          ),
          annotation(
            'wrong',
            'Newton converges linearly, |e_{k+1}| ≤ C|e_k| with C < 1, which is still fast because C is small near the root.',
            sp[3],
            'At a simple root Newton is quadratic, |e_{k+1}| ≈ C|e_k|^2, so e_{k+1}/e_k → 0; linear convergence only occurs at multiple roots. Together with the previous sentence the two rates are swapped.',
          ),
        ],
        [
          'Robustness:',
          annotation(
            'correct',
            'Bisection always converges when the root is bracketed, no matter how wide [a, b] is.',
            sp[4],
            'Guaranteed convergence from any valid bracket regardless of width; this is global convergence.',
          ),
          annotation(
            'correct',
            "Newton may diverge or cycle when x_0 is far from the root, and fails when f'(x_k) = 0.",
            sp[5],
            "Divergence or cycling from a distant x_0 and failure at f'(x_k) = 0; matches the reference.",
          ),
        ],
        [
          'Cost per iteration:',
          annotation(
            'correct',
            'Bisection costs one function evaluation per step.',
            sp[6],
            'One function evaluation per bisection step is the reference cost.',
          ),
          annotation(
            'unclear',
            "For Newton the cost per step depends on the derivative; if f' is complicated it can be much more.",
            sp[7],
            "Acknowledges that f' affects the cost but never states that each step needs both f and f'; the instructor should decide whether “depends on the derivative” counts as the f + f' cost.",
          ),
        ],
      ],
    },
    {
      studentId: 8,
      paragraphs: [
        [
          'Prerequisites.',
          annotation(
            'correct',
            'Bisection only needs continuity and a sign change on [a, b]; smoothness is irrelevant.',
            sp[0],
            'Continuity and a sign change, and “smoothness is irrelevant” correctly says no derivative is needed; satisfies the point.',
          ),
          annotation(
            'unclear',
            'Newton needs a smooth f and an x_0 that is ‘reasonably’ close, where ‘reasonably’ depends on the curvature.',
            sp[1],
            "Smoothness implies differentiability and the curvature remark hints at the f''/f' constant, but f'(x_k) ≠ 0 is never mentioned; the instructor must judge whether the closeness condition alone earns the point.",
          ),
        ],
        [
          'Rates.',
          annotation(
            'correct',
            'Bisection gains one binary digit per step, independent of f.',
            sp[2],
            'One binary digit per step is exactly linear convergence with ratio 1/2, i.e. the bound halves every iteration, regardless of f; credited despite no use of the word “linear”.',
          ),
          annotation(
            'unclear',
            'Newton is often said to be quadratic, though I think this is more of an asymptotic statement and depends on the root.',
            sp[3],
            'The student reports the quadratic rate without committing to it, and “depends on the root” may or may not refer to the simple-root condition; the instructor should check whether this hedge shows understanding.',
          ),
        ],
        [
          'Robustness.',
          annotation(
            'correct',
            'Bisection is globally convergent on any valid bracket.',
            sp[4],
            'Uses the exact term “globally convergent” with the valid-bracket condition; matches the reference.',
          ),
          annotation(
            'unclear',
            'Newton is less forgiving: the iteration can wander, although for most functions met in practice it settles down.',
            sp[5],
            '“Can wander” may mean divergence or cycling, but the student immediately softens it and never says convergence can fail; the instructor must decide whether this conveys that Newton is only locally convergent.',
          ),
        ],
        [
          'Cost.',
          annotation(
            'wrong',
            'Per iteration the two are comparable; the real difference is the number of iterations, not the cost of each.',
            sp[7],
            "A Newton step needs f and f' while a bisection step needs only f, so the per-iteration costs are not comparable; the claim sounds plausible but contradicts the reference.",
          ),
        ],
      ],
    },
    {
      studentId: 9,
      paragraphs: [
        [
          'Prerequisites.',
          annotation(
            'wrong',
            'Bisection requires f to be monotone on [a, b], so that the root is unique and the method knows which half to keep.',
            sp[0],
            'Monotonicity is not required: continuity and f(a)f(b) < 0 suffice, and the sign test picks a half even when several roots exist. The student also never states continuity or the sign condition.',
          ),
          annotation(
            'wrong',
            'Newton requires only that f be continuous; the derivative can always be approximated, so no extra conditions apply.',
            sp[1],
            "Newton needs f differentiable, f'(x_k) ≠ 0 and a close x_0; “only continuous” and “no extra conditions” omit all three.",
          ),
        ],
        [
          'Convergence.',
          annotation(
            'wrong',
            'Since bisection halves the interval, the error is squared at each step, which is precisely quadratic convergence; this is why bisection needs so few iterations.',
            sp[2],
            'Halving the interval divides the error bound by 2, it does not square it; e_{n+1} = e_n/2 is linear convergence, and bisection needs many iterations (about 3.3 per digit).',
          ),
          annotation(
            'wrong',
            'Newton, by contrast, converges superlinearly with order (1 + √5)/2 ≈ 1.618.',
            sp[3],
            'Order (1 + √5)/2 ≈ 1.618 belongs to the secant method; Newton has order 2 at a simple root. The fluent phrasing hides a confusion between the two methods.',
          ),
        ],
        [
          'Robustness.',
          annotation(
            'wrong',
            "Newton's method converges for every starting value x_0, because each tangent step moves strictly closer to the root; this monotone behaviour makes it the more robust method.",
            sp[5],
            'Newton does not converge for every x_0: e.g. f(x) = x^3 − 2x + 2 from x_0 = 0 cycles 0 → 1 → 0, and arctan x diverges for |x_0| > 1.39. The “strictly closer” claim is false in general.',
          ),
          annotation(
            'correct',
            'Bisection is also convergent whenever the initial bracket contains a sign change.',
            sp[4],
            'Convergence whenever the initial bracket has a sign change is the bisection robustness point, even though the surrounding argument is flawed.',
          ),
        ],
        [
          'Cost.',
          annotation(
            'correct',
            "Each Newton iteration requires f(x_k) and f'(x_k), so it is roughly twice as expensive as a bisection step.",
            sp[7],
            "Correctly counts f and f' per Newton step and compares the cost with bisection.",
          ),
        ],
      ],
    },
    {
      studentId: 10,
      paragraphs: [
        [
          'Convergence rate.',
          annotation(
            'correct',
            'For bisection, c_n is the midpoint of an interval of length (b − a)/2^n, so |c_n − x*| ≤ (b − a)/2^{n+1}; to reach a tolerance ε we need n ≥ log_2((b − a)/ε) − 1, i.e. for b − a = 1 and ε = 10^{-8} about 26 steps.',
            sp[2],
            'Derives the bound (b − a)/2^{n+1} from the interval length and inverts it correctly for n; log_2(10^8) − 1 ≈ 25.6, so about 26 steps is right.',
          ),
          annotation(
            'correct',
            "For Newton, expanding 0 = f(x*) around x_k gives e_{k+1} = f''(ξ_k)/(2f'(x_k))·e_k^2 with e_k = x_k − x*, so the order is 2 at a simple root.",
            sp[3],
            'A correct Taylor derivation of the quadratic error relation, sign and constant included, with the simple-root condition.',
          ),
          annotation(
            'correct',
            "At a root of multiplicity m this breaks down because f'(x*) = 0, and one gets e_{k+1} ≈ (1 − 1/m)e_k, only linear.",
            sp[3],
            'Goes beyond the key: the multiple-root case gives linear convergence with ratio (m − 1)/m, which is correct and matches the “only linear at a multiple root” clause.',
          ),
        ],
        [
          'Robustness.',
          annotation(
            'correct',
            'Bisection: the invariant f(a_n)f(b_n) < 0 is kept at every step, so the bracket always contains a root and the method cannot fail.',
            sp[4],
            'Proves global convergence through the loop invariant f(a_n)f(b_n) < 0; matches the reference.',
          ),
          annotation(
            'correct',
            'Newton: for f(x) = arctan x, starting at |x_0| > 1.39 the iterates alternate in sign and grow in size, so it diverges, even though the root x* = 0 is simple.',
            sp[5],
            'The arctan counterexample is correct (the critical value is about 1.3917) and shows divergence at a simple root, which is exactly why Newton is only locally convergent.',
          ),
        ],
      ],
    },
    {
      studentId: 11,
      paragraphs: [
        [
          'I use f(x) = cos x − x for everything.',
          annotation(
            'correct',
            'Bisection applies on [0, 1] because f is continuous and f(0) = 1 > 0, f(1) = cos 1 − 1 ≈ −0.460 < 0.',
            sp[0],
            'Checks continuity and the sign change on the concrete bracket; the values f(0) = 1 and f(1) ≈ −0.460 are correct.',
          ),
          annotation(
            'correct',
            'To get |c_n − x*| ≤ 10^{-6} I need 1/2^{n+1} ≤ 10^{-6}, so n = 19, i.e. 20 midpoints, and the error bound only halves each time.',
            sp[2],
            'Applies the bound (b − a)/2^{n+1} correctly (2^{20} ≈ 1.05·10^6) and identifies the halving, i.e. linear, rate.',
          ),
        ],
        [
          annotation(
            'correct',
            "Newton needs f'(x) = −sin x − 1, which lies in [−1.85, −1] on [0, 1], so it never vanishes there, and x_0 = 1 is close enough.",
            sp[1],
            "Computes f' and verifies f' ≠ 0 on the interval, plus a starting point close to the root; the prerequisites are demonstrated on the example rather than stated abstractly.",
          ),
          annotation(
            'correct',
            'From x_0 = 1: x_1 = 0.750364, x_2 = 0.739113, x_3 = 0.739085; the errors 1.1e-2, 2.8e-5, 1.7e-10 are each about 0.22 times the square of the previous one, so this is quadratic.',
            sp[3],
            "The iterates and errors are correct, and the ratio 0.22 matches |f''(x*)/(2f'(x*))| = cos(x*)/(2(1 + sin x*)) ≈ 0.221; a numerical demonstration of quadratic convergence.",
          ),
        ],
        [
          annotation(
            'correct',
            'Bisection would have reached the root from any bracket, even [−10, 10], just more slowly.',
            sp[4],
            'Guaranteed convergence regardless of bracket width; [−10, 10] is a valid bracket here since f(−10) > 0 > f(10).',
          ),
          annotation(
            'correct',
            "Here Newton was safe, but starting at x_0 = −π/2 gives f'(x_0) = 0 and the first step is undefined.",
            sp[5],
            "Correct: −sin(−π/2) − 1 = 0, so the method breaks down at that x_0; a concrete instance of the f'(x_k) = 0 failure, showing convergence is not guaranteed.",
          ),
          annotation(
            'unclear',
            'Per iteration they cost almost the same here, since sin and cos are equally cheap.',
            sp[7],
            "The student implicitly counts the extra sin evaluation for f' but concludes the costs are “almost the same”; true for this f, but the instructor should decide whether it shows the general f + f' cost per Newton step.",
          ),
          'So 3 Newton steps beat 20 bisection steps easily.',
        ],
      ],
    },
    {
      studentId: 12,
      paragraphs: [
        [
          annotation(
            'correct',
            'Bisection: f continuous with f(a)f(b) < 0,',
            sp[0],
            'Continuity and the sign condition in one line; this is the full bisection prerequisite.',
          ),
          annotation(
            'correct',
            'and then convergence is guaranteed.',
            sp[4],
            'The second half of the same sentence states guaranteed convergence once the bracket is valid, which is the separate robustness point.',
          ),
          annotation(
            'correct',
            'Error ≤ (b − a)/2^{n+1}, so linear.',
            sp[2],
            'Correct error bound and linear rate in one compact line.',
          ),
        ],
        [
          annotation(
            'correct',
            'Newton: digits double near a simple root,',
            sp[3],
            '“Digits double near a simple root” is exactly quadratic convergence with the simple-root condition.',
          ),
          annotation(
            'correct',
            "but a bad x_0 or f'(x_k) = 0 can wreck it.",
            sp[5],
            "Names both failure modes, a poor x_0 and f'(x_k) = 0, so convergence is not guaranteed; credited as the Newton robustness point.",
          ),
        ],
      ],
    },
  ],
}

export default demoCase
