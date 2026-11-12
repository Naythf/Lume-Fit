// Approximate surface regions on the CC0 body, not a physiological activation model.
export function muscleZone(x, y, z) {
  const a = Math.abs(x),
    front = z >= 0;
  if (y > 0.7 && y < 0.83 && a > 0.12 && a < 0.23) return "shoulders";
  if (y > 0.65 && y < 0.79 && a >= 0.23 && a < 0.36)
    return front ? "biceps" : "triceps";
  if (y > 0.64 && y < 0.79 && a < 0.145) return front ? "chest" : "back";
  if (y > 0.47 && y <= 0.64 && a < 0.13) return front ? "core" : "back";
  if (y > 0.38 && y <= 0.48 && a < 0.15) return front ? "quads" : "glutes";
  if (y > 0.23 && y <= 0.38 && a < 0.16) return front ? "quads" : "hamstrings";
  if (y > 0.07 && y <= 0.23 && a < 0.14) return "calves";
  return "";
}
