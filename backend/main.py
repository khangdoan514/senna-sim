import os 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.api.insights import router as insights_router
from app.api.qualifying import router as qualifying_router
from app.api.replay import router as replay_router
from app.api.session import router as session_router
from app.api.ws import router as ws_router
import xgboost as xgb
import joblib
import pandas as pd
import numpy as np

app = FastAPI(title="F1 Simulation", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173/",
        "http://127.0.0.1:5173/",
    ],
    allow_credentials=True,
    allow_methods=[""],
    allow_headers=[""],
)

app.include_router(session_router)
app.include_router(replay_router)
app.include_router(qualifying_router)
app.include_router(insights_router)
app.include_router(ws_router)

@app.get("/")
async def root():
    return {"status": "ok", "service": "F1 Simulation API"}

@app.get("/api/hello")
async def hello():
    return {"message": "TrackSense API"}

if __name__ == "__main__":
    use_reload = os.environ.get("F1_API_RELOAD", "").strip().lower() in ("1", "true", "yes")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=use_reload,
        log_level="info",
    )

# ══════════════════════════════════════════════════════
# LOAD MODELS AT STARTUP
# ══════════════════════════════════════════════════════

anirudh_model = xgb.XGBRegressor()
anirudh_model.load_model("model/anirudh_laptime_xgbv2.json")
anirudh_config = joblib.load("model/anirudh_inference_config.pkl")

david_model = xgb.XGBRegressor()
david_model.load_model("model/david_lap1_model.json")
david_enc    = joblib.load("model/david_enc_l1.pkl")
david_config = joblib.load("model/david_inference_config.pkl")

# ── Anirudh config ────────────────────────────────────────────────────────────
A_FEATURE_COLS = anirudh_config['feature_cols']
A_LAG_MEDIANS  = anirudh_config['lag_medians']
A_COMPOUND_MAP = anirudh_config['compound_map']
A_ENCODERS     = anirudh_config['encoders']
A_WX_MEDIANS   = anirudh_config['weather_medians']

# ── David config ──────────────────────────────────────────────────────────────
D_LAP1_FEATURES = david_config['LAP1_FEATURES']
D_ALT_LOOKUP    = david_config['alt_lookup']
D_RXN_MEDIAN    = david_config['reaction_time_median']
D_CON_MEDIAN    = david_config['constructor_avg_median']
D_WX_MEDIANS    = david_config['weather_medians']

# ══════════════════════════════════════════════════════
# 2026 DRIVER GRID
# ══════════════════════════════════════════════════════

DRIVERS_2026 = [
    {"driver_ref": "antonelli",      "constructor_ref": "mercedes",     "constructor_id": "mercedes",     "grid": 1,  "quali": 1},
    {"driver_ref": "hamilton",       "constructor_ref": "ferrari",      "constructor_id": "ferrari",      "grid": 2,  "quali": 2},
    {"driver_ref": "russell",        "constructor_ref": "mercedes",     "constructor_id": "mercedes",     "grid": 3,  "quali": 3},
    {"driver_ref": "leclerc",        "constructor_ref": "ferrari",      "constructor_id": "ferrari",      "grid": 4,  "quali": 4},
    {"driver_ref": "norris",         "constructor_ref": "mclaren",      "constructor_id": "mclaren",      "grid": 5,  "quali": 5},
    {"driver_ref": "piastri",        "constructor_ref": "mclaren",      "constructor_id": "mclaren",      "grid": 6,  "quali": 6},
    {"driver_ref": "max_verstappen", "constructor_ref": "red_bull",     "constructor_id": "red_bull",     "grid": 7,  "quali": 7},
    {"driver_ref": "gasly",          "constructor_ref": "alpine",       "constructor_id": "alpine",       "grid": 8,  "quali": 8},
    {"driver_ref": "hadjar",         "constructor_ref": "red_bull",     "constructor_id": "red_bull",     "grid": 9,  "quali": 9},
    {"driver_ref": "lawson",         "constructor_ref": "rb",           "constructor_id": "rb",           "grid": 10, "quali": 10},
    {"driver_ref": "bearman",        "constructor_ref": "haas",         "constructor_id": "haas",         "grid": 11, "quali": 11},
    {"driver_ref": "colapinto",      "constructor_ref": "alpine",       "constructor_id": "alpine",       "grid": 12, "quali": 12},
    {"driver_ref": "lindblad",       "constructor_ref": "rb",           "constructor_id": "rb",           "grid": 13, "quali": 13},
    {"driver_ref": "sainz",          "constructor_ref": "williams",     "constructor_id": "williams",     "grid": 14, "quali": 14},
    {"driver_ref": "albon",          "constructor_ref": "williams",     "constructor_id": "williams",     "grid": 15, "quali": 15},
    {"driver_ref": "ocon",           "constructor_ref": "haas",         "constructor_id": "haas",         "grid": 16, "quali": 16},
    {"driver_ref": "bortoleto",      "constructor_ref": "audi",         "constructor_id": "audi",         "grid": 17, "quali": 17},
    {"driver_ref": "alonso",         "constructor_ref": "aston_martin", "constructor_id": "aston_martin", "grid": 18, "quali": 18},
    {"driver_ref": "hulkenberg",     "constructor_ref": "audi",         "constructor_id": "audi",         "grid": 19, "quali": 19},
    {"driver_ref": "bottas",         "constructor_ref": "cadillac",     "constructor_id": "cadillac",     "grid": 20, "quali": 20},
    {"driver_ref": "perez",          "constructor_ref": "cadillac",     "constructor_id": "cadillac",     "grid": 21, "quali": 21},
    {"driver_ref": "stroll",         "constructor_ref": "aston_martin", "constructor_id": "aston_martin", "grid": 22, "quali": 22},
]

