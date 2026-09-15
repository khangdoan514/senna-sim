import { PAGE, INNER, H1 } from '../components/layout'
import DRSSweep from '../components/DRSSweep'

export default function Telemetry() {
  return (
    <div className={PAGE}>
      <DRSSweep delay={80} />

      <div className={INNER}>
        <div className="text-right">
          <h1 className={H1}>Stats</h1>
          <p className="font-['Alumni_Sans'] text-[17px] text-[#9FA0C3]">Season statistics and telemetry data</p>
        </div>

        <div
          className="mt-8 rounded-xl p-16 flex flex-col items-center justify-center text-center"
          style={{
            background: 'linear-gradient(135deg, #0e1113 0%, rgba(124,152,158,0.04) 50%, #0e1113 100%)',
            border: '1px solid rgba(124,152,158,0.15)',
            minHeight: 400,
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(216,43,13,0.12)', border: '1px solid rgba(216,43,13,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #D82B0D', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
          </div>

          <p className="font-['Alumni_Sans'] text-[11px] tracking-[4px] uppercase text-[#D82B0D] mb-3">
            Work in Progress
          </p>
          <h2 className="font-['Zen_Dots'] text-[26px] text-white font-normal mb-3 leading-tight">
            Stats Coming Soon
          </h2>
          <p className="font-['Alumni_Sans'] text-[15px] text-[#748386] max-w-md leading-relaxed">
            Season statistics, driver telemetry breakdowns, reliability data, and ML model performance metrics are currently being integrated.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
