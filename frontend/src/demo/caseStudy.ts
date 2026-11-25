import { annotation, type DemoCase } from './caseTypes'

const returnRubric = {
  crash:
    'A worker can commit the credit and crash before acknowledging the message. The queue can then deliver the same return again.',
  identity:
    'Use the original return event ID as the deduplication key. It stays the same on every retry.',
  transaction:
    'In one database transaction, insert the event ID under a unique constraint and apply the credit only if the insert succeeds.',
  acknowledgement:
    'Acknowledge after the transaction commits. If the event ID is already recorded, skip the credit and acknowledge the duplicate.',
}

const reservationRubric = {
  race: 'Both requests can read the bike as available before either changes its status.',
  claim:
    'Use an atomic conditional update to claim an available bike, or lock its row and recheck availability before claiming it.',
  transaction:
    'Save the hold and the reservation in one transaction. Roll back both changes if the reservation fails.',
  conflict:
    'If another request already claimed the bike, tell the rider it has just been booked and offer another available bike.',
}

export const coreCases: DemoCase[] = [
  {
    question: {
      question_id: 1,
      question:
        'Why was a bike return credited twice? The worker crashed and the queue can redeliver messages. Explain the duplication and design a handler that credits each return once.',
      score: 8,
    },
    pointsPerCriterion: 2,
    rubric: Object.values(returnRubric),
    responses: [
      {
        studentId: 101,
        paragraphs: [
          [
            annotation(
              'correct',
              'The first worker credited the return and then crashed before telling the queue it was done. A second worker got the same return and credited it again.',
              returnRubric.crash,
              'This identifies the gap between the database commit and the queue acknowledgement. Redelivery across that gap explains both credits.',
            ),
            annotation(
              'correct',
              'I would use the return event ID to spot repeats because the ID stays the same each time the message arrives.',
              returnRubric.identity,
              'A stable event ID lets any worker recognize another delivery of the same return.',
            ),
          ],
          [
            annotation(
              'unclear',
              'I would write a handled flag with the credit, and each worker would check the flag before updating the balance.',
              returnRubric.transaction,
              '“With the credit” leaves the transaction boundary unclear. Two workers could both see a missing flag. A uniquely keyed insert and the credit must share one transaction.',
            ),
            annotation(
              'wrong',
              'I would acknowledge the message as soon as a worker receives it so it cannot be picked up again.',
              returnRubric.acknowledgement,
              'An acknowledgement on receipt removes the chance to retry. A crash before the credit commits could leave the rider without a credit.',
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
              'The first credit probably reached the database before the worker crashed. The queue was still waiting for its acknowledgement, so it sent the return again.',
              returnRubric.crash,
              'The response correctly connects a successful write followed by a missed acknowledgement to the duplicate delivery.',
            ),
          ],
          [
            {
              ...annotation(
                'wrong',
                'I would turn on exactly-once delivery so the queue can also roll back any credit that the database has saved.',
                returnRubric.transaction,
                'Queue delivery guarantees do not roll back writes in an external database. The application must make the financial write and its deduplication record atomic.',
              ),
              missedOnFirstPass: true,
            },
            annotation(
              'wrong',
              'Each worker can give the delivery a new UUID and put it in the log to identify duplicates.',
              returnRubric.identity,
              'A new UUID identifies a delivery attempt. Replays of one return get distinct IDs, so this lookup would miss the duplicate.',
            ),
            annotation(
              'wrong',
              'When a duplicate turns up, leave its message unacknowledged so a different worker can try it.',
              returnRubric.acknowledgement,
              'An already recorded return needs no further processing. Leaving it unacknowledged sends it through the redelivery loop again.',
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
              'The first transaction can be durable even if the worker dies before the broker sees an acknowledgement. When the lease expires, the broker can hand out the same return again.',
              returnRubric.crash,
              'The answer distinguishes the database commit from the broker acknowledgement and explains why a crash between them creates a replay.',
            ),
          ],
          [
            annotation(
              'correct',
              'Carry the original return event ID in the message and use that ID for every attempt.',
              returnRubric.identity,
              'The same logical return carries the same key on every delivery.',
            ),
            annotation(
              'correct',
              'In one transaction, insert that key into a table with a uniqueness constraint and credit the account only if the insert succeeds.',
              returnRubric.transaction,
              'The unique constraint chooses one attempt and the transaction commits its deduplication record and credit together.',
            ),
            annotation(
              'correct',
              'Acknowledge after commit. If the key already exists from a committed attempt, skip the credit and acknowledge the replay.',
              returnRubric.acknowledgement,
              'An unfinished attempt remains eligible for retry. A replay of a committed attempt can be acknowledged without issuing a second credit.',
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
              'The crash may have happened somewhere between receiving the return and responding to the queue.',
              returnRubric.crash,
              'The proposed interval is broad enough to include a crash before the credit. The answer needs to place the committed credit before the crash.',
            ),
            annotation(
              'correct',
              'I would keep the same original return event ID for every delivery and check it against a shared table.',
              returnRubric.identity,
              'The original event ID is a stable key across workers and delivery attempts.',
            ),
          ],
          [
            annotation(
              'wrong',
              'I would commit the event ID to that table first, then send the request to add the credit.',
              returnRubric.transaction,
              'A crash between these commits could leave the return marked as handled while its credit is still missing.',
            ),
            annotation(
              'unclear',
              'Once the worker finishes, it can tell the queue to drop the message.',
              returnRubric.acknowledgement,
              'The answer leaves the acknowledgement timing open. It should follow durable commit, and a replay of a committed event can be acknowledged immediately.',
            ),
          ],
        ],
      },
    ],
  },
  {
    question: {
      question_id: 2,
      question:
        'How should the system prevent double booking of the last bike? Two requests arrive together. Describe the database operation, how to handle failure, and what the second rider sees.',
      score: 8,
    },
    pointsPerCriterion: 2,
    rubric: Object.values(reservationRubric),
    responses: [
      {
        studentId: 101,
        paragraphs: [
          [
            annotation(
              'correct',
              'If both riders look up the bike before either request updates it, both requests can see the same available status.',
              reservationRubric.race,
              'The answer describes the race between separately reading availability and changing it.',
            ),
            annotation(
              'correct',
              'I would set its status to held in a single update whose condition requires the current status to be available. Only a request that changes one row gets to reserve it.',
              reservationRubric.claim,
              'The database evaluates the availability condition as it makes the write. Only one request can move the bike to held.',
            ),
          ],
          [
            annotation(
              'correct',
              'That update and the reservation insert need to be in the same transaction so the hold rolls back if the insert fails.',
              reservationRubric.transaction,
              'Rolling back both writes keeps a failed reservation from stranding a bike in the held state.',
            ),
            annotation(
              'unclear',
              'The second rider can just refresh the screen.',
              reservationRubric.conflict,
              'Refreshing might show the changed inventory, but it leaves the rider without an explicit explanation or a next available bike.',
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
              'The two requests can both read available while neither one has written a reservation yet.',
              reservationRubric.race,
              'The response correctly identifies the stale availability read both requests can act on.',
            ),
            annotation(
              'wrong',
              'I would disable the Reserve button whenever a request is running so the two riders cannot book at once.',
              reservationRubric.claim,
              'Disabling a button can reduce repeat clicks in one browser. Riders on separate devices still need the database to arbitrate their competing requests.',
            ),
          ],
          [
            annotation(
              'wrong',
              'First commit the bike as held, then make the reservation in a second transaction. If that fails, keep the hold until staff clears it.',
              reservationRubric.transaction,
              'The second transaction can fail after the hold has committed, leaving the last bike unavailable without a rider who can claim it.',
            ),
            annotation(
              'correct',
              'If someone has already claimed it, tell the second rider the bike was just booked and show the next closest station with a free bike.',
              reservationRubric.conflict,
              'This gives the rider both an accurate explanation of the conflict and a practical alternative.',
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
              'Two requests can each read available, then both try to book the bike using those earlier reads.',
              reservationRubric.race,
              'Both requests can act on the same stale observation unless the database controls the subsequent claim.',
            ),
            annotation(
              'correct',
              'Attempt one conditional update to set held where this bike is still available. Affected-row count zero means the request did not claim it.',
              reservationRubric.claim,
              'The atomic update and row count distinguish the successful claim from a conflicting one.',
            ),
          ],
          [
            annotation(
              'correct',
              'If the update succeeds, create the reservation in the same transaction. Roll the transaction back if the reservation insert fails.',
              reservationRubric.transaction,
              'The availability change and reservation either commit together or both roll back.',
            ),
            annotation(
              'correct',
              'For a lost claim, show that the bike was just booked and suggest another bike from the current inventory.',
              reservationRubric.conflict,
              'The client tells the rider what happened and gives them an actionable alternative.',
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
              'The requests could run at almost the same time, so something in one request could be out of date.',
              reservationRubric.race,
              'Concurrency alone does not identify the stale read. The response needs to explain that both requests can observe the bike as available before either changes it.',
            ),
            annotation(
              'correct',
              'In a transaction, I would lock the bike row, read its status under that lock, and change it to held only if it is still available.',
              reservationRubric.claim,
              'A row lock serializes competing claims. Checking the status under the lock lets the next request observe the winner’s hold.',
            ),
          ],
          [
            annotation(
              'wrong',
              'I would commit the hold and make the reservation in a background job. If the job fails, the bike can stay held for that rider.',
              reservationRubric.transaction,
              'A failed job would leave the hold without a reservation. The design needs a shared commit or a defined mechanism that releases the hold after failure.',
            ),
            annotation(
              'correct',
              'If the bike was already held when the second request got the lock, tell that rider and list other bikes they can reserve.',
              reservationRubric.conflict,
              'The response shows how to explain the conflict and helps the second rider continue.',
            ),
          ],
        ],
      },
    ],
  },
]
