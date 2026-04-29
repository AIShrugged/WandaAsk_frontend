'use client';

import { useCallback, useEffect, useRef } from 'react';

import type { CriticalPathEdge, CriticalPathNode } from '../model/types';

const NODE_W = 192;
const NODE_H = 68;
const COL_GAP = 110;
const ROW_GAP = 24;

const STATUS_COLOR: Record<string, string> = {
  done: '#34d399',
  in_progress: '#60a5fa',
  open: '#a78bfa',
};

function getStatusColor(status: string | null) {
  return STATUS_COLOR[status ?? ''] ?? '#4d5880';
}

function computeLevels(nodes: CriticalPathNode[], edges: CriticalPathEdge[]) {
  const nodeIds = new Set(nodes.map((n) => {return n.node_id}));
  const successors = new Map<number, number[]>();
  const predecessors = new Map<number, number[]>();

  for (const node of nodes) {
    successors.set(node.node_id, []);
    predecessors.set(node.node_id, []);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.from_node_id) || !nodeIds.has(edge.to_node_id))
      continue;
    successors.get(edge.from_node_id)?.push(edge.to_node_id);
    predecessors.get(edge.to_node_id)?.push(edge.from_node_id);
  }

  const levels = new Map<number, number>();
  const getLevel = (id: number): number => {
    if (levels.has(id)) return levels.get(id)!;
    const preds = predecessors.get(id) ?? [];
    const level = preds.length > 0 ? Math.max(...preds.map((id) => getLevel(id))) + 1 : 0;
    levels.set(id, level);
    return level;
  };

  for (const node of nodes) getLevel(node.node_id);
  return levels;
}

function computePositions(
  nodes: CriticalPathNode[],
  edges: CriticalPathEdge[],
) {
  const levels = computeLevels(nodes, edges);
  const maxLevel = Math.max(0, ...levels.values());

  const cols: Map<number, number[]> = new Map();
  for (let l = 0; l <= maxLevel; l++) cols.set(l, []);
  for (const node of nodes) {
    const level = levels.get(node.node_id) ?? 0;
    cols.get(level)?.push(node.node_id);
  }

  const maxColSize = Math.max(1, ...[...cols.values()].map((c) => {return c.length}));
  const totalH = maxColSize * (NODE_H + ROW_GAP) - ROW_GAP;

  const positions = new Map<number, { x: number; y: number }>();
  for (let l = 0; l <= maxLevel; l++) {
    const ids = cols.get(l) ?? [];
    const colH = ids.length * (NODE_H + ROW_GAP) - ROW_GAP;
    const startY = (totalH - colH) / 2;
    for (const [i, id] of ids.entries()) {
      positions.set(id, {
        x: l * (NODE_W + COL_GAP) + 40,
        y: startY + i * (NODE_H + ROW_GAP) + 40,
      });
    }
  }
  return positions;
}

function edgePath(sx: number, sy: number, tx: number, ty: number) {
  const dx = Math.abs(tx - sx) * 0.45;
  return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

interface CriticalPathGraphProps {
  nodes: CriticalPathNode[];
  edges: CriticalPathEdge[];
  selectedNodeId: number | null;
  onSelectNode: (id: number | null) => void;
}

export function CriticalPathGraph({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
}: CriticalPathGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const transformRef = useRef<Transform>({ x: 0, y: 0, scale: 1 });
  const groupRef = useRef<SVGGElement>(null);
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, tx: 0, ty: 0 });

  const nodeIds = new Set(nodes.map((n) => {return n.node_id}));
  const renderableEdges = edges.filter(
    (e) => {return nodeIds.has(e.from_node_id) && nodeIds.has(e.to_node_id)},
  );

  const positions = computePositions(nodes, renderableEdges);

  const allX = [...positions.values()].map((p) => {return p.x + NODE_W});
  const allY = [...positions.values()].map((p) => {return p.y + NODE_H});
  const graphW = allX.length > 0 ? Math.max(...allX) + 60 : 400;
  const graphH = allY.length > 0 ? Math.max(...allY) + 60 : 300;

  const criticalNodeIds = new Set(
    nodes.filter((n) => {return n.is_critical}).map((n) => {return n.node_id}),
  );

  const criticalChainEdges = new Set<string>();
  for (const edge of renderableEdges) {
    if (
      criticalNodeIds.has(edge.from_node_id) &&
      criticalNodeIds.has(edge.to_node_id)
    ) {
      criticalChainEdges.add(`${edge.from_node_id}-${edge.to_node_id}`);
    }
  }

  const selectedPredecessors = new Set<number>();
  if (selectedNodeId !== null) {
    for (const edge of renderableEdges) {
      if (edge.to_node_id === selectedNodeId)
        selectedPredecessors.add(edge.from_node_id);
    }
  }

  const applyTransform = useCallback(() => {
    if (!groupRef.current) return;
    const t = transformRef.current;
    groupRef.current.setAttribute(
      'transform',
      `translate(${t.x},${t.y}) scale(${t.scale})`,
    );
  }, []);

  const setTransform = useCallback(
    (fn: (prev: Transform) => Transform) => {
      transformRef.current = fn(transformRef.current);
      applyTransform();
    },
    [applyTransform],
  );

  const fitToView = useCallback(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const scale = Math.min(1, (width - 32) / graphW, (height - 32) / graphH);
    transformRef.current = {
      x: (width - graphW * scale) / 2,
      y: (height - graphH * scale) / 2,
      scale,
    };
    applyTransform();
  }, [graphW, graphH, applyTransform]);

  useEffect(() => {
    fitToView();
  }, [fitToView]);

  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const rect = svgRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setTransform((prev) => {
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.max(0.25, Math.min(3, prev.scale * factor));
        const ratio = newScale / prev.scale;
        return {
          scale: newScale,
          x: mx - (mx - prev.x) * ratio,
          y: my - (my - prev.y) * ratio,
        };
      });
    },
    [setTransform],
  );

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {return el.removeEventListener('wheel', onWheel)};
  }, [onWheel]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as Element).closest('.cpm-node')) return;
      dragging.current = true;
      dragStart.current = {
        mx: e.clientX,
        my: e.clientY,
        tx: transformRef.current.x,
        ty: transformRef.current.y,
      };
    },
    [],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - dragStart.current.mx;
      const dy = e.clientY - dragStart.current.my;
      setTransform((prev) => {return {
        ...prev,
        x: dragStart.current.tx + dx,
        y: dragStart.current.ty + dy,
      }});
    },
    [setTransform],
  );

  const stopDrag = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      className='relative flex-1 overflow-hidden'
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, hsl(240 20% 10%) 0%, hsl(240 40% 2%) 70%)',
        cursor: 'grab',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >
      <svg ref={svgRef} className='absolute inset-0 w-full h-full'>
        <defs>
          <filter id='cpm-glow-critical' x='-50%' y='-50%' width='200%' height='200%'>
            <feGaussianBlur in='SourceGraphic' stdDeviation='3' result='blur' />
            <feMerge>
              <feMergeNode in='blur' />
              <feMergeNode in='SourceGraphic' />
            </feMerge>
          </filter>
          <filter id='cpm-glow-node' x='-30%' y='-30%' width='160%' height='160%'>
            <feGaussianBlur in='SourceGraphic' stdDeviation='5' result='blur' />
            <feMerge>
              <feMergeNode in='blur' />
              <feMergeNode in='SourceGraphic' />
            </feMerge>
          </filter>
          <marker id='cpm-arrow-normal' markerWidth='8' markerHeight='8' refX='7' refY='3' orient='auto'>
            <path d='M0,0 L0,6 L8,3 z' fill='hsl(240 15% 16%)' />
          </marker>
          <marker id='cpm-arrow-critical' markerWidth='8' markerHeight='8' refX='7' refY='3' orient='auto'>
            <path d='M0,0 L0,6 L8,3 z' fill='#ff7043' />
          </marker>
          <marker id='cpm-arrow-selected' markerWidth='8' markerHeight='8' refX='7' refY='3' orient='auto'>
            <path d='M0,0 L0,6 L8,3 z' fill='#60a5fa' />
          </marker>
          <pattern id='cpm-dots' x='0' y='0' width='32' height='32' patternUnits='userSpaceOnUse'>
            <circle cx='1' cy='1' r='1' fill='hsl(240 15% 16%)' opacity='0.5' />
          </pattern>
        </defs>

        <rect width='100%' height='100%' fill='url(#cpm-dots)' />

        <g ref={groupRef}>
          {renderableEdges.map((edge) => {
            const sp = positions.get(edge.from_node_id);
            const tp = positions.get(edge.to_node_id);
            if (!sp || !tp) return null;
            const sx = sp.x + NODE_W;
            const sy = sp.y + NODE_H / 2;
            const tx = tp.x;
            const ty = tp.y + NODE_H / 2;
            const key = `${edge.from_node_id}-${edge.to_node_id}`;
            const isCritical = criticalChainEdges.has(key);
            const isSelected =
              selectedNodeId !== null &&
              (edge.to_node_id === selectedNodeId || edge.from_node_id === selectedNodeId);
            const d = edgePath(sx, sy, tx, ty);

            if (isCritical) {
              return (
                <g key={key}>
                  <path
                    d={d}
                    stroke='#ff7043'
                    strokeWidth='3'
                    fill='none'
                    opacity='0.25'
                    filter='url(#cpm-glow-critical)'
                  />
                  <path
                    d={d}
                    stroke='#ff7043'
                    strokeWidth='2'
                    fill='none'
                    opacity='0.9'
                    markerEnd='url(#cpm-arrow-critical)'
                  />
                </g>
              );
            }

            if (isSelected) {
              return (
                <path
                  key={key}
                  d={d}
                  stroke='#60a5fa'
                  strokeWidth='1.5'
                  fill='none'
                  strokeDasharray='4 3'
                  opacity='0.7'
                  markerEnd='url(#cpm-arrow-selected)'
                />
              );
            }

            return (
              <path
                key={key}
                d={d}
                stroke='hsl(240 15% 16%)'
                strokeWidth='1.5'
                fill='none'
                opacity='0.7'
                markerEnd='url(#cpm-arrow-normal)'
              />
            );
          })}

          {nodes.map((node) => {
            const pos = positions.get(node.node_id);
            if (!pos) return null;
            const isSelected = node.node_id === selectedNodeId;
            const isCritical = node.is_critical;
            const isDimmed =
              selectedNodeId !== null &&
              !isSelected &&
              !isCritical &&
              !selectedPredecessors.has(node.node_id);
            const sc = getStatusColor(node.status);
            let borderColor = 'hsl(240 15% 16%)';
            if (isCritical) borderColor = '#ff7043';
            if (isSelected) borderColor = '#60a5fa';

            let bgColor = 'hsl(240 30% 7%)';
            if (isCritical) bgColor = 'hsl(15 20% 10%)';
            if (isSelected) bgColor = 'hsl(230 35% 14%)';
            const slack = node.slack ?? 0;
            const name = node.issue_name ?? `Issue #${node.issue_id}`;
            const truncatedName =
              name.length > 20 ? name.slice(0, 19) + '…' : name;

            return (
              <g
                key={node.node_id}
                className='cpm-node'
                style={{ cursor: 'pointer', opacity: isDimmed ? 0.4 : 1, transition: 'opacity 0.2s' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(isSelected ? null : node.node_id);
                }}
              >
                {isCritical && (
                  <rect
                    x={pos.x - 2}
                    y={pos.y - 2}
                    width={NODE_W + 4}
                    height={NODE_H + 4}
                    rx='11'
                    fill='rgba(255,112,67,0.06)'
                    stroke='rgba(255,112,67,0.15)'
                    strokeWidth='1'
                    filter='url(#cpm-glow-node)'
                  />
                )}
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx='9'
                  fill={bgColor}
                  stroke={borderColor}
                  strokeWidth={isSelected || isCritical ? 1.5 : 1}
                />
                <rect
                  x={pos.x}
                  y={pos.y}
                  width='3'
                  height={NODE_H}
                  rx='1.5'
                  fill={isCritical ? '#ff7043' : sc}
                  opacity={isCritical ? 1 : 0.7}
                />
                <text
                  x={pos.x + 14}
                  y={pos.y + 19}
                  fontSize='9'
                  fontWeight='700'
                  fill={isCritical ? '#ff7043' : '#4d5880'}
                  letterSpacing='0.06em'
                  style={{ textTransform: 'uppercase' }}
                >
                  {`#${node.issue_id}${isCritical ? ' · CP' : ''}`}
                </text>
                <text
                  x={pos.x + 14}
                  y={pos.y + 36}
                  fontSize='12'
                  fontWeight='600'
                  fill='hsl(240 30% 90%)'
                >
                  {truncatedName}
                </text>
                <text
                  x={pos.x + 14}
                  y={pos.y + 53}
                  fontSize='10'
                  fill='#6b7a9c'
                >
                  {`${node.duration_days}d  ·  ES:${node.early_start ?? '?'}  EF:${node.early_finish ?? '?'}`}
                </text>
                <circle cx={pos.x + NODE_W - 16} cy={pos.y + 16} r='4' fill={sc} />
                {node.status === 'in_progress' && (
                  <circle
                    cx={pos.x + NODE_W - 16}
                    cy={pos.y + 16}
                    r='7'
                    fill='none'
                    stroke={sc}
                    strokeWidth='1'
                    opacity='0.3'
                  />
                )}
                <rect
                  x={pos.x + NODE_W - 42}
                  y={pos.y + NODE_H - 20}
                  width='32'
                  height='14'
                  rx='4'
                  fill={slack === 0 ? 'rgba(255,112,67,0.12)' : 'rgba(30,38,64,0.8)'}
                  stroke={slack === 0 ? 'rgba(255,112,67,0.3)' : '#2a3050'}
                  strokeWidth='0.5'
                />
                <text
                  x={pos.x + NODE_W - 26}
                  y={pos.y + NODE_H - 9}
                  fontSize='9'
                  fontWeight='700'
                  textAnchor='middle'
                  fill={slack === 0 ? '#ff7043' : '#4d5880'}
                >
                  {slack === 0 ? 'Slack:0' : `+${slack}`}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Zoom controls */}
      <div className='absolute bottom-4 left-4 flex flex-col gap-0.5'>
        <button
          type='button'
          onClick={() => setTransform((p) => ({ ...p, scale: Math.min(3, p.scale * 1.2) }))}
          className='w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground bg-card border border-border hover:border-border/80 transition-colors text-base select-none'
        >
          +
        </button>
        <button
          type='button'
          onClick={() => setTransform((p) => ({ ...p, scale: Math.max(0.25, p.scale / 1.2) }))}
          className='w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground bg-card border border-border hover:border-border/80 transition-colors text-base select-none'
        >
          −
        </button>
        <button
          type='button'
          onClick={fitToView}
          className='w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground bg-card border border-border hover:border-border/80 transition-colors text-[11px] select-none'
        >
          ⊡
        </button>
      </div>

      {/* Legend */}
      <div className='absolute bottom-4 right-4 flex flex-col gap-1.5 bg-card/80 backdrop-blur-sm border border-border rounded-lg px-3.5 py-2.5'>
        <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
          Legend
        </p>
        <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
          <span
            className='w-5 h-0.5 shrink-0 rounded-full'
            style={{ background: '#ff7043', boxShadow: '0 0 6px rgba(255,112,67,0.5)' }}
          />
          Critical path
        </div>
        <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
          <span className='w-5 h-0.5 shrink-0 rounded-full bg-border' />
          Dependency
        </div>
        <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
          <span className='w-2 h-2 shrink-0 rounded-sm' style={{ background: '#34d399' }} />
          Done
        </div>
        <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
          <span className='w-2 h-2 shrink-0 rounded-sm' style={{ background: '#60a5fa' }} />
          In Progress
        </div>
        <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
          <span className='w-2 h-2 shrink-0 rounded-sm bg-muted' />
          Open
        </div>
      </div>

      {/* Click outside to deselect */}
      {selectedNodeId !== null && (
        <div
          className='absolute inset-0'
          style={{ zIndex: -1 }}
          onClick={() => {return onSelectNode(null)}}
        />
      )}
    </div>
  );
}
