import { useMemo, useState } from 'react'
import type { QualifyingSummary } from '../../types/telemetry'

interface Props {
  summary: QualifyingSummary | null
}

export default function QualifyingPage({ summary }: Props) {
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
  const [segment, setSegment] = useState<'Q1' | 'Q2' | 'Q3'>('Q3')

  const segmentFrames = useMemo(() => {
    if (!summary || !selectedDriver) return []
    return summary.telemetry[selectedDriver]?.segments?.[segment] ?? []
  }, [summary, selectedDriver, segment])

  if (!summary) {
    return <div className="bg-gray-800 rounded-lg p-6">No qualifying data loaded.</div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Qualifying Results</h3>
        <div className="space-y-2 max-h-[550px] overflow-auto">
          {summary.results.map((driver) => (
            <button
              key={driver.code}
              onClick={() => setSelectedDriver(driver.code)}
              className={`w-full text-left p-2 rounded ${selectedDriver === driver.code ? 'bg-red-600' : 'bg-gray-700'}`}
            >
              P{driver.position} - {driver.code} ({driver.full_name})
            </button>
          ))}
        </div>
      </div>
      <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold">Telemetry</h3>
          <select
            value={segment}
            onChange={(event) => setSegment(event.target.value as 'Q1' | 'Q2' | 'Q3')}
            className="bg-gray-700 rounded px-2 py-1"
          >
            <option>Q1</option>
            <option>Q2</option>
            <option>Q3</option>
          </select>
        </div>
        {!selectedDriver && <p className="text-gray-400">Select a driver to view segment telemetry.</p>}
        {selectedDriver && (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">Driver: {selectedDriver} | Segment: {segment}</p>
            <p className="text-sm text-gray-400">Frames: {segmentFrames.length}</p>
            <div className="h-72 overflow-auto bg-gray-900 rounded p-3 text-xs">
              {segmentFrames.slice(0, 120).map((frame, idx) => (
                <div key={idx} className="font-mono text-gray-300">
                  t={frame.t.toFixed(2)} | speed={Math.round(frame.telemetry.speed)} | gear={frame.telemetry.gear} | drs={frame.telemetry.drs}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