# Circuit → lat/lng for weather API
CIRCUIT_LOCATIONS = {
    "bahrain":        {"lat": 26.0325, "lng": 50.5106,  "name": "Bahrain",         "total_laps": 57},
    "jeddah":         {"lat": 21.6319, "lng": 39.1044,  "name": "Saudi Arabia",    "total_laps": 50},
    "albert_park":    {"lat": -37.8497,"lng": 144.9680, "name": "Australia",       "total_laps": 58},
    "suzuka":         {"lat": 34.8431, "lng": 136.5407, "name": "Japan",           "total_laps": 53},
    "shanghai":       {"lat": 31.3389, "lng": 121.2197, "name": "China",           "total_laps": 56},
    "miami":          {"lat": 25.9581, "lng": -80.2389, "name": "Miami",           "total_laps": 57},
    "imola":          {"lat": 44.3439, "lng": 11.7167,  "name": "Emilia Romagna",  "total_laps": 63},
    "monaco":         {"lat": 43.7347, "lng": 7.4206,   "name": "Monaco",          "total_laps": 78},
    "villeneuve":     {"lat": 45.5000, "lng": -73.5228, "name": "Canada",          "total_laps": 70},
    "catalunya":      {"lat": 41.5700, "lng": 2.2611,   "name": "Spain",           "total_laps": 66},
    "red_bull_ring":  {"lat": 47.2197, "lng": 14.7647,  "name": "Austria",         "total_laps": 71},
    "silverstone":    {"lat": 52.0786, "lng": -1.0169,  "name": "Great Britain",   "total_laps": 52},
    "hungaroring":    {"lat": 47.5789, "lng": 19.2486,  "name": "Hungary",         "total_laps": 70},
    "spa":            {"lat": 50.4372, "lng": 5.9714,   "name": "Belgium",         "total_laps": 44},
    "zandvoort":      {"lat": 52.3888, "lng": 4.5409,   "name": "Netherlands",     "total_laps": 72},
    "monza":          {"lat": 45.6156, "lng": 9.2811,   "name": "Italy",           "total_laps": 53},
    "baku":           {"lat": 40.3725, "lng": 49.8533,  "name": "Azerbaijan",      "total_laps": 51},
    "marina_bay":     {"lat": 1.2914,  "lng": 103.8640, "name": "Singapore",       "total_laps": 62},
    "americas":       {"lat": 30.1328, "lng": -97.6411, "name": "USA",             "total_laps": 56},
    "rodriguez":      {"lat": 19.4042, "lng": -99.0907, "name": "Mexico",          "total_laps": 71},
    "interlagos":     {"lat": -23.7036,"lng": -46.6997, "name": "Brazil",          "total_laps": 71},
    "vegas":          {"lat": 36.1699, "lng": -115.1398,"name": "Las Vegas",       "total_laps": 50},
    "losail":         {"lat": 25.4900, "lng": 51.4536,  "name": "Qatar",           "total_laps": 57},
    "yas_marina":     {"lat": 24.4672, "lng": 54.6031,  "name": "Abu Dhabi",       "total_laps": 58},
}

