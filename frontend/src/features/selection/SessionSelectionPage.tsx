import SessionSelector from '../../components/SessionSelector'

interface Props {
  onLoadSession: (year: number, round: number, sessionType: string) => Promise<void>
}

export default function SessionSelectionPage({ onLoadSession }: Props) {
  return <SessionSelector onLoadSession={onLoadSession} />
}
