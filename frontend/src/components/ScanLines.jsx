/**
 * Scan Lines Overlay
 * Adds CRT monitor effect
 */

function ScanLines({ opacity = 0.03 }) {
  return (
    <div 
      className="scan-lines"
      style={{ opacity }}
    />
  );
}

export default ScanLines;
