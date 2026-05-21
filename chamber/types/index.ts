// ─── Core temporal graph ─────────────────────────────────────────────────────

export type Era = 'early' | 'middle' | 'late'
export type Confidence = 'documented' | 'inferred' | 'extrapolated'
export type ConstraintType = 'hard' | 'soft'
export type Stance = 'agrees' | 'challenges' | 'synthesizes' | 'questions'
export type MindId = 'jobs' | 'davinci' | 'einstein' | 'franklin' | 'musk'
export type InteractionMode = 'council' | 'sandbox' | 'archaeology' | 'live' | 'map'

export interface TemporalNode {
  mind_id: MindId
  era: Era
  date_range: string
  topic: string
  position: string
  confidence: Confidence
  source: {
    title: string
    chapter: string
    page_ref?: string
  }
  contradicts?: string[]
  caused_by?: string
  changed_to?: string
}

// ─── Constraints ─────────────────────────────────────────────────────────────

export interface Constraint {
  id: string
  name: string
  description: string
  type: ConstraintType
  defaultOn: boolean
  evidence: string
  source: string
  refusalPhrase?: string
}

export interface ConstraintState {
  id: string
  active: boolean
}

// ─── Contradictions ───────────────────────────────────────────────────────────

export interface Contradiction {
  mind_id: MindId
  topic: string
  position_a: { era: string; position: string; source: string }
  position_b: { era: string; position: string; source: string }
  note: string
}

// ─── Mind definition ─────────────────────────────────────────────────────────

export interface EraDefinition {
  id: Era
  label: string
  dateRange: string
  description: string
}

export interface Mind {
  id: MindId
  name: string
  fullName: string
  lifespan: string
  briefDescription: string
  primarySource: string
  secondarySources: string[]
  eras: EraDefinition[]
  constraints: Constraint[]
  voice: string
  errorPhrase: string
}

// ─── SSE events ──────────────────────────────────────────────────────────────

export type SSEEventType =
  | 'tension_detected'
  | 'contradiction_detected'
  | 'mind_start'
  | 'token'
  | 'mind_end'
  | 'synthesis_start'
  | 'synthesis_end'
  | 'awaiting_input'
  | 'user_intervention'
  | 'done'
  | 'error'

export interface TensionDetectedEvent {
  type: 'tension_detected'
  minds: MindId[]
  nature: string
}

export interface ContradictionDetectedEvent {
  type: 'contradiction_detected'
  topic: string
  position_a: { era: string; position: string; source: string }
  position_b: { era: string; position: string; source: string }
  note: string
}

export interface MindStartEvent {
  type: 'mind_start'
  mind_id: MindId
}

export interface TokenEvent {
  type: 'token'
  mind_id: MindId | 'synthesis'
  token: string
}

export interface MindEndEvent {
  type: 'mind_end'
  mind_id: MindId
  stance: Stance
  era_label: string
  citations: string[]
}

export interface AwaitingInputEvent {
  type: 'awaiting_input'
  mind_id_next: MindId
  options: ('challenge' | 'redirect' | 'ask_direct')[]
}

export type SSEEvent =
  | TensionDetectedEvent
  | ContradictionDetectedEvent
  | MindStartEvent
  | TokenEvent
  | MindEndEvent
  | AwaitingInputEvent
  | { type: 'synthesis_start' }
  | { type: 'synthesis_end' }
  | { type: 'done' }
  | { type: 'error'; message: string }

// ─── Reasoning trace ─────────────────────────────────────────────────────────

export interface TraceStep {
  label: string
  value: string
  constraintId?: string
}

export interface ReasoningTrace {
  steps: TraceStep[]
  hypotheticalSentences: number[]
}

// ─── Debate state ─────────────────────────────────────────────────────────────

export interface DebateEntry {
  mind_id: MindId
  text: string
  stance?: Stance
  era_label?: string
  citations?: string[]
  isStreaming: boolean
  contradiction?: Contradiction
}

export interface InterventionRecord {
  type: 'challenge' | 'redirect' | 'ask_direct'
  content: string
  target_mind?: MindId
  after_mind: MindId
}

// ─── Graph / map ──────────────────────────────────────────────────────────────

export interface MapNode {
  id: string
  topic: string
  era: Era
  frequency: number
  connections: string[]
  connectionNotes: Record<string, string>
}

export interface MapEdge {
  source: string
  target: string
  note: string
}

// ─── Archaeology ─────────────────────────────────────────────────────────────

export interface ArchaeologyTimeline {
  mind_id: MindId
  topic: string
  nodes: {
    era: Era
    date_range: string
    position: string
    source: string
    caused_by?: string
    contradicts_era?: Era
    contradiction_note?: string
  }[]
  summary: string
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export interface AuditData {
  question: string
  mind: Mind
  era: EraDefinition
  activeConstraints: Constraint[]
  retrievedChunks: string[]
  trace: ReasoningTrace
  response: string
  contradictions: Contradiction[]
  hypothetical?: string
  timestamp: string
}
