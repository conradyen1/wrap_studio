export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function rotatedPoint(point, center, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function pointInLayer(point, layer) {
  const local = rotatedPoint(point, { x: layer.x, y: layer.y }, -layer.rotation);
  return (
    local.x >= layer.x - layer.width / 2 &&
    local.x <= layer.x + layer.width / 2 &&
    local.y >= layer.y - layer.height / 2 &&
    local.y <= layer.y + layer.height / 2
  );
}

export function containSize(sourceWidth, sourceHeight, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight, 1);
  return { width: sourceWidth * scale, height: sourceHeight * scale };
}

export function fileStem(name) {
  return name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}