# ══════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════

def fmt_ms(ms: float) -> str:
    s = ms / 1000
    return f"{int(s // 60)}:{s % 60:06.3f}"

def build_anirudh_row(
    d: dict, circuit_ref: str, compound: str,
    air_temp: float, track_temp: float,
    humidity: float, wind_speed: float,
    lap: int = 1, tyre_life: int = 1,
    prev_lap_time: float = None,
    prev2_lap_time: float = None,
    prev3_lap_time: float = None,
    best_lap_so_far: float = None,
) -> dict:
    at = air_temp   if air_temp   is not None else A_WX_MEDIANS['air_temp']
    tt = track_temp if track_temp is not None else A_WX_MEDIANS['track_temp']

    # Start from training medians then override with real values
    lags = dict(A_LAG_MEDIANS)
    if prev_lap_time is not None:
        lags['prev_lap_time']    = prev_lap_time
        lags['rolling3_avg_lap'] = prev_lap_time
        lags['best_lap_so_far']  = best_lap_so_far if best_lap_so_far else prev_lap_time
        lags['gap_to_best_lap']  = prev_lap_time - (best_lap_so_far if best_lap_so_far else prev_lap_time)
        lags['lap_time_delta']   = 0
    if prev2_lap_time is not None:
        lags['prev2_lap_time']   = prev2_lap_time
        lags['rolling3_avg_lap'] = (
            (prev_lap_time or 0) + prev2_lap_time + (prev3_lap_time or prev2_lap_time)
        ) / 3
    if prev3_lap_time is not None:
        lags['prev3_lap_time']   = prev3_lap_time

    row = {
        'circuit_ref_enc':     A_ENCODERS['circuit_ref'].get(circuit_ref, 0),
        'driver_ref_enc':      A_ENCODERS['driver_ref'].get(d['driver_ref'], 0),
        'constructor_id_enc':  A_ENCODERS['constructor_id'].get(d['constructor_id'], 0),
        'lap':                 lap,
        'tyre_life':           tyre_life,
        'tyre_life_squared':   tyre_life ** 2,
        'compound':            A_COMPOUND_MAP.get(compound.upper(), 0),
        'grid':                d['grid'],
        'qualifying_position': d['quali'],
        'is_lap1':             1 if lap == 1 else 0,
        'is_pit_lap':          0,
        'is_outlap':           0,
        'is_inlap':            0,
        'air_temp':            at,
        'track_temp':          tt,
        'humidity':            humidity   if humidity   is not None else A_WX_MEDIANS['humidity'],
        'wind_speed':          wind_speed if wind_speed is not None else A_WX_MEDIANS['wind_speed'],
        'track_air_delta':     tt - at,
        'has_tyre_data':       1,
        'has_air_temp':        1,
        'has_track_temp':      1,
        'has_humidity':        1,
        'has_wind_speed':      1,
        'circuit_id':          A_ENCODERS['circuit_ref'].get(circuit_ref, 0),
        'round':               1,
        **lags,
    }
    return {col: row.get(col, 0) for col in A_FEATURE_COLS}


def build_david_row(
    d: dict, circuit_ref: str, compound: str,
    air_temp: float, track_temp: float,
    humidity: float, wind_speed: float,
) -> dict:
    return {
        'driver_ref':               d['driver_ref'],
        'constructor_ref':          d['constructor_ref'],
        'circuit_ref':              circuit_ref,
        'compound':                 compound.upper(),
        'air_temp':                 air_temp   if air_temp   is not None else D_WX_MEDIANS['air_temp'],
        'track_temp':               track_temp if track_temp is not None else D_WX_MEDIANS['track_temp'],
        'humidity':                 humidity   if humidity   is not None else D_WX_MEDIANS['humidity'],
        'wind_speed':               wind_speed if wind_speed is not None else D_WX_MEDIANS['wind_speed'],
        'alt':                      D_ALT_LOOKUP.get(circuit_ref, 0.0),
        'grid':                     d['grid'],
        'qualifying_position':      d['quali'],
        'reaction_time_ms':         D_RXN_MEDIAN,
        'constructor_avg_lap_time': D_CON_MEDIAN,
    }


