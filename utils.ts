import path from "path";

export function hasText(s: any): s is string {
  return (
    s !== undefined &&
    s !== null &&
    typeof s === "string" &&
    s.trim().length > 0
  );
}

export function hasElements(arr: any): arr is any[] {
  return (
    arr !== undefined && arr !== null && Array.isArray(arr) && arr.length > 0
  );
}

export function getTempDir() {
  return process.env.TEMP_DIR ?? path.join(process.cwd(), "temp");
}

export function getUploadsDir() {
  return process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");
}
