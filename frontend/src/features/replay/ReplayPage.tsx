import Controls from '../../components/Controls'
import Leaderboard from '../../components/Leaderboard'
import RaceTrack from '../../components/RaceTrack'
import TrackAmbientBar from '../../components/TrackAmbientBar'
import { REPLAY_CHROME } from '../../components/layout'
import type { SessionInfo, TelemetryFrame, TrackBoundaries } from '../../types/telemetry'

interface Props {
  currentFrame: TelemetryFrame | null
  sessionInfo: SessionInfo | null
  trackBoundaries?: TrackBoundaries
  initialGridMode?: boolean
  isPlaying: boolean
  playbackSpeed: number
  frameIndex: number
  totalFrames: number
  onPlay: () => void
  onPause: () => void
  onRestart: () => void
  onSpeedChange: (speed: number) => void
  onSeek: (frame: number) => void
  playbackDisabled?: boolean
}

export default function ReplayPage(props: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
      <div className="min-w-0 lg:col-span-8">
        <TrackAmbientBar frame={props.currentFrame} />
        <div className={`${REPLAY_CHROME} p-3 sm:p-4`}>
          <RaceTrack
            frameData={props.currentFrame}
            sessionInfo={props.sessionInfo}
            trackBoundaries={props.trackBoundaries}
          />
        </div>
        <div className="mt-6">
          <Controls
            isPlaying={props.isPlaying}
            playbackSpeed={props.playbackSpeed}
            currentFrame={props.frameIndex}
            totalFrames={props.totalFrames}
            onPlay={props.onPlay}
            onPause={props.onPause}
            onRestart={props.onRestart}
            onSpeedChange={props.onSpeedChange}
            onSeek={props.onSeek}
            playbackDisabled={props.playbackDisabled}
          />
        </div>
      </div>
      <div className="min-w-0 lg:col-span-4">
        <Leaderboard
          frameData={props.currentFrame}
          sessionInfo={props.sessionInfo}
          initialGridMode={props.initialGridMode ?? false}
        />
      </div>
    </div>
  )
}
