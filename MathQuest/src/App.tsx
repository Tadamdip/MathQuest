import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  Brain,
  Calculator,
  CheckCircle2,
  CircleHelp,
  Dice5,
  Flag,
  Medal,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  User,
  X,
} from 'lucide-react'

type Category =
  | 'addition'
  | 'fraction'
  | 'multiplication'
  | 'percentage'
  | 'probability'
  | 'division'
  | 'mixed'
  | 'boss'

type SpaceKind = 'start' | 'roll' | 'safe' | 'challenge' | 'bonus' | 'penalty' | 'move' | 'finish'

type BoardSpace = {
  id: number
  title: string
  caption: string
  kind: SpaceKind
  category?: Category
  delta?: number
  points?: number
  accent: string
}

type Question = {
  category: Category
  prompt: string
  accepted: string[]
  explanation: string
}

type ScoreRecord = {
  id?: number
  playerName: string
  score: number
  moves: number
  correctAnswers: number
  wrongAnswers: number
  createdAt?: string
}

const API_URL = import.meta.env.VITE_SCORE_API_URL ?? 'http://localhost/math-quest-api/scores.php'

const spaces: BoardSpace[] = [
  {
    id: 0,
    title: 'Start',
    caption: 'Begin the quest',
    kind: 'start',
    accent: 'border-stone-300 bg-white text-stone-800',
  },
  {
    id: 1,
    title: 'Roll Again',
    caption: 'Take another turn',
    kind: 'roll',
    accent: 'border-sky-300 bg-sky-50 text-sky-950',
  },
  {
    id: 2,
    title: 'Addition',
    caption: 'Add carefully',
    kind: 'challenge',
    category: 'addition',
    accent: 'border-teal-300 bg-teal-50 text-teal-950',
  },
  {
    id: 3,
    title: 'Safe Space',
    caption: 'No question here',
    kind: 'safe',
    accent: 'border-emerald-300 bg-emerald-50 text-emerald-950',
  },
  {
    id: 4,
    title: 'Fractions',
    caption: 'Combine parts',
    kind: 'challenge',
    category: 'fraction',
    accent: 'border-violet-300 bg-violet-50 text-violet-950',
  },
  {
    id: 5,
    title: 'Slide Back',
    caption: 'Move back 1',
    kind: 'move',
    delta: -1,
    accent: 'border-rose-300 bg-rose-50 text-rose-950',
  },
  {
    id: 6,
    title: 'Multiply',
    caption: 'Find the product',
    kind: 'challenge',
    category: 'multiplication',
    accent: 'border-orange-300 bg-orange-50 text-orange-950',
  },
  {
    id: 7,
    title: 'Bonus',
    caption: '+5 points',
    kind: 'bonus',
    points: 5,
    accent: 'border-lime-300 bg-lime-50 text-lime-950',
  },
  {
    id: 8,
    title: 'Percent',
    caption: 'Think in 100s',
    kind: 'challenge',
    category: 'percentage',
    accent: 'border-cyan-300 bg-cyan-50 text-cyan-950',
  },
  {
    id: 9,
    title: 'Safe Space',
    caption: 'Catch your breath',
    kind: 'safe',
    accent: 'border-emerald-300 bg-emerald-50 text-emerald-950',
  },
  {
    id: 10,
    title: 'Chance',
    caption: 'Probability',
    kind: 'challenge',
    category: 'probability',
    accent: 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-950',
  },
  {
    id: 11,
    title: 'Divide',
    caption: 'Split equally',
    kind: 'challenge',
    category: 'division',
    accent: 'border-amber-300 bg-amber-50 text-amber-950',
  },
  {
    id: 12,
    title: 'Shortcut',
    caption: 'Move forward 2',
    kind: 'move',
    delta: 2,
    accent: 'border-blue-300 bg-blue-50 text-blue-950',
  },
  {
    id: 13,
    title: 'Mixed Math',
    caption: 'Order matters',
    kind: 'challenge',
    category: 'mixed',
    accent: 'border-indigo-300 bg-indigo-50 text-indigo-950',
  },
  {
    id: 14,
    title: 'Penalty',
    caption: '-5 points',
    kind: 'penalty',
    points: -5,
    accent: 'border-red-300 bg-red-50 text-red-950',
  },
  {
    id: 15,
    title: 'Finish Gate',
    caption: 'Boss question',
    kind: 'finish',
    category: 'boss',
    accent: 'border-yellow-300 bg-yellow-50 text-yellow-950',
  },
]

const visualOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
const finalIndex = spaces.length - 1

const questionBank: Record<Category, Question[]> = {
  addition: [
    {
      category: 'addition',
      prompt: 'What is 38 + 27?',
      accepted: ['65'],
      explanation: '38 + 27 = 65.',
    },
    {
      category: 'addition',
      prompt: 'A player has 46 points and earns 29 more. What is the total?',
      accepted: ['75'],
      explanation: '46 + 29 = 75.',
    },
  ],
  fraction: [
    {
      category: 'fraction',
      prompt: 'What is 1/2 + 1/4?',
      accepted: ['3/4', '0.75'],
      explanation: '1/2 is 2/4, and 2/4 + 1/4 = 3/4.',
    },
    {
      category: 'fraction',
      prompt: 'Simplify 6/8.',
      accepted: ['3/4', '0.75'],
      explanation: 'Divide the numerator and denominator by 2 to get 3/4.',
    },
  ],
  multiplication: [
    {
      category: 'multiplication',
      prompt: 'What is 8 x 7?',
      accepted: ['56'],
      explanation: '8 groups of 7 equals 56.',
    },
    {
      category: 'multiplication',
      prompt: 'A route has 6 stops worth 9 points each. How many points is that?',
      accepted: ['54'],
      explanation: '6 x 9 = 54.',
    },
  ],
  percentage: [
    {
      category: 'percentage',
      prompt: 'What is 20% of 50?',
      accepted: ['10'],
      explanation: '20% is 0.20, and 0.20 x 50 = 10.',
    },
    {
      category: 'percentage',
      prompt: 'A 100-point score increases by 15%. What is the increase?',
      accepted: ['15'],
      explanation: '15% of 100 is 15.',
    },
  ],
  probability: [
    {
      category: 'probability',
      prompt: 'If you roll one die, what is the probability of getting a 6?',
      accepted: ['1/6', '0.1667', '16.67%', '16.7%'],
      explanation: 'There is 1 winning outcome out of 6 possible outcomes.',
    },
    {
      category: 'probability',
      prompt: 'A bag has 3 red balls and 2 blue balls. What is the probability of picking blue?',
      accepted: ['2/5', '0.4', '40%'],
      explanation: 'There are 2 blue balls out of 5 total balls.',
    },
  ],
  division: [
    {
      category: 'division',
      prompt: 'What is 72 / 9?',
      accepted: ['8'],
      explanation: '72 divided by 9 equals 8.',
    },
    {
      category: 'division',
      prompt: 'Share 96 points equally among 4 rounds. How many points per round?',
      accepted: ['24'],
      explanation: '96 / 4 = 24.',
    },
  ],
  mixed: [
    {
      category: 'mixed',
      prompt: 'Solve: 5 x 4 + 10',
      accepted: ['30'],
      explanation: 'Multiply first: 5 x 4 = 20, then 20 + 10 = 30.',
    },
    {
      category: 'mixed',
      prompt: 'Solve: 18 + 6 / 3',
      accepted: ['20'],
      explanation: 'Divide first: 6 / 3 = 2, then 18 + 2 = 20.',
    },
  ],
  boss: [
    {
      category: 'boss',
      prompt: 'Final Boss: Solve (12 x 3) + 20 - 6.',
      accepted: ['50'],
      explanation: '12 x 3 = 36, then 36 + 20 - 6 = 50.',
    },
    {
      category: 'boss',
      prompt: 'Final Boss: A score of 80 gets a 25% bonus. What is the final score?',
      accepted: ['100'],
      explanation: '25% of 80 is 20, and 80 + 20 = 100.',
    },
  ],
}

