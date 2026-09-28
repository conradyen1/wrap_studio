import test from "node:test";
import assert from "node:assert/strict";
import { containSize, fileStem, pointInLayer, rotatedPoint } from "./core.js";

test("containSize preserves aspect ratio", () => {
  assert.deepEqual(containSize(1000, 500, 400, 400), { width: 400, height: 200 });
});

test("layer hit testing accounts for rotation", () => {
  const layer = { x: 100, y: 100, width: 100, height: 20, rotation: Math.PI / 2 };
  assert.equal(pointInLayer({ x: 100, y: 140 }, layer), true);
  assert.equal(pointInLayer({ x: 140, y: 100 }, layer), false);
});

test("rotation and file naming helpers", () => {
  const point = rotatedPoint({ x: 2, y: 1 }, { x: 1, y: 1 }, Math.PI / 2);
  assert.ok(Math.abs(point.x - 1) < 0.00001);
  assert.ok(Math.abs(point.y - 2) < 0.00001);
  assert.equal(fileStem("My Neon Wrap.PNG"), "my-neon-wrap");
});
