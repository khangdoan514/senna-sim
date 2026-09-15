from typing import Dict, List, Tuple
import numpy as np
import pandas as pd
from scipy.ndimage import uniform_filter1d

# Smooth closed XY ring
def smooth_closed_xy(x: np.ndarray, y: np.ndarray, size: int) -> Tuple[np.ndarray, np.ndarray]:
    n = len(x)
    if n < 3 or size < 3:
        return x, y
    
    # Force odd filter window size
    k = int(size) | 1
    k = min(k, n if (n % 2 == 1) else n - 1)
    if k < 3:
        return x, y
    
    return (
        uniform_filter1d(np.asarray(x, dtype=float), size=k, mode="wrap"),
        uniform_filter1d(np.asarray(y, dtype=float), size=k, mode="wrap"),
    )

# Track mixin
class TrackMixin:
    # KD tree on reference XY
    def build_track(self) -> None:
        try:
            from scipy.spatial import cKDTree
            if self.x_ref is None or self.y_ref is None:
                self._track_ref_tree = None
                self._ref_arc_lengths = None
                self._ref_total_length = 0.0
                return
            
            xr = np.asarray(self.x_ref, dtype=float).ravel()
            yr = np.asarray(self.y_ref, dtype=float).ravel()
            if len(xr) < 3:
                self._track_ref_tree = None
                self._ref_arc_lengths = None
                self._ref_total_length = 0.0
                return
            
            self._track_ref_tree = cKDTree(np.column_stack((xr, yr)))
            seg = np.hypot(np.diff(xr), np.diff(yr))
            self._ref_arc_lengths = np.concatenate(([0.0], np.cumsum(seg)))
            self._ref_total_length = float(self._ref_arc_lengths[-1]) if len(self._ref_arc_lengths) else 0.0
        except Exception:
            self._track_ref_tree = None
            self._ref_arc_lengths = None
            self._ref_total_length = 0.0

    # Bearing from first to last
    def calculate_rotation(self, telemetry) -> float:
        if len(telemetry) == 0:
            return 0.0

        x_coords = telemetry['X'].values
        y_coords = telemetry['Y'].values

        # First to last delta angle
        dx = x_coords[-1] - x_coords[0]
        dy = y_coords[-1] - y_coords[0]
        angle = np.degrees(np.arctan2(dy, dx))

        return angle

    # Bounds over all driver XY
    def calculate_bounds(self, driver_telemetry: Dict) -> Dict:
        all_x, all_y = [], []

        for tel in driver_telemetry.values():
            all_x.extend(tel['X'].values)
            all_y.extend(tel['Y'].values)

        return {
            "min_x": float(np.min(all_x)),
            "max_x": float(np.max(all_x)),
            "min_y": float(np.min(all_y)),
            "max_y": float(np.max(all_y))
        }

    # Inner outer corridor from lap
    def extract_track_geometry(self, example_lap):
        try:
            tel = example_lap.get_telemetry()

            if tel is None or len(tel) == 0:
                print("No telemetry data for track geometry")
                return None, None, None, None, None, None, None, []

            x_ref = np.asarray(tel["X"].values, dtype=float)
            y_ref = np.asarray(tel["Y"].values, dtype=float)
            if len(x_ref) < 4:
                print("Not enough points for track geometry")
                return None, None, None, None, None, None, None, []

            # Sector split fractions along lap
            sector_splits: List[float] = []
            try:
                if "Time" in tel.columns and "Distance" in tel.columns:
                    time_s = tel["Time"].dt.total_seconds().to_numpy(dtype=float)
                    dist_v = tel["Distance"].to_numpy(dtype=float)
                    if len(time_s) > 0 and len(dist_v) > 0:
                        lap_dist = float(np.nanmax(dist_v))
                        s1 = example_lap.get("Sector1Time")
                        s2 = example_lap.get("Sector2Time")
                        if lap_dist > 0 and s1 is not None and pd.notna(s1):
                            s1_end = float(s1.total_seconds() if hasattr(s1, "total_seconds") else pd.Timedelta(s1).total_seconds())
                            i1 = int(np.searchsorted(time_s, s1_end, side="left"))
                            i1 = int(np.clip(i1, 0, len(dist_v) - 1))
                            f1 = float(np.clip(dist_v[i1] / lap_dist, 0.0, 1.0))
                            if 0.0 < f1 < 1.0:
                                sector_splits.append(f1)
                        
                        if lap_dist > 0 and s1 is not None and pd.notna(s1) and s2 is not None and pd.notna(s2):
                            s1s = float(s1.total_seconds() if hasattr(s1, "total_seconds") else pd.Timedelta(s1).total_seconds())
                            s2s = float(s2.total_seconds() if hasattr(s2, "total_seconds") else pd.Timedelta(s2).total_seconds())
                            s2_end = s1s + s2s
                            i2 = int(np.searchsorted(time_s, s2_end, side="left"))
                            i2 = int(np.clip(i2, 0, len(dist_v) - 1))
                            f2 = float(np.clip(dist_v[i2] / lap_dist, 0.0, 1.0))
                            if 0.0 < f2 < 1.0:
                                sector_splits.append(f2)
                
                sector_splits = sorted(set(sector_splits))
                if len(sector_splits) > 2:
                    sector_splits = sector_splits[:2]
            except Exception:
                sector_splits = []

            # Upsample uniform in index space
            n0 = len(x_ref)
            target_pts = int(min(9000, max(4500, n0 * 5)))
            t_old = np.linspace(0.0, 1.0, n0)
            t_new = np.linspace(0.0, 1.0, target_pts)
            x_ref = np.interp(t_new, t_old, x_ref)
            y_ref = np.interp(t_new, t_old, y_ref)

            # Low pass wrap filter on centerline
            n_pts = len(x_ref)
            sm = int(min(63, max(41, n_pts // 120))) | 1
            if len(x_ref) >= sm:
                x_ref = uniform_filter1d(x_ref, size=sm, mode="wrap")
                y_ref = uniform_filter1d(y_ref, size=sm, mode="wrap")

            track_width = 220.0
            self.track_corridor_width_m = track_width

            # Central difference tangent per point
            n = len(x_ref)
            dx = np.roll(x_ref, -1) - np.roll(x_ref, 1)
            dy = np.roll(y_ref, -1) - np.roll(y_ref, 1)

            length = np.sqrt(dx**2 + dy**2)
            length[length == 0] = 1.0
            nx = -dy / length
            ny = dx / length

            # Odd width blur on normals
            kn = min(55, max(37, n // 5 | 1))
            if kn >= 5:
                nx = uniform_filter1d(nx, size=kn, mode="wrap")
                ny = uniform_filter1d(ny, size=kn, mode="wrap")
                nn = np.sqrt(nx * nx + ny * ny)
                nn[nn == 0] = 1.0
                nx /= nn
                ny /= nn

            x_inner = x_ref + nx * (track_width / 2)
            y_inner = y_ref + ny * (track_width / 2)
            x_outer = x_ref - nx * (track_width / 2)
            y_outer = y_ref - ny * (track_width / 2)

            # Second smooth on edge polylines
            bw = min(27, max(15, n // 200 | 1)) | 1
            x_inner, y_inner = smooth_closed_xy(x_inner, y_inner, bw)
            x_outer, y_outer = smooth_closed_xy(x_outer, y_outer, bw)

            drs_zones = []
            if hasattr(self.session, 'drs_zones') and self.session.drs_zones:
                for zone in self.session.drs_zones:
                    drs_zones.append({
                        "start": float(zone['Start']),
                        "end": float(zone['End'])
                    })

            return x_ref, y_ref, x_inner, y_inner, x_outer, y_outer, drs_zones, sector_splits

        except Exception as e:
            print(f"Error extracting track geometry: {e}")
            return None, None, None, None, None, None, None, []
