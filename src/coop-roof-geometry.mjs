// Visual-only native Farm coop roof geometry. Units: metres, radians.
// The underside of each pitched roof intersects the wall top at its support line.
export function nativeCoopRoofPlacement(depth, {pitch=0.34, thickness=0.13, overhang=0.125}={}) {
  if (![depth,pitch,thickness,overhang].every(Number.isFinite) ||
      depth<=0 || pitch<=0 || pitch>=Math.PI/2 || thickness<=0 || overhang<0)
    throw new RangeError("Invalid native coop roof dimensions");
  const panelDepth=depth/2+2*overhang;
  const supportOffset=depth/4;
  const centerAboveWall=Math.tan(pitch)*supportOffset+
    thickness/(2*Math.cos(pitch));
  return {panelDepth,pitch,thickness,centerAboveWall};
}
