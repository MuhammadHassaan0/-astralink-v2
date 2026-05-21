'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import ReasoningMap from '@/components/map/ReasoningMap'
import { MINDS } from '@/lib/minds'
import type { MindId } from '@/types'

// ─── Static graph data per mind ───────────────────────────────────────────────

const GRAPH_DATA: Record<MindId, { nodes: any[]; edges: any[] }> = {
  jobs: {
    nodes: [
      { id: 'simplicity',  topic: 'Simplicity',       era: 'late',   frequency: 28, spoken: 'Simple can be harder than complex. You have to work hard to get your thinking clean to make it simple. But it\'s worth it in the end, because once you get there, you can move mountains.', citation: 'Ch. 24, Steve Jobs, Isaacson (2011)' },
      { id: 'death',       topic: 'Death',             era: 'late',   frequency: 22, spoken: 'Remembering that you are going to die is the best way I know to avoid the trap of thinking you have something to lose. You are already naked. There is no reason not to follow your heart.', citation: 'Stanford Commencement Address (2005)' },
      { id: 'design',      topic: 'Design',            era: 'late',   frequency: 26, spoken: 'Design is not just what it looks like and feels like. Design is how it works. Most people make the mistake of thinking design is what it looks like.', citation: 'Ch. 24, Steve Jobs, Isaacson (2011)' },
      { id: 'endtoend',    topic: 'End-to-end',        era: 'early',  frequency: 20, spoken: 'The most important decisions I\'ve ever made are the things I decided not to do. The Mac was great because we controlled the whole thing — hardware, software, packaging, the store experience.', citation: 'Ch. 7, Steve Jobs, Isaacson (2011)' },
      { id: 'intuition',   topic: 'Intuition',         era: 'middle', frequency: 14, spoken: 'Intuition is a very powerful thing — more powerful than intellect, in my opinion. Western rational thought is not an innate human characteristic; it is learned and is the great achievement of Western civilization.', citation: 'Ch. 3, Steve Jobs, Isaacson (2011)' },
      { id: 'zen',         topic: 'Zen',               era: 'early',  frequency: 12, spoken: 'I took a calligraphy class, and ten years later, we put it all into the Mac. You can\'t connect the dots looking forward; you can only connect them looking backward.', citation: 'Stanford Commencement Address (2005)' },
      { id: 'focus',       topic: 'Focus',             era: 'late',   frequency: 18, spoken: 'People think focus means saying yes to the thing you\'ve got to focus on. But that\'s not what it means at all. It means saying no to the hundred other good ideas that there are.', citation: 'Apple Worldwide Developers Conference (1997)' },
      { id: 'product',     topic: 'Product',           era: 'late',   frequency: 24, spoken: 'We\'re gambling on our vision, and we would rather do that than make "me too" products. Let some other companies do that. For us, it\'s always the next dream.', citation: 'Ch. 24, Steve Jobs, Isaacson (2011)' },
      { id: 'creativity',  topic: 'Creativity',        era: 'middle', frequency: 16, spoken: 'Creativity is just connecting things. When you ask creative people how they did something, they feel a little guilty because they didn\'t really do it — they just saw something.', citation: 'Wired interview (1996)' },
    ],
    edges: [
      { source: 'simplicity', target: 'design',     note: 'Design is the application of simplicity to human need — the two are inseparable in Jobs\'s documented thinking.' },
      { source: 'simplicity', target: 'focus',      note: 'Focus requires removing everything that does not contribute. Simplicity and focus are the same discipline applied differently.' },
      { source: 'death',      target: 'simplicity', note: '"Remembering you will die" eliminates the need for complexity — you stop adding and start removing.' },
      { source: 'death',      target: 'product',    note: 'Mortality as design principle drove the product decisions from 2004 onward — single-button, radical reduction.' },
      { source: 'zen',        target: 'simplicity', note: 'The calligraphy class, the Reed College exposure to Zen aesthetics — the root of the simplicity conviction.' },
      { source: 'intuition',  target: 'zen',        note: 'Zen practice trained the intuition — the trust in non-rational knowing that Jobs deployed throughout his career.' },
      { source: 'endtoend',   target: 'product',    note: 'End-to-end control is the precondition for great product — you cannot make something excellent if you don\'t own the whole system.' },
      { source: 'creativity', target: 'intuition',  note: 'Creativity is pattern-matching by intuition — connecting things others cannot see because they rely too heavily on explicit reasoning.' },
      { source: 'design',     target: 'product',    note: 'Every product decision is a design decision. The two cannot be separated without destroying both.' },
      { source: 'focus',      target: 'endtoend',   note: 'Focus enables end-to-end control — saying no to everything outside the core product domain.' },
    ],
  },

  davinci: {
    nodes: [
      { id: 'observation', topic: 'Observation',   era: 'early',  frequency: 28, spoken: 'My object is first to cite experience and then to show by reason why experience is compelled to work in such a way. And this is the true rule by which those who speculate about the effects of nature must proceed.', citation: 'Codex Atlanticus fol. 154r' },
      { id: 'analogy',     topic: 'Analogy',       era: 'middle', frequency: 22, spoken: 'The blood in its movement serves the body as the ocean serves the earth — supplying life to the distant parts, drawing back, and supplying again. I have drawn the rivers of blood as I draw rivers of water.', citation: 'Codex Leicester, fol. 2r' },
      { id: 'unfinished',  topic: 'Unfinished',    era: 'late',   frequency: 20, spoken: 'I have never finished a single work that I set out to complete. Yet the notebooks contain ten thousand pages. Perhaps the notebooks are the work.', citation: 'Ch. 15, Leonardo da Vinci, Isaacson (2017)' },
      { id: 'anatomy',     topic: 'Anatomy',       era: 'middle', frequency: 24, spoken: 'I have dissected more than thirty human bodies, destroying all the other members, and removing the very minutest particles of the flesh by which these veins are surrounded. I know the nerves, the bones, the way light enters the eye.', citation: 'Ch. 12, Leonardo da Vinci, Isaacson (2017)' },
      { id: 'flight',      topic: 'Flight',        era: 'middle', frequency: 18, spoken: 'A bird is an instrument working according to mathematical law. It lies within the power of man to make this instrument with all its motions, but not with as much virtue, for it has not the spirit of sensation.', citation: 'Codex on the Flight of Birds, fol. 1r' },
      { id: 'water',       topic: 'Water',         era: 'early',  frequency: 16, spoken: 'Water is sometimes sharp and sometimes strong, sometimes acid and sometimes bitter, sometimes sweet and sometimes thick or thin, sometimes it is seen bringing hurt or pestilence, sometime health-giving, sometimes poisonous.', citation: 'Codex Leicester, fol. 15v' },
      { id: 'painting',    topic: 'Painting',      era: 'early',  frequency: 26, spoken: 'Painting is poetry that is seen rather than felt, and poetry is painting that is felt rather than seen. Each illuminates the other; neither can be fully understood in isolation.', citation: 'Ch. 8, Leonardo da Vinci, Isaacson (2017)' },
      { id: 'curiosity',   topic: 'Curiosity',     era: 'early',  frequency: 20, spoken: 'The noblest pleasure is the joy of understanding. I have wasted my hours. But not one of them — every question I followed led me to the next thing I needed to know.', citation: 'Ch. 1, Leonardo da Vinci, Isaacson (2017)' },
    ],
    edges: [
      { source: 'observation', target: 'anatomy',   note: 'Anatomy begins with looking — thirty dissected bodies observed, recorded, drawn before any theory.' },
      { source: 'observation', target: 'water',     note: 'Leonardo spent years watching water move — every notebook on hydraulics begins with observation.' },
      { source: 'analogy',     target: 'anatomy',   note: 'The blood/ocean analogy: anatomy understood through the analogy of river systems observed in nature.' },
      { source: 'analogy',     target: 'flight',    note: 'Flight studied through analogy to observed nature — birds as instruments, wings as levers.' },
      { source: 'painting',    target: 'observation',note: 'Painting demands more precise observation than any science — the eye must learn to see before the hand can render.' },
      { source: 'curiosity',   target: 'unfinished',note: 'Curiosity is the engine of the unfinished work — each question opens three more before the first is answered.' },
      { source: 'anatomy',     target: 'painting',  note: 'Anatomy and painting are the same discipline — both require understanding structure beneath surface.' },
      { source: 'flight',      target: 'water',     note: 'Air and water obey the same laws — Leonardo\'s fluid dynamics notebooks informed his flying machine designs.' },
    ],
  },

  einstein: {
    nodes: [
      { id: 'intuition',  topic: 'Intuition',      era: 'early',  frequency: 26, spoken: 'I have no special talent. I am only passionately curious. The only real valuable thing is intuition. A thought experiment is just curiosity given form — you ride the beam of light and see what happens.', citation: 'Ch. 1, Einstein: His Life and Universe, Isaacson (2007)' },
      { id: 'realism',    topic: 'Realism',         era: 'late',   frequency: 24, spoken: 'The moon exists when no one is looking at it. I cannot believe that God plays dice with the universe. Physical reality must exist independently of whether it is observed.', citation: 'EPR paper (1935); Ch. 23, Isaacson (2007)' },
      { id: 'spacetime',  topic: 'Space-time',      era: 'early',  frequency: 22, spoken: 'There is no absolute time. There is no absolute space. There is only space-time, and it is curved by mass. I knew this before I had the mathematics to prove it — the mathematics took ten years.', citation: 'Ch. 6, Einstein: His Life and Universe, Isaacson (2007)' },
      { id: 'unified',    topic: 'Unified field',   era: 'late',   frequency: 18, spoken: 'I want to know God\'s thoughts. The rest are details. The unified field is not a career ambition — it is the only question left worth asking.', citation: 'Ch. 26, Einstein: His Life and Universe, Isaacson (2007)' },
      { id: 'quantum',    topic: 'Quantum',          era: 'middle', frequency: 20, spoken: 'Quantum mechanics is very impressive. But an inner voice tells me that it is not yet the real thing. The theory produces a great deal but hardly brings us closer to the secret of the Old One.', citation: 'Letter to Max Born (1926)' },
      { id: 'peace',      topic: 'Pacifism',         era: 'late',   frequency: 14, spoken: 'I am not only a pacifist but a militant pacifist. I am willing to fight for peace. Nothing will end war unless the people themselves refuse to go to war. I signed the manifesto knowing I would not live to see its effect.', citation: 'Russell-Einstein Manifesto (1955)' },
      { id: 'beauty',     topic: 'Mathematical beauty', era: 'middle', frequency: 16, spoken: 'If you can\'t explain it simply, you don\'t understand it well enough. But a beautiful theory is not necessarily a correct one — nature is not required to be beautiful. Yet it usually is.', citation: 'Ch. 14, Einstein: His Life and Universe, Isaacson (2007)' },
    ],
    edges: [
      { source: 'intuition', target: 'spacetime',  note: 'Special relativity originated as a thought experiment — riding a light beam — not from equations.' },
      { source: 'intuition', target: 'quantum',    note: 'Einstein\'s intuition told him quantum mechanics was incomplete decades before he could prove it.' },
      { source: 'realism',   target: 'quantum',    note: 'The EPR paper: quantum mechanics violates physical realism. Einstein chose realism over the formalism.' },
      { source: 'realism',   target: 'unified',    note: 'A unified field theory would restore realism — replacing quantum probability with deterministic description.' },
      { source: 'spacetime', target: 'unified',    note: 'General relativity is a field theory of gravity. The unified field extends it to electromagnetism.' },
      { source: 'beauty',    target: 'unified',    note: 'The unified field must be beautiful — Einstein\'s aesthetic sense was a genuine heuristic for theory selection.' },
      { source: 'peace',     target: 'realism',    note: 'Political realism mirrors physical realism: reality exists whether you acknowledge it or not.' },
    ],
  },

  franklin: {
    nodes: [
      { id: 'coalition',    topic: 'Coalition',    era: 'late',   frequency: 26, spoken: 'A man who cannot bring others along with him has no real power, whatever his title. I have never achieved a single significant thing alone. Every one of them was done by persuading enough people to want the same end.', citation: 'Ch. 18, Benjamin Franklin: An American Life, Isaacson (2003)' },
      { id: 'utility',      topic: 'Utility',      era: 'early',  frequency: 24, spoken: 'What signifies philosophy that does not apply to some use? The lightning rod. The bifocals. The public library. The fire company. These are philosophy made useful. An idea that helps no one is decoration.', citation: 'Ch. 8, Benjamin Franklin: An American Life, Isaacson (2003)' },
      { id: 'diplomacy',    topic: 'Diplomacy',    era: 'middle', frequency: 22, spoken: 'The most effective way to get what you want is to make the other party believe it was their idea. I spent six years in Paris doing this on behalf of a country that did not yet exist.', citation: 'Ch. 16, Benjamin Franklin: An American Life, Isaacson (2003)' },
      { id: 'humor',        topic: 'Humor',        era: 'early',  frequency: 18, spoken: 'Poor Richard knew that a man who makes you laugh has your attention, and a man who has your attention can plant whatever he wishes there. Humor is the most efficient form of persuasion ever devised.', citation: 'Poor Richard\'s Almanack (1733–1758)' },
      { id: 'curiosity',    topic: 'Curiosity',    era: 'early',  frequency: 16, spoken: 'I made so little study of electricity in my youth that I was entirely self-taught. This is perhaps why I was not impeded by what was known. I simply wanted to know what the lightning was.', citation: 'Ch. 8, Benjamin Franklin: An American Life, Isaacson (2003)' },
      { id: 'compromise',   topic: 'Compromise',   era: 'late',   frequency: 20, spoken: 'I confess that there are several parts of this constitution which I do not at present approve of. But I am not sure I shall never approve of them. Having lived long, I have experienced many instances of being obliged to change opinions.', citation: 'Constitutional Convention (1787)' },
      { id: 'improvement',  topic: 'Self-improvement', era: 'early', frequency: 14, spoken: 'I proposed to myself the bold and arduous project of arriving at moral perfection. I failed, of course. But the failure taught me more than the project.', citation: 'Autobiography of Benjamin Franklin' },
    ],
    edges: [
      { source: 'coalition',  target: 'diplomacy',  note: 'Diplomacy is coalition-building at the international scale — the method is identical.' },
      { source: 'utility',    target: 'curiosity',  note: 'Curiosity directed by utility — Franklin only pursued questions that led somewhere useful.' },
      { source: 'humor',      target: 'diplomacy',  note: 'Humor was Franklin\'s primary diplomatic tool — disarming, persuading, making the idea palatable.' },
      { source: 'compromise', target: 'coalition',  note: 'Coalition requires compromise — the Constitutional Convention speech is the canonical example.' },
      { source: 'humor',      target: 'coalition',  note: 'Humor is how Franklin built coalitions — shared laughter is shared ground.' },
      { source: 'improvement',target: 'utility',    note: 'Self-improvement is utility applied to the self — virtues as practical instruments, not moral absolutes.' },
      { source: 'curiosity',  target: 'coalition',  note: 'Genuine curiosity about other people — distinct from interest in them — was Franklin\'s coalition superpower.' },
    ],
  },

  musk: {
    nodes: [
      { id: 'firstprinciples', topic: 'First principles', era: 'early',  frequency: 28, spoken: 'I tend to approach things from a physics framework. Physics teaches you to reason from first principles rather than by analogy. If you ask why a rocket costs sixty-five million dollars, and you break it down to materials, it\'s two million. So what\'s all the rest?', citation: 'Ch. 4, Elon Musk, Isaacson (2023)' },
      { id: 'multiplanetary',  topic: 'Multiplanetary',   era: 'early',  frequency: 24, spoken: 'Either we become a spacefaring civilisation and a multiplanet species, or we\'re stuck on one planet and eventually something wipes us out. That\'s the calculation. It\'s not complicated. It\'s just uncomfortable.', citation: 'Ch. 7, Elon Musk, Isaacson (2023)' },
      { id: 'iteration',       topic: 'Rapid iteration',  era: 'middle', frequency: 22, spoken: 'The key to SpaceX is that we iterate faster than anyone thought possible. We blow up rockets. We learn. We blow up again. Every failure is data. The goal is not to avoid failure — it\'s to fail faster than the competition can even try.', citation: 'Ch. 14, Elon Musk, Isaacson (2023)' },
      { id: 'urgency',         topic: 'Urgency',          era: 'early',  frequency: 20, spoken: 'I felt the urgency because I thought SpaceX had maybe a 10% chance of success. Tesla maybe 5%. I was not investing because I thought we would win. I was investing because if we didn\'t try, no one would.', citation: 'Ch. 9, Elon Musk, Isaacson (2023)' },
      { id: 'physics',         topic: 'Physics',          era: 'early',  frequency: 18, spoken: 'Physics is the law. Everything else is a recommendation. If something is not physically impossible, it is just a matter of will and resources. And resources are a matter of will applied over time.', citation: 'Ch. 4, Elon Musk, Isaacson (2023)' },
      { id: 'timelines',       topic: 'Timelines',        era: 'late',   frequency: 16, spoken: 'I know the timelines are always wrong. But if I say five years, people try for five years. If I say ten years, they pace themselves. Aspirational timelines are a management tool. Obviously.', citation: 'Ch. 22, Elon Musk, Isaacson (2023)' },
      { id: 'civilisation',    topic: 'Civilisation',     era: 'middle', frequency: 14, spoken: 'The thing that matters is not Tesla or SpaceX or any one company. The thing that matters is whether civilisation continues and advances. These companies are instruments of that. If they fail but someone else succeeds, that is fine.', citation: 'TED Interview (2022)' },
    ],
    edges: [
      { source: 'firstprinciples', target: 'physics',       note: 'First principles reasoning is physics reasoning — decompose to physical reality, rebuild from there.' },
      { source: 'firstprinciples', target: 'iteration',     note: 'Rapid iteration is first principles applied to time — the fastest physical path to the answer.' },
      { source: 'multiplanetary',  target: 'urgency',       note: 'The multiplanetary imperative generates the urgency — existential stakes create existential speed.' },
      { source: 'multiplanetary',  target: 'civilisation',  note: 'Multiplanetary is the operational form of the civilisational concern.' },
      { source: 'urgency',         target: 'timelines',     note: 'Aggressive timelines are urgency made explicit — a tool for maintaining civilisational speed.' },
      { source: 'physics',         target: 'multiplanetary',note: 'Physics says it\'s possible. That\'s the only permission needed.' },
      { source: 'iteration',       target: 'timelines',     note: 'Rapid iteration makes aggressive timelines achievable — not in the stated timeframe, but eventually.' },
    ],
  },
}