# ══════════════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════════════


@app.get("/api/circuits")
def get_circuits():
    """Return all available circuits for frontend dropdowns."""
    return [
        {"circuit_ref": ref, "name": info["name"], "total_laps": info["total_laps"]}
        for ref, info in CIRCUIT_LOCATIONS.items()
    ]


@app.get("/api/weather/{circuit_ref}")
async def get_weather(circuit_ref: str):
    """
    Fetch live weather for a circuit location.
    Uses Open-Meteo (free, no API key needed).
    """
    import httpx
    loc = CIRCUIT_LOCATIONS.get(circuit_ref)
    if not loc:
        return {"error": "Unknown circuit"}

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude":              loc["lat"],
                    "longitude":             loc["lng"],
                    "current":               "temperature_2m,relative_humidity_2m,wind_speed_10m",
                    "wind_speed_unit":       "ms",
                    "forecast_days":         1,
                },
                timeout=8,
            )
            data = r.json()
        current    = data["current"]
        air_temp   = current["temperature_2m"]
        humidity   = current["relative_humidity_2m"]
        wind_speed = current["wind_speed_10m"]
        track_temp = round(air_temp + 10, 1)  # estimated proxy

        return {
            "circuit_ref": circuit_ref,
            "air_temp":    air_temp,
            "track_temp":  track_temp,
            "humidity":    humidity,
            "wind_speed":  wind_speed,
            "source":      "open-meteo.com",
        }
    except Exception as e:
        # Fallback to training medians if weather fetch fails
        return {
            "circuit_ref": circuit_ref,
            "air_temp":    A_WX_MEDIANS["air_temp"],
            "track_temp":  A_WX_MEDIANS["track_temp"],
            "humidity":    A_WX_MEDIANS["humidity"],
            "wind_speed":  A_WX_MEDIANS["wind_speed"],
            "source":      "fallback",
        }


@app.get("/api/predict/lap1")
def predict_lap1(
    circuit_ref: str,
    compound:    str   = "SOFT",
    air_temp:    float = None,
    track_temp:  float = None,
    humidity:    float = None,
    wind_speed:  float = None,
):
    """
    Predict lap 1 times for all drivers.
    David's model is the primary prediction (trained specifically on lap 1).
    Anirudh's model is shown alongside for comparison.
    """
    results = []
    for d in DRIVERS_2026:
        # ── David — lap 1 specialist ──
        d_row  = build_david_row(d, circuit_ref, compound, air_temp, track_temp, humidity, wind_speed)
        d_df   = pd.DataFrame([d_row])
        d_df   = d_df[D_LAP1_FEATURES]  # ← enforce exact column order
        d_enc_ = david_enc.transform(d_df)
        d_pred = float(david_model.predict(d_enc_)[0])

        # ── Anirudh — general model on lap 1 ──
        a_row  = build_anirudh_row(d, circuit_ref, compound, air_temp, track_temp, humidity, wind_speed, lap=1)
        a_df   = pd.DataFrame([a_row])
        a_pred = float(anirudh_model.predict(a_df)[0])

        avg_pred = (a_pred + d_pred) / 2

        results.append({
            "driver":      d['driver_ref'],
            "constructor": d['constructor_ref'],
            "grid":        d['grid'],
            "david_ms":    round(d_pred),
            "david_fmt":   fmt_ms(d_pred),
            "anirudh_ms":  round(a_pred),
            "anirudh_fmt": fmt_ms(a_pred),
            "avg_ms":      round(avg_pred),
            "avg_fmt":     fmt_ms(avg_pred),
        })

    results.sort(key=lambda x: x['avg_ms'])
    for i, r in enumerate(results):
        r['predicted_rank'] = i + 1

    return results


