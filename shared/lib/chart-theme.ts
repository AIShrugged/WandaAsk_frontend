// Chart theme constants — resolved from CSS custom properties at render time.
// Using var() references ensures correct rendering in both light and dark themes
// and remains valid after the TRIBES OKLCH token migration (Phase 1).
// ⚠️ Token names must stay in sync with the @theme inline block in globals.css.

// Tooltip background and text follow the card/surface theme
export const CHART_TOOLTIP_STYLE = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  fontSize: 12,
  color: 'var(--color-foreground)',
} as const;

// Axis tick labels
export const CHART_TICK_STYLE = {
  fontSize: 11,
  fill: 'var(--color-muted-foreground)',
} as const;

// Cartesian grid lines
export const CHART_GRID_COLOR = 'var(--color-border)';

// Hover cursor overlay for BarChart
export const CHART_CURSOR_BAR = {
  fill: 'var(--color-muted)',
  opacity: 0.6,
} as const;

// Hover cursor for LineChart
export const CHART_CURSOR_LINE = {
  stroke: 'var(--color-border)',
  strokeWidth: 1,
} as const;