const categoryLabels: Record<Category, string> = {
  addition: 'Addition',
  fraction: 'Fractions',
  multiplication: 'Multiplication',
  percentage: 'Percentages',
  probability: 'Probability',
  division: 'Division',
  mixed: 'Mixed Math',
  boss: 'Final Boss',
}

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ')

function normalizeAnswer(answer: string) {
  return answer.toLowerCase().replace(/\s+/g, '').replace('÷', '/')
}

function pickQuestion(category: Category) {
  const questions = questionBank[category]
  return questions[Math.floor(Math.random() * questions.length)]
}

function tileIcon(kind: SpaceKind) {
  if (kind === 'challenge') return <Calculator className="h-4 w-4" />
  if (kind === 'finish') return <Flag className="h-4 w-4" />
  if (kind === 'bonus') return <Sparkles className="h-4 w-4" />
  if (kind === 'penalty') return <AlertCircle className="h-4 w-4" />
  if (kind === 'safe') return <ShieldCheck className="h-4 w-4" />
  if (kind === 'roll') return <Dice5 className="h-4 w-4" />
  return <Target className="h-4 w-4" />
}

function App() {
  const [playerName, setPlayerName] = useState('')
  const [position, setPosition] = useState(0)
  const [dice, setDice] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState(0)
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState('')
  const [message, setMessage] = useState('Enter your name, roll the die, and solve the spaces you land on.')
  const [gameFinished, setGameFinished] = useState(false)
  const [scoreSaved, setScoreSaved] = useState(false)
  const [leaderboard, setLeaderboard] = useState<ScoreRecord[]>([])
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [isSaving, setIsSaving] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(true)

  const currentSpace = spaces[position]
  const progress = Math.round((position / finalIndex) * 100)

  const stats = useMemo(
    () => [
      { label: 'Score', value: score },
      { label: 'Moves', value: moves },
      { label: 'Correct', value: correctAnswers },
      { label: 'Wrong', value: wrongAnswers },
    ],
    [correctAnswers, moves, score, wrongAnswers],
  )

  const loadScores = useCallback(async () => {
    try {
      const response = await fetch(API_URL)
      if (!response.ok) throw new Error('Could not load scores')
      const data = (await response.json()) as { scores: ScoreRecord[] }
      setLeaderboard(data.scores ?? [])
      setApiStatus('online')
    } catch {
      setApiStatus('offline')
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadScores()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadScores])

  function landOn(index: number, chainedMove = false) {
    const nextIndex = Math.min(Math.max(index, 0), finalIndex)
    const tile = spaces[nextIndex]
    setPosition(nextIndex)

    if (tile.kind === 'challenge' && tile.category) {
      setActiveQuestion(pickQuestion(tile.category))
      setMessage(`Solve the ${categoryLabels[tile.category]} challenge to keep moving.`)
      return
    }

    if (tile.kind === 'finish') {
      setActiveQuestion(pickQuestion('boss'))
      setMessage('You reached the Finish Gate. Answer the boss question to complete the game.')
      return
    }

    if (tile.kind === 'bonus') {
      const bonus = tile.points ?? 5
      setScore((value) => value + bonus)
      setMessage(`Bonus space. You gained ${bonus} points.`)
      return
    }

    if (tile.kind === 'penalty') {
      const penalty = tile.points ?? -5
      setScore((value) => value + penalty)
      setMessage(`Penalty space. You lost ${Math.abs(penalty)} points.`)
      return
    }

    if (tile.kind === 'roll') {
      setMessage('Roll Again space. You can roll once more right away.')
      return
    }

    if (tile.kind === 'move' && tile.delta && !chainedMove) {
      const movedIndex = Math.min(Math.max(nextIndex + tile.delta, 0), finalIndex)
      setMessage(tile.delta > 0 ? 'Shortcut activated. You moved forward 2 spaces.' : 'Slide Back activated. You moved back 1 space.')
      landOn(movedIndex, true)
      return
    }

    setMessage(tile.kind === 'safe' ? 'Safe space. No challenge this turn.' : 'Ready for the next roll.')
  }

  function rollDice() {
    if (!playerName.trim()) {
      setIsHelpOpen(true)
      setMessage('Type your player name before rolling so your score can be saved to the leaderboard.')
      return
    }

    if (activeQuestion || gameFinished) return

    const roll = Math.floor(Math.random() * 6) + 1
    setDice(roll)
    setMoves((value) => value + 1)
    landOn(position + roll >= finalIndex ? finalIndex : position + roll)
  }

  function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeQuestion) return

    const isCorrect = activeQuestion.accepted.some((item) => normalizeAnswer(item) === normalizeAnswer(answer))

    if (isCorrect) {
      const points = activeQuestion.category === 'boss' ? 25 : 10
      setScore((value) => value + points)
      setCorrectAnswers((value) => value + 1)
      setMessage(`Correct. ${activeQuestion.explanation} You gained ${points} points.`)

      if (activeQuestion.category === 'boss') {
        setGameFinished(true)
        setPosition(finalIndex)
      }
    } else {
      setScore((value) => value - 5)
      setWrongAnswers((value) => value + 1)
      setPosition((value) => Math.max(value - 1, 0))
      setMessage(`Not quite. ${activeQuestion.explanation} You lost 5 points and moved back 1 space.`)
    }

    setAnswer('')
    setActiveQuestion(null)
  }

  async function saveScore() {
    if (!playerName.trim() || !gameFinished || scoreSaved) return

    setIsSaving(true)
    try {
      const payload: ScoreRecord = {
        playerName: playerName.trim(),
        score,
        moves,
        correctAnswers,
        wrongAnswers,
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Could not save score')
      const data = (await response.json()) as { scores: ScoreRecord[] }
      setLeaderboard(data.scores ?? [])
      setApiStatus('online')
      setScoreSaved(true)
      setMessage('Score saved to the MySQL leaderboard.')
    } catch {
      setApiStatus('offline')
      setMessage('The game works, but the XAMPP score API is not connected yet.')
    } finally {
      setIsSaving(false)
    }
  }

  function resetGame() {
    setPosition(0)
    setDice(null)
    setScore(0)
    setMoves(0)
    setCorrectAnswers(0)
    setWrongAnswers(0)
    setActiveQuestion(null)
    setAnswer('')
    setGameFinished(false)
    setScoreSaved(false)
    setMessage('New round started. Roll the die and chase a better score.')
  }

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/70 px-4 py-6 backdrop-blur-sm">
          <section
            aria-labelledby="how-to-play-title"
            aria-modal="true"
            className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-teal-100 bg-white shadow-2xl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4 border-b border-stone-200 p-5">
              <div className="flex gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white">
                  <BookOpen className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-normal text-teal-700">Quick Guide</p>
                  <h2 id="how-to-play-title" className="text-2xl font-black leading-tight text-stone-950">
                    How to Play Math Quest
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    Start with your name, roll the die, answer math challenges, and reach the Finish Gate.
                  </p>
                </div>
              </div>
              <button
                aria-label="Close how to play guide"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-50 focus:outline-none focus:ring-4 focus:ring-stone-200"
                type="button"
                onClick={() => setIsHelpOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 p-5">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <h3 className="text-base font-black text-amber-950">Enter your player name first</h3>
                    <p className="mt-1 text-sm leading-6 text-amber-900">
                      The Roll button waits for a name because that name is used when you save your final leaderboard score.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                    <User className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black text-stone-950">1. Type your name</h3>
                  <p className="mt-1 text-sm leading-6 text-stone-600">Use the Player name box at the top before your first roll.</p>
                </div>

                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                    <Dice5 className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black text-stone-950">2. Roll and move</h3>
                  <p className="mt-1 text-sm leading-6 text-stone-600">Click Roll to move the player marker across the quest board.</p>
                </div>

                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black text-stone-950">3. Solve challenges</h3>
                  <p className="mt-1 text-sm leading-6 text-stone-600">Challenge spaces ask math questions. Correct answers earn points.</p>
                </div>

                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black text-stone-950">4. Finish and save</h3>
                  <p className="mt-1 text-sm leading-6 text-stone-600">Beat the boss question at space 15, then save your score.</p>
                </div>
              </div>

              <div className="grid gap-2 rounded-lg border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-700">
                <p>
                  <span className="font-black text-stone-950">Scoring:</span> regular correct answers give +10 points, the boss gives +25 points,
                  and wrong answers cost -5 points plus one space backward.
                </p>
                <p>
                  <span className="font-black text-stone-950">Board spaces:</span> Bonus adds points, Penalty removes points, Shortcut moves forward,
                  Slide Back moves backward, and Safe Space has no question.
                </p>
              </div>

              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200"
                type="button"
                onClick={() => setIsHelpOpen(false)}
              >
                <Dice5 className="h-5 w-5" />
                Start Playing
              </button>
            </div>
          </section>
        </div>
      )}

      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-900">
              <Brain className="h-4 w-4" />
              Gec104 Mathematics in the Modern World
            </div>
            <h1 className="max-w-full break-words text-2xl font-black leading-tight tracking-normal text-stone-950 sm:text-4xl">
              Math Quest Game Challenge
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">
              Roll, solve, score, and save your final result. The board applies arithmetic, fractions, percentages, probability, and order of operations.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto_auto] lg:min-w-[520px]">
            <label className="grid gap-1 text-sm font-semibold text-stone-700">
              Player name
              <span className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  className="h-11 w-full rounded-lg border border-stone-300 bg-white pl-10 pr-3 text-base outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value)}
                  placeholder="Your name"
                  maxLength={60}
                />
              </span>
            </label>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-lg border border-stone-300 bg-white px-4 text-sm font-bold text-stone-800 shadow-sm transition hover:bg-stone-50 focus:outline-none focus:ring-4 focus:ring-stone-200"
              type="button"
              onClick={() => setIsHelpOpen(true)}
              title="Open how to play guide"
            >
              <CircleHelp className="h-4 w-4" />
              How to Play
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-lg bg-stone-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-stone-800 focus:outline-none focus:ring-4 focus:ring-stone-300 disabled:cursor-not-allowed disabled:bg-stone-400"
              type="button"
              onClick={resetGame}
              title="Restart the game"
            >
              <RefreshCcw className="h-4 w-4" />
              Restart
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_370px] lg:px-8">
        <div className="grid gap-5">
          <div className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-stone-950">Quest Board</h2>
                <p className="text-sm text-stone-600">Current space: {currentSpace.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-center">
                  <div className="text-xs font-bold uppercase text-stone-500">Die</div>
                  <div className="text-2xl font-black text-stone-950">{dice ?? '-'}</div>
                </div>
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200 disabled:cursor-not-allowed disabled:bg-stone-400"
                  type="button"
                  onClick={rollDice}
                  disabled={Boolean(activeQuestion) || gameFinished}
                  title="Roll the die"
                >
                  <Dice5 className="h-5 w-5" />
                  Roll
                </button>
              </div>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${progress}%` }} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {visualOrder.map((spaceId) => {
                const tile = spaces[spaceId]
                const isCurrent = position === tile.id

                return (
                  <div
                    key={tile.id}
                    className={cn(
                      'relative flex min-h-28 flex-col justify-between rounded-lg border-2 p-3 transition',
                      tile.accent,
                      isCurrent && 'ring-4 ring-teal-300',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-white/75 px-2 text-xs font-black">
                        {tile.id}
                      </span>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/75">{tileIcon(tile.kind)}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-black leading-5">{tile.title}</h3>
                      <p className="mt-1 text-xs font-semibold leading-4 opacity-75">{tile.caption}</p>
                    </div>
                    {isCurrent && (
                      <div className="absolute right-2 top-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-black text-amber-950 shadow-md">
                        P
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-stone-950">Challenge Panel</h2>
                  <p className="text-sm text-stone-600">Answer correctly to earn points.</p>
                </div>
                <Target className="h-6 w-6 text-teal-600" />
              </div>

              {activeQuestion ? (
                <form className="grid gap-4" onSubmit={submitAnswer}>
                  <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                    <div className="text-xs font-black uppercase tracking-normal text-teal-700">{categoryLabels[activeQuestion.category]}</div>
                    <p className="mt-2 text-lg font-black leading-7 text-teal-950">{activeQuestion.prompt}</p>
                  </div>
                  <label className="grid gap-2 text-sm font-bold text-stone-700">
                    Your answer
                    <input
                      className="h-12 rounded-lg border border-stone-300 px-3 text-lg font-bold outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      placeholder="Type answer"
                      autoFocus
                    />
                  </label>
                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200"
                    type="submit"
                  >
                    <Send className="h-4 w-4" />
                    Submit Answer
                  </button>
                </form>
              ) : (
                <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
                  <div>
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                    <p className="mt-3 text-base font-black text-stone-900">No active question</p>
                    <p className="mt-1 text-sm leading-6 text-stone-600">Roll the die to land on a challenge space.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-stone-950">Score Tracker</h2>
                  <p className="text-sm text-stone-600">Correct: +10, boss: +25, wrong: -5.</p>
                </div>
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <div className="text-xs font-black uppercase tracking-normal text-stone-500">{item.label}</div>
                    <div className="mt-1 text-2xl font-black text-stone-950">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-stone-200 bg-white p-3">
                <div className="text-xs font-black uppercase tracking-normal text-stone-500">Status</div>
                <p className="mt-1 text-sm leading-6 text-stone-700">{message}</p>
              </div>

              {gameFinished && (
                <button
                  className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 text-sm font-black text-amber-950 shadow-sm transition hover:bg-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-stone-300"
                  type="button"
                  onClick={saveScore}
                  disabled={isSaving || scoreSaved}
                  title="Save score to MySQL"
                >
                  <Medal className="h-5 w-5" />
                  {scoreSaved ? 'Score Saved' : isSaving ? 'Saving...' : 'Save Score'}
                </button>
              )}
            </div>
          </div>
        </div>

        <aside className="grid gap-5">
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-stone-950">Leaderboard</h2>
                <p className="text-sm text-stone-600">
                  {apiStatus === 'online' ? 'Connected to MySQL' : apiStatus === 'checking' ? 'Checking API' : 'XAMPP API offline'}
                </p>
              </div>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-50 focus:outline-none focus:ring-4 focus:ring-stone-200"
                type="button"
                onClick={() => void loadScores()}
                title="Refresh leaderboard"
              >
                <RefreshCcw className="h-4 w-4" />
              </button>
            </div>

            {leaderboard.length > 0 ? (
              <div className="grid gap-2">
                {leaderboard.map((item, index) => (
                  <div key={`${item.id ?? item.playerName}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-stone-950">
                        {index + 1}. {item.playerName}
                      </div>
                      <div className="text-xs font-semibold text-stone-500">
                        {item.moves} moves · {item.correctAnswers} correct
                      </div>
                    </div>
                    <div className="text-lg font-black text-teal-700">{item.score}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4 text-sm leading-6 text-stone-600">
                Finish a game and connect the PHP API to show saved scores here.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="text-xl font-black text-stone-950">Math Concepts</h2>
            <div className="mt-3 grid gap-2 text-sm font-semibold text-stone-700">
              {['Arithmetic operations', 'Fractions and percentages', 'Probability with dice outcomes', 'Order of operations', 'Score and resource tracking'].map((concept) => (
                <div key={concept} className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{concept}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default App
