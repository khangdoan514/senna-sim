import { useState } from 'react'

interface SessionSelectorProps {
  onLoadSession: (year: number, round: number, sessionType: string) => void | Promise<void>
}

const DEFAULT_SESSION_YEAR = 2024
const DEFAULT_SESSION_ROUND = 4

export default function SessionSelector({ onLoadSession }: SessionSelectorProps) {
  const maxYear = new Date().getFullYear()
  const [year, setYear] = useState(DEFAULT_SESSION_YEAR)
  const [round, setRound] = useState(DEFAULT_SESSION_ROUND)
  const [sessionType, setSessionType] = useState('R')
  const [loading, setLoading] = useState(false)

  const handleLoad = async () => {
    setLoading(true)
    await onLoadSession(year, round, sessionType)
    setLoading(false)
  }

  const parseNumberInput = (raw: string, fallback: number): number => {
    const n = Number(raw)
    return Number.isFinite(n) ? n : fallback
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg rounded-lg shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Select F1 Session</h2>

        <div className="space-y-6">
          {/* Year Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseNumberInput(e.target.value, year))}
              min={2018}
              max={maxYear}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Round Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Round Number
            </label>
            <input
              type="number"
              value={round}
              onChange={(e) => setRound(parseNumberInput(e.target.value, round))}
              min={1}
              max={24}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Session Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Type
            </label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="R">Race</option>
              <option value="Q">Qualifying</option>
              <option value="FP1">Free Practice 1</option>
              <option value="FP2">Free Practice 2</option>
              <option value="FP3">Free Practice 3</option>
              <option value="S">Sprint</option>
              <option value="SQ">Sprint Qualifying</option>
            </select>
          </div>

          {/* Load Button */}
          <button
            onClick={handleLoad}
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold text-white transition-colors shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading Session...
              </span>
            ) : (
              'Load Session'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}