import bisect
import math
import numpy as np
import pandas as pd
from typing import Any, Dict, List, Optional, Tuple
from app.lib.tyres import tyre_index_for_frame
from fastf1 import _api as f1_api

# Lap duration from wall clock (lap_number step) is wrong if telemetry starts mid-lap or on
# the first increment after join — a few seconds can "beat" every real lap. Only track FL
# from increments whose elapsed time looks like a real F1 lap.
_FASTEST_LAP_PLAUSIBLE_MIN_S = 45.0
_FASTEST_LAP_PLAUSIBLE_MAX_S = 240.0

# Frame mixin
class FramesMixin:
    # Normalize driver key
    @staticmethod
    def driver_number_key(driver: object) -> str:
        if driver is None:
            return ""

        if isinstance(driver, float):
            return str(int(driver))

        if isinstance(driver, int):
            return str(driver)

        s = str(driver).strip()
        try:
            return str(int(float(s)))
        except (TypeError, ValueError):
            return s

    # Grid slots from session results
    def extract_grid_positions(self) -> Dict[str, int]:
        out: Dict[str, int] = {}
        if self.session is None:
            return out
        try:
            res = self.session.results
            if res is None or len(res) == 0:
                return out
            
            for _, row in res.iterrows():
                num = row.get("DriverNumber")
                gp = row.get("GridPosition")
                if num is None or gp is None:
                    continue
                
                try:
                    gpv = int(gp)
                except (TypeError, ValueError):
                    continue
                
                key = self.driver_number_key(num)
                if not key:
                    continue
                
                out[key] = gpv
        
        except Exception as exc:
            print(f"Grid positions unavailable: {exc}")
        
        return out

    # Finisher status from results row
    @staticmethod
    def is_race_finisher(status: object) -> bool:
        if status is None:
            return False
        
        try:
            if isinstance(status, float) and pd.isna(status):
                return False
        except (TypeError, ValueError):
            pass
        
        s = str(status).strip()
        if s == "Finished":
            return True
        
        # Plus lap strings count as finishers
        if s.startswith("+") and "Lap" in s:
            return True
        
        return False

    # Finisher flags keyed by number
    def extract_race_finishers(self) -> Dict[str, bool]:
        out: Dict[str, bool] = {}
        if self.session is None:
            return out
        
        try:
            res = self.session.results
            if res is None or len(res) == 0:
                return out
            
            for _, row in res.iterrows():
                num = row.get("DriverNumber")
                if num is None:
                    continue
                
                key = self.driver_number_key(num)
                if not key:
                    continue
                
                st = row.get("Status")
                out[key] = self.is_race_finisher(st)
        
        except Exception as exc:
            print(f"Race finisher flags unavailable: {exc}")
        
        return out

    # Pit counts from lap markers
    def extract_pit_stops(self) -> Dict[str, int]:
        out: Dict[str, int] = {}
        if self.session is None:
            return out
        
        try:
            for driver in self.drivers:
                laps = self.session.laps.pick_drivers(driver)
                if laps is None or len(laps) == 0:
                    continue
                
                key = self.driver_number_key(driver)
                pit_in = int(laps["PitInTime"].notna().sum()) if "PitInTime" in laps.columns else 0
                pit_out = int(laps["PitOutTime"].notna().sum()) if "PitOutTime" in laps.columns else 0
                out[key] = max(pit_in, pit_out)
        
        except Exception as exc:
            print(f"Pit stop counts unavailable: {exc}")
        
        return out

    # Pit out session seconds sorted
    def extract_pit_out_times(self) -> Dict[str, List[float]]:
        out: Dict[str, List[float]] = {}
        if self.session is None:
            return out
        
        try:
            for driver in self.drivers:
                laps = self.session.laps.pick_drivers(driver)
                if laps is None or len(laps) == 0:
                    continue
                
                key = self.driver_number_key(driver)
                times: List[float] = []
                if "PitOutTime" not in laps.columns:
                    out[key] = []
                    continue
                
                for _, row in laps.iterrows():
                    pit_out = row.get("PitOutTime")
                    if pit_out is None or pd.isna(pit_out):
                        continue
                    
                    if hasattr(pit_out, "total_seconds"):
                        sec = float(pit_out.total_seconds())
                    else:
                        sec = float(pd.Timedelta(pit_out).total_seconds())
                    
                    times.append(sec)
                
                times.sort()
                out[key] = times
        
        except Exception as exc:
            print(f"Pit out times unavailable: {exc}")
        
        return out

    # Official timing position stream
    def extract_timing_position_stream(self) -> Dict[str, Tuple[np.ndarray, np.ndarray]]:
        out: Dict[str, Tuple[np.ndarray, np.ndarray]] = {}
        if self.session is None:
            return out
        
        try:
            _, stream = f1_api.timing_data(self.session.api_path)
        except Exception as exc:
            print(f"F1 timing position stream unavailable: {exc}")
            return out
        
        if stream is None or len(stream) == 0:
            print("Empty timing stream leaderboard uses distance")
            return out
        
        try:
            work = stream.copy()
            td = pd.to_timedelta(work["Time"], errors="coerce")
            work["t_sec"] = td.dt.total_seconds()
            work = work.dropna(subset=["t_sec", "Driver"])
            if work.empty:
                return out
            
            for drv_raw, grp in work.groupby("Driver", sort=False):
                key = self.driver_number_key(drv_raw)
                if not key:
                    continue
                
                g = grp.sort_values("t_sec")
                g = g.drop_duplicates(subset=["t_sec"], keep="last")
                t_arr = g["t_sec"].to_numpy(dtype=np.float64)
                pos_series = pd.to_numeric(g["Position"], errors="coerce").ffill()
                pos_arr = pos_series.to_numpy(dtype=np.float64)
                ok = ~np.isnan(pos_arr)
                if not ok.any():
                    continue
                
                t_arr = t_arr[ok]
                pos_arr = pos_arr[ok]
                if len(t_arr) == 0:
                    continue
                
                out[key] = (t_arr, pos_arr)
            print(f"Timing position stream for {len(out)} drivers")
        
        except Exception as exc:
            print(f"Failed to parse timing position stream: {exc}")
        
        return out

    # Lookup tower position at time
    @staticmethod
    def lookup_timing_position(t_arr: np.ndarray, pos_arr: np.ndarray, t: float) -> Optional[int]:
        if len(t_arr) == 0:
            return None
        
        i = int(np.searchsorted(t_arr, t, side="right")) - 1
        if i < 0:
            return None
        
        p = pos_arr[i]
        if np.isnan(p):
            return None
        
        return int(p)

    # Weather and track status arrays
    def timeline_ambient(self, timeline: np.ndarray) -> Tuple[Optional[Dict[str, np.ndarray]], np.ndarray, np.ndarray]:
        track_codes = np.ones(len(timeline), dtype=np.int32)
        track_msgs = np.full(len(timeline), "AllClear", dtype=object)
        weather: Optional[Dict[str, np.ndarray]] = None
        if self.session is None:
            return None, track_codes, track_msgs

        try:
            wd = getattr(self.session, "weather_data", None)
            if wd is not None and len(wd) > 0 and "Time" in wd.columns:
                wd2 = wd.dropna(subset=["Time"]).copy()
                if len(wd2) > 0:
                    tw_series = pd.to_timedelta(wd2["Time"], errors="coerce").dt.total_seconds()
                    wd2 = wd2.loc[tw_series.notna()]
                    tw = tw_series[tw_series.notna()].to_numpy(dtype=float)
                    if len(tw) > 0:
                        weather = {}
                        pairs = [
                            ("AirTemp", "air_temp"),
                            ("TrackTemp", "track_temp"),
                            ("Humidity", "humidity"),
                            ("Pressure", "pressure"),
                            ("Rainfall", "rainfall"),
                            ("WindSpeed", "wind_speed"),
                            ("WindDirection", "wind_direction"),
                        ]

                        for col, key in pairs:
                            if col not in wd2.columns:
                                continue
                            
                            vals = pd.to_numeric(wd2[col], errors="coerce").to_numpy(dtype=float)
                            if len(vals) != len(tw):
                                continue
                            
                            s = pd.Series(vals).ffill().bfill()
                            vals = s.to_numpy(dtype=float)
                            if np.all(np.isnan(vals)):
                                continue
                            
                            v0 = float(vals[0]) if np.isfinite(vals[0]) else 0.0
                            v1 = float(vals[-1]) if np.isfinite(vals[-1]) else v0
                            weather[key] = np.interp(timeline, tw, vals, left=v0, right=v1).astype(np.float64)
                        
                        if len(weather) == 0:
                            weather = None
        
        except Exception as exc:
            print(f"Weather series unavailable: {exc}")
            weather = None

        try:
            ts = getattr(self.session, "track_status", None)
            if ts is not None and len(ts) > 0 and "Time" in ts.columns:
                ts2 = ts.dropna(subset=["Time"]).copy()
                if len(ts2) > 0:
                    tts = pd.to_timedelta(ts2["Time"], errors="coerce").dt.total_seconds()
                    ts2 = ts2.loc[tts.notna()]
                    tts = tts[tts.notna()].to_numpy(dtype=float)
                    if len(tts) > 0:
                        st = pd.to_numeric(ts2["Status"], errors="coerce").fillna(1).to_numpy(dtype=np.int32)
                        msg = ts2["Message"].fillna("").astype(str).to_numpy()
                        j_idx = np.searchsorted(tts, timeline, side="right") - 1
                        j_idx = np.clip(j_idx, 0, len(tts) - 1)
                        track_codes = st[j_idx]
                        track_msgs = msg[j_idx]
        
        except Exception as exc:
            print(f"Track status series unavailable: {exc}")

        return weather, track_codes, track_msgs

    @staticmethod
    def timedelta_to_seconds(v: Any) -> Optional[float]:
        if v is None:
            return None
        
        try:
            if isinstance(v, float) and pd.isna(v):
                return None
        except (TypeError, ValueError):
            pass
        
        try:
            if hasattr(v, "total_seconds"):
                return float(v.total_seconds())
            return float(pd.Timedelta(v).total_seconds())
        except (TypeError, ValueError):
            return None

    # Official sector splits
    def extract_sector_times_by_driver_lap(self, driver_abbrevs: Dict[str, str],) -> Dict[str, Dict[int, Tuple[float, float, float]]]:
        # driver_key -> lap_number -> (s1_sec, s2_sec, s3_sec)
        sector_rows: Dict[str, Dict[int, Tuple[float, float, float]]] = {}
        if self.session is None:
            return sector_rows

        try:
            for driver in self.drivers:
                laps = self.session.laps.pick_drivers(driver)
                if laps is None or len(laps) == 0:
                    continue

                key = self.driver_number_key(driver)
                inner: Dict[int, Tuple[float, float, float]] = {}

                for _, row in laps.iterrows():
                    s1 = self.timedelta_to_seconds(row.get("Sector1Time"))
                    s2 = self.timedelta_to_seconds(row.get("Sector2Time"))
                    s3 = self.timedelta_to_seconds(row.get("Sector3Time"))
                    if s1 is None or s2 is None or s3 is None:
                        continue
                    if s1 <= 0 or s2 <= 0 or s3 <= 0:
                        continue
                    if not (math.isfinite(s1) and math.isfinite(s2) and math.isfinite(s3)):
                        continue

                    ln = row.get("LapNumber")
                    if ln is None:
                        continue
                    try:
                        if isinstance(ln, float) and pd.isna(ln):
                            continue
                    except (TypeError, ValueError):
                        pass
                    
                    try:
                        lap_num = int(float(ln))
                    except (TypeError, ValueError):
                        continue
                    
                    if lap_num < 1:
                        continue

                    inner[lap_num] = (float(s1), float(s2), float(s3))

                if inner:
                    sector_rows[key] = inner
        
        except Exception as exc:
            print(f"Sector times by lap unavailable: {exc}")
            return {}

        return sector_rows

    # Build per frame driver snapshots
    def generate_frames(
        self,
        driver_telemetry: Dict,
        driver_colors: Dict,
        driver_abbrevs: Dict[str, str],
        driver_teams: Optional[Dict[str, str]] = None,
    ):
        # Find common time range
        print("   Finding max session time...")
        max_time = 0.0
        min_time = None
        for driver, tel in driver_telemetry.items():
            if len(tel) > 0:
                driver_min = float(tel["session_seconds"].min())
                driver_max = float(tel["session_seconds"].max())
                min_time = driver_min if min_time is None else min(min_time, driver_min)
                max_time = max(max_time, driver_max)

        if min_time is None:
            self.frames = []
            return

        session_duration = max(0.0, max_time - min_time)
        print(f"   Session duration: {session_duration:.2f} seconds")

        # Twenty five hertz output cadence
        fps = 25
        frame_dt = 1.0 / fps
        num_frames = int(session_duration * fps)
        print(f"   Generating {num_frames} frames at {fps} FPS")
        if num_frames <= 0:
            self.frames = []
            return

        teams = driver_teams or {}
        def interp_compound_strings(tel_local, t_sorted_local: np.ndarray, order_local: np.ndarray, timeline_local: np.ndarray) -> np.ndarray:
            if "Compound" not in tel_local.columns:
                return np.array([""] * len(timeline_local), dtype=object)
            
            raw = tel_local["Compound"].to_numpy()[order_local]
            idx = np.searchsorted(t_sorted_local, timeline_local, side="right") - 1
            idx = np.clip(idx, 0, len(raw) - 1)
            picked = raw[idx]
            out = np.empty(len(timeline_local), dtype=object)
            for i, v in enumerate(picked):
                if v is None or pd.isna(v):
                    out[i] = ""
                else:
                    s = str(v).strip()
                    out[i] = "" if s.lower() == "nan" else s
            
            return out

        # Timeline then per driver arrays
        timeline = np.arange(min_time, max_time, frame_dt)
        if len(timeline) > 0 and float(timeline[-1]) < max_time - 1e-6:
            timeline = np.append(timeline, float(max_time))
        
        interpolated = {}
        for driver, tel in driver_telemetry.items():
            if len(tel) == 0:
                continue
            
            t = tel["session_seconds"].to_numpy(dtype=float)
            order = np.argsort(t)
            t_sorted = t[order]
            t_sorted, unique_idx = np.unique(t_sorted, return_index=True)
            order = order[unique_idx]

            def interp(column: str, default: float = 0.0):
                if column not in tel.columns:
                    return np.full_like(timeline, default, dtype=float)
                
                values = tel[column].to_numpy(dtype=float)[order]
                return np.interp(timeline, t_sorted, values)

            def interp_step(column: str, default: float = 0.0):
                if column not in tel.columns:
                    return np.full_like(timeline, default, dtype=float)
                
                values = tel[column].to_numpy(dtype=float)[order]
                idx = np.searchsorted(t_sorted, timeline, side="right") - 1
                idx = np.clip(idx, 0, len(values) - 1)
                return values[idx]

            interpolated[driver] = {
                "x": interp("X"),
                "y": interp("Y"),
                "speed": interp("Speed"),
                "gear": interp("nGear"),
                "throttle": interp("Throttle"),
                "brake": interp("Brake"),
                "drs": interp("DRS"),
                # Lap index uses step sampling
                "lap": interp_step("lap_number", 1.0),
                # Distance uses step sampling
                "dist": interp_step("race_distance", 0.0),
                "compound": interp_compound_strings(tel, t_sorted, order, timeline),
            }

        driver_session_end: Dict[str, float] = {}
        for drv, tel in driver_telemetry.items():
            if len(tel) == 0:
                continue
            
            driver_session_end[self.driver_number_key(drv)] = float(tel["session_seconds"].max())

        tree = getattr(self, "_track_ref_tree", None)
        # Pit latch uses distance hysteresis
        pitting_latched: Dict[str, bool] = {}
        pit_enter_m = 48.0   # Far from line means pitting
        pit_exit_m = 30.0    # Near line clears pitting
        last_compound_by_driver: Dict[str, str] = {}
        grid_positions = getattr(self, "grid_positions", {}) or {}
        pit_out_times_by_driver = getattr(self, "pit_out_times", {}) or {}

        lap_start_time_by_driver: Dict[str, float] = {}
        last_lap_seen_by_driver: Dict[str, int] = {}
        running_fastest_lap: Optional[Dict[str, Any]] = None
        use_timing_order = bool(self.timing_stream_arrays)
        weather_series, track_code_arr, track_msg_arr = self.timeline_ambient(timeline)

        sector_rows = self.extract_sector_times_by_driver_lap(driver_abbrevs)
        best_s1: Optional[Dict[str, Any]] = None
        best_s2: Optional[Dict[str, Any]] = None
        best_s3: Optional[Dict[str, Any]] = None

        def sector_better(new_t: float, cur: Optional[Dict[str, Any]]) -> bool:
            if not math.isfinite(new_t):
                return False
            if cur is None:
                return True
            
            old = cur.get("time_seconds")
            try:
                old_f = float(old)
            except (TypeError, ValueError):
                return True
            
            if not math.isfinite(old_f):
                return True
            
            return new_t < old_f

        for frame_idx, t in enumerate(timeline):
            if frame_idx % 100 == 0:  # Log every hundred frames
                print(f"   Progress: {frame_idx}/{num_frames} frames ({frame_idx/num_frames*100:.1f}%)")

            frame_data = {
                "time": float(t - min_time),
                "t": float(t - min_time),
                "drivers": {}
            }
            
            frame_data["track_status"] = {
                "status": int(track_code_arr[frame_idx]),
                "message": str(track_msg_arr[frame_idx]),
            }
            
            if weather_series:
                wrow: Dict[str, Any] = {}
                for k in (
                    "air_temp",
                    "track_temp",
                    "humidity",
                    "pressure",
                    "rainfall",
                    "wind_speed",
                    "wind_direction",
                ):
                    if k in weather_series:
                        wrow[k] = float(weather_series[k][frame_idx])
                
                if "rainfall" in wrow:
                    wrow["rain_state"] = "Wet" if wrow["rainfall"] > 0.5 else "Dry"
                
                frame_data["weather"] = wrow

            # One dict per car this instant
            snapshot = []
            for driver in self.drivers:
                if driver not in interpolated:
                    continue
                
                d = interpolated[driver]
                px = float(d["x"][frame_idx])
                py = float(d["y"][frame_idx])
                spd = float(d["speed"][frame_idx])
                gr = int(round(d["gear"][frame_idx]))
                key = self.driver_number_key(driver)
                prev = pitting_latched.get(key, False)
                if tree is not None:
                    dist_ref, _ = tree.query([px, py])
                    if dist_ref >= pit_enter_m:
                        pitting_latched[key] = True
                    elif dist_ref <= pit_exit_m:
                        pitting_latched[key] = False
                    else:
                        pitting_latched[key] = prev
                    
                    pitting = pitting_latched[key]
                else:
                    pitting = False

                t_end = driver_session_end.get(key)
                
                # Past end marks finish or out
                past_end = t_end is not None and float(t) >= t_end - frame_dt - 1e-3
                finisher = getattr(self, "race_finishers", {}).get(key, False)
                finished = bool(past_end and finisher)
                out = bool(past_end and not finisher)
                finish_time_seconds = (
                    float(t_end - min_time) if finished and t_end is not None else None
                )

                if out or finished:
                    pitting = False

                comp_val = d["compound"][frame_idx]
                compound_str = str(comp_val).strip() if comp_val else ""
                if compound_str.lower() in ("nan", "none"):
                    compound_str = ""
                
                if not compound_str and key in last_compound_by_driver:
                    compound_str = last_compound_by_driver[key]
                
                if compound_str:
                    last_compound_by_driver[key] = compound_str

                # Tyre enum for UI tint
                tyre_idx = tyre_index_for_frame(compound_str if compound_str else None)

                gp_slot = int(grid_positions.get(key, 999))
                lap_num = int(max(1, round(d["lap"][frame_idx])))
                pit_times = pit_out_times_by_driver.get(key, [])
                pit_stops_so_far = bisect.bisect_right(pit_times, float(t))
                
                # Sort uses lap then distance
                prev_lap = last_lap_seen_by_driver.get(key)
                if prev_lap is None:
                    last_lap_seen_by_driver[key] = lap_num
                    lap_start_time_by_driver.setdefault(key, float(t))
                elif lap_num > prev_lap:
                    start_t = lap_start_time_by_driver.get(key, float(t))
                    completed_lap_time = float(t - start_t)
                    if (
                        completed_lap_time > 0
                        and _FASTEST_LAP_PLAUSIBLE_MIN_S <= completed_lap_time <= _FASTEST_LAP_PLAUSIBLE_MAX_S
                    ):
                        if running_fastest_lap is None or completed_lap_time < float(
                            running_fastest_lap["time_seconds"]
                        ):
                            running_fastest_lap = {
                                "abbrev": driver_abbrevs.get(str(driver), str(driver)),
                                "time_seconds": completed_lap_time,
                                "lap": int(prev_lap),
                            }

                    triplet = sector_rows.get(key, {}).get(int(prev_lap))
                    if triplet is not None:
                        v1, v2, v3 = triplet
                        abbr = str(driver_abbrevs.get(str(driver), key))
                        if sector_better(v1, best_s1):
                            best_s1 = {"abbrev": abbr, "time_seconds": float(v1)}
                        if sector_better(v2, best_s2):
                            best_s2 = {"abbrev": abbr, "time_seconds": float(v2)}
                        if sector_better(v3, best_s3):
                            best_s3 = {"abbrev": abbr, "time_seconds": float(v3)}
                    
                    lap_start_time_by_driver[key] = float(t)
                    last_lap_seen_by_driver[key] = lap_num

                timing_pos: Optional[int] = None
                if use_timing_order:
                    pair = self.timing_stream_arrays.get(key)
                    if pair is not None:
                        timing_pos = self.lookup_timing_position(pair[0], pair[1], float(t))

                snapshot.append(
                    {
                        "code": key,
                        "x": px,
                        "y": py,
                        "speed": spd,
                        "gear": gr,
                        "throttle": float(d["throttle"][frame_idx]),
                        "brake": float(d["brake"][frame_idx]),
                        "drs": int(round(d["drs"][frame_idx])),
                        "lap": lap_num,
                        "dist": float(d["dist"][frame_idx]),
                        "color": driver_colors.get(driver, "#FFFFFF"),
                        "abbrev": driver_abbrevs.get(str(driver), str(driver)),
                        "team": teams.get(str(driver), "Unknown"),
                        "compound": compound_str,
                        "tyre": tyre_idx,
                        "pitting": pitting,
                        "out": out,
                        "finished": finished,
                        "finish_time_seconds": finish_time_seconds,
                        "pit_stops": int(pit_stops_so_far),
                        "grid_position": gp_slot,
                        "_timing_pos": timing_pos,
                    }
                )

            # Timing order then distance tie break
            if use_timing_order:
                snapshot.sort(
                    key=lambda item: (
                        int(item["_timing_pos"])
                        if item.get("_timing_pos") is not None
                        else 99,
                        -int(max(1, item.get("lap", 1))),
                        -float(item.get("dist", 0.0)),
                        str(item.get("abbrev", "")),
                    )
                )
            else:
                snapshot.sort(
                    key=lambda item: (
                        -int(max(1, item.get("lap", 1))),
                        -float(item.get("dist", 0.0)),
                        str(item.get("abbrev", "")),
                    )
                )
            
            leader_lap = int(snapshot[0]["lap"]) if snapshot else 1
            leader_dist_raw = float(snapshot[0].get("dist", 0.0)) if snapshot else 0.0
            for car in snapshot:
                c = str(car["code"])
                raw_d = float(car.get("dist", 0.0))
                lap_c = int(max(1, car.get("lap", 1)))
                if lap_c == leader_lap:
                    car["gap_to_leader_m"] = max(0.0, leader_dist_raw - raw_d)
                else:
                    car["gap_to_leader_m"] = None
            
            for position, car in enumerate(snapshot, start=1):
                code = car.pop("code")
                car.pop("_timing_pos", None)
                car["position"] = position
                frame_data["drivers"][code] = car
            
            # Fastest lap widget needs lap two
            if leader_lap >= 2 and running_fastest_lap is not None:
                frame_data["fastest_lap"] = running_fastest_lap.copy()
            else:
                frame_data["fastest_lap"] = None

            frame_data["sector_fastest"] = {
                "1": best_s1.copy() if best_s1 is not None else None,
                "2": best_s2.copy() if best_s2 is not None else None,
                "3": best_s3.copy() if best_s3 is not None else None,
            }

            self.frames.append(frame_data)

        print(f"Generated {len(self.frames)} total frames")
