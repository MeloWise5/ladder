import React from 'react'

function StepHeatmap({ steps, last, gap, selectedStep, onStepClick }) {
  const [hoveredStep, setHoveredStep] = React.useState(null);
  if (!steps || steps.length === 0) return null;

  // Sort high → low so the grid reads like a price ladder (top/left = highest)
  const sorted = [...steps].sort((a, b) => Number(b.price) - Number(a.price));

  const STATUS_COLOR = {
    BUY:  { bg: 'rgba(239, 68,  68,  0.85)', border: 'rgba(239, 68,  68,  0.4)' },
    SELL: { bg: 'rgba(34,  197, 94,  0.85)', border: 'rgba(34,  197, 94,  0.4)' },
    OPEN: { bg: 'rgba(100, 116, 139, 0.4)',  border: 'rgba(100, 116, 139, 0.2)' },
  };
  const getColor = (status) =>
    STATUS_COLOR[(status || '').toUpperCase()] || STATUS_COLOR.OPEN;

  const counts = sorted.reduce((acc, s) => {
    const k = (s.status || 'OPEN').toUpperCase();
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  // ── Precise price placement ──────────────────────────────────────────────
  // Find the FLOOR step: the highest step price that is ≤ current price.
  // Don't round to nearest — use the step the price is currently inside.
  const lastNum = Number(last) || 0;
  const gapNum  = Number(gap)  || 0;
  let floorIdx    = -1;
  let dotPercent  = 0;   // 0–100: how far through the gap (left=step price, right=next lower step)

  if (lastNum > 0 && gapNum > 0) {
    sorted.forEach((step, i) => {
      const stepPrice = Number(step.price);
      if (stepPrice <= lastNum) {
        // First one we find (sorted high→low) is the floor
        if (floorIdx === -1) {
          floorIdx   = i;
          // Distance into the gap as a percentage
          // Grid is high→low so LEFT edge of this cell = the step price (lower bound).
          // The gap opens RIGHTWARD toward lower prices, but the price is moving
          // LEFTWARD toward the next higher step. So we use right: dotPercent%
          // to position the dot toward the LEFT (higher-price) side.
          const distIntoGap = lastNum - stepPrice;
          dotPercent = Math.min(100, Math.max(0, (distIntoGap / gapNum) * 100));
        }
      }
    });

    // Edge case: price is above every step — pin dot to left side of highest step
    if (floorIdx === -1 && sorted.length > 0) {
      floorIdx   = 0;
      dotPercent = 100; // at the very left (high) side
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  // ── Sell price line (Percentage & Fixed ladders, on click or hover) ──────
  // Prefer the clicked (selected) step; fall back to hovered.
  const activeStep = selectedStep || hoveredStep;
  const sellPrice = (['percentage', 'fixed'].includes(activeStep?.transaction?.ladder_type?.toLowerCase()) &&
                     activeStep?.transaction?.sell_price)
    ? Number(activeStep.transaction.sell_price) : null;

  let sellFloorIdx   = -1;
  let sellDotPercent = 0;

  if (sellPrice && sellPrice > 0 && gapNum > 0) {
    sorted.forEach((step, i) => {
      const stepPrice = Number(step.price);
      if (stepPrice <= sellPrice && sellFloorIdx === -1) {
        sellFloorIdx   = i;
        const distIntoGap = sellPrice - stepPrice;
        sellDotPercent = Math.min(100, Math.max(0, (distIntoGap / gapNum) * 100));
      }
    });
    if (sellFloorIdx === -1 && sorted.length > 0) {
      sellFloorIdx   = 0;
      sellDotPercent = 100;
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="step-heatmap">
      <div className="step-heatmap-header">
        <span className="step-heatmap-title">
          STEP GRID &nbsp;·&nbsp; {sorted.length} steps
          {lastNum > 0 && <span className="step-heatmap-price-tag"> &nbsp;@ ${Number(lastNum).toFixed(2)}</span>}
        </span>
        <div className="step-heatmap-legend">
          {Object.entries(counts).map(([status, n]) => (
            <span key={status} className="step-heatmap-legend-item">
              <span className="step-heatmap-swatch" style={{ background: getColor(status).bg }} />
              {status} ({n})
            </span>
          ))}
          <span className="step-heatmap-legend-item">
            <span className="step-grid-live-dot-legend" />
            PRICE
          </span>
        </div>
      </div>
      <div className="step-grid-wrap">
        {sorted.map((step, i) => {
          const col      = getColor(step.status);
          const isFloor  = i === floorIdx;
          const stepStatus = (step.status || 'OPEN').toUpperCase();
          const isSelected = selectedStep && String(selectedStep._id) === String(step._id);
          const isClickable = stepStatus === 'SELL' || stepStatus === 'OPEN' || stepStatus === 'BUY';
          return (
            <div
              key={step._id || i}
              className={`step-grid-cell${isFloor ? ' step-grid-cell--live' : ''}${isSelected ? ' step-grid-cell--selected' : ''}`}
              style={{
                background: col.bg,
                borderColor: isSelected ? 'rgba(245,166,35,0.9)' : isFloor ? 'rgba(255,255,255,0.5)' : col.border,
                cursor: isClickable ? 'pointer' : 'default',
              }}
              title={`$${Number(step.price).toFixed(2)}  ·  ${i === sellFloorIdx ? 'SELL' : step.status}${
                isFloor
                  ? `  ·  price $${Number(lastNum).toFixed(2)} is ${dotPercent.toFixed(0)}% into this step`
                  : ''
              }${i === sellFloorIdx && sellPrice ? `  ·  sell $${Number(sellPrice).toFixed(2)}` : ''}`}
              onClick={isClickable ? () => onStepClick && onStepClick(isSelected ? null : step) : undefined}
              onMouseEnter={() => setHoveredStep(step)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              {isFloor && (
                <span
                  className="step-grid-live-dot"
                  style={{ right: `${dotPercent}%`, left: 'auto' }}
                />
              )}
              {i === sellFloorIdx && (
                <span
                  className="step-grid-sell-dot"
                  style={{ right: `${sellDotPercent}%`, left: 'auto' }}
                />
              )}
              <span className="step-grid-price" style={{ color: stepStatus === 'BUY' ? '#fff' : 'rgba(0,0,0,0.75)' }}>${Number(step.price).toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LadderStepTab({ ladder, selectedStep, onStepClick }) {
  return (
    <>
      {ladder && ladder.steps && ladder.steps.length > 0 && (
        <StepHeatmap
          steps={ladder.steps}
          last={ladder.last}
          gap={ladder.gap}
          selectedStep={selectedStep}
          onStepClick={onStepClick}
        />
      )}
    </>
  )
}

export default LadderStepTab
