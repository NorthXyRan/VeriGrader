import { annotation, flagged, type DemoCase } from '../caseTypes'

const sp = [
  'Scoring Point 1 (Problem Distinction: Interpolation) Given a set of discrete points, find a curve or function that passes through all points.',
  'Scoring Point 2 (Problem Distinction: Approximation) Given a set of discrete points, find a curve or function that is as close as possible to but not necessarily passing through all points, often used in noisy data situations.',
  'Scoring Point 3 (Solution Differences: Interpolation) Polynomial interpolation (e.g. Lagrange interpolation, Newton interpolation), spline interpolation (e.g. cubic spline); other reasonable solution is also acceptable.',
  'Scoring Point 4 (Solution Differences: Approximation) Least squares method (polynomial approximation, spline approximation), Bézier curve fitting, smoothing methods; other reasonable solution is also acceptable.',
  'Scoring Point 5 (Advantage: Interpolation) Passes through all data points accurately, suitable for precise data modeling without noise.',
  'Scoring Point 6 (Advantage: Approximation) Robust to noise and outliers; captures the overall trend with a simple, smooth model and generalizes better between data points.',
  'Scoring Point 7 (Disadvantage: Interpolation) Sensitive to noise; high-degree polynomial interpolation on equally spaced nodes can oscillate strongly near the interval ends (Runge phenomenon).',
  'Scoring Point 8 (Disadvantage: Approximation) Does not reproduce the data exactly (non-zero residuals at the nodes); the result depends on the chosen model form and degree or smoothing parameter, so a poor choice underfits or overfits.',
] as const