export default function MapPage() {
  const [selectedMind, setSelectedMind] = useState<MindId>('jobs')
  const graphData = GRAPH_DATA[selectedMind]

  return (
    <AppShell>
      <div
        style={{
          position: 'relative',
          height: 'calc(100vh - 52px)',
          backgroundColor: 'var(--ink)',
          overflow: 'hidden',
        }}
      >
        {/* Mind selector — overlaid top-left */}
        <div
          style={{
            position: 'absolute',
            top: '1.25rem',
            left: '1.25rem',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          {MINDS.map((m) => {
            const active = m.id === selectedMind
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMind(m.id as MindId)}
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontWeight: active ? 400 : 300,
                  fontSize: '0.55rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: active ? 'var(--gold)' : 'var(--muted)',
                  background: active ? 'rgba(200,168,74,0.08)' : 'none',
                  border: active ? '1px solid rgba(200,168,74,0.25)' : '1px solid transparent',
                  padding: '0.3em 0.7em',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
              >
                {m.name}
              </button>
            )
          })}
        </div>

        {/* Legend — bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: '1.25rem',
            left: '1.25rem',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          {(['early', 'middle', 'late'] as const).map((era) => (
            <div key={era} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: { early: '#c8a84a', middle: '#8a6a2a', late: '#4a3c1e' }[era],
                  border: '1px solid rgba(244,239,229,0.25)',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '0.48rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                {era}
              </span>
            </div>
          ))}
          <p
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '0.44rem',
              color: 'var(--muted)',
              marginTop: '0.25rem',
              opacity: 0.6,
            }}
          >
            Click node to explore · Drag to reposition
          </p>
        </div>

        {/* D3 graph */}
        <ReasoningMap
          mindId={selectedMind}
          nodes={graphData.nodes}
          edges={graphData.edges}
        />
      </div>
    </AppShell>
  )
}
