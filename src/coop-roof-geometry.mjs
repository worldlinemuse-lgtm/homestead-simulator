// Visual-only native Farm coop roof geometry. Units: metres, radians.
// The underside of each pitched roof intersects the wall top at its support line.
export function nativeCoopRoofPlacement(depth, {pitch=0.34, thickness=0.13, overhang=0.125}={}) {
  if (![depth,pitch,thickness,overhang].every(Number.isFinite) ||
      depth<=0 || pitch<=0 || pitch>=Math.PI/2 || thickness<=0 || overhang<0)
    throw new RangeError("Invalid native coop roof dimensions");
  const supportOffset=depth/4;
  // The panel's horizontal reach shrinks with pitch. Preserve the existing
  // illustrated panel size, but never let a steep roof end inside its wall.
  const minimumPanelDepth=2*Math.max(0,
    (supportOffset+overhang-thickness*Math.sin(pitch)/2)/Math.cos(pitch));
  const panelDepth=Math.max(depth/2+2*overhang,minimumPanelDepth);
  const centerAboveWall=Math.tan(pitch)*supportOffset+
    thickness/(2*Math.cos(pitch));
  return {panelDepth,pitch,thickness,centerAboveWall};
}

// Gable infill spans the wall-top chord to the underside ridge. Coordinates
// are relative to the native footprint's wall top, not terrain or an art offset.
export function nativeCoopGableProfile(depth, options={}) {
  const {pitch}=nativeCoopRoofPlacement(depth,options);
  const rise=Math.tan(pitch)*depth/2;
  return {leftZ:-depth/2,ridgeZ:0,rightZ:depth/2,baseY:0,ridgeY:rise};
}
