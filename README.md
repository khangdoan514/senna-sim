<div align="center">
  <img src="logo.jpg" alt="TrackSense logo" width="500" />
</div>


**TrackSense** is a Formula 1 race intelligence platform built for fans, analysts, and developers who want more than static race summaries. It turns raw session data into an interactive analysis workspace where users can load real events, inspect telemetry behavior, control replay flow in real time, and explore predictive outcomes for upcoming scenarios. By combining data processing, simulation controls, and visual exploration in one system, TrackSense helps users move from simply viewing race results to actively understanding how pace, consistency, and race context shape performance.

## **Why This Project Is Different**

Most race dashboards show static charts after the event. TrackSense focuses on live interaction with session state and adds an explicit AI layer built around three complementary methods: statistical modeling, supervised learning, and simulation forecasting. The backend manages replay state, telemetry frames, and insight generation, while the frontend presents this through a control room style interface built for exploration.

The statistical modeling layer is designed around a custom ELO system that updates driver and constructor ratings after each result, teammate comparison, and reliability signal. These evolving ratings become a dynamic performance baseline that can feed prediction pipelines.

The supervised learning layer predicts race outcomes such as win probability, podium likelihood, and points finishes. It is designed to use features from qualifying performance, circuit history, weather conditions, and tire strategy, with ensemble methods such as XGBoost and other tree models from Scikit learn.

The simulation forecasting layer supports interactive what if analysis. Users can change race context variables such as weather shifts, safety car periods, and pit timing, then inspect how forecasted outcomes move under each scenario.

## **Feature Profile**

### **1) Session Operations**

- Load race, qualifying, or sprint sessions from FastF1 data
- Query available rounds by season
- Pull reference lap profiles for normalized lap study
- Track session metadata such as event, frame count, and duration

### **2) Replay Engine**

- Frame stream support for animated race playback
- Stateful playback controls: play, pause, restart, seek, and speed adjustment
- Shared replay state that can be consumed by API calls and WebSocket clients

### **3) Telemetry and Insight Layer**

- Per frame driver position and movement extraction
- Driver insight endpoint for focused driver context
- Track insight endpoint for field level position mapping
- Qualifying summary and segment level retrieval by driver code

### **4) Weather and Circuit Context**

- Circuit catalog endpoint used for selector workflows
- Live weather pull by circuit reference
- Circuit location mapping used by simulation and preview flows

### **5) AI and Prediction Framework**

- Statistical modeling with a custom ELO rating system for drivers and constructors
- Dynamic updates based on race results, teammate comparisons, and reliability factors
- ELO ratings used as evolving performance signals for prediction tasks

### **6) Supervised Learning Pipeline**

- Outcome prediction targets include win probability, podium probability, and points finish probability
- Feature space includes qualifying form, historical circuit performance, weather context, and tire strategy
- Model family includes XGBoost and tree based methods from Scikit learn
- Training design uses historical race data from early Formula 1 seasons to current seasons
### **7) Scenario Simulation and Forecasting**

- Interactive what if workflows for race condition changes
- Inputs include weather changes, safety car deployment, and pit stop timing choices
- Simulation output shows projected movement in race outcomes under alternate scenarios

### **8) Frontend Experience**

- Dedicated pages for simulation, telemetry, ELO, performance, drivers, constructors, circuits, and about
- Shared service layer for API calls and WebSocket communication
- Rich simulation interface with session selection, track rendering, and control actions

## **Technology Stack**

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** FastAPI, Uvicorn, Pydantic
- **Data and ML:** FastF1, Pandas, NumPy, SciPy, scikit learn, XGBoost, joblib
- **Streaming:** Native WebSocket support

## **Architecture Map**

```bash
tracksense/
├── backend/
│   ├── main.py             # FastAPI app startup and model loading
│   ├── requirements.txt    # Python dependencies
│   ├── app/
│   │   ├── api/            # Route modules for simulation, qualifying, insights, websocket
│   │   ├── services/       # Replay, telemetry, stream, and insight logic
│   │   └── models/         # Request and response schemas
│   ├── data/               # Cached race session data
│   └── model/              # Serialized ML artifacts
│
└── frontend/
    ├── package.json        # Frontend scripts and dependencies
    └── src/
        ├── pages/          # Feature pages and route screens
        ├── components/     # Shared user interface components
        ├── services/       # API and websocket client layer
        └── f1Replay/       # Replay modules and simulation UI
```

## **Local Development Setup**

### **Prerequisites**

- Python 3.12+
- Node.js 18+ (Node.js 20 LTS recommended)
- npm 9+

### **Run Backend**

```bash
cd backend
python -m venv .venv
```

Activate environment:

- **Windows PowerShell:** `.venv\Scripts\Activate.ps1`
- **macOS or Linux:** `source .venv/bin/activate`

Install dependencies and start API:

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Docs:

- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`

### **Run Frontend**

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8000
```

Start frontend:

```bash
npm run dev
```

Frontend URL: `http://localhost:5173`

## **API Reference**

| Domain | Method | Endpoint | Purpose |
|--------|--------|----------|---------|
| Core | `GET` | `/` | Health check and service metadata |
| Core | `GET` | `/api/hello` | Basic API reachability check |
| Simulation | `POST` | `/api/simulation/load-session` | Load selected season, round, and session into replay state |
| Simulation | `GET` | `/api/simulation/current-frame` | Retrieve current replay frame payload |
| Simulation | `POST` | `/api/simulation/control/play` | Start playback |
| Simulation | `POST` | `/api/simulation/control/pause` | Pause playback |
| Simulation | `POST` | `/api/simulation/control/restart` | Restart playback from beginning |
| Simulation | `POST` | `/api/simulation/control/seek` | Jump to a target frame index |
| Simulation | `POST` | `/api/simulation/control/speed` | Update playback speed |
| Simulation | `GET` | `/api/simulation/ref-lap-profile` | Return normalized reference lap profile |
| Simulation | `GET` | `/api/simulation/sessions/{year}` | List season rounds and events |
| Prediction | `GET` | `/api/predict/lap1` | Predict lap 1 times for all drivers with model comparison output |
| Prediction | `GET` | `/api/predict/lap` | Predict a selected lap time for all drivers |
| Prediction | `GET` | `/api/predict/race` | Predict full race lap progression and projected finish order |
| Qualifying | `GET` | `/api/qualifying/summary` | Retrieve qualifying summary for loaded session |
| Qualifying | `GET` | `/api/qualifying/driver/{driver_code}/{segment}` | Retrieve telemetry segment data for a driver |
| Insights | `GET` | `/api/insights/driver` | Build live driver insight from current frame |
| Insights | `GET` | `/api/insights/track` | Build live track position insight from current frame |
| Circuit and weather | `GET` | `/api/circuits` | List available circuit references and metadata |
| Circuit and weather | `GET` | `/api/weather/{circuit_ref}` | Fetch live weather for a circuit location |
| Stream | `WS` | `/ws/replay` | Push replay frames over WebSocket for live clients |

## **Operational Notes**

- Model artifacts under `backend/model/` are required for startup.
- First session load can take longer because source data may need to be fetched and cached.
- Some frontend views currently use mock values and can be connected to backend endpoints as APIs expand.

## **Quality and Roadmap**

- Expand backend coverage for all analytics pages
- Add persistence strategy for simulation output storage
- Improve automated tests for API behavior and UI flows
- Add continuous integration checks for linting, typing, and smoke validation