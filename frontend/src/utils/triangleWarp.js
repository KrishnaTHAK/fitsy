// Piecewise-affine image warp. Maps a source quad of an image onto a
// destination quad on a canvas by splitting it into two triangles. This is our
// own compositing step for the pose-driven garment try-on — no external VTON
// model, just geometry.

// Solve the 6 affine params [a,b,c,d,e,f] mapping a source triangle -> dest
// triangle, where x' = a*u + c*v + e and y' = b*u + d*v + f. Arg order matches
// CanvasRenderingContext2D.setTransform(a, b, c, d, e, f). Returns null for a
// degenerate (zero-area) source triangle.
export function affineFromTriangles(s, d) {
  const [[u0, v0], [u1, v1], [u2, v2]] = s;
  const [[x0, y0], [x1, y1], [x2, y2]] = d;
  const den = u0 * (v2 - v1) - u1 * (v2 - v0) + u2 * (v1 - v0);
  if (Math.abs(den) < 1e-9) return null;
  const a = -(v0 * (x2 - x1) - v1 * (x2 - x0) + v2 * (x1 - x0)) / den;
  const b = -(v0 * (y2 - y1) - v1 * (y2 - y0) + v2 * (y1 - y0)) / den;
  const c = (u0 * (x2 - x1) - u1 * (x2 - x0) + u2 * (x1 - x0)) / den;
  const d2 = (u0 * (y2 - y1) - u1 * (y2 - y0) + u2 * (y1 - y0)) / den;
  const e =
    (u0 * (v2 * x1 - v1 * x2) + v0 * (u1 * x2 - u2 * x1) + (u2 * v1 - u1 * v2) * x0) / den;
  const f =
    (u0 * (v2 * y1 - v1 * y2) + v0 * (u1 * y2 - u2 * y1) + (u2 * v1 - u1 * v2) * y0) / den;
  return [a, b, c, d2, e, f];
}

function drawTriangle(ctx, img, s, d) {
  const m = affineFromTriangles(s, d);
  if (!m) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(d[0][0], d[0][1]);
  ctx.lineTo(d[1][0], d[1][1]);
  ctx.lineTo(d[2][0], d[2][1]);
  ctx.closePath();
  ctx.clip();
  ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

// srcQuad / dstQuad: [TL, TR, BR, BL], each [x, y].
// ponytail: piecewise-affine, no true perspective / cloth physics. Upgrade to a
// full homography or thin-plate spline (TPS) if trapezoidal fit looks off.
export function warpImageQuad(ctx, img, srcQuad, dstQuad) {
  const [sTL, sTR, sBR, sBL] = srcQuad;
  const [dTL, dTR, dBR, dBL] = dstQuad;
  drawTriangle(ctx, img, [sTL, sTR, sBR], [dTL, dTR, dBR]);
  drawTriangle(ctx, img, [sTL, sBR, sBL], [dTL, dBR, dBL]);
}