@app.get("/api/predict/lap")
def predict_single_lap(
    circuit_ref: str,
    lap:         int,
    compound:    str   = "SOFT",
    air_temp:    float = None,
    track_temp:  float = None,
    humidity:    float = None,
    wind_speed:  float = None,
):
    """
    Predict a specific lap time for all drivers.
    Lap 1 → uses David's model.
    Lap 2+ → uses Anirudh's model with tyre_life = lap number.
    """
    results = []
    for d in DRIVERS_2026:
        if lap == 1:
            d_row  = build_david_row(d, circuit_ref, compound, air_temp, track_temp, humidity, wind_speed)
            d_df   = pd.DataFrame([d_row])[D_LAP1_FEATURES]
            d_enc_ = david_enc.transform(d_df)
            pred   = float(david_model.predict(d_enc_)[0])
        else:
            a_row = build_anirudh_row(
                d, circuit_ref, compound,
                air_temp, track_temp, humidity, wind_speed,
                lap=lap, tyre_life=lap,
            )
            a_df = pd.DataFrame([a_row])
            pred = float(anirudh_model.predict(a_df)[0])

        results.append({
            "driver":        d['driver_ref'],
            "constructor":   d['constructor_ref'],
            "grid":          d['grid'],
            "lap":           lap,
            "predicted_ms":  round(pred),
            "predicted_fmt": fmt_ms(pred),
        })

    results.sort(key=lambda x: x['predicted_ms'])
    for i, r in enumerate(results):
        r['predicted_rank'] = i + 1

    return results


@app.get("/api/predict/race")
def predict_race(
    circuit_ref: str,
    total_laps:  int   = None,
    compound:    str   = "SOFT",
    air_temp:    float = None,
    track_temp:  float = None,
    humidity:    float = None,
    wind_speed:  float = None,
):
    """
    Predict full race lap-by-lap for all drivers.
    Lap 1  → David's model.
    Lap 2+ → Anirudh's model, autoregressive (each lap feeds the next).
    """
    # Use circuit's known lap count if not provided
    laps = total_laps or CIRCUIT_LOCATIONS.get(circuit_ref, {}).get("total_laps", 50)

    all_results = []
    for d in DRIVERS_2026:
        lap_times      = []
        prev_lap_time  = None
        prev2_lap_time = None
        prev3_lap_time = None
        best_lap       = None

        # ── Lap 1: David ──
        d_row   = build_david_row(d, circuit_ref, compound, air_temp, track_temp, humidity, wind_speed)
        d_df    = pd.DataFrame([d_row])[D_LAP1_FEATURES]
        d_enc_  = david_enc.transform(d_df)
        lap1_ms = float(david_model.predict(d_enc_)[0])
        lap_times.append({"lap": 1, "predicted_ms": round(lap1_ms), "predicted_fmt": fmt_ms(lap1_ms), "model": "david"})

        prev3_lap_time = None
        prev2_lap_time = None
        prev_lap_time  = lap1_ms
        best_lap       = lap1_ms

        # ── Laps 2-N: Anirudh ──
        for lap in range(2, laps + 1):
            a_row = build_anirudh_row(
                d, circuit_ref, compound,
                air_temp, track_temp, humidity, wind_speed,
                lap=lap,
                tyre_life=lap,
                prev_lap_time=prev_lap_time,
                prev2_lap_time=prev2_lap_time,
                prev3_lap_time=prev3_lap_time,
                best_lap_so_far=best_lap,
            )
            a_df   = pd.DataFrame([a_row])
            lap_ms = float(anirudh_model.predict(a_df)[0])
            lap_times.append({"lap": lap, "predicted_ms": round(lap_ms), "predicted_fmt": fmt_ms(lap_ms), "model": "anirudh"})

            # Roll lags forward
            prev3_lap_time = prev2_lap_time
            prev2_lap_time = prev_lap_time
            prev_lap_time  = lap_ms
            if best_lap is None or lap_ms < best_lap:
                best_lap = lap_ms

        total_ms = sum(lt['predicted_ms'] for lt in lap_times)
        all_results.append({
            "driver":      d['driver_ref'],
            "constructor": d['constructor_ref'],
            "grid":        d['grid'],
            "total_ms":    total_ms,
            "total_fmt":   fmt_ms(total_ms),
            "laps":        lap_times,
        })

    all_results.sort(key=lambda x: x['total_ms'])
    for i, r in enumerate(all_results):
        r['predicted_finish'] = i + 1

    return all_results