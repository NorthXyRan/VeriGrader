import { annotation, type DemoCase } from './caseTypes'

const accessRubric = [
  'Compute failed unlocks per eligible rental attempt by station, hour, and channel. Count retries for the same attempt once.',
  'Reconcile app, kiosk, and dock events by attempt and timestamp. Quantify missing coverage before interpreting the gap.',
  'Compare like-for-like time windows and account for differences in demand, bike availability, and maintenance.',
  'Separate stockouts, lock faults, and connection failures, then target the cause supported by the event data.',
  'Set an evening failure target for North Residence and a matched gap target, such as 12% and four percentage points. Report uncertainty.',
] as const

const pilotRubric = [
  'Specify the scheduled and threshold policies before the pilot. Give both policies the same fleet and two-trip evening budget.',
  'Randomize the entire network by evening, balance assignments by weekday, and reset starting inventory to limit carryover.',
  'Measure failed rentals and returns per recorded attempt across all assigned evenings, including evenings when no trip runs.',
  'Monitor van time and check each station for a worsening failure rate when the network average improves.',
  'Estimate a weekday-adjusted effect with uncertainty and adopt the threshold policy only if it meets a predefined improvement target and stays within guardrails.',
] as const

export const advancedCases: DemoCase[] = [
  {
    question: {
      question_id: 3,
      question:
        'From 6 to 9 p.m., 22% of rental attempts at North Residence fail versus 8% at the Library. North loses app events after 7 p.m., and demand peaks at different hours. How would you investigate the gap, choose a fix, and measure recovery?',
      score: 10,
    },
    pointsPerCriterion: 2,
    rubric: accessRubric,
    responses: [
      {
        studentId: 101,
        paragraphs: [
          [
            annotation(
              'correct',
              'Measure failed unlocks per eligible attempt, collapse retries under the same attempt ID, and report rates by station, hour, and app or kiosk.',
              accessRubric[0],
              'Defines a comparable denominator, deduplicates retries, and preserves the three relevant breakdowns.',
            ),
            annotation(
              'correct',
              'Join the surviving app events to kiosk records and dock logs by attempt ID and timestamp, then report the fraction of attempts lacking an app outcome after 7 p.m.',
              accessRubric[1],
              'Tests whether missing app outcomes could distort the observed gap and records how much data is missing.',
            ),
            annotation(
              'wrong',
              'A drop in North app traffic would prove that students there have less demand after 7 p.m.',
              accessRubric[2],
              'App traffic after 7 p.m. is affected by the known telemetry gap. Comparing matched time windows and triangulating demand would address that ambiguity.',
            ),
          ],
          [
            annotation(
              'correct',
              'Separate stations with no usable bikes from attempted unlocks that hit lock errors or network timeouts. If stockouts dominate, stage more bikes at North before the evening peak.',
              accessRubric[3],
              'Connects distinct failure modes to a response supported by the dominant observed cause.',
            ),
            annotation(
              'unclear',
              'I would call the fix successful if the two stations were about the same by next month.',
              accessRubric[4],
              'The answer gives a review date. A numerical rate and gap, matched time periods, and uncertainty are still needed.',
            ),
          ],
        ],
      },
      {
        studentId: 102,
        paragraphs: [
          [
            annotation(
              'correct',
              'Use denied unlocks over eligible attempts by station, hour, and channel. A rider clicking retry on the same attempt still counts once.',
              accessRubric[0],
              'Uses an attempt-level denominator and keeps differences in station, time, and channel visible.',
            ),
            annotation(
              'correct',
              'Link app, kiosk, and dock traces by attempt ID and aligned timestamps. Report unmatched outcomes separately for each hour around the outage.',
              accessRubric[1],
              'Makes the event join and the missing-coverage check explicit.',
            ),
            annotation(
              'correct',
              'Compare the same weekday and hour at both stops and separate periods by observed demand, usable bike count, and maintenance state.',
              accessRubric[2],
              'Controls for differences in operating periods, fleet supply, maintenance, and demand before interpreting the gap.',
            ),
          ],
          [
            annotation(
              'unclear',
              "Once we have the logs, engineering should adjust North's evening operations.",
              accessRubric[3],
              'The intervention needs a failure category and a specific repair or operating change linked to the evidence.',
            ),
            annotation(
              'correct',
              'Require North to fall below 12% and the matched gap to fall below four percentage points. Show confidence intervals and the amount of usable data for both estimates.',
              accessRubric[4],
              'Defines both recovery thresholds and reports how precise the estimates are.',
            ),
          ],
        ],
      },
      {
        studentId: 103,
        paragraphs: [
          [
            annotation(
              'wrong',
              'I would divide the number of failures by the rides that eventually started, since that gives the same denominator for both stations.',
              accessRubric[0],
              'Successful rides exclude denied attempts. The denominator should represent all eligible attempts at each station.',
            ),
            annotation(
              'correct',
              'Match the kiosk, dock, and app records by attempt ID and estimate the share of attempts whose app result is missing each hour.',
              accessRubric[1],
              'Reconciles the event sources and measures the degree of missing coverage over time.',
            ),
          ],
          [
            annotation(
              'unclear',
              'For comparison I would pick evenings when North and the Library seem equally busy.',
              accessRubric[2],
              'Comparable demand is a sensible starting point. The answer leaves the matching rule, bike availability, and maintenance controls unspecified.',
            ),
            annotation(
              'correct',
              'Split empty docks with no bikes, lock jams, and timeouts into different categories. Replace the affected locks if jam codes explain the excess failures.',
              accessRubric[3],
              'Uses distinguishable failure modes and proposes a fix tied to the one driving the disparity.',
            ),
            annotation(
              'wrong',
              'If total rentals across campus increase, that is enough to declare the access gap closed.',
              accessRubric[4],
              'Campus totals can improve while access at North falls. Evaluate the North rate and matched station gap directly.',
            ),
          ],
        ],
      },
      {
        studentId: 104,
        paragraphs: [
          [
            annotation(
              'unclear',
              'Calculate a failure percentage for each location using evening rental records.',
              accessRubric[0],
              'The numerator and denominator, retry handling, and breakdown by hour and channel remain unspecified.',
            ),
            annotation(
              'wrong',
              'Count any app session without an outcome as a successful retry so those sessions can fill in the two-hour gap.',
              accessRubric[1],
              'Missing outcomes could include either successes or failures. Mark coverage as missing and corroborate outcomes with dock and kiosk records.',
            ),
            annotation(
              'correct',
              'Match the same weekday and hour at both stations and account separately for how many riders arrive, how many bikes they can use, and when racks are under repair.',
              accessRubric[2],
              'Defines matched windows and the relevant measures of demand, supply, and repair activity.',
            ),
          ],
          [
            annotation(
              'wrong',
              "Move the Library's last remaining bike to North every evening, even if the issue turns out to be North's lock hardware.",
              accessRubric[3],
              'A bicycle transfer leaves a hardware fault unresolved and may create a new stockout at the Library.',
            ),
            annotation(
              'unclear',
              'Track North for a week and see whether there are fewer failures.',
              accessRubric[4],
              'The answer needs an attempt-normalized failure target, a matched gap, and a measure of uncertainty.',
            ),
          ],
        ],
      },
    ],
  },
  {
    question: {
      question_id: 4,
      question:
        'Campus Bike Share has eight connected stations and one van. Design a four-week pilot comparing a scheduled 5 p.m. rebalancing run with threshold-triggered rebalancing. The van gets two trips per evening. Explain assignment, measurement, and when you would switch policies.',
      score: 10,
    },
    pointsPerCriterion: 2,
    rubric: pilotRubric,
    responses: [
      {
        studentId: 101,
        paragraphs: [
          [
            annotation(
              'correct',
              'Keep the same fleet and cap both plans at two trips. The scheduled plan sends a van at 5 p.m. The threshold plan dispatches when a station has at most two usable bikes for ten minutes.',
              pilotRubric[0],
              'Specifies a reproducible trigger and holds resources steady across the two plans.',
            ),
            annotation(
              'wrong',
              'Assign four stations to each plan and move bicycles between those two groups as usual.',
              pilotRubric[1],
              'Bike transfers expose both groups to decisions made under the other policy. Assign the connected network together.',
            ),
            annotation(
              'correct',
              'Count denied rentals and failed returns over all recorded attempts each night, even when no trigger sends a van.',
              pilotRubric[2],
              'Includes every assigned evening and measures both sides of station availability.',
            ),
          ],
          [
            annotation(
              'correct',
              'Log driver minutes, and compare the failure rate of each station before accepting an improvement in the campus average.',
              pilotRubric[3],
              'Captures operational cost and checks whether an average improvement hides a local deterioration.',
            ),
            annotation(
              'unclear',
              'Choose the policy that looks reliably better over the four weeks.',
              pilotRubric[4],
              'A decision rule needs a minimum effect, an uncertainty estimate, and a check against the guardrails.',
            ),
          ],
        ],
      },
      {
        studentId: 102,
        paragraphs: [
          [
            annotation(
              'unclear',
              'The scheduled arm runs at 5 p.m. and the other arm dispatches when the dashboard shows a shortage.',
              pilotRubric[0],
              'The shortage threshold and the common fleet and trip limits must be defined before assignment.',
            ),
            annotation(
              'correct',
              'Randomize the entire network by evening within each weekday group. Return the stations to a shared starting allocation before the next comparison.',
              pilotRubric[1],
              'Contains cross-station spillover, balances weekdays, and accounts for inventory carried across evenings.',
            ),
            annotation(
              'wrong',
              'Measure failures only on nights when the van made a trip, because those are the nights when a policy was actually applied.',
              pilotRubric[2],
              'Whether a van runs is part of the assigned policy. Restricting measurement to trip nights would select different subsets in each arm.',
            ),
          ],
          [
            annotation(
              'unclear',
              'Collect driving logs and watch for complaints from students.',
              pilotRubric[3],
              'Logs and complaints may help diagnose problems. Define van time and the individual station failure-rate check explicitly.',
            ),
            annotation(
              'correct',
              'Estimate the change in failure percentage points after weekday adjustment, include a confidence interval, and require at least a three-point improvement without exceeding the station and van guardrails.',
              pilotRubric[4],
              'States an adjusted effect, uncertainty estimate, minimum worthwhile change, and guardrail requirement.',
            ),
          ],
        ],
      },
      {
        studentId: 103,
        paragraphs: [
          [
            annotation(
              'correct',
              'Fix the van budget at two trips and start both arms with the same fleet. Compare a 5 p.m. run on the scheduled route with dispatch when a station stays below three bikes or two return spaces for ten minutes.',
              pilotRubric[0],
              'Makes both operations reproducible, includes full and empty station risks, and equalizes fleet and trip constraints.',
            ),
            annotation(
              'correct',
              "Randomize evenings for the whole network in weekday blocks. Before each evening, restore the same target inventory, since yesterday's moves affect today's dispatches.",
              pilotRubric[1],
              'The whole-network assignment handles shared bicycles, weekday blocks control scheduling differences, and the reset limits carryover.',
            ),
            annotation(
              'correct',
              'For every assigned evening, record failed rentals and returns divided by the corresponding attempts. An evening with zero van trips still contributes its rental and return attempts.',
              pilotRubric[2],
              'Records both user outcomes for all assigned evenings and preserves the relevant denominators.',
            ),
          ],
          [
            annotation(
              'correct',
              "Keep van time under 90 minutes on each evening and reject a plan that increases any station's failure rate by more than three percentage points.",
              pilotRubric[3],
              'Defines observable limits for driver time and equity across stations.',
            ),
            annotation(
              'correct',
              'Estimate the effect within weekday blocks, show a confidence interval across evenings, and adopt the threshold policy only if it cuts failures by at least three percentage points while meeting both guardrails.',
              pilotRubric[4],
              'Connects the analysis to the experimental unit and sets a predeclared effect and operational threshold for moving forward.',
            ),
          ],
        ],
      },
      {
        studentId: 104,
        paragraphs: [
          [
            annotation(
              'wrong',
              'Start the scheduled policy with 60 bikes and allow the threshold policy to use 75 if the first weekend is busy.',
              pilotRubric[0],
              'Different fleet sizes would mix the effect of extra bicycles with the effect of the dispatch policy.',
            ),
            annotation(
              'wrong',
              'Use the scheduled plan in weeks one and two and the threshold plan once the midterm rush starts in week three.',
              pilotRubric[1],
              'The midterm demand change is confounded with policy. Randomized network evenings across both periods would give a more comparable assignment.',
            ),
            annotation(
              'correct',
              'Use the share of rental and return attempts that fail, including assigned nights with no dispatch.',
              pilotRubric[2],
              'Includes failed rentals and returns across the full set of assigned evenings.',
            ),
          ],
          [
            annotation(
              'unclear',
              'Make sure that the trial stays affordable.',
              pilotRubric[3],
              'A measurable driver-time limit and station-level failure check would make the guardrail actionable.',
            ),
            annotation(
              'wrong',
              'Switch immediately if the threshold policy has a higher ride count on one Friday.',
              pilotRubric[4],
              'One Friday is sensitive to demand fluctuations. Use the assigned evenings, uncertainty, an improvement threshold, and both guardrails.',
            ),
          ],
        ],
      },
    ],
  },
]
