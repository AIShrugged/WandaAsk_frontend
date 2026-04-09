// Chart theme constants — synchronized with app/globals.css dark theme
// ⚠️ Change only together with CSS variable values in globals.css

// Tooltip with dark theme background (was: white — visual bug on dark bg)
export const CHART_TOOLTIP_STYLE = {
  background: 'hsl(240 30% 7%)',
  border: '1px solid hsl(240 15% 16%)',
  borderRadius: '6px',
  fontSize: 12,
  color: 'hsl(220 20% 93%)',
} as const;

// Axis tick labels
export const CHART_TICK_STYLE = {
  fontSize: 11,
  fill: 'hsl(240 8% 56%)',
} as const;

// Cartesian grid lines
export const CHART_GRID_COLOR = 'hsl(240 15% 16%)';

// Hover cursor overlay for BarChart (was: white flash on dark bg)
export const CHART_CURSOR_BAR = {
  fill: 'hsl(240 20% 13%)',
  opacity: 0.6,
} as const;

// Hover cursor for LineChart
export const CHART_CURSOR_LINE = {
  stroke: 'hsl(240 15% 16%)',
  strokeWidth: 1,
} as const;
