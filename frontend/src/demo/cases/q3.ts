import { annotation, flagged, type DemoCase } from '../caseTypes'

const sp = [
  'Scoring Point 1 (Update Formula: Explicit Euler) y_{n+1} = y_n + h f(t_n, y_n): the slope is evaluated at the known point (t_n, y_n), so y_{n+1} is computed directly from known values. The method is first order (global error O(h)).',
  'Scoring Point 2 (Update Formula: Implicit Euler) y_{n+1} = y_n + h f(t_{n+1}, y_{n+1}): the slope is evaluated at the unknown new point, so y_{n+1} appears on both sides and is defined implicitly by an equation. It is also only first order (global error O(h)), not more accurate than explicit Euler.',
  "Scoring Point 3 (Stability: Explicit Euler) For the test equation y' = λy it gives y_{n+1} = (1 + hλ) y_n, so it is stable only when |1 + hλ| ≤ 1 (the disc of radius 1 centred at −1); for real λ < 0 this means h ≤ 2/|λ|. The method is conditionally stable.",
  "Scoring Point 4 (Stability: Implicit Euler) For y' = λy it gives y_{n+1} = y_n / (1 − hλ), and |1/(1 − hλ)| ≤ 1 for every h > 0 whenever Re(λ) ≤ 0, so the stability region contains the whole left half-plane (A-stable). The factor tends to 0 as hλ → −∞ (L-stable), so stiff components are damped.",
  'Scoring Point 5 (Cost per Step: Explicit Euler) One evaluation of f per step and no equation to solve, so each step is very cheap.',
  'Scoring Point 6 (Cost per Step: Implicit Euler) Each step requires solving y_{n+1} − h f(t_{n+1}, y_{n+1}) = y_n, in general a nonlinear system (e.g. Newton’s method with the matrix I − hJ, J = ∂f/∂y), so one step costs more than an explicit step. For linear f it reduces to one linear solve.',
  'Scoring Point 7 (Choice for the Stiff Problem: Explicit Euler) Here ∂f/∂y = λ = −1000, so explicit Euler needs h ≤ 2/1000 = 0.002 for stability, even after the fast transient e^{−1000t} has died out and y ≈ cos t varies slowly; e.g. 5000 steps on [0, 10], far more than accuracy requires. It is not the method to choose.',
  'Scoring Point 8 (Choice for the Stiff Problem: Implicit Euler) Choose implicit Euler: it is stable for every h > 0 here, so h is set only by the accuracy needed to follow the slow cos t component (e.g. h = 0.05–0.1). Because f is linear in y, each step has the closed form y_{n+1} = (y_n + 1000h cos t_{n+1}) / (1 + 1000h), so the extra cost per step is negligible. Other reasonable justifications based on stability are also acceptable.',
] as const

