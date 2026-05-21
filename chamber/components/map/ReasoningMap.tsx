'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { AnimatePresence } from 'framer-motion'
import NodeDetail from './NodeDetail'
import type { MindId } from '@/types'

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string
  topic: string
  era: 'early' | 'middle' | 'late'
  frequency: number
  spoken: string
  citation: string
}

interface EdgeDatum extends d3.SimulationLinkDatum<NodeDatum> {
  note: string
}

interface Props {
  mindId: MindId
  nodes: NodeDatum[]
  edges: EdgeDatum[]
}

const ERA_COLOR: Record<string, string> = {
  early:  '#c8a84a',
  middle: '#8a6a2a',
  late:   '#4a3c1e',
}

const MIN_R = 8
const MAX_R = 28

export default function ReasoningMap({ mindId, nodes, edges }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selected, setSelected] = useState<NodeDatum | null>(null)
  const [edgeTooltip, setEdgeTooltip] = useState<{ x: number; y: number; note: string } | null>(null)
  const simulationRef = useRef<d3.Simulation<NodeDatum, EdgeDatum> | null>(null)

  const runSimulation = useCallback(() => {
    if (!svgRef.current || nodes.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height } = svgRef.current.getBoundingClientRect()
    if (!width || !height) return

    const freqExtent = d3.extent(nodes, (n) => n.frequency) as [number, number]
    const rScale = d3.scaleSqrt().domain(freqExtent).range([MIN_R, MAX_R])

    // Deep-copy nodes, start at jittered center to avoid singularity
    const cx = width / 2
    const cy = height / 2
    const simNodes: NodeDatum[] = nodes.map((n, i) => ({
      ...n,
      x: cx + (Math.cos((i / nodes.length) * Math.PI * 2) * 60),
      y: cy + (Math.sin((i / nodes.length) * Math.PI * 2) * 60),
    }))
    const nodeMap = new Map(simNodes.map((n) => [n.id, n]))

    const simEdges: EdgeDatum[] = edges.map((e) => ({
      ...e,
      source: nodeMap.get(e.source as string) ?? e.source,
      target: nodeMap.get(e.target as string) ?? e.target,
    }))

    const g = svg.append('g')

    // Zoom
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.4, 2.5])
        .on('zoom', (event) => g.attr('transform', event.transform))
    )

    // Edges
    const link = g.append('g')
      .selectAll<SVGLineElement, EdgeDatum>('line')
      .data(simEdges)
      .join('line')
      .attr('stroke', 'rgba(244,239,229,0.12)')
      .attr('stroke-width', 1)
      .style('cursor', 'default')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('stroke', 'rgba(244,239,229,0.65)')
        const [mx, my] = d3.pointer(event, svgRef.current!)
        setEdgeTooltip({ x: mx, y: my, note: d.note })
      })
      .on('mouseleave', function () {
        d3.select(this).attr('stroke', 'rgba(244,239,229,0.12)')
        setEdgeTooltip(null)
      })

    // Nodes
    const node = g.append('g')
      .selectAll<SVGGElement, NodeDatum>('g')
      .data(simNodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, NodeDatum>()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart()
            d.fx = d.x; d.fy = d.y
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0)
            d.fx = null; d.fy = null
          })
      )
      .on('click', (_, d) => setSelected(d))

    node.append('circle')
      .attr('r', (d) => rScale(d.frequency))
      .attr('fill', (d) => ERA_COLOR[d.era] ?? '#c8a84a')
      .attr('stroke', 'rgba(244,239,229,0.25)')
      .attr('stroke-width', 1)

    node.append('text')
      .text((d) => d.topic)
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => rScale(d.frequency) + 12)
      .attr('fill', 'rgba(244,239,229,0.7)')
      .attr('font-family', 'var(--font-dm-mono)')
      .attr('font-size', '9px')
      .attr('letter-spacing', '0.08em')
      .style('pointer-events', 'none')
      .style('text-transform', 'uppercase')

    // Simulation — gentler charge + x/y centering forces keep nodes in viewport
    const sim = d3.forceSimulation<NodeDatum>(simNodes)
      .force('link', d3.forceLink<NodeDatum, EdgeDatum>(simEdges).id((d) => d.id).distance(110).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-90))
      .force('center', d3.forceCenter(cx, cy).strength(0.08))
      .force('x', d3.forceX(cx).strength(0.04))
      .force('y', d3.forceY(cy).strength(0.04))
      .force('collision', d3.forceCollide<NodeDatum>().radius((d) => rScale(d.frequency) + 14))
      .on('tick', () => {
        link
          .attr('x1', (d) => (d.source as NodeDatum).x ?? 0)
          .attr('y1', (d) => (d.source as NodeDatum).y ?? 0)
          .attr('x2', (d) => (d.target as NodeDatum).x ?? 0)
          .attr('y2', (d) => (d.target as NodeDatum).y ?? 0)
        node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
      })

    simulationRef.current = sim
  }, [mindId, nodes, edges])

  useEffect(() => {
    const timeout = setTimeout(runSimulation, 80)
    return () => {
      clearTimeout(timeout)
      simulationRef.current?.stop()
    }
  }, [runSimulation])

  // Update glow without restarting simulation
  useEffect(() => {
    if (!svgRef.current) return
    d3.select(svgRef.current)
      .selectAll<SVGCircleElement, NodeDatum>('circle')
      .attr('filter', (d) =>
        selected?.id === d.id
          ? 'drop-shadow(0 0 10px rgba(200,168,74,0.9))'
          : null
      )
      .attr('stroke', (d) =>
        selected?.id === d.id
          ? 'rgba(200,168,74,0.6)'
          : 'rgba(244,239,229,0.25)'
      )
  }, [selected])

  // Re-run when window resizes
  useEffect(() => {
    const handler = () => runSimulation()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [runSimulation])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      />

      {/* Edge tooltip */}
      {edgeTooltip && (
        <div
          style={{
            position: 'absolute',
            left: edgeTooltip.x + 12,
            top: edgeTooltip.y - 8,
            backgroundColor: 'rgba(12,11,9,0.92)',
            border: '1px solid rgba(200,168,74,0.25)',
            padding: '0.45rem 0.7rem',
            fontFamily: 'var(--font-cormorant)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '0.82rem',
            color: 'var(--parchment)',
            lineHeight: 1.55,
            maxWidth: 220,
            pointerEvents: 'none',
            zIndex: 15,
          }}
        >
          {edgeTooltip.note}
        </div>
      )}

      {/* Node detail panel */}
      <AnimatePresence>
        {selected && (
          <NodeDetail
            key={selected.id}
            topic={selected.topic}
            era={selected.era}
            text={selected.spoken}
            citation={selected.citation}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
