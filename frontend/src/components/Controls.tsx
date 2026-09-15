import { Play, Pause, RotateCcw, Rewind, FastForward } from 'lucide-react'
import { REPLAY_CHROME } from './layout'

interface ControlsProps {
  isPlaying: boolean
  playbackSpeed: number
  currentFrame: number
  totalFrames: number
  onPlay: () => void
  onPause: () => void
  onRestart: () => void
  onSpeedChange: (speed: number) => void
  onSeek: (frame: number) => void
  playbackDisabled?: boolean
}

export default function Controls({
  isPlaying,
  playbackSpeed,
  currentFrame,
  totalFrames,
  onPlay,
  onPause,
  onRestart,
  onSpeedChange,
  onSeek,
  playbackDisabled = false,
}: ControlsProps) {
  const speeds = [0.25, 0.5, 1, 2, 4, 8]

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const frame = Math.floor(percentage * totalFrames)
    onSeek(frame)
  }

  const progress = totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0

  return (
    <div className={`${REPLAY_CHROME} p-6`}>
      {playbackDisabled && (
        <p className="mb-3 font-['Alumni_Sans'] text-[13px] text-[#9FA0C3]">
          Playback controls are disabled for this offline predictive preview.
        </p>
      )}
      {/* Progress Bar */}
      <div className="mb-4">
        <div
          className={`h-2 rounded-full bg-[#0d0f10] ring-1 ring-[rgba(124,152,158,0.12)] transition-colors ${playbackDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-[#121518]'}`}
          onClick={playbackDisabled ? undefined : handleProgressClick}
          role={playbackDisabled ? undefined : 'slider'}
        >
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{ width: `${progress}%`, background: '#D82B0D' }}
          />
        </div>
        <div className="mt-2 flex justify-between font-mono text-xs text-[#9FA0C3]">
          <span>Frame: {currentFrame}</span>
          <span>Total: {totalFrames}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Restart */}
        <button
          type="button"
          onClick={onRestart}
          disabled={playbackDisabled}
          className="rounded-full border border-[rgba(124,152,158,0.15)] bg-[#161a1d] p-3 text-[#E8E8EF] transition-colors hover:bg-[#1c2124] disabled:cursor-not-allowed disabled:opacity-40"
          title="Restart"
        >
          <RotateCcw size={20} />
        </button>

        {/* Rewind */}
        <button
          type="button"
          onClick={() => onSeek(Math.max(0, currentFrame - 100))}
          disabled={playbackDisabled}
          className="rounded-full border border-[rgba(124,152,158,0.15)] bg-[#161a1d] p-3 text-[#E8E8EF] transition-colors hover:bg-[#1c2124] disabled:cursor-not-allowed disabled:opacity-40"
          title="Rewind 100 frames"
        >
          <Rewind size={20} />
        </button>

        {/* Play/Pause */}
        <button
          type="button"
          onClick={isPlaying ? onPause : onPlay}
          disabled={playbackDisabled}
          className="rounded-full p-4 text-white shadow-lg transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: '#D82B0D' }}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </button>

        {/* Fast Forward */}
        <button
          type="button"
          onClick={() => onSeek(Math.min(Math.max(0, totalFrames - 1), currentFrame + 100))}
          disabled={playbackDisabled}
          className="rounded-full border border-[rgba(124,152,158,0.15)] bg-[#161a1d] p-3 text-[#E8E8EF] transition-colors hover:bg-[#1c2124] disabled:cursor-not-allowed disabled:opacity-40"
          title="Fast forward 100 frames"
        >
          <FastForward size={20} />
        </button>

        {/* Speed Control */}
        <div className="ml-0 flex items-center gap-2 sm:ml-4">
          <span className="font-['Alumni_Sans'] text-sm text-[#9FA0C3]">Speed:</span>
          <div className="flex flex-wrap gap-1">
            {speeds.map((speed) => (
              <button
                type="button"
                key={speed}
                onClick={() => onSpeedChange(speed)}
                disabled={playbackDisabled}
                className={`rounded-lg px-3 py-1 font-mono text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  playbackSpeed === speed
                    ? 'border border-[rgba(216,43,13,0.4)] text-white'
                    : 'border border-transparent bg-[#161a1d] text-[#9FA0C3] hover:bg-[#1c2124] hover:text-[#E8E8EF]'
                }`}
                style={playbackSpeed === speed ? { background: '#D82B0D' } : undefined}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}