import fastf1
import numpy as np
import pickle
import os
import pandas as pd
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from frames import FramesMixin
from track import TrackMixin

# Main processor
class F1DataProcessor(TrackMixin, FramesMixin):
    def __init__(self, year: int, round_number: int, session_type: str = "R"):
        self.year = year
        self.round_number = round_number
        self.session_type = session_type
        self.session = None
        self.frames = []
        self.drivers = []
        self.circuit_info = {}
        self.x_ref = None
        self.y_ref = None
        self.track_corridor_width_m = 220.0
        self._track_ref_tree = None
        self._ref_arc_lengths: Optional[np.ndarray] = None
        self._ref_total_length: float = 0.0
        self.sector_splits: List[float] = []
        self.grid_positions: Dict[str, int] = {}
        self.pit_stops: Dict[str, int] = {}
        self.pit_out_times: Dict[str, List[float]] = {}
        self.fastest_lap: Optional[Dict[str, Any]] = None
        self._session_info_cache: Optional[Dict[str, Any]] = None
        
        # Official timing arrays by driver
        self.timing_stream_arrays: Dict[str, Tuple[np.ndarray, np.ndarray]] = {}
        self.race_finishers: Dict[str, bool] = {}

        # FastF1 cache directory
        cache_dir = Path(".fastf1-cache")
        cache_dir.mkdir(exist_ok=True)
        fastf1.Cache.enable_cache(str(cache_dir))

    # Load session synchronously
    def load_session(self):
        print(f"Loading session: {self.year} Round {self.round_number}")

        # Try cache first
        cache_file = self.get_cache_filename()
        if os.path.exists(cache_file):
            print("Loading from cache...")
            try:
                with open(cache_file, 'rb') as f:
                    data = pickle.load(f)                    
                    self.frames = data['frames']
                    self.drivers = data['drivers']
                    self.circuit_info = data['circuit_info']
                    tg = data.get('track_geom')
                    if tg:
                        self.x_ref = np.asarray(tg['x_ref'], dtype=float)
                        self.y_ref = np.asarray(tg['y_ref'], dtype=float)
                        self.x_inner = np.asarray(tg['x_inner'], dtype=float)
                        self.y_inner = np.asarray(tg['y_inner'], dtype=float)
                        self.x_outer = np.asarray(tg['x_outer'], dtype=float)
                        self.y_outer = np.asarray(tg['y_outer'], dtype=float)
                        self.drs_zones = tg.get('drs_zones', [])
                        self.sector_splits = tg.get('sector_splits', []) or []
                        self.track_corridor_width_m = float(tg.get('corridor_width_m', self.track_corridor_width_m))
                        self.build_track()
                    
                    self.grid_positions = data.get("grid_positions", {}) or {}
                    self.pit_stops = data.get("pit_stops", {}) or {}
                    self.pit_out_times = data.get("pit_out_times", {}) or {}
                    self.timing_stream_arrays = {}
                    self.race_finishers = {}
                    self._session_info_cache = data.get("session_info") or {}
                    self.fastest_lap = data.get("fastest_lap") or (self._session_info_cache.get("fastest_lap") if self._session_info_cache else None)
                    
                    if self.fastest_lap is None:
                        try:
                            self.session = fastf1.get_session(self.year, self.round_number, self.session_type)
                            self.session.load(telemetry=False, weather=False, messages=False)
                            self.compute_fastest_lap()
                            self._session_info_cache = self.get_session_info()
                            self.save_cache()
                        
                        except Exception as exc:
                            print(f"Could not backfill fastest lap from cache load: {exc}")
                print(f"Loaded {len(self.frames)} frames from cache")
                return
            
            except Exception as e:
                print(f"Cache error: {e}, reloading from FastF1...")

        # Load full session from FastF1
        self.session = fastf1.get_session(self.year, self.round_number, self.session_type)
        self.session.load()

        print("Processing telemetry data...")
        self.process_telemetry()

        # Write cache
        self.save_cache()

    # Fastest lap from session laps
    def compute_fastest_lap(self) -> None:
        self.fastest_lap = None
        if self.session is None:
            return
        
        try:
            laps = self.session.laps
            if laps is None or len(laps) == 0:
                return
            
            fastest = laps.pick_fastest()
            if fastest is None:
                return
            
            # FastF1 row shape varies by version
            if isinstance(fastest, pd.Series):
                row = fastest
            elif hasattr(fastest, "iloc"):
                if len(fastest) == 0:
                    return
                row = fastest.iloc[0]
            else:
                row = fastest
            
            lt = row.get("LapTime")
            if lt is None or pd.isna(lt):
                return
            
            if hasattr(lt, "total_seconds"):
                secs = float(lt.total_seconds())
            else:
                secs = float(pd.Timedelta(lt).total_seconds())
            
            drv = row.get("Driver")
            if drv is None:
                return
            
            info = self.session.get_driver(drv)
            abbrev = str(info.get("Abbreviation", drv))
            lap_n = int(row.get("LapNumber", 0) or 0)
            self.fastest_lap = {"abbrev": abbrev, "time_seconds": secs, "lap": lap_n}
       
        except Exception as exc:
            print(f"Fastest lap unavailable: {exc}")

    # Blocking FastF1 session load
    def load_session_sync(self):
        self.session = fastf1.get_session(self.year, self.round_number, self.session_type)
        self.session.load()

    # Build per driver telemetry tables
    def process_telemetry(self):
        print("Detailing per driver telemetry")

        # Sorted driver identifiers
        self.drivers = sorted(self.session.drivers)
        print(f"Found {len(self.drivers)} drivers: {self.drivers}")

        driver_colors = {}
        driver_abbrevs: Dict[str, str] = {}
        driver_teams: Dict[str, str] = {}
        for drv in self.drivers:
            try:
                info = self.session.get_driver(drv)
                driver_abbrevs[str(drv)] = str(info.get('Abbreviation', drv))
                driver_teams[str(drv)] = str(info.get('TeamName', 'Unknown'))
            
            except Exception:
                driver_abbrevs[str(drv)] = str(drv)
                driver_teams[str(drv)] = 'Unknown'

        # Concatenate laps per driver
        driver_telemetry = {}
        example_lap = None # Lap used for track outline

        for idx, driver in enumerate(self.drivers):
            print(f"Processing driver {idx+1}/{len(self.drivers)}: {driver}")

            driver_laps = self.session.laps.pick_drivers(driver)
            print(f"   Found {len(driver_laps)} laps")

            if len(driver_laps) == 0:
                print(f"   No laps found for driver {driver}, skipping")
                continue

            # First lap defines track shape
            if example_lap is None and len(driver_laps) > 0:
                example_lap = driver_laps.iloc[0]

            # Team color for rendering
            driver_info = self.session.get_driver(driver)
            team = driver_info.get('TeamName', 'Unknown')
            team_color = driver_info.get('TeamColor', 'FFFFFF')
            driver_colors[driver] = f"#{team_color}"
            print(f"   Team: {team}, Color: {driver_colors[driver]}")

            # Per lap telemetry segments
            telemetry_segments = []
            total_distance_offset = 0.0
            for lap_idx, (_, lap) in enumerate(driver_laps.iterrows()):
                if lap_idx % 10 == 0:
                    print(f"   Processing lap {lap_idx+1}/{len(driver_laps)}")
                
                try:
                    tel = lap.get_telemetry()
                    if tel is not None and len(tel) > 0:
                        if "SessionTime" not in tel.columns:
                            continue
                        
                        lap_tel = tel.copy()
                        session_seconds = lap_tel["SessionTime"].dt.total_seconds()
                        comp_raw = lap.get("Compound", "") # Tyre compound copied from lap row
                        if pd.isna(comp_raw):
                            comp_cell = ""
                        else:
                            comp_cell = str(comp_raw).strip()
                        
                        lap_tel = lap_tel.assign(
                            session_seconds=session_seconds,
                            lap_number=float(lap.get("LapNumber", 0) or 0),
                            race_distance=lap_tel.get("Distance", 0.0) + total_distance_offset,
                            Compound=comp_cell,
                        )
                        
                        telemetry_segments.append(lap_tel)
                        if "Distance" in lap_tel.columns and len(lap_tel["Distance"]) > 0:
                            total_distance_offset += float(lap_tel["Distance"].max())
                
                except Exception as e:
                    continue

            if telemetry_segments:
                combined = pd.concat(telemetry_segments, ignore_index=True)
                combined = combined.sort_values("session_seconds").drop_duplicates("session_seconds")
                driver_telemetry[driver] = combined
                print(f"   Collected {len(driver_telemetry[driver])} telemetry points for {driver}")

        # Track outline from example lap
        if example_lap is not None:
            print("Extracting track geometry...")
            result = self.extract_track_geometry(example_lap)
            if result:
                (self.x_ref, self.y_ref,
                self.x_inner, self.y_inner,
                self.x_outer, self.y_outer,
                self.drs_zones,
                self.sector_splits) = result
                print(f"   Track geometry extracted: inner={len(self.x_inner)}, outer={len(self.x_outer)} points")
                print(f"   Sample inner point: x={self.x_inner[0] if len(self.x_inner) > 0 else 'N/A'}, y={self.y_inner[0] if len(self.y_inner) > 0 else 'N/A'}")
                self.build_track()
            else:
                print("   Could not extract track geometry")
                self.sector_splits = []

        # World bounds for camera fit
        print("Calculating circuit bounds...")
        example_driver = self.drivers[0] if self.drivers else None
        if example_driver and example_driver in driver_telemetry:
            tel = driver_telemetry[example_driver]
            self.circuit_info = {
                "rotation": self.calculate_rotation(tel),
                "bounds": self.calculate_bounds(driver_telemetry)
            }

            print(f"   Circuit bounds: {self.circuit_info['bounds']}")

        self.grid_positions = self.extract_grid_positions()
        print(f"   Starting grid positions: {len(self.grid_positions)} drivers")
        self.pit_stops = self.extract_pit_stops()
        self.pit_out_times = self.extract_pit_out_times()
        print(f"   Pit stop counts extracted for {len(self.pit_stops)} drivers")
        self.race_finishers = self.extract_race_finishers()
        self.timing_stream_arrays = self.extract_timing_position_stream()

        # Raster timeline to JSON frames
        print("Generating animation frames...")
        self.generate_frames(driver_telemetry, driver_colors, driver_abbrevs, driver_teams)
        self.compute_fastest_lap()

    # Single frame by index
    def get_frame(self, frame_index: int) -> Dict:
        if 0 <= frame_index < len(self.frames):
            return self.frames[frame_index]
        return {}

    # Event fields plus fastest lap
    def get_session_info(self) -> Dict:
        info: Dict[str, Any] = {}
        if self.session:
            info = {
                "event_name": self.session.event["EventName"],
                "round": self.session.event["RoundNumber"],
                "country": self.session.event["Country"],
                "location": self.session.event["Location"],
                "date": str(self.session.event["EventDate"]),
            }
        elif getattr(self, "_session_info_cache", None):
            info = dict(self._session_info_cache)

        # Total laps(lap X/Y)
        total_laps = info.get("total_laps")
        if not isinstance(total_laps, (int, float)) or int(total_laps) <= 0:
            total_laps = None
            if self.session is not None:
                try:
                    raw_total = getattr(self.session, "total_laps", None)
                    if raw_total is not None:
                        total_laps = int(raw_total)
                except Exception:
                    total_laps = None

            # Cached sessions often don't carry session.total_laps;
            # infer from the maximum lap number seen in the final frame.
            if (total_laps is None or total_laps <= 0) and self.frames:
                try:
                    last = self.frames[-1] if self.frames else {}
                    drivers = (last or {}).get("drivers", {}) or {}
                    from_last = max(
                        (int((d or {}).get("lap") or 0) for d in drivers.values()),
                        default=0,
                    )
                    if from_last > 0:
                        total_laps = from_last
                except Exception:
                    total_laps = None

            if total_laps is not None and int(total_laps) > 0:
                info["total_laps"] = int(total_laps)
        
        fl = getattr(self, "fastest_lap", None)
        if fl is not None:
            info["fastest_lap"] = fl
        elif "fastest_lap" not in info:
            info["fastest_lap"] = None
        
        return info

    # Rotation and XY bounds
    def get_circuit_info(self) -> Dict:
        return self.circuit_info

    # Polylines for frontend canvas
    def get_track_boundaries(self):
        empty = {
            "inner": {"x": [], "y": []},
            "outer": {"x": [], "y": []},
            "center": {"x": [], "y": []},
            "corridor_width_m": 0.0,
            "drs_zones": [],
            "sector_splits": [],
            "finish_line": {"x": [], "y": []},
        }

        if hasattr(self, 'x_inner') and self.x_inner is not None and len(self.x_inner) > 0:
            cw = float(getattr(self, "track_corridor_width_m", 220.0))
            xi = self.x_inner.tolist() if hasattr(self.x_inner, 'tolist') else list(self.x_inner)
            yi = self.y_inner.tolist() if hasattr(self.y_inner, 'tolist') else list(self.y_inner)
            xo = self.x_outer.tolist() if hasattr(self.x_outer, 'tolist') else list(self.x_outer)
            yo = self.y_outer.tolist() if hasattr(self.y_outer, 'tolist') else list(self.y_outer)
            finish = {"x": [float(xi[0]), float(xo[0])], "y": [float(yi[0]), float(yo[0])]}
            return {
                "inner": {"x": xi, "y": yi},
                "outer": {"x": xo, "y": yo},
                "center": {
                    "x": self.x_ref.tolist() if hasattr(self.x_ref, 'tolist') else list(self.x_ref),
                    "y": self.y_ref.tolist() if hasattr(self.y_ref, 'tolist') else list(self.y_ref),
                },
                "corridor_width_m": cw,
                "drs_zones": getattr(self, 'drs_zones', []),
                "sector_splits": getattr(self, 'sector_splits', []) or [],
                "finish_line": finish,
            }
        
        return empty

    # Pickle path under computed_data
    def get_cache_filename(self) -> str:
        cache_dir = Path("computed_data")
        cache_dir.mkdir(exist_ok=True)
        return str(cache_dir / f"{self.year}_R{self.round_number}_{self.session_type}.pkl")

    # Persist frames and track geometry
    def save_cache(self):
        cache_file = self.get_cache_filename()
        track_geom = None
        if hasattr(self, 'x_inner') and self.x_inner is not None and len(self.x_inner) > 0:
            track_geom = {
                'x_ref': np.asarray(self.x_ref, dtype=float).tolist(),
                'y_ref': np.asarray(self.y_ref, dtype=float).tolist(),
                'x_inner': np.asarray(self.x_inner, dtype=float).tolist(),
                'y_inner': np.asarray(self.y_inner, dtype=float).tolist(),
                'x_outer': np.asarray(self.x_outer, dtype=float).tolist(),
                'y_outer': np.asarray(self.y_outer, dtype=float).tolist(),
                'drs_zones': getattr(self, 'drs_zones', []),
                'sector_splits': getattr(self, 'sector_splits', []) or [],
                'corridor_width_m': float(getattr(self, 'track_corridor_width_m', 220.0)),
            }
        
        with open(cache_file, 'wb') as f:
            pickle.dump({
                'frames': self.frames,
                'drivers': self.drivers,
                'circuit_info': self.circuit_info,
                'session_info': self.get_session_info(),
                'track_geom': track_geom,
                'grid_positions': getattr(self, 'grid_positions', {}) or {},
                'pit_stops': getattr(self, 'pit_stops', {}) or {},
                'pit_out_times': getattr(self, 'pit_out_times', {}) or {},
                'fastest_lap': getattr(self, 'fastest_lap', None),
            }, f)

        print(f"Saved cache to {cache_file}")
