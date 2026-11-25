import { annotation, flagged, type DemoCase } from '../caseTypes'

const sp = [
  'Scoring Point 1 (Principle: Direct) Transforms A by a finite sequence of row operations into triangular factors PA = LU (partial pivoting chooses the largest |a_ik| in the column as pivot), then solves Ly = Pb by forward substitution and Ux = y by back substitution; the solution is reached after a fixed, finite number of operations.',
  'Scoring Point 2 (Principle: Iterative) Splits A = M − N and repeats x^{(k+1)} = M^{-1}(N x^{(k)} + b) from an initial guess x^{(0)}, with M = D for Jacobi and M = D + L for Gauss–Seidel (A = D + L + U: diagonal, strictly lower and strictly upper parts); Gauss–Seidel uses each newly updated component immediately, and A itself is never modified.',
  'Scoring Point 3 (Convergence and Accuracy: Direct) There is no convergence question: in exact arithmetic the result is exact, and in floating point the only error is rounding, kept under control by partial pivoting (backward stable in practice), so the final accuracy is limited by the condition number κ(A).',
  'Scoring Point 4 (Convergence and Accuracy: Iterative) Converges for every initial guess if and only if the spectral radius ρ(M^{-1}N) < 1, the error shrinking roughly by a factor ρ per iteration; strict diagonal dominance of A is sufficient for both Jacobi and Gauss–Seidel, and A symmetric positive definite is sufficient for Gauss–Seidel. The result is approximate, stopped when the residual ‖b − Ax^{(k)}‖ falls below a tolerance.',
  'Scoring Point 5 (Cost and Memory: Direct) About (2/3)n^3 flops for dense LU plus O(n^2) per triangular solve, with O(n^2) storage; for a sparse A, fill-in makes L and U much denser than A, so time and memory grow far beyond nnz(A).',
  'Scoring Point 6 (Cost and Memory: Iterative) Each iteration costs O(nnz(A)) (about O(n) when every row has only a few nonzeros) and memory is only A plus a few vectors; the total cost is the cost per iteration times the number of iterations, which depends on ρ and the tolerance.',
  'Scoring Point 7 (Suitable Scenarios: Direct) Small-to-medium or dense systems, ill-conditioned or non-diagonally-dominant systems where reliability matters, and many right-hand sides with the same A, since LU is computed once and each new b costs only two O(n^2) triangular solves. Other reasonable scenarios are also acceptable.',
  'Scoring Point 8 (Suitable Scenarios: Iterative) Very large sparse systems (e.g. from discretised PDEs) that are diagonally dominant or SPD, where the LU factors would not fit in memory, moderate accuracy is enough, or a good initial guess is available. Other reasonable scenarios are also acceptable.',
] as const

