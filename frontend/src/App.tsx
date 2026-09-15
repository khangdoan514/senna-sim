/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APP ROOT — src/App.tsx
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This is the top-level component. It sets up three things:
 *
 *  1. CustomCursor  — the red/black gaming arrow that replaces the browser
 *                     cursor site-wide. Rendered outside the router so it's
 *                     always on top of everything (z-index 99999).
 *
 *  2. ClickSpark    — red sparks on every click, anywhere on the page.
 *                     Wraps the entire BrowserRouter so it covers all pages.
 *
 *  3. BrowserRouter — React Router. Contains the Sidebar and all page routes.
 *
 * ─── ADDING A NEW PAGE ──────────────────────────────────────────────────────
 *  1. Create src/pages/YourPage.tsx
 *  2. Import it here: import YourPage from './pages/YourPage'
 *  3. Add a route:    <Route path="/your-path" element={<YourPage />} />
 *  4. Add a nav link in src/components/Sidebar.tsx (NAV array at the top)
 *
 * ─── REMOVING CLICK SPARKS ──────────────────────────────────────────────────
 *  Wrap <BrowserRouter> directly without <ClickSpark>.
 *  Or add ClickSpark only to specific elements in individual pages.
 *
 * ─── REMOVING CUSTOM CURSOR ─────────────────────────────────────────────────
 *  Delete <CustomCursor /> below AND remove `cursor: none` from index.css.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CustomCursor  from './components/CustomCursor'
import ClickSpark    from './components/ClickSpark'
import Sidebar       from './components/Sidebar'

import Home          from './pages/Home'
import Simulation    from './pages/Simulation'
import ELO           from './pages/ELO'
import Performance   from './pages/Performance'
import Telemetry     from './pages/Telemetry'
import Drivers       from './pages/Drivers'
import Constructors  from './pages/Constructors'
import Circuits      from './pages/Circuits'
import About         from './pages/About'
import Formulytics        from './pages/Formulytics'

export default function App() {
  return (
    <BrowserRouter>
      <ClickSpark sparkColor="#e10600" sparkCount={8} sparkSize={22}>

        {/* Diamond cursor + motion trail + click explosion */}
        <CustomCursor />

        {/* Fixed left navigation */}
        <Sidebar />

        {/* Page content */}
        <Routes>
          <Route path="/"             element={<Home />}         />
          <Route path="/simulation"   element={<Simulation />}   />
          <Route path="/elo"          element={<ELO />}          />
          <Route path="/performance"  element={<Performance />}  />
          <Route path="/telemetry"    element={<Telemetry />}    />
          <Route path="/formulytics"  element={<Formulytics />}  />
          <Route path="/drivers"      element={<Drivers />}      />
          <Route path="/constructors" element={<Constructors />} />
          <Route path="/circuits"     element={<Circuits />}     />
          <Route path="/about"        element={<About />}        />
        </Routes>

      </ClickSpark>
    </BrowserRouter>
  )
}