const demoCase: DemoCase = {
  question: {
    question_id: 1,
    question:
      'What are the differences between interpolation and approximation? (Problem Distinction, Solution Differences, Advantages Comparison, Disadvantages Comparison)',
    score: 8,
  },
  pointsPerCriterion: 1,
  rubric: sp,
  responses: [
    {
      studentId: 1,
      paragraphs: [
        [
          'Problem distinction:',
          annotation(
            'correct',
            'Interpolation looks for a function p with p(x_i) = y_i at every node, so the curve must pass exactly through all data points.',
            sp[0],
            'States the interpolation condition p(x_i) = y_i at every node and reads it correctly as passing through all points.',
          ),
          annotation(
            'correct',
            'Approximation only asks that the function stay close to the data in some norm, for example by minimising Σ(f(x_i) − y_i)², so it need not hit any point exactly; this is what we want when the measurements carry noise.',
            sp[1],
            'Defines closeness through an explicit error norm, makes clear the points need not be matched, and ties the choice to noisy data — every element of the scoring point.',
          ),
        ],
        [
          'Solution methods:',
          annotation(
            'correct',
            'For interpolation we use Lagrange or Newton divided-difference polynomials, or piecewise cubic splines when there are many nodes.',
            sp[2],
            'Names both polynomial forms and the cubic spline, and adds the sensible condition for switching to splines.',
          ),
          annotation(
            'correct',
            'For approximation the standard tool is least squares, either with a low-degree polynomial or with a spline that has fewer knots than data points.',
            sp[3],
            'Least-squares polynomial and least-squares spline fitting are both listed in the key; "fewer knots than data points" shows the student knows why it is not interpolation.',
          ),
        ],
        [
          'Advantages:',
          annotation(
            'correct',
            'Interpolation reproduces the data exactly, which is ideal when the values are trustworthy, e.g. tabulated function values.',
            sp[4],
            'Exact reproduction plus the right use case (noise-free tabulated values) matches the interpolation advantage.',
          ),
          annotation(
            'correct',
            'Approximation smooths out noise and keeps the model simple, so it shows the real trend instead of the measurement error.',
            sp[5],
            'Covers noise robustness, model simplicity and recovering the trend — the three parts of the approximation advantage.',
          ),
        ],
        [
          'Disadvantages:',
          annotation(
            'correct',
            'Interpolation follows the noise too, and a high-degree polynomial on equally spaced nodes oscillates badly near the endpoints (Runge phenomenon).',
            sp[6],
            'Gives both halves of the point: noise is reproduced, and Runge oscillation is tied correctly to high degree on equally spaced nodes.',
          ),
          annotation(
            'unclear',
            'Approximation has some error at the nodes, and how well it works depends on the situation.',
            sp[7],
            'Non-zero error at the nodes is stated, but "depends on the situation" never says what it depends on. The key expects the dependence on model form or degree (under- or overfitting); the instructor should decide whether the first half alone earns the mark.',
          ),
        ],
      ],
    },
    {
      studentId: 2,
      paragraphs: [
        [
          annotation(
            'correct',
            'Interpolation: n+1 equations p(x_i) = y_i for n+1 unknown coefficients, so the curve is pinned to every point.',
            sp[0],
            'Phrases the problem as a square system of n+1 conditions for n+1 coefficients. "Pinned to every point" is exactly "passes through all points", without the textbook wording.',
          ),
          annotation(
            'correct',
            'Approximation: far more points than unknowns, so not every equation can hold; instead we make the leftovers r_i = y_i − f(x_i) small overall, which is the right move when y_i already contains measurement error.',
            sp[1],
            'An overdetermined system whose residuals are made small overall is the definition of approximation, and the student links it to measurement error. Full credit despite no keyword overlap.',
          ),
        ],
        [
          annotation(
            'correct',
            'To pin the curve: write p(x) = Σ y_i ℓ_i(x) with ℓ_i(x_j) = δ_ij, or glue cubic pieces together so that the first and second derivatives match at the joins.',
            sp[2],
            'ℓ_i with ℓ_i(x_j) = δ_ij is the Lagrange basis, and C² cubic pieces are a cubic spline. Both named methods appear in substance even though neither is named.',
          ),
          annotation(
            'correct',
            'To make r small: solve AᵀAc = Aᵀy (or use a QR factorisation of A for stability), or penalise roughness and let a smoothing spline trade closeness against wiggle.',
            sp[3],
            'AᵀAc = Aᵀy are the least-squares normal equations, and the roughness-penalised spline is a smoothing method. Both are listed approximation techniques.',
          ),
        ],
        [
          annotation(
            'correct',
            'If the data are exact, for instance values from a table of sin x, pinning loses nothing: the error at the nodes is zero.',
            sp[4],
            'Zero error at the nodes, together with the right use case of exact tabulated data, matches the interpolation advantage.',
          ),
          annotation(
            'correct',
            'If the data are noisy, using many points at once lets part of the noise cancel, the fitted curve stays smooth, and it predicts new x values better.',
            sp[5],
            'Noise cancelling across many points, smoothness and better prediction between data points cover the approximation advantage completely.',
          ),
        ],
        [
          annotation(
            'correct',
            'Pinning has a price: 1/(1 + 25x²) sampled at 11 equally spaced nodes on [−1, 1] gives a polynomial that blows up near ±1, and any noise in y_i is copied straight into the curve.',
            sp[6],
            "Gives Runge's own example with the correct setting (equally spaced nodes, large error near ±1) and adds noise sensitivity. Full credit for the interpolation disadvantage.",
          ),
          annotation(
            'correct',
            'Making r small has a price too: the curve misses the points, and the degree is a gamble — too low misses the shape, too high starts chasing the noise again.',
            sp[7],
            'Non-zero residuals plus the degree trade-off (too low underfits, too high overfits) is exactly the approximation disadvantage, in the student’s own words.',
          ),
        ],
      ],
    },
    {
      studentId: 3,
      paragraphs: [
        [
          'Interpolation and approximation are two of the most important topics in numerical analysis and are used everywhere in engineering. First, the problem.',
          annotation(
            'correct',
            'Interpolation constructs a function that agrees with the data at every node x_0, …, x_n.',
            sp[0],
            'Agreement with the data at every node is the interpolation condition.',
          ),
          annotation(
            'correct',
            'Approximation constructs a function from a simpler class that is close to the data without having to agree at the nodes, which is why it is preferred for experimental data.',
            sp[1],
            'Close to the data, not required to agree at the nodes, and suited to experimental (noisy) data — matches the approximation problem.',
          ),
        ],
        [
          'Second, the methods.',
          annotation(
            'correct',
            "Typical interpolation methods are Lagrange interpolation, Newton's divided differences and cubic splines.",
            sp[2],
            'Lists the polynomial and spline interpolation methods named in the key.',
          ),
          annotation(
            'wrong',
            'For approximation, least squares chooses the coefficients that minimise the largest absolute deviation max|f(x_i) − y_i|, which makes it the best approximation in every sense.',
            sp[3],
            'Minimising the largest deviation is minimax (Chebyshev, L∞) approximation, not least squares, which minimises the sum of squared residuals. "Best in every sense" is also false, since each norm gives a different best fit. The method is named, but its definition is wrong.',
          ),
        ],
        [
          'Third, advantages and disadvantages.',
          annotation(
            'correct',
            'Interpolation is exact at the data, so for precise tabulated values it is the natural choice.',
            sp[4],
            'Exactness at the data and the precise-data use case match the interpolation advantage.',
          ),
          annotation(
            'correct',
            'Approximation is less affected by random errors and gives a smoother curve that follows the trend.',
            sp[5],
            'Robustness to random error, smoothness and following the trend cover the approximation advantage.',
          ),
          'Both methods are widely used in practice.',
          annotation(
            'wrong',
            'The main weakness of interpolation is the Runge phenomenon, which can always be removed by adding more equally spaced nodes.',
            sp[6],
            'Names the Runge phenomenon correctly, then reverses the key fact: adding more equally spaced nodes makes the oscillation worse. The remedy is Chebyshev nodes or piecewise (spline) interpolation. The buried claim is wrong, so no credit.',
          ),
          annotation(
            'correct',
            'The weakness of approximation is that the fitted curve does not reproduce the measured values, and choosing too high a degree leads to overfitting.',
            sp[7],
            'Non-zero residuals and the overfitting risk of a poorly chosen degree match the approximation disadvantage.',
          ),
        ],
      ],
    },
    {
      studentId: 4,
      paragraphs: [
        [
          'Problem:',
          annotation(
            'correct',
            'Interpolation means fitting a function that passes through the given data points, matching their values exactly.',
            sp[0],
            'Passing through the given points and matching their values exactly is the interpolation problem.',
          ),
          flagged(
            annotation(
              'wrong',
              'Approximation means the curve never passes through any of the data points, it only follows their general distribution.',
              sp[1],
              'The key says approximation need not pass through the points. "Never passes through any" is a stronger claim and false: a least-squares line routinely crosses some of its data points. Not credited.',
            ),
            'unclear',
            '"Never passes through" may be loose wording for "is not required to pass through", or a genuine misconception. The wording needs a closer check against the scoring point.',
          ),
        ],
        [
          'Solution:',
          annotation(
            'correct',
            'Interpolation uses Lagrange or Newton polynomials, or splines.',
            sp[2],
            'Lagrange, Newton and spline interpolation are the methods in the key.',
          ),
          annotation(
            'correct',
            'Approximation uses least squares fitting.',
            sp[3],
            'Least squares is the primary approximation method in the key.',
          ),
        ],
        [
          'Advantages:',
          annotation(
            'correct',
            'Interpolation has zero error at the nodes.',
            sp[4],
            'Zero error at the nodes is the interpolation advantage of passing through the data exactly.',
          ),
          annotation(
            'wrong',
            'Approximation has non-zero error, but the result is sufficiently smooth and continuous.',
            sp[5],
            'Smoothness and continuity do not distinguish approximation, because interpolating polynomials and splines are smooth as well. The expected advantage, robustness to noise and capturing the trend, is missing.',
          ),
        ],
        [
          'Disadvantages:',
          flagged(
            annotation(
              'correct',
              'When there are many nodes the interpolating polynomial has a very high degree and can swing strongly between the nodes, especially close to the two ends.',
              sp[6],
              'This describes the Runge phenomenon without naming it: large oscillations of a high-degree interpolant between nodes, concentrated near the interval ends. Credited.',
            ),
            'unclear',
            'The answer mentions "swinging" near the ends but neither names the Runge phenomenon nor ties it to node placement. Check whether the description meets the scoring point.',
          ),
        ],
      ],
    },
    {
      studentId: 5,
      paragraphs: [
        [
          'Problem distinction:',
          annotation(
            'correct',
            'Interpolation uses the Lagrange polynomial,',
            sp[2],
            'Written under "Problem distinction", but this names a solution method: Lagrange interpolation. It is aligned to the method scoring point regardless of the heading.',
          ),
          annotation(
            'correct',
            'approximation uses the least squares method.',
            sp[3],
            'The second half of the same sentence names least squares, the approximation method in the key. Credited under solution differences despite the heading.',
          ),
        ],
        [
          'Solution differences:',
          annotation(
            'correct',
            'The interpolation curve has to go through every data point.',
            sp[0],
            'Placed under "Solution differences", but it is the problem definition of interpolation: the curve goes through every point.',
          ),
          annotation(
            'wrong',
            'The approximation curve goes through the average of the points.',
            sp[1],
            'Approximation is defined by small overall error, not by passing through "the average of the points". A least-squares line does pass through (x̄, ȳ), but that is a property of one method, not the definition. Not credited.',
          ),
        ],
        [
          'Advantages:',
          annotation(
            'correct',
            'Interpolation is bad with noise because it copies every error into the curve.',
            sp[6],
            'Listed under "Advantages", but it is a disadvantage of interpolation, sensitivity to noise. Aligned to the interpolation disadvantage; credited for the noise half of the point.',
          ),
          annotation(
            'correct',
            'Approximation ignores small random errors and shows the trend.',
            sp[5],
            'Robustness to small random errors and showing the trend match the approximation advantage.',
          ),
        ],
        [
          'Disadvantages:',
          annotation(
            'wrong',
            'Approximation needs more computation than interpolation because it must solve an optimization problem.',
            sp[7],
            'A low-degree least-squares fit solves a small (m+1)×(m+1) system and is usually cheaper than high-degree interpolation. Cost is not the disadvantage the key targets (non-zero residuals, dependence on model choice).',
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
            'Interpolation makes the curve go exactly through all given points,',
            sp[0],
            'The opening clause states the interpolation problem: the curve goes exactly through all points.',
          ),
          annotation(
            'correct',
            'approximation only makes it close, which is better when the data has errors;',
            sp[1],
            'Close but not exact, preferred for data with errors — the approximation problem, extracted from the middle of a run-on sentence.',
          ),
          annotation(
            'correct',
            'for the first one we use Lagrange, Newton or a cubic spline',
            sp[2],
            '"The first one" refers back to interpolation; Lagrange, Newton and cubic splines are the key’s methods.',
          ),
          flagged(
            annotation(
              'correct',
              'and for the second one least squares or a Bézier-type smooth curve,',
              sp[3],
              '"The second one" is approximation; least squares and Bézier fitting are both in the key.',
            ),
            'unclear',
            '"The second one" refers back across a long run-on sentence. Confirm that it denotes approximation, not interpolation, before crediting least squares and Bézier fitting.',
          ),
          'and both give a continuous function you can evaluate anywhere.',
          annotation(
            'correct',
            'The interpolation polynomial can oscillate at the edges when the degree is high and it also fits the noise,',
            sp[6],
            'Edge oscillation at high degree (Runge) and fitting the noise are both halves of the interpolation disadvantage.',
          ),
          flagged(
            annotation(
              'wrong',
              'while approximation is always more accurate than interpolation at new points,',
              sp[5],
              '"Always" is false: for exact, smooth data an interpolant is usually more accurate between the nodes. The real advantage, robustness to noise, appears nowhere in this clause.',
            ),
            'unclear',
            'The scope of this clause is ambiguous: it may continue the previous clause about noisy data, or claim that approximation always beats interpolation. Needs a second look.',
          ),
          annotation(
            'correct',
            'but interpolation is the right choice if the data are exact',
            sp[4],
            'Exact data as the setting where interpolation should be preferred is the interpolation advantage.',
          ),
          flagged(
            annotation(
              'wrong',
              'and approximation sometimes loses details.',
              sp[7],
              '"Loses details" names neither the non-zero residuals nor the dependence on model form or degree. On re-reading it is too vague to meet the approximation disadvantage, so no credit.',
            ),
            'unclear',
            '"Loses details" gestures at underfitting, but it does not say that the loss comes from the choice of model or degree, nor mention the residuals. The instructor should decide whether this counts.',
          ),
        ],
      ],
    },
    {
      studentId: 7,
      paragraphs: [
        [
          'Problem distinction:',
          annotation(
            'correct',
            'Interpolation: find a function through all data points (x_i, y_i).',
            sp[0],
            'A function through all data points is the interpolation problem.',
          ),
          annotation(
            'correct',
            'Approximation: find a function near the data points that minimises some error measure, useful for noisy measurements.',
            sp[1],
            'Near the points, minimising an error measure, and used for noisy measurements — matches the approximation problem.',
          ),
        ],
        [
          'Solution differences:',
          annotation(
            'wrong',
            'Interpolation is usually done by least squares,',
            sp[2],
            'Swapped: least squares is the standard approximation method. In general it does not pass through the data points, so it is not an interpolation method.',
          ),
          annotation(
            'wrong',
            'and approximation by Lagrange or Newton polynomials.',
            sp[3],
            'Swapped: Lagrange and Newton polynomials are interpolation methods, constructed to pass through every node. The student has the two method families reversed.',
          ),
        ],
        [
          'Advantages:',
          annotation(
            'correct',
            'Interpolation is exact at the nodes, good for precise data.',
            sp[4],
            'Exactness at the nodes for precise data is the interpolation advantage.',
          ),
          annotation(
            'correct',
            'Approximation is robust to noise and gives a smooth trend line.',
            sp[5],
            'Noise robustness and a smooth trend match the approximation advantage.',
          ),
        ],
        [
          'Disadvantages:',
          annotation(
            'correct',
            'Interpolation with a high degree oscillates (Runge phenomenon) and amplifies measurement errors.',
            sp[6],
            'Runge oscillation at high degree and amplified measurement error are the interpolation disadvantage.',
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
            'Interpolation is when the function goes through the points exactly.',
            sp[0],
            'Going through the points exactly is the interpolation problem.',
          ),
          flagged(
            annotation(
              'correct',
              'Approximation is more like a model of the data, which may or may not go through them depending on the method.',
              sp[1],
              'On review the core distinction is present: the curve is not required to pass through the points, and "a model of the data" is a fit to the data as a whole. Enough for the one-mark point.',
            ),
            'unclear',
            '"May or may not go through" captures that passing through is not required, but "a model of the data" leaves out the closeness criterion (minimising an error). Borderline; the instructor should decide.',
          ),
        ],
        [
          annotation(
            'correct',
            'Typical interpolation methods: Lagrange, Newton, splines.',
            sp[2],
            'Lagrange, Newton and spline interpolation match the key.',
          ),
          flagged(
            annotation(
              'correct',
              'Approximation can be done with regression or other fitting methods.',
              sp[3],
              'Regression on discrete data is least-squares fitting, the method in the key. The vague "other fitting methods" adds nothing, but it does not undo the credit.',
            ),
            'unclear',
            '"Regression" usually means least squares, but "other fitting methods" is unspecified. Decide whether naming regression alone meets the point.',
          ),
        ],
        [
          flagged(
            annotation(
              'wrong',
              'Interpolation is generally more accurate overall.',
              sp[4],
              'Exactness at the nodes does not make interpolation "more accurate overall"; between nodes, and with noisy data, it can be far less accurate. This is not the advantage in the key.',
            ),
            'unclear',
            '"More accurate overall" may be loose wording for exact at the nodes (the advantage in the key) or a broader, false claim about accuracy everywhere. Check which is meant.',
          ),
          annotation(
            'correct',
            'Approximation usually handles noisy data better.',
            sp[5],
            'Better handling of noisy data is the core of the approximation advantage.',
          ),
        ],
        [
          annotation(
            'wrong',
            'Interpolation can be slow for large data sets.',
            sp[6],
            'Speed is not the disadvantage in the key. The expected points, sensitivity to noise and Runge oscillation, are missing.',
          ),
          annotation(
            'wrong',
            'Approximation may not be suitable in some cases.',
            sp[7],
            'Names no specific disadvantage: no residuals at the nodes and no dependence on model choice. There is nothing to credit.',
          ),
        ],
      ],
    },
    {
      studentId: 9,
      paragraphs: [
        [
          annotation(
            'correct',
            'Interpolation and approximation both construct a function from discrete data, but interpolation additionally requires the function to reproduce every data value exactly.',
            sp[0],
            'Reproducing every data value exactly is the interpolation condition.',
          ),
          annotation(
            'wrong',
            'Approximation, by contrast, estimates values outside the range of the data, which is why it is also called extrapolation.',
            sp[1],
            'Confuses approximation with extrapolation. Approximation means fitting closely without passing through the points; extrapolation (evaluating beyond the data range) can be done with an interpolant or an approximant. Fluent, but wrong.',
          ),
        ],
        [
          annotation(
            'wrong',
            'The standard interpolation technique is the Taylor polynomial, which matches the function at all the data points.',
            sp[2],
            'A Taylor polynomial matches derivatives at a single point, not values at several nodes, so it is not an interpolation method for discrete data. This sentence would be easy to over-credit on a quick read.',
          ),
          annotation(
            'correct',
            'Approximation is typically performed with least squares regression.',
            sp[3],
            'Least-squares regression is the approximation method in the key.',
          ),
        ],
        [
          annotation(
            'wrong',
            'Because approximation uses all derivatives of the function, it is more accurate and converges as the degree increases.',
            sp[5],
            'Carries the Taylor confusion into the advantages. Least-squares fitting uses only data values, and raising the degree on noisy data overfits instead of converging.',
          ),
          annotation(
            'wrong',
            "Interpolation's main drawback is that it can only represent linear relationships between the points.",
            sp[6],
            'False: polynomial and spline interpolation handle nonlinear data. The real drawback, noise sensitivity and Runge oscillation, is missing.',
          ),
        ],
      ],
    },
    {
      studentId: 10,
      paragraphs: [
        [
          'Problem distinction:',
          annotation(
            'correct',
            'Interpolation imposes p(x_i) = y_i for i = 0, …, n; with a degree-n polynomial this is the square Vandermonde system Vc = y, which has a unique solution whenever the nodes are distinct.',
            sp[0],
            'States the interpolation conditions and goes beyond the key with the Vandermonde formulation and the uniqueness condition (distinct nodes).',
          ),
          annotation(
            'correct',
            'Approximation takes m + 1 basis functions with m < n, so Vc = y is overdetermined and we minimise ‖Vc − y‖₂ instead, accepting non-zero residuals; this is appropriate when y is noisy.',
            sp[1],
            'An overdetermined system solved in the 2-norm with non-zero residuals, motivated by noise, is a precise statement of the approximation problem.',
          ),
        ],
        [
          'Solution differences:',
          annotation(
            'correct',
            "In practice one avoids the ill-conditioned Vandermonde matrix: Newton's divided differences make adding a node cheap, barycentric Lagrange is numerically stable, and cubic splines keep the degree low.",
            sp[2],
            'Names the Newton, Lagrange and spline methods and explains when each is preferred, which goes beyond the key.',
          ),
          annotation(
            'correct',
            'For the least-squares problem, a QR factorisation of V is preferred over the normal equations VᵀVc = Vᵀy, because forming VᵀV squares the condition number.',
            sp[3],
            'Least squares, with a correct numerical-stability argument for QR over the normal equations (κ(VᵀV) = κ(V)²).',
          ),
        ],
      ],
    },
    {
      studentId: 11,
      paragraphs: [
        [
          'Take the three points (0, 1), (1, 3), (2, 2).',
          annotation(
            'correct',
            'Interpolation asks for a curve through all three; the unique quadratic is p(x) = 1 + 3.5x − 1.5x², and indeed p(0) = 1, p(1) = 3, p(2) = 2.',
            sp[0],
            'Shows the problem through a concrete interpolant, checked at every node; the arithmetic is correct.',
          ),
          annotation(
            'correct',
            'I built p from the Lagrange basis polynomials; with many points I would use a cubic spline instead.',
            sp[2],
            'Lagrange construction, with cubic splines as the alternative for many points, matches the interpolation methods.',
          ),
        ],
        [
          annotation(
            'correct',
            'Approximation asks for something simpler that is only close to the points, such as the best straight line.',
            sp[1],
            'A simpler model that is only close to the points is the approximation problem.',
          ),
          annotation(
            'correct',
            'By least squares that line is y = 1.5 + 0.5x; its residuals are −0.5, 1 and −0.5, the sum of squares is 1.5, and it passes through none of the points.',
            sp[3],
            'Least-squares line computed correctly (slope 0.5, intercept 1.5, SSE 1.5). It demonstrates the method and the non-zero residuals at the same time.',
          ),
        ],
        [
          annotation(
            'correct',
            'If the three values are exact, p is perfect at the nodes.',
            sp[4],
            'Exactness at the nodes for exact data is the interpolation advantage.',
          ),
          annotation(
            'correct',
            'If the 3 at x = 1 is a bad measurement, the line only shifts by a third of that error,',
            sp[5],
            'A correct quantitative robustness argument: the middle point has x − x̄ = 0, so an error there leaves the slope unchanged and moves the line by one third. This is noise robustness, shown numerically.',
          ),
          annotation(
            'correct',
            'while the parabola has to bend all the way through the bad value, so interpolation copies the noise into the curve.',
            sp[6],
            'The interpolant passes through the corrupted value, which shows its sensitivity to noise. Credited for the noise half of the interpolation disadvantage.',
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
            'Interpolation: exact at every node.',
            sp[0],
            'Exact at every node is the interpolation condition, stated concisely.',
          ),
          annotation(
            'correct',
            'Approximation: small total error, not exact — meant for noisy data.',
            sp[1],
            'Small total error, not exact, and intended for noisy data: the whole approximation problem in one line.',
          ),
        ],
        [
          annotation(
            'correct',
            'Interpolation risk: Runge oscillation at high degree on uniform nodes; fix it with Chebyshev nodes or splines.',
            sp[6],
            'Names Runge oscillation with its exact trigger (high degree, uniform nodes) and both standard remedies.',
          ),
          annotation(
            'correct',
            'Approximation risk: the wrong model degree means underfitting or overfitting.',
            sp[7],
            'Dependence on the model degree and the under/overfitting trade-off match the approximation disadvantage.',
          ),
        ],
      ],
    },
  ],
}

export default demoCase