const demoCase: DemoCase = {
  question: {
    question_id: 3,
    question:
      "Compare the explicit (forward) Euler method and the implicit (backward) Euler method for y' = f(t, y). Which would you choose for the stiff problem y' = -1000(y - cos t), and why? (Update Formula, Stability, Cost per Step, Choice for the Stiff Problem)",
    score: 8,
  },
  pointsPerCriterion: 1,
  rubric: sp,
  responses: [
    // 1. Excellent, rigorous; one hedged point left genuinely unclear.
    {
      studentId: 1,
      paragraphs: [
        [
          'Update formula.',
          annotation(
            'correct',
            'Explicit Euler: y_{n+1} = y_n + h f(t_n, y_n), i.e. the integral of f over [t_n, t_{n+1}] approximated by the left-endpoint rule, so y_{n+1} is obtained directly from known data.',
            sp[0],
            'Correct formula with the slope at the known point, and the left-endpoint-rule view makes explicit why y_{n+1} needs no solve.',
          ),
          annotation(
            'correct',
            'Implicit Euler: y_{n+1} = y_n + h f(t_{n+1}, y_{n+1}) (right-endpoint rule), so y_{n+1} appears on both sides and must be found by solving an equation.',
            sp[1],
            'Correct formula, and the student states the defining feature: y_{n+1} occurs on both sides, so each step is an equation to solve.',
          ),
          "Both have local error O(h^2) and global error O(h); the leading terms are ±(h^2/2)y'' with opposite signs.",
        ],
        [
          "Stability (y' = λy, z = hλ).",
          annotation(
            'correct',
            'Explicit: y_{n+1} = (1 + z)y_n, so we need |1 + z| ≤ 1, the unit disc centred at −1; for real λ < 0 this is h ≤ 2/|λ|.',
            sp[2],
            'Amplification factor 1 + z, the disc |1 + z| ≤ 1 centred at −1 and the real-axis bound h ≤ 2/|λ| are all exactly as required.',
          ),
          annotation(
            'unclear',
            'Implicit: y_{n+1} = y_n/(1 − z), and |1/(1 − z)| ≤ 1 for any step size, at least for the λ we care about.',
            sp[3],
            'The factor 1/(1 − z) is right, but "for any step size" is only true when Re(λ) ≤ 0 (for 0 < hλ < 2 the factor exceeds 1), and "the λ we care about" is a hedge. The instructor should decide whether it implies Re(λ) ≤ 0, i.e. A-stability.',
          ),
        ],
        [
          'Cost per step.',
          annotation(
            'correct',
            'Explicit costs one f-evaluation and no solve.',
            sp[4],
            'States exactly the per-step cost of explicit Euler: a single evaluation of f and no equation to solve.',
          ),
          annotation(
            'correct',
            'Implicit needs a nonlinear solve per step, typically Newton with the matrix I − hJ, J = ∂f/∂y, so one step is several times more expensive.',
            sp[5],
            'Names the per-step nonlinear solve and the Newton matrix I − hJ, which is precisely what makes an implicit step more expensive.',
          ),
        ],
        [
          'Stiff problem.',
          annotation(
            'correct',
            'Here ∂f/∂y = −1000, so explicit Euler needs h ≤ 0.002 although after t ≈ 0.01 the transient e^{−1000t} is below 10^{−4} and y ≈ cos t is smooth.',
            sp[6],
            'Correct bound h ≤ 2/1000 = 0.002, and the student checks the key point numerically: e^{−10} ≈ 4.5·10^{−5}, so stability, not the smooth solution, forces the tiny step.',
          ),
          annotation(
            'correct',
            'I would take implicit Euler with h chosen by accuracy alone; the equation is linear in y, so each step is just y_{n+1} = (y_n + 1000h cos t_{n+1})/(1 + 1000h), no Newton iteration at all.',
            sp[7],
            'Correct choice and justification, and the closed-form step (1 + 1000h)y_{n+1} = y_n + 1000h cos t_{n+1} is derived correctly, showing the implicit cost is negligible here.',
          ),
        ],
      ],
    },
    // 2. Excellent, unconventional: own words, pictures and an example, almost no textbook terms.
    {
      studentId: 2,
      paragraphs: [
        [
          annotation(
            'correct',
            'Forward: stand at (t_n, y_n), read the slope there, walk a distance h along it: y_{n+1} = y_n + h·f(t_n, y_n).',
            sp[0],
            'A picture-in-words of explicit Euler plus the exact formula; the slope is taken at the known current point, so the update is direct.',
          ),
          annotation(
            'correct',
            'Backward: choose the landing point so that the slope there points back to where you started, i.e. y_{n+1} = y_n + h·f(t_{n+1}, y_{n+1}), which is an equation for y_{n+1}, not an assignment.',
            sp[1],
            'The "landing point whose slope points back" image is exactly the implicit definition, and "an equation, not an assignment" says that y_{n+1} must be solved for, without using the word implicit.',
          ),
          'Neither is more accurate, both errors shrink like h.',
        ],
        [
          "Try y' = −50y with h = 0.1.",
          annotation(
            'correct',
            'Forward gives y_{n+1} = (1 − 5)y_n = −4y_n, so the numbers flip sign and grow 4× per step while the true solution decays; forward only stays bounded when the multiplier 1 + hλ is between −1 and 1, which here means h ≤ 2/50 = 0.04.',
            sp[2],
            'The example is computed correctly (1 + hλ = −4), and "multiplier between −1 and 1" is the real-axis form of |1 + hλ| ≤ 1, giving h ≤ 2/|λ| = 0.04. Conditional stability shown without the textbook term.',
          ),
          annotation(
            'correct',
            'Backward gives y_{n+1} = y_n/(1 + 5) = y_n/6; in general the multiplier is 1/(1 − hλ), whose size is below 1 for every h as soon as the real part of λ is ≤ 0, and it goes to 0 when h|λ| is huge, so a fast decaying mode is wiped out in one step instead of ringing.',
            sp[3],
            '|1/(1 − hλ)| ≤ 1 for every h when Re(λ) ≤ 0 is precisely A-stability, and the factor tending to 0 for large h|λ| is L-stability, though the student never uses either term.',
          ),
        ],
        [
          annotation(
            'correct',
            'Forward step = one call of f, nothing else.',
            sp[4],
            'One evaluation of f and nothing to solve is exactly the explicit per-step cost.',
          ),
          annotation(
            'correct',
            'Backward step = a root-finding problem g(Y) = Y − y_n − h f(t_{n+1}, Y) = 0 every time, usually a few Newton steps each needing a linear solve with I − h∂f/∂y.',
            sp[5],
            'Writes the per-step equation as a root-finding problem and names Newton with the matrix I − h∂f/∂y, which is the rubric’s I − hJ.',
          ),
        ],
        [
          annotation(
            'correct',
            "In y' = −1000(y − cos t) the same multiplier logic says forward needs h ≤ 2/1000 = 0.002 for the whole run, even though after ~0.01 time units only the slow cos t part is left; on [0, 10] that is 5000 steps to draw something that looks like cos t.",
            sp[6],
            'Correct bound 0.002 and correct count 10/0.002 = 5000, with the key observation that the restriction persists after the transient has gone.',
          ),
          annotation(
            'correct',
            'Backward wins: g is linear here, so (1 + 1000h)y_{n+1} = y_n + 1000h cos t_{n+1} solves by hand, and h = 0.1 already follows cos t nicely, about 100 steps.',
            sp[7],
            'Correct choice with the correct closed-form step, and h = 0.1 is chosen by how well cos t is followed, i.e. by accuracy rather than stability.',
          ),
        ],
      ],
    },
    // 3. Strong and thorough; one subtle error buried in the stiff-problem paragraph.
    {
      studentId: 3,
      paragraphs: [
        [
          'Update formulas',
          annotation(
            'correct',
            "The explicit (forward) Euler method comes from the Taylor expansion y(t_{n+1}) = y(t_n) + h y'(t_n) + O(h^2) and gives y_{n+1} = y_n + h f(t_n, y_n), which can be evaluated directly.",
            sp[0],
            'Correct derivation from a forward Taylor expansion and the correct formula; "evaluated directly" captures the explicit nature.',
          ),
          annotation(
            'correct',
            "The implicit (backward) Euler method expands around t_{n+1} instead, y(t_n) = y(t_{n+1}) − h y'(t_{n+1}) + O(h^2), which gives y_{n+1} = y_n + h f(t_{n+1}, y_{n+1}); since y_{n+1} is inside f, the formula defines y_{n+1} only implicitly.",
            sp[1],
            'The backward Taylor expansion is correct and leads to the right formula; the student explicitly notes y_{n+1} is defined only implicitly.',
          ),
          'Both methods have local truncation error O(h^2) and are therefore first-order methods.',
        ],
        [
          'Stability',
          annotation(
            'correct',
            "Applying explicit Euler to y' = λy gives y_n = (1 + hλ)^n y_0, which stays bounded only if |1 + hλ| ≤ 1, so the method is conditionally stable with h ≤ 2/|λ| for real negative λ.",
            sp[2],
            'Closed form (1 + hλ)^n y_0, the condition |1 + hλ| ≤ 1 and the bound h ≤ 2/|λ| are all correct.',
          ),
          annotation(
            'correct',
            'Implicit Euler gives y_n = (1 − hλ)^{−n} y_0, and |1 − hλ| ≥ 1 for all h > 0 whenever Re(λ) ≤ 0, so the method is A-stable; it is also L-stable because 1/(1 − hλ) → 0 as hλ → −∞.',
            sp[3],
            'Correct closed form, correct condition including the Re(λ) ≤ 0 qualifier, and both A- and L-stability are justified rather than just named.',
          ),
        ],
        [
          'Cost per step',
          annotation(
            'correct',
            'Explicit Euler needs one evaluation of f per step and no linear algebra.',
            sp[4],
            'One f-evaluation and no linear algebra is exactly the explicit per-step cost.',
          ),
          annotation(
            'correct',
            "Implicit Euler must solve y_{n+1} − h f(t_{n+1}, y_{n+1}) = y_n at every step, normally by Newton's method, where each iteration requires the Jacobian and an LU solve with I − hJ.",
            sp[5],
            'Writes the per-step equation exactly and correctly describes the Newton/LU work with I − hJ.',
          ),
        ],
        [
          'Choice for the stiff problem',
          'The solution is y(t) ≈ cos t + 0.001 sin t plus a transient C e^{−1000t}, so the problem is stiff: one time scale is 10^{−3}, the other is of order 1.',
          annotation(
            'wrong',
            'For explicit Euler the stability condition is |1 − 1000h| ≤ 1, which gives h ≤ 0.001, so 10 000 steps would be needed on [0, 10] although the solution is smooth.',
            sp[6],
            'The inequality |1 − 1000h| ≤ 1 is right but solved wrongly: −1 ≤ 1 − 1000h ≤ 1 gives h ≤ 2/1000 = 0.002, not 0.001, so the bound and the 10 000-step count are both off by a factor of 2.',
          ),
          annotation(
            'correct',
            'Therefore I choose implicit Euler: since the right-hand side is linear in y, each step is y_{n+1} = (y_n + 1000h cos t_{n+1})/(1 + 1000h), and h can be chosen as large as accuracy for cos t allows, e.g. h = 0.05.',
            sp[7],
            'Correct choice, correct closed-form step, and h is explicitly set by accuracy for cos t, exactly as the point requires.',
          ),
        ],
      ],
    },
    // 4. Confident; three claims the first pass cannot settle, the regrade settles them.
    {
      studentId: 4,
      paragraphs: [
        [
          'Formulas:',
          annotation(
            'correct',
            'Forward Euler y_{n+1} = y_n + h f(t_n, y_n).',
            sp[0],
            'Correct explicit Euler formula with f evaluated at the known point (t_n, y_n).',
          ),
          annotation(
            'correct',
            'Backward Euler y_{n+1} = y_n + h f(t_{n+1}, y_{n+1}), here y_{n+1} is unknown on both sides so it is implicit.',
            sp[1],
            'Correct implicit Euler formula, and the student notes that y_{n+1} is unknown on both sides.',
          ),
          flagged(
            annotation(
              'wrong',
              'Backward Euler is the more accurate one of the two, because the slope is taken at the end of the step where the solution actually is.',
              sp[1],
              "Both methods are first order, with local errors +(h²/2)y'' and −(h²/2)y'' of equal size; using the end-point slope improves damping, not accuracy. The claim contradicts the point.",
            ),
            'unclear',
            '"More accurate" could refer to better qualitative behaviour on decaying solutions, which is a stability effect, or to a smaller truncation error. Check which the student means before judging it against the first-order statement.',
          ),
        ],
        [
          'Stability:',
          annotation(
            'correct',
            'Forward Euler is stable only if |1 + hλ| ≤ 1, for negative real λ this means h ≤ 2/|λ|.',
            sp[2],
            'Correct stability condition |1 + hλ| ≤ 1 and the correct real-axis bound h ≤ 2/|λ|.',
          ),
          annotation(
            'correct',
            'Backward Euler has amplification 1/(1 − hλ) and is A-stable, the whole left half plane is inside the stability region.',
            sp[3],
            'Correct amplification factor, and A-stability is stated with its meaning (left half-plane inside the region).',
          ),
        ],
        [
          'Cost:',
          annotation(
            'correct',
            'Forward Euler: one function evaluation per step, nothing to solve.',
            sp[4],
            'Exactly the explicit per-step cost: one evaluation of f and no equation to solve.',
          ),
          flagged(
            annotation(
              'wrong',
              'Backward Euler needs a matrix inversion of I − hJ in every step, therefore it is always slower overall than forward Euler.',
              sp[5],
              '"Always slower overall" is false and contradicts the student’s own choice below: at λ = −1000 forward Euler needs 5000 steps on [0, 10], backward Euler about 100. Also, one solves with I − hJ (LU), never forms the inverse.',
            ),
            'unclear',
            'The per-step part (work with I − hJ each step) matches the point, but "always slower overall" is a claim about total run time. Unclear whether to credit the per-step cost or penalise the overgeneralisation.',
          ),
        ],
        [
          'Stiff problem:',
          flagged(
            annotation(
              'correct',
              "For y' = −1000(y − cos t) I take backward Euler, it is unconditionally stable so h only has to resolve cos t, h = 0.1 is fine.",
              sp[7],
              'Here λ = −1000 < 0, so "stable for every h" is true for this problem, and choosing h only to resolve cos t (h = 0.1) is exactly the reasoning of the point. Credited.',
            ),
            'unclear',
            '"Unconditionally stable" is an overgeneralisation in general (it fails for Re(λ) > 0), so it is unclear whether the justification is sound or rests on the belief that implicit Euler is stable for every problem.',
          ),
        ],
      ],
    },
    // 5. Good content, but filed under the wrong headings.
    {
      studentId: 5,
      paragraphs: [
        [
          'Update formula:',
          annotation(
            'correct',
            'Explicit y_{n+1} = y_n + h f(t_n, y_n).',
            sp[0],
            'Correct explicit Euler formula; the slope is taken at the known point.',
          ),
          annotation(
            'correct',
            "Implicit applied to y' = λy gives y_{n+1} = y_n/(1 − hλ), which stays bounded for every h when Re λ ≤ 0, that is why it is called A-stable.",
            sp[3],
            'Written under "Update formula", but this is the stability result: factor 1/(1 − hλ), bounded for every h when Re λ ≤ 0, i.e. A-stability. Credited to the stability point.',
          ),
        ],
        [
          'Stability:',
          annotation(
            'correct',
            'Implicit is stable but we pay for it: in every step the equation y_{n+1} − h f(t_{n+1}, y_{n+1}) = y_n must be solved, normally with Newton and the Jacobian.',
            sp[5],
            'Placed under "Stability", but the content is the implicit per-step cost: solving y_{n+1} − h f(t_{n+1}, y_{n+1}) = y_n by Newton each step. Credited to the cost point.',
          ),
        ],
        [
          'Cost per step:',
          annotation(
            'correct',
            'Explicit Euler is only usable when |1 + hλ| ≤ 1, for real λ < 0 this means h ≤ 2/|λ|, otherwise the error grows every step.',
            sp[2],
            'Under "Cost per step", but it states the explicit stability condition |1 + hλ| ≤ 1 and h ≤ 2/|λ| correctly, so it matches the explicit stability point.',
          ),
        ],
        [
          'Stiff problem:',
          annotation(
            'correct',
            'With the implicit formula y_{n+1} = y_n + h f(t_{n+1}, y_{n+1}) the unknown y_{n+1} is inside f,',
            sp[1],
            'The implicit update formula only appears in the stiff-problem section, but it is correct and the student notes y_{n+1} is inside f.',
          ),
          annotation(
            'correct',
            'but here f is linear in y so we get y_{n+1} = (y_n + 1000h cos t_{n+1})/(1 + 1000h) directly and can take h large, only limited by how accurately we want cos t.',
            sp[7],
            'Correct closed-form step for this linear problem and h limited only by accuracy for cos t, which is the justification the point asks for.',
          ),
        ],
      ],
    },
    // 6. One dense unheaded paragraph interleaving both methods.
    {
      studentId: 6,
      paragraphs: [
        [
          annotation(
            'correct',
            'Explicit Euler is y_{n+1} = y_n + h f(t_n, y_n)',
            sp[0],
            'Correct explicit formula, segmented out of a run-on sentence that also covers implicit Euler.',
          ),
          annotation(
            'correct',
            'and implicit is y_{n+1} = y_n + h f(t_{n+1}, y_{n+1}) so the new value is hidden inside f,',
            sp[1],
            'Correct implicit formula; "the new value is hidden inside f" means y_{n+1} is defined implicitly.',
          ),
          annotation(
            'correct',
            'so explicit costs one f evaluation per step',
            sp[4],
            'A clause of the run-on sentence that states the explicit per-step cost exactly: one evaluation of f.',
          ),
          annotation(
            'correct',
            'while implicit needs Newton iteration with I − hJ every step,',
            sp[5],
            'Names the per-step Newton solve with I − hJ, which is the source of the higher implicit cost.',
          ),
          annotation(
            'correct',
            "but explicit applied to y' = λy multiplies by 1 + hλ each step so it needs |1 + hλ| ≤ 1, h ≤ 2/|λ|,",
            sp[2],
            'Correct factor 1 + hλ, condition |1 + hλ| ≤ 1 and bound h ≤ 2/|λ|, all inside one clause.',
          ),
          annotation(
            'wrong',
            'and implicit multiplies by 1/(1 + hλ) which is always below 1, so no restriction.',
            sp[3],
            'Sign error: the implicit factor is 1/(1 − hλ). The stated 1/(1 + hλ) has modulus above 1 for −2 < hλ < 0 and is unbounded at hλ = −1, so it does not support "no restriction".',
          ),
          annotation(
            'correct',
            "For y' = −1000(y − cos t) that means explicit needs h ≤ 0.002 for the whole interval although the solution is basically cos t after t ≈ 0.01,",
            sp[6],
            'Correct bound h ≤ 2/1000 = 0.002, and the student notes it applies even after the transient, when the solution is just ≈ cos t.',
          ),
          annotation(
            'unclear',
            'so implicit is the better choice since it is more stable and the bigger step makes up for the solve.',
            sp[7],
            'Right choice, but "more stable" never says h is limited only by accuracy, and the student’s own factor 1/(1 + hλ) would blow up near hλ = −1. The instructor should decide whether the justification is sound.',
          ),
        ],
      ],
    },
    // 7. Good, but swaps the stability factors of the two methods.
    {
      studentId: 7,
      paragraphs: [
        [
          'Update Formula',
          annotation(
            'correct',
            'Explicit Euler: y_{n+1} = y_n + h f(t_n, y_n), computed straight away from the old value.',
            sp[0],
            'Correct formula, and "computed straight away from the old value" captures the explicit update.',
          ),
          annotation(
            'correct',
            'Implicit Euler: y_{n+1} = y_n + h f(t_{n+1}, y_{n+1}), the new value appears on both sides, we must solve for it each step.',
            sp[1],
            'Correct formula, with y_{n+1} on both sides and solved for at every step.',
          ),
        ],
        [
          'Stability',
          "Use the test equation y' = λy with Re λ < 0.",
          annotation(
            'wrong',
            'For explicit Euler the amplification factor is 1/(1 − hλ), and |1/(1 − hλ)| ≤ 1 for all h > 0, so explicit Euler is A-stable.',
            sp[2],
            'Swapped: 1/(1 − hλ) is the implicit factor. Explicit Euler gives y_{n+1} = (1 + hλ)y_n and is only conditionally stable, which the student’s own h ≤ 0.002 below contradicts.',
          ),
          annotation(
            'wrong',
            'For implicit Euler the factor is 1 + hλ and the method is only stable inside the disc |1 + hλ| ≤ 1, so h ≤ 2/|λ|.',
            sp[3],
            'Swapped: the disc |1 + hλ| ≤ 1 and h ≤ 2/|λ| belong to explicit Euler. Implicit Euler has factor 1/(1 − hλ) and is A-stable.',
          ),
        ],
        [
          'Cost per Step',
          annotation(
            'correct',
            'Implicit Euler needs to solve a nonlinear equation (Newton, with Jacobian I − hJ) every step, so a single step is several f-evaluations plus a linear solve.',
            sp[5],
            'Correctly describes the per-step nonlinear solve with Newton and I − hJ, hence a more expensive step.',
          ),
          'For big systems this difference matters a lot.',
        ],
        [
          'Choice',
          annotation(
            'correct',
            "For y' = −1000(y − cos t), explicit Euler needs |1 − 1000h| ≤ 1, i.e. h ≤ 0.002, which means 5000 steps on [0, 10] even though y ≈ cos t is smooth.",
            sp[6],
            'Correct in itself: |1 − 1000h| ≤ 1 gives h ≤ 0.002 and 5000 steps on [0, 10]. Note that it contradicts the student’s Stability section, which gave this disc to implicit Euler.',
          ),
          annotation(
            'correct',
            'So I use implicit Euler: because f is linear, y_{n+1} = (y_n + 1000h cos t_{n+1})/(1 + 1000h), and h can be 0.1 just for accuracy.',
            sp[7],
            'Correct choice, correct closed-form step, and h = 0.1 is chosen for accuracy, as the point requires.',
          ),
        ],
      ],
    },
    // 8. Sophisticated but hedged; several borderline claims keep the paper flagged.
    {
      studentId: 8,
      paragraphs: [
        [
          annotation(
            'correct',
            'Explicit Euler, y_{n+1} = y_n + h f(t_n, y_n), is the left-rectangle rule applied to y(t_{n+1}) = y(t_n) + ∫ f dt.',
            sp[0],
            'Correct formula, derived as the left-rectangle quadrature of the integral form, so y_{n+1} uses only known data.',
          ),
          annotation(
            'correct',
            'Implicit Euler is the right-rectangle rule, y_{n+1} = y_n + h f(t_{n+1}, y_{n+1}), so y_{n+1} is defined by a fixed-point equation.',
            sp[1],
            'Correct formula and correct observation that y_{n+1} is defined by an equation (right-rectangle rule).',
          ),
        ],
        [
          annotation(
            'unclear',
            'Explicit Euler is stable as long as h is small compared to the fastest time scale of the problem.',
            sp[2],
            '"h small compared to the fastest time scale" is h ≲ 1/|λ_max|, the right idea up to a constant, but no condition |1 + hλ| ≤ 1 or bound 2/|λ| is given. The instructor must decide whether the qualitative form earns the point.',
          ),
          annotation(
            'unclear',
            'Implicit Euler is, roughly speaking, stable for any h on dissipative problems.',
            sp[3],
            '"Dissipative" is close to Re(λ) ≤ 0, which would make this A-stability, but "roughly speaking" and the missing factor 1/(1 − hλ) leave it open. The instructor should judge whether this counts.',
          ),
          annotation(
            'correct',
            'Each implicit step needs a nonlinear solve, e.g. Newton or a simple fixed-point iteration.',
            sp[5],
            'In general an implicit step does require a nonlinear solve, and Newton or fixed-point iteration are both valid solvers, so the per-step cost point is met.',
          ),
        ],
        [
          annotation(
            'unclear',
            'Explicit Euler would also do the job here, just with noticeably smaller steps than the solution itself would suggest.',
            sp[6],
            'Qualitatively right (stability, not the smooth solution, limits h), but the bound h ≤ 0.002 is never given and "noticeably smaller" understates a 50× restriction. The instructor should decide whether this is enough.',
          ),
          annotation(
            'unclear',
            'For the stiff problem I would lean towards implicit Euler, solving each step with a few fixed-point iterations, which should be cheap.',
            sp[7],
            'Right choice, but fixed-point iteration y ← y_n + h f(t_{n+1}, y) converges only if 1000h < 1, i.e. h < 0.001, stricter than explicit Euler’s own limit. The instructor must decide whether this defeats the justification.',
          ),
        ],
      ],
    },
    // 9. Fluent and confident, reads like an A answer, but wrong on the key ideas.
    {
      studentId: 9,
      paragraphs: [
        [
          'Update formulas.',
          annotation(
            'correct',
            'The explicit method advances with the slope at the current point, y_{n+1} = y_n + h f(t_n, y_n), so it is a direct update.',
            sp[0],
            'Correct explicit formula with the slope at the current known point.',
          ),
          annotation(
            'correct',
            'The implicit method uses y_{n+1} = y_n + h f(t_{n+1}, y_{n+1});',
            sp[1],
            'The implicit formula itself is correct, with f evaluated at the unknown new point.',
          ),
          annotation(
            'wrong',
            'because it uses information from the end of the interval it is second order, one order more accurate than explicit Euler.',
            sp[1],
            "False: implicit Euler is first order, like explicit Euler (local error −(h²/2)y''). Using the end-point slope alone does not raise the order; that needs averaging both ends, as in the trapezoidal rule.",
          ),
        ],
        [
          'Stability.',
          annotation(
            'wrong',
            'Explicit Euler is unstable for stiff equations: errors are amplified at every step no matter how small h is.',
            sp[2],
            'Wrong: explicit Euler is conditionally stable. Errors are multiplied by 1 + hλ, which is damped for h ≤ 2/|λ| (here h ≤ 0.002); the claim omits the step-size condition entirely.',
          ),
          annotation(
            'wrong',
            'Implicit Euler, on the other hand, is unconditionally stable for every ODE, which is why it is the standard choice for stiff problems.',
            sp[3],
            'Overclaimed: |1/(1 − hλ)| ≤ 1 holds for all h only when Re(λ) ≤ 0 (A-stability); for λ > 0 with 0 < hλ < 2 the factor exceeds 1.',
          ),
        ],
        [
          'Cost.',
          annotation(
            'correct',
            'Explicit Euler only needs one evaluation of f per step.',
            sp[4],
            'Correct: one evaluation of f per step is the explicit cost.',
          ),
          annotation(
            'wrong',
            'In practice implicit Euler costs about the same per step, since the equation can always be rearranged to give y_{n+1} explicitly.',
            sp[5],
            'Only true for linear f (as in this stiff problem). For nonlinear f, y_{n+1} − h f(t_{n+1}, y_{n+1}) = y_n has no closed form and needs Newton iterations with I − hJ, so a step costs more.',
          ),
        ],
        [
          'Choice.',
          annotation(
            'wrong',
            "For y' = −1000(y − cos t) I would choose implicit Euler, since the solution changes rapidly and the higher accuracy of the implicit method is needed to follow it.",
            sp[7],
            'Right method, wrong reason: after a transient of about 0.01 the solution is ≈ cos t and changes slowly, and implicit Euler is not more accurate. The reason to choose it is stability, which lets h be set by accuracy alone.',
          ),
        ],
      ],
    },
    // 10. Deep on stability and the stiff choice, silent on formulas and cost.
    {
      studentId: 10,
      paragraphs: [
        [
          'Stability',
          annotation(
            'correct',
            "Apply both to y' = λy. Explicit: y_{n+1} = y_n + hλy_n = (1 + hλ)y_n, so y_n = (1 + hλ)^n y_0 stays bounded iff |1 + hλ| ≤ 1, a disc of radius 1 centred at −1 in the hλ-plane; for real λ < 0 this is −2 ≤ hλ ≤ 0, i.e. h ≤ 2/|λ|.",
            sp[2],
            'Complete derivation: factor 1 + hλ, the disc centred at −1 and the real-axis interval −2 ≤ hλ ≤ 0 giving h ≤ 2/|λ|.',
          ),
          annotation(
            'unclear',
            'Implicit: y_{n+1} = y_n + hλy_{n+1}, so (1 − hλ)y_{n+1} = y_n.',
            sp[1],
            'This is implicit Euler only for the test equation f = λy; the general update y_{n+1} = y_n + h f(t_{n+1}, y_{n+1}) is never stated. The instructor should decide whether this specialised form earns the update-formula point.',
          ),
          annotation(
            'correct',
            'Amplification factor R = 1/(1 − hλ); |R| ≤ 1 iff |1 − hλ| ≥ 1, the outside of the disc centred at +1, which contains the whole left half-plane, so implicit Euler is A-stable, and R → 0 as hλ → −∞, so it is even L-stable.',
            sp[3],
            'Goes beyond the key: the region is correctly identified as the outside of the unit disc centred at +1, giving A-stability, and R → 0 gives L-stability.',
          ),
        ],
        [
          'Choice for the stiff problem',
          "Write e = y − y_p where y_p ≈ cos t + 0.001 sin t is the slow solution; then e' = −1000e, so the deviation behaves exactly like the test equation with λ = −1000.",
          annotation(
            'correct',
            'Explicit: need |1 − 1000h| ≤ 1, h ≤ 0.002; with h = 0.003 the factor is −2 and the transient is doubled every step even after it physically decayed to zero.',
            sp[6],
            'Correct bound h ≤ 0.002, and the counterexample is right: h = 0.003 gives 1 − 3 = −2, so the dead transient grows again.',
          ),
          annotation(
            'correct',
            'Implicit: factor 1/(1 + 1000h) < 1 for all h, e.g. 1/101 for h = 0.1, so the transient is damped and h only needs to resolve cos t, which varies on a time scale of order 1.',
            sp[7],
            'Correct factor (1/101 at h = 0.1) and the correct conclusion that h is set only by resolving cos t; the closed-form step is not given, but stability-based justification is accepted.',
          ),
        ],
      ],
    },
    // 11. Built around one worked numeric example (ungraded at start).
    {
      studentId: 11,
      paragraphs: [
        [
          'Formulas',
          annotation(
            'correct',
            'Explicit: y_{n+1} = y_n + h f(t_n, y_n).',
            sp[0],
            'Correct explicit Euler formula with the slope at the known point.',
          ),
          annotation(
            'unclear',
            'Implicit: same but with f evaluated at the next point.',
            sp[1],
            '"f at the next point" suggests f(t_{n+1}, y_{n+1}), but the formula is never written and the student does not say y_{n+1} becomes an unknown to solve for. The worked example below solves for it, so the instructor should decide.',
          ),
        ],
        [
          "Example: y' = −1000(y − cos t), y(0) = 0, h = 0.01.",
          annotation(
            'correct',
            'Explicit: y_{n+1} = y_n − 10(y_n − cos t_n) = −9y_n + 10 cos t_n, so y_1 = 10, y_2 ≈ −80.0, y_3 ≈ 730, the error is multiplied by −9 every step; to stop this we need |1 − 1000h| ≤ 1, h ≤ 0.002.',
            sp[6],
            'The iterates are right (y_1 = 10, y_2 = −90 + 10 cos 0.01 ≈ −80.0, y_3 ≈ 730), the growth factor −9 = 1 − 1000·0.01 is correctly identified, and the bound h ≤ 0.002 follows.',
          ),
          annotation(
            'correct',
            'Implicit: y_{n+1} = (y_n + 10 cos t_{n+1})/11, giving y_1 ≈ 0.909, y_2 ≈ 0.992, y_3 ≈ 0.9988 while the exact values are ≈ 0.9999, 0.9998, 0.9996, so the error shrinks about 11 times per step and later h can be increased to what cos t needs; I choose implicit Euler.',
            sp[7],
            'Correct closed-form step for h = 0.01 and correct numbers (errors ≈ 0.091, 0.0083, 0.00076, each about 1/11 of the last), leading to the right choice with h set by accuracy.',
          ),
        ],
        [
          'General',
          annotation(
            'correct',
            'The −9 is 1 + hλ with λ = −1000; explicit Euler is stable only when |1 + hλ| ≤ 1.',
            sp[2],
            'Generalises the example correctly: the factor 1 + hλ and the condition |1 + hλ| ≤ 1.',
          ),
          annotation(
            'correct',
            'The 1/11 is 1/(1 − hλ), and |1/(1 − hλ)| < 1 for every h > 0 if Re λ < 0, so implicit Euler has no step restriction on decaying problems (A-stable).',
            sp[3],
            'Correct factor and condition with the Re λ < 0 qualifier, correctly named A-stability.',
          ),
          annotation(
            'correct',
            'Cost: implicit needs to solve for y_{n+1} each step (Newton for nonlinear f), more work per step, but here the solve is one division.',
            sp[5],
            'Correct general statement (a Newton solve per step for nonlinear f) and correct remark that for this linear problem it is a single division.',
          ),
        ],
      ],
    },
    // 12. Short but sharp (ungraded at start).
    {
      studentId: 12,
      paragraphs: [
        [
          annotation(
            'correct',
            'EE: y_{n+1} = y_n + h f(t_n, y_n),',
            sp[0],
            'Correct explicit Euler formula, the first half of a sentence that also states its cost.',
          ),
          annotation(
            'correct',
            'one f-eval per step.',
            sp[4],
            'Terse but exact: one evaluation of f per step is the explicit per-step cost.',
          ),
          annotation(
            'correct',
            'IE: y_{n+1} = y_n + h f(t_{n+1}, y_{n+1}), implicit in y_{n+1}.',
            sp[1],
            'Correct implicit Euler formula, and the student notes that it is implicit in y_{n+1}.',
          ),
        ],
        [
          annotation(
            'correct',
            'Here λ = −1000: EE is stable only for h ≤ 2/1000 = 0.002.',
            sp[6],
            'Correct λ and the correct stability bound h ≤ 0.002 for explicit Euler.',
          ),
          annotation(
            'correct',
            'IE has factor 1/(1 + 1000h) < 1 for all h and the step is closed form, y_{n+1} = (y_n + 1000h cos t_{n+1})/(1 + 1000h), so take IE with h chosen by accuracy only.',
            sp[7],
            'Everything the point asks for in one sentence: stable for every h, closed-form step for the linear problem, h chosen by accuracy.',
          ),
        ],
      ],
    },
  ],
}

export default demoCase
