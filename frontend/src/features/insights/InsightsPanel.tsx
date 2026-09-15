interface DriverInsight {
  telemetry?: {
    speed: number
    gear: number
    throttle: number
    brake: number
    drs: number
    tyre_life: number
    estimated_degradation: number
  } | null
}

interface Props {
  selectedDriver: string
  insight: DriverInsight | null
  onDriverChange: (driver: string) => void
}

export default function InsightsPanel({ selectedDriver, insight, onDriverChange }: Props) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Insights</h3>
        <input
          value={selectedDriver}
          onChange={(event) => onDriverChange(event.target.value.toUpperCase())}
          className="w-20 px-2 py-1 bg-gray-700 rounded"
          maxLength={3}
        />
      </div>
      {!insight?.telemetry && <p className="text-gray-400">No telemetry for selected driver.</p>}
      {insight?.telemetry && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Speed: {Math.round(insight.telemetry.speed)} km/h</div>
          <div>Gear: {insight.telemetry.gear}</div>
          <div>Throttle: {Math.round(insight.telemetry.throttle)}%</div>
          <div>Brake: {Math.round(insight.telemetry.brake)}%</div>
          <div>DRS: {insight.telemetry.drs >= 10 ? 'OPEN' : 'CLOSED'}</div>
          <div>Tyre Life: {Math.round(insight.telemetry.tyre_life)}</div>
          <div className="col-span-2">Estimated Degradation: {insight.telemetry.estimated_degradation}%</div>
        </div>
      )}
    </div>
  )
}