const demoCase: DemoCase = {
  question: {
    question_id: 4,
    question:
      'For a large sparse linear system Ax = b, compare direct methods (Gaussian elimination / LU factorization with partial pivoting) with iterative methods (Jacobi, Gauss–Seidel). (Principle, Convergence and Accuracy, Cost and Memory, Suitable Scenarios)',
    score: 8,
  },
  pointsPerCriterion: 1,
  rubric: sp,
  responses: [
    {
      studentId: 1,
      paragraphs: [
        [
          'Principle:',
          annotation(
            'correct',
            'Direct: Gaussian elimination with partial pivoting gives PA = LU (L unit lower, U upper), then Ly = Pb by forward and Ux = y by back substitution; it terminates after a fixed number of flops.',
            sp[0],
            'PA = LU from pivoted elimination, the two triangular solves in the right order, and termination after a fixed flop count: every element of the direct principle is present.',
          ),
          annotation(
            'correct',
            'Iterative: split A = M − N, so Mx = Nx + b suggests x^{(k+1)} = M^{-1}(Nx^{(k)} + b); with A = D + L + U, Jacobi takes M = D and Gauss–Seidel M = D + L.',
            sp[1],
            'Derives the iteration from the fixed-point form Mx = Nx + b rather than just quoting it, and the choices M = D and M = D + L are exactly Jacobi and Gauss–Seidel.',
          ),
        ],
        [
          'Convergence and accuracy:',
          annotation(
            'correct',
            'Direct: no convergence issue; in floating point only rounding error, pivoting keeps the multipliers |l_ij| ≤ 1 so it is stable, and the relative error is about κ(A)·u.',
            sp[2],
            'Names the mechanism of pivoting’s stability (|l_ij| ≤ 1) and the κ(A)·u forward-error estimate, which is precisely "accuracy limited by the condition number".',
          ),
          annotation(
            'unclear',
            'Iterative: e^{(k+1)} = M^{-1}N e^{(k)}, so the error goes to 0 when the iteration matrix is small enough, e.g. A diagonally dominant; we stop when ‖r^{(k)}‖/‖b‖ < tol.',
            sp[3],
            'The error recursion and the relative-residual stop are right, but "small enough" is never made precise (ρ(M^{-1}N) < 1, or some norm < 1?) and "diagonally dominant" omits "strictly", which weak dominance alone does not guarantee. The instructor should decide whether the criterion counts as stated.',
          ),
        ],
        [
          'Cost and memory:',
          annotation(
            'correct',
            'LU: ≈ 2n^3/3 flops, and for sparse A the fill-in makes L and U far denser than A, so memory is no longer O(nnz).',
            sp[4],
            'Correct leading constant 2n^3/3, and the consequence of fill-in is stated in exactly the right terms: storage escapes O(nnz).',
          ),
          annotation(
            'correct',
            'One Jacobi/G–S sweep: O(nnz) flops, storage A + 2 vectors; total = sweeps × O(nnz).',
            sp[5],
            'Per-sweep cost, memory, and the total-cost product all match the point in one compact line.',
          ),
        ],
        [
          'Scenarios:',
          annotation(
            'correct',
            'Direct when n is moderate, A is ill-conditioned or not diagonally dominant, or there are many b for the same A (factor once, each b costs O(n^2)).',
            sp[6],
            'Covers all three reference scenarios, including the O(n^2) cost per extra right-hand side that justifies reusing LU.',
          ),
          annotation(
            'correct',
            'Iterative for very large sparse systems from PDE discretisation, especially diagonally dominant or SPD, when ~10^{-6} accuracy is enough.',
            sp[7],
            'Large sparse PDE systems with the right structural conditions and an explicit moderate tolerance: the full iterative scenario.',
          ),
        ],
      ],
    },
    {
      studentId: 2,
      paragraphs: [
        [
          'I use one small example for both: A = [[4,1],[1,3]].',
          annotation(
            'correct',
            'With elimination I kill the entry below the 4 by subtracting 1/4 of row 1 from row 2, which leaves an upper-triangular system that I solve from the bottom up, so after a fixed amount of work I have x. With pivoting I first swap rows so the biggest number in the column is on top.',
            sp[0],
            'Never says "LU" or "back substitution", yet "subtract 1/4 of row 1", "upper-triangular, solve from the bottom up" and "swap so the biggest is on top" are elimination, back substitution and partial pivoting exactly.',
          ),
          annotation(
            'correct',
            'The other way: guess x^{(0)}, then fix each unknown from its own equation, x_1 = (b_1 - x_2)/4 and x_2 = (b_2 - x_1)/3, and keep repeating; Jacobi uses only the old values, G–S plugs in the new x_1 right away.',
            sp[1],
            'x_1 = (b_1 − x_2)/4, x_2 = (b_2 − x_1)/3 is the componentwise form of x^{(k+1)} = D^{-1}(b − (L+U)x^{(k)}) for this A, and "plugs in the new x_1" is the M = D + L difference.',
          ),
        ],
        [
          annotation(
            'correct',
            'Elimination does not "converge", it just ends; the only error is floating-point round-off, and with pivoting this stays small unless the matrix is nearly singular (big cond(A)).',
            sp[2],
            '"It just ends" is the no-convergence-question point, and "small unless nearly singular (big cond(A))" correctly ties the remaining error to κ(A).',
          ),
          annotation(
            'correct',
            'For the repeating method write e^{(k+1)} = T e^{(k)}; the error dies for every start exactly when all eigenvalues of T are inside the unit circle. Here 4 > 1 and 3 > 1, so each row is dominated by its diagonal and both Jacobi and G–S will work. I stop when ||b - Ax^{(k)}|| < 10^{-6}.',
            sp[3],
            '"All eigenvalues inside the unit circle" is ρ(T) < 1 without the term; 4 > |1| and 3 > |1| is a correct check of strict diagonal dominance; the residual stop completes the point.',
          ),
        ],
        [
          annotation(
            'correct',
            'Cost: elimination is roughly n^3 operations, and the zeros of a sparse A get filled with nonzeros during elimination, so you may need to store an almost full matrix.',
            sp[4],
            '"Zeros get filled with nonzeros" is fill-in described without the word, with the right consequence for storage; order n^3 suffices without the 2/3 constant.',
          ),
          annotation(
            'correct',
            'One sweep only touches the nonzeros, so it is about 5n work for a 5-point Laplacian, and nothing new is stored except the x vectors.',
            sp[5],
            '5n work for a 5-point stencil is O(nnz) instantiated on a concrete matrix, and "nothing new stored except x" is the memory claim.',
          ),
        ],
        [
          annotation(
            'correct',
            'If I need x for 100 different b with the same A, I factor once and each new b is just two triangular solves.',
            sp[6],
            'The many-right-hand-sides scenario, with the reason (factor once, two triangular solves per b) made concrete.',
          ),
          annotation(
            'correct',
            'For a 10^6 x 10^6 grid problem I would iterate, because the factors would not fit in memory and 3-4 correct digits are enough.',
            sp[7],
            'A 10^6-unknown grid problem where factors do not fit and 3–4 digits suffice hits two of the reference reasons for preferring iteration.',
          ),
        ],
      ],
    },
    {
      studentId: 3,
      paragraphs: [
        [
          'Principle:',
          annotation(
            'correct',
            'Gaussian elimination reduces A column by column to an upper triangular U, storing the multipliers in L, so PA = LU, where P records the row swaps made by partial pivoting (largest |a_ik| in column k becomes the pivot); then x follows from forward and back substitution in a finite number of steps.',
            sp[0],
            'Explains where L comes from (the stored multipliers) and what P records, then the two substitutions and finite termination: a complete and precise direct principle.',
          ),
          annotation(
            'correct',
            'Jacobi and Gauss–Seidel instead start from x^{(0)} and solve the i-th equation for x_i repeatedly: Jacobi uses only values from the previous sweep, i.e. x^{(k+1)} = D^{-1}(b − (L+U)x^{(k)}), while Gauss–Seidel overwrites x_i at once, which is x^{(k+1)} = (D+L)^{-1}(b − Ux^{(k)}).',
            sp[1],
            'Both matrix forms are correct and are linked to the componentwise description, which corresponds to M = D and M = D + L in the splitting.',
          ),
        ],
        [
          'Convergence and Accuracy:',
          annotation(
            'correct',
            'The direct method has no convergence question; its only error is rounding, which pivoting keeps small, so the computed solution is as good as κ(A) allows.',
            sp[2],
            'All three elements are present: no convergence issue, rounding controlled by pivoting, and accuracy bounded by κ(A).',
          ),
          annotation(
            'correct',
            'For the iterative methods the error satisfies e^{(k+1)} = Te^{(k)}, so they converge for every x^{(0)} if and only if ρ(T) < 1; strict diagonal dominance guarantees this for both, SPD guarantees it for Gauss–Seidel, and in practice we stop when the residual is below a tolerance.',
            sp[3],
            'States the iff criterion with its justification via the error recursion, both sufficient conditions with the correct method attached to each, and the residual stopping rule.',
          ),
        ],
        [
          'Cost and Memory:',
          annotation(
            'correct',
            'LU costs about 2n^3/3 flops and needs O(n^2) storage in general; for a sparse A the factors suffer fill-in, e.g. a 2D Poisson matrix with bandwidth √n gets a completely filled band, so memory grows to about n^{1.5}.',
            sp[4],
            'Correct dense cost and a correct quantitative fill-in example: a 2D grid with n unknowns has bandwidth √n, and banded LU fills the band, giving n·√n = n^{1.5} storage versus 5n nonzeros in A.',
          ),
          annotation(
            'wrong',
            'Per sweep, Jacobi is one product with the off-diagonal part, while Gauss–Seidel must solve the triangular system with D + L, which like any triangular solve costs O(n^2), so a G–S sweep is far more expensive than a Jacobi sweep.',
            sp[5],
            'A sparse triangular solve costs O(nnz(D+L)), not O(n^2): Gauss–Seidel just walks the nonzeros of each row in order, so a sweep costs the same O(nnz) as Jacobi. O(n^2) holds only for a dense triangle, and the conclusion "far more expensive" is false.',
          ),
        ],
        [
          'Suitable Scenarios:',
          annotation(
            'correct',
            'Direct methods suit small or dense systems, systems that are not diagonally dominant, and repeated solves with the same A, since the LU is reused.',
            sp[6],
            'Three of the reference scenarios, including the non-diagonally-dominant case where iterations may fail and the reuse of LU.',
          ),
          annotation(
            'correct',
            'Iterative methods suit very large sparse systems such as discretised PDEs, where the factors would not fit in memory and a moderate accuracy is enough.',
            sp[7],
            'Large sparse PDE systems with the two reasons the reference gives: factors do not fit and moderate accuracy suffices.',
          ),
        ],
      ],
    },
    {
      studentId: 4,
      paragraphs: [
        [
          'Principle.',
          annotation(
            'correct',
            'Direct: LU with partial pivoting, PA = LU, then two triangular solves. Exact after finite steps.',
            sp[0],
            'PA = LU with partial pivoting, two triangular solves and finite termination: the direct principle in compact form.',
          ),
          annotation(
            'correct',
            'Iterative: A = D + L + U, Jacobi x^{(k+1)} = D^{-1}(b - (L+U)x^{(k)}), Gauss–Seidel x^{(k+1)} = (D+L)^{-1}(b - Ux^{(k)}).',
            sp[1],
            'Both iteration formulas are correct and are the splitting iteration with M = D and M = D + L.',
          ),
        ],
        [
          'Convergence/accuracy.',
          flagged(
            annotation(
              'wrong',
              'Because of partial pivoting the LU solution is accurate to machine precision, the error is about 10^{-16} no matter which A.',
              sp[2],
              'Pivoting makes the backward error (residual) small, but the forward error is about κ(A)·10^{-16}; for a Hilbert matrix with κ ≈ 10^{13} only about three digits survive. "No matter which A" ignores the condition number.',
            ),
            'unclear',
            'Partial pivoting does give a backward-stable solve, which the student may mean, but "error about 10^{-16} no matter which A" could be a claim about the forward error; it is unclear which error is meant.',
          ),
          annotation(
            'correct',
            'Iterative converges iff ρ(B) < 1 where B is the iteration matrix, e.g. strictly diagonally dominant A is enough.',
            sp[3],
            'The iff spectral-radius criterion and strict diagonal dominance as a sufficient condition are both stated correctly.',
          ),
          flagged(
            annotation(
              'wrong',
              'G–S converges whenever Jacobi converges and it is always 2 times faster, so Jacobi is never the better choice.',
              sp[3],
              'False as a general rule: for A = [[1,2,−2],[1,1,1],[2,2,1]] Jacobi converges (ρ_J = 0) while Gauss–Seidel diverges (ρ_GS = 2). ρ_GS = ρ_J^2 holds only for special classes such as consistently ordered matrices.',
            ),
            'unclear',
            'Gauss–Seidel is twice as fast as Jacobi for some matrix classes (e.g. tridiagonal), so the student may be quoting a correct special case; no restriction is stated, so it needs checking.',
          ),
        ],
        [
          'Cost/memory.',
          annotation(
            'correct',
            'LU is 2n^3/3 flops and fill-in can make L and U nearly dense even if A is sparse.',
            sp[4],
            'Correct flop count, and fill-in is correctly identified as what destroys the sparsity of the factors.',
          ),
          flagged(
            annotation(
              'wrong',
              'Iterative is O(n^2) per step because of the matrix-vector product.',
              sp[5],
              'For a sparse A the matrix–vector product costs O(nnz(A)), about 5n for a 5-point stencil, not O(n^2); treating A as dense throws away exactly the advantage the question is about.',
            ),
            'unclear',
            'O(n^2) per step is correct for a dense matrix–vector product; it is unclear whether the student is ignoring sparsity or just giving a dense upper bound.',
          ),
        ],
        [
          'Scenarios.',
          annotation(
            'correct',
            'Big sparse systems like from PDEs → iterative.',
            sp[7],
            'Large sparse PDE systems is the iterative scenario in the reference.',
          ),
          'Direct for the rest.',
        ],
      ],
    },
    {
      studentId: 5,
      paragraphs: [
        [
          'Principle:',
          annotation(
            'correct',
            'The main problem of the direct method for sparse A is fill-in: during elimination zeros become nonzeros, so L and U can need much more memory than A.',
            sp[4],
            'Written under "Principle", but this is the memory cost of direct methods, and fill-in with its consequence for L and U is stated correctly.',
          ),
          annotation(
            'correct',
            'So for a big sparse system from a PDE that is diagonally dominant, we prefer Jacobi or Gauss–Seidel.',
            sp[7],
            'Also under "Principle", yet it is the iterative scenario: large, sparse, PDE-derived and diagonally dominant.',
          ),
        ],
        [
          'Convergence and Accuracy:',
          annotation(
            'correct',
            'If we must solve Ax = b for many different b, LU is computed once and reused, each solve only O(n^2).',
            sp[6],
            'Placed under "Convergence", but reusing LU at O(n^2) per right-hand side is the direct-method scenario and is correct.',
          ),
          annotation(
            'wrong',
            'Jacobi method: x^{(k+1)} = D^{-1}(b − Ax^{(k)}).',
            sp[1],
            'A term is missing: Jacobi is x^{(k+1)} = x^{(k)} + D^{-1}(b − Ax^{(k)}) = D^{-1}(b − (L+U)x^{(k)}). As written the fixed point satisfies D^{-1}(b − Ax) = x, not Ax = b.',
          ),
        ],
        [
          'Cost and Memory:',
          annotation(
            'correct',
            'Iterative method converges for any initial guess iff the spectral radius of the iteration matrix is < 1, and the error is reduced by about ρ each step.',
            sp[3],
            'Under "Cost", but this is the convergence criterion and rate for iterative methods, stated correctly including "for any initial guess".',
          ),
        ],
        [
          'Suitable Scenarios:',
          annotation(
            'correct',
            'Direct method: Gaussian elimination with partial pivoting gives the exact solution after finite steps (forward elimination then back substitution).',
            sp[0],
            'Under "Scenarios", but it describes the direct principle: pivoted elimination plus back substitution, terminating in finitely many steps.',
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
            'Gaussian elimination with pivoting gives the solution directly by making A upper triangular and back substitution,',
            sp[0],
            'Pivoted elimination to upper-triangular form followed by back substitution, the first clause of a run-on sentence, is the direct principle.',
          ),
          annotation(
            'correct',
            'but Jacobi and Gauss–Seidel start from a guess and update x using the diagonal of A each time until it stops changing,',
            sp[1],
            '"Start from a guess and update x by dividing by the diagonal" is the Jacobi/Gauss–Seidel splitting with M built from D, described without formulas.',
          ),
          annotation(
            'correct',
            'the direct one costs n^3 and fill in makes the sparse matrix full so memory is big',
            sp[4],
            'O(n^3) work and fill-in destroying sparsity, extracted from the middle of a sentence that is mostly about the iterative methods.',
          ),
          annotation(
            'correct',
            'while iterative only need the nonzeros and a few vectors, each iteration is cheap like O(nnz).',
            sp[5],
            'O(nnz) per iteration and storage of only the nonzeros plus a few vectors match the point.',
          ),
        ],
        [
          annotation(
            'wrong',
            'Gauss–Seidel converges for any matrix because it always uses the newest values, Jacobi sometimes not,',
            sp[3],
            'Using the newest values does not guarantee convergence: Gauss–Seidel needs ρ((D+L)^{-1}U) < 1, and for A = [[1,2],[2,1]] that radius is 4, so it diverges.',
          ),
          annotation(
            'correct',
            'so for small matrix or many b with same A use LU since you factor once,',
            sp[6],
            'Small systems and many right-hand sides with a single factorisation are both reference scenarios for direct methods.',
          ),
          annotation(
            'correct',
            'for huge sparse like PDE grid use iterative and stop when residual is small.',
            sp[7],
            'Huge sparse PDE grid systems is the iterative scenario; the stopping remark is extra but correct.',
          ),
        ],
      ],
    },
    {
      studentId: 7,
      paragraphs: [
        [
          'Principle',
          annotation(
            'correct',
            'Direct method: Gaussian elimination with row pivoting turns A into LU, then forward and back substitution.',
            sp[0],
            'LU via elimination with row pivoting followed by forward and back substitution covers the direct principle.',
          ),
          annotation(
            'correct',
            'Iterative: rewrite Ax = b as x = Bx + c with B = -D^{-1}(L+U) for Jacobi, and iterate from x^{(0)}.',
            sp[1],
            'B = −D^{-1}(L+U) is the correct Jacobi iteration matrix (M^{-1}N with M = D), and iterating from x^{(0)} is the principle.',
          ),
        ],
        [
          'Convergence and accuracy',
          annotation(
            'wrong',
            'The direct method is approximate and may not converge if A is not diagonally dominant,',
            sp[2],
            'This is a property of the iterative methods attributed to LU: pivoted elimination has no convergence condition and needs no diagonal dominance. The student has swapped the two methods.',
          ),
          annotation(
            'wrong',
            'while the iterative method reaches the exact solution after at most n iterations, so it is more accurate.',
            sp[3],
            'Finite termination is the direct method’s property (or conjugate gradient’s in exact arithmetic); Jacobi and Gauss–Seidel only approach x and converge only if ρ < 1. The other half of the swap.',
          ),
        ],
        [
          'Cost and memory',
          annotation(
            'correct',
            'LU needs about 2n^3/3 flops and the fill-in destroys sparsity, so storage can be close to n^2.',
            sp[4],
            'Correct flop count, fill-in, and the O(n^2) worst-case storage that results.',
          ),
          annotation(
            'correct',
            'Jacobi/G–S cost O(nnz) per iteration and store only A and x.',
            sp[5],
            'O(nnz) per iteration and storage of only A and the iterate are the expected cost and memory facts.',
          ),
        ],
        [
          'Scenarios',
          annotation(
            'correct',
            'Direct: moderate n, or when solving with the same A and many b.',
            sp[6],
            'Moderate size and many right-hand sides with the same A are listed direct-method scenarios.',
          ),
          annotation(
            'correct',
            'Iterative: large sparse systems, e.g. from FEM/FDM, when A is diagonally dominant.',
            sp[7],
            'Large sparse diagonally dominant systems from FEM/FDM discretisation is the iterative scenario.',
          ),
        ],
      ],
    },
    {
      studentId: 8,
      paragraphs: [
        [
          annotation(
            'correct',
            'Direct solvers (LU with partial pivoting) factor PA = LU once and then do two triangular solves, so they finish in a predictable number of steps.',
            sp[0],
            'PA = LU, two triangular solves and a predictable step count: the direct principle, stated without hedging.',
          ),
          annotation(
            'unclear',
            'Accuracy is essentially as good as the data allows, since GEPP is backward stable, although strictly speaking the growth factor can be 2^{n-1}.',
            sp[2],
            'Backward stability and the 2^{n−1} worst-case growth factor are both correct, but the student never says the forward error is rounding amplified by κ(A), and the caveat undercuts "as good as the data allows". The instructor must decide whether this earns the point.',
          ),
          annotation(
            'unclear',
            'Jacobi and Gauss–Seidel converge under the usual conditions, and Gauss–Seidel is typically about twice as fast.',
            sp[3],
            '"The usual conditions" is never specified (ρ < 1, strict diagonal dominance, SPD), and ρ_GS = ρ_J^2 holds only for consistently ordered matrices; "typically" may or may not acknowledge that. Needs instructor judgment.',
          ),
        ],
        [
          annotation(
            'correct',
            'For sparse A, fill-in is the real cost of a direct method, though a good ordering such as nested dissection can keep it manageable for 2D problems.',
            sp[4],
            'Identifies fill-in as the dominant cost, and the nested-dissection remark is a correct advanced refinement (O(n log n) fill for 2D grids).',
          ),
          annotation(
            'unclear',
            'An iterative sweep is cheap, but the total cost depends on how many sweeps are needed, which can be large.',
            sp[5],
            'The total = per-sweep × number-of-sweeps relation is right, but "cheap" is never quantified as O(nnz) and memory is not mentioned; the instructor should decide whether half the point is enough.',
          ),
          annotation(
            'unclear',
            'Which one wins depends on the problem size, the conditioning and how many right-hand sides there are.',
            sp[6],
            'Names exactly the right deciding factors (size, conditioning, number of right-hand sides) but never says which way each one points for direct methods; listing factors may or may not count as answering the scenario.',
          ),
          annotation(
            'correct',
            'For very large 3D problems iterative methods are usually the only option because the factors would not fit in memory.',
            sp[7],
            'Very large problems where the LU factors do not fit in memory is the reference reason for preferring iteration; "usually" does not weaken it.',
          ),
        ],
      ],
    },
    {
      studentId: 9,
      paragraphs: [
        [
          'Principle.',
          annotation(
            'correct',
            'Direct methods such as Gaussian elimination reduce A to upper triangular form and recover x by back substitution in a finite number of steps.',
            sp[0],
            'Elimination to upper-triangular form, back substitution and finite termination: the one part of the principle this answer gets right.',
          ),
          annotation(
            'wrong',
            'Iterative methods instead refine the solution by repeatedly applying Gaussian elimination to the residual equation Ae = r, so Jacobi and Gauss–Seidel are essentially iterative refinement with different pivot orders.',
            sp[1],
            'This describes iterative refinement, a different algorithm. Jacobi and Gauss–Seidel never eliminate or factor A; they apply x^{(k+1)} = M^{-1}(Nx^{(k)} + b) with M = D or D + L.',
          ),
        ],
        [
          'Convergence and Accuracy.',
          annotation(
            'wrong',
            'Because a direct method performs exact algebraic operations, it introduces no error at all,',
            sp[2],
            'In floating point every elimination step rounds; the computed solution has relative error about κ(A)·u, so "no error at all" is false.',
          ),
          annotation(
            'wrong',
            'and partial pivoting is used simply to speed up the elimination by avoiding unnecessary row operations.',
            sp[2],
            'Partial pivoting exists for stability: it keeps |l_ij| ≤ 1 so rounding errors are not amplified. It adds comparisons and row swaps rather than saving work.',
          ),
          annotation(
            'wrong',
            'Gauss–Seidel, on the other hand, converges for any nonsingular matrix, since each update uses the most recent information, and after n iterations it reaches the exact solution.',
            sp[3],
            'Two errors in one sentence: Gauss–Seidel converges only if ρ((D+L)^{-1}U) < 1, and it never terminates exactly after n steps; that finite-termination property belongs to conjugate gradient in exact arithmetic.',
          ),
        ],
        [
          'Cost and Memory.',
          annotation(
            'correct',
            'Each iteration only touches the nonzero entries of A, so its cost is proportional to nnz(A) and the memory footprint stays small.',
            sp[5],
            'O(nnz(A)) cost per iteration and small memory are both correct, even though the surrounding answer is wrong.',
          ),
        ],
        [
          'Suitable Scenarios.',
          annotation(
            'wrong',
            'Therefore direct methods are preferable for large sparse systems, where their exactness pays off,',
            sp[6],
            'Reversed: fill-in and O(n^3) work make direct methods the worst choice for very large sparse systems, and their "exactness" rests on the false no-error claim above.',
          ),
          annotation(
            'wrong',
            'and iterative methods are best kept for small dense problems.',
            sp[7],
            'Also reversed: on small dense problems LU is cheap and reliable, while the O(nnz) advantage of iteration matters only for large sparse systems.',
          ),
        ],
      ],
    },
    {
      studentId: 10,
      paragraphs: [
        [
          'Principle',
          annotation(
            'correct',
            'Direct: at step k pick the row with largest |a_ik| (i ≥ k), swap, and eliminate below the pivot with multipliers l_ik = a_ik/a_kk; after n − 1 steps PA = LU, and x comes from Ly = Pb, Ux = y. The number of operations is known in advance.',
            sp[0],
            'Goes beyond the point: the pivot rule, the multiplier formula, n − 1 elimination steps producing PA = LU, both triangular solves and a predetermined operation count.',
          ),
          annotation(
            'correct',
            'Iterative: from A = M − N, Ax = b ⇔ Mx = Nx + b, which gives x^{(k+1)} = M^{-1}(Nx^{(k)} + b). M must be easy to invert: M = D (Jacobi) needs only divisions, M = D + L (Gauss–Seidel) needs one forward substitution, i.e. using the new x_j for j < i.',
            sp[1],
            'Derives the iteration from the splitting and explains why M = D and M = D + L are chosen (cheap to invert), linking forward substitution to the use of new components.',
          ),
        ],
        [
          'Cost and Memory',
          annotation(
            'correct',
            'Direct: 2n^3/3 flops + 2n^2 per right-hand side. The danger for sparse A is fill-in: for an "arrow" matrix with full first row and column, eliminating x_1 first fills the whole matrix, while ordering that row last gives no fill-in at all, so the ordering decides the memory.',
            sp[4],
            'The arrow-matrix example is exactly right: eliminating the dense row first creates a full (n−1)×(n−1) update, while ordering it last creates no fill. A sharp illustration of fill-in beyond the reference.',
          ),
          annotation(
            'correct',
            'Iterative: one sweep is O(nnz) (≈ 5n for the 5-point Laplacian) and needs only A, x^{(k)} and x^{(k+1)}, and Gauss–Seidel can even overwrite x in place; total work = O(nnz) × number of sweeps.',
            sp[5],
            'Per-sweep cost with a concrete count, minimal memory (with the correct in-place observation for Gauss–Seidel), and the total-cost product.',
          ),
        ],
        ['Convergence and Scenarios: no time.'],
      ],
    },
    {
      studentId: 11,
      paragraphs: [
        ['Example: A = [[2,1],[1,2]], b = (3,3)^T, exact x = (1,1)^T.'],
        [
          'Principle:',
          annotation(
            'correct',
            'Direct: R2 - 0.5R1 gives 1.5x_2 = 1.5, so x_2 = 1 and back substitution gives x_1 = (3 - 1)/2 = 1. It ends after a fixed number of operations.',
            sp[0],
            'The elimination step (multiplier 0.5, new pivot 1.5) and back substitution are computed correctly, and the student notes the fixed operation count.',
          ),
          annotation(
            'correct',
            'Iterative: Jacobi x_i^{(k+1)} = (b_i - Σ_{j≠i} a_{ij}x_j^{(k)})/a_{ii}; from x^{(0)} = 0 I get (1.5, 1.5), (0.75, 0.75), (1.125, 1.125), ... and G–S uses the new x_1 immediately: (1.5, 0.75), (1.125, 0.9375), ...',
            sp[1],
            'The componentwise Jacobi formula is correct and every iterate checks out (e.g. G–S: x_2 = (3 − 1.5)/2 = 0.75), showing the old-versus-new-values difference concretely.',
          ),
        ],
        [
          'Convergence/accuracy:',
          annotation(
            'correct',
            'Direct answer is exact here; on a computer only rounding error remains.',
            sp[2],
            'No convergence question and only rounding error is the core of the point; κ(A) is not mentioned, but for this well-conditioned example (κ = 3) that is a minor omission.',
          ),
          annotation(
            'correct',
            'Jacobi error halves each step because the iteration matrix [[0,-1/2],[-1/2,0]] has ρ = 0.5 < 1, and G–S is faster here (ρ = 0.25); in general we need ρ < 1, which holds if A is strictly diagonally dominant like this A.',
            sp[3],
            'Eigenvalues ±1/2 give ρ_J = 0.5, matching the observed halving (errors 1, 0.5, 0.25, 0.125), and ρ_GS = 0.25 = ρ_J^2 is right for this 2×2 case; the general criterion is stated too.',
          ),
        ],
        [
          'Cost:',
          annotation(
            'wrong',
            'Direct is O(n^3), but for a sparse A it is cheaper because the zeros do not need to be eliminated.',
            sp[4],
            'Ignores fill-in: elimination turns zeros of a sparse A into nonzeros, which then must be eliminated and stored, so a sparse A does not simply make LU cheap. The 2×2 example cannot reveal this.',
          ),
          annotation(
            'correct',
            'Iterative is O(nnz) per sweep, here only 4 nonzeros, and memory is just A and x.',
            sp[5],
            'O(nnz) cost per sweep and storage of only A and x match the point.',
          ),
        ],
        [
          'Scenarios:',
          annotation(
            'correct',
            'Large sparse diagonally dominant systems → iterative.',
            sp[7],
            'Large sparse diagonally dominant systems is the iterative scenario in the reference.',
          ),
        ],
      ],
    },
    {
      studentId: 12,
      paragraphs: [
        [
          annotation(
            'correct',
            'Direct: PA = LU (GE + partial pivoting), then two triangular solves, finite steps;',
            sp[0],
            'Everything the principle needs in one line: PA = LU via pivoted elimination, two triangular solves, finite termination.',
          ),
          annotation(
            'correct',
            '2n^3/3 flops and fill-in ruins sparsity.',
            sp[4],
            'Correct cost constant and the fill-in consequence for a sparse A, in seven words.',
          ),
        ],
        [
          annotation(
            'correct',
            'Iterative: x^{(k+1)} = M^{-1}(Nx^{(k)} + b), M = D (Jacobi) or D + L (G–S);',
            sp[1],
            'The splitting iteration with the correct M for both methods.',
          ),
          annotation(
            'correct',
            'converges ∀x^{(0)} iff ρ(M^{-1}N) < 1, e.g. strictly diag. dominant A;',
            sp[3],
            'The exact criterion including "for every initial guess", plus the right sufficient condition; no stopping rule, but the convergence content is complete.',
          ),
          annotation(
            'correct',
            'O(nnz) per sweep, O(nnz) memory.',
            sp[5],
            'O(nnz) per sweep and O(nnz) memory (A plus vectors) is the point in its most compact form.',
          ),
        ],
        ['Out of time for scenarios.'],
      ],
    },
  ],
}

export default demoCase
