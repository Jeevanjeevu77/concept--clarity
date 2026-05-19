import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LEVEL_COLORS = {
  BEGINNER: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
  INTERMEDIATE: { bg: '#fef9c3', text: '#713f12', border: '#fde68a' },
  ADVANCED: { bg: '#fee2e2', text: '#7f1d1d', border: '#fecaca' },
};

const TYPE_LABELS = {
  DEFINITION: '📖 Definition',
  DETAILED: '🔍 Detailed',
  STEP_BY_STEP: '📋 Step-by-Step',
};

export default function ExplanationCard({ data, onTopicClick }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const levelStyle = LEVEL_COLORS[data.level] || LEVEL_COLORS.BEGINNER;

  function formatDetailedText(text) {
    if (!text) return null;
    // Convert \n1. Step... into an ordered list
    if (text.includes('\n1.') || text.match(/^1\./)) {
      const lines = text.split(/\n/).filter(Boolean);
      const listItems = lines
        .filter(l => l.match(/^\d+\./))
        .map(l => l.replace(/^\d+\.\s*/, '').trim());
      if (listItems.length > 0) {
        return (
          <ol className="list-none space-y-2 mt-2">
            {listItems.map((item, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1.5px solid var(--accent)' }}>
                  {i + 1}
                </span>
                <span className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item}</span>
              </li>
            ))}
          </ol>
        );
      }
    }
    return <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{text}</p>;
  }

  return (
    <div className="card p-6 space-y-5 animate-fade-up">

      {/* ── Header: Topic + Badges ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold leading-snug"
            style={{ color: 'var(--text-primary)' }}>
            {data.topic}
          </h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: levelStyle.bg, color: levelStyle.text, border: `1px solid ${levelStyle.border}` }}>
              {data.level}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: 'var(--tag-bg)', color: 'var(--text-muted)' }}>
              {TYPE_LABELS[data.type] || data.type}
            </span>
          </div>
        </div>
      </div>

      <hr style={{ borderColor: 'var(--border)' }} />

      {/* ── Short Explanation ── */}
      <Section icon="✦" label="Quick Answer">
        <p className="text-base leading-relaxed font-medium"
          style={{ color: 'var(--text-primary)' }}>
          {data.shortExplanation}
        </p>
      </Section>

      {/* ── Read More Toggle ── */}
      {data.detailedExplanation && (
        <div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-2 text-sm font-medium transition-all duration-150 group"
            style={{ color: 'var(--accent)' }}
          >
            <span className="transition-transform duration-200" style={{
              display: 'inline-block',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0)'
            }}>▶</span>
            {expanded ? 'Show less' : 'Read full explanation'}
          </button>

          {expanded && (
            <div className="mt-3 animate-fade-in">
              <div className="pl-4 border-l-2" style={{ borderColor: 'var(--accent)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--text-muted)' }}>Detailed Explanation</p>
                {formatDetailedText(data.detailedExplanation)}
              </div>
            </div>
          )}
        </div>
      )}

      <hr style={{ borderColor: 'var(--border)' }} />

      {/* ── Example ── */}
      {data.example && (
        <Section icon="💡" label="Example">
          <div className="rounded-lg p-4" style={{ background: 'var(--tag-bg)' }}>
            <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {data.example}
            </p>
          </div>
        </Section>
      )}

      {/* ── Analogy (Beginner/Intermediate only) ── */}
      {data.analogy && (
        <Section icon="🔗" label="Analogy">
          <div className="rounded-lg p-4 border-l-4" style={{
            background: 'var(--accent-soft)',
            borderColor: 'var(--accent)'
          }}>
            <p className="leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>
              "{data.analogy}"
            </p>
          </div>
        </Section>
      )}

      {/* ── Summary ── */}
      {data.summary && (
        <Section icon="📌" label="Summary">
          <p className="font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {data.summary}
          </p>
        </Section>
      )}

      {/* ── Related Topics ── */}
      {data.relatedTopics?.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--text-muted)' }}>
            Explore Next
          </p>
          <div className="flex flex-wrap gap-2">
            {data.relatedTopics.map((topic, i) => (
              <button
                key={i}
                onClick={() => {
                  if (onTopicClick) {
                    onTopicClick(topic);
                  } else {
                    navigate('/', { state: { prefill: topic } });
                  }
                }}
                className="tag text-sm"
              >
                {topic} →
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ icon, label, children }) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--text-muted)' }}>
        <span>{icon}</span> {label}
      </p>
      {children}
    </div>
  );
}
