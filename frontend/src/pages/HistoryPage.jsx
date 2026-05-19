import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { conceptApi } from '../services/api';
import ExplanationCard from '../components/ExplanationCard';
import LoadingSkeleton from '../components/LoadingSkeleton';

const LEVEL_BADGE = {
  BEGINNER: { bg: '#dcfce7', text: '#166534' },
  INTERMEDIATE: { bg: '#fef9c3', text: '#713f12' },
  ADVANCED: { bg: '#fee2e2', text: '#7f1d1d' },
};
const TYPE_ICON = { DEFINITION: '📖', DETAILED: '🔍', STEP_BY_STEP: '📋' };

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all'); // 'all' | 'mine'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [tab]);

  async function loadHistory() {
    setLoading(true);
    setSelected(null);
    try {
      const res = tab === 'mine'
        ? await conceptApi.getSessionHistory()
        : await conceptApi.getHistory(0, 50);
      setItems(res.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    const val = e.target.value;
    setSearch(val);
    if (val.trim().length >= 2) {
      try {
        const res = await conceptApi.searchHistory(val.trim());
        setItems(res.data);
      } catch { /* ignore */ }
    } else if (!val.trim()) {
      loadHistory();
    }
  }

  async function handleSelect(item) {
    setLoadingDetail(true);
    setSelected(null);
    try {
      const res = await conceptApi.getHistoryById(item.id);
      setSelected(res.data);
    } catch {
      setSelected(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  const filtered = items.filter(i =>
    !search.trim() || i.topic.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            History
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Browse and revisit previous explanations
          </p>
        </div>
        <button onClick={() => navigate('/')} className="btn-ghost text-sm">
          + New Explanation
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Tab */}
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          {['all', 'mine'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-2 text-sm font-medium transition-all duration-150 capitalize"
              style={{
                background: tab === t ? 'var(--accent)' : 'var(--card-bg)',
                color: tab === t ? 'white' : 'var(--text-secondary)',
              }}>
              {t === 'all' ? '🌐 All' : '👤 Mine'}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          className="input-field flex-1 py-2 px-4 text-sm"
          placeholder="Search topics…"
          value={search}
          onChange={handleSearch}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* List */}
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="card p-4 space-y-2">
                  <div className="shimmer-line h-4 w-3/4" />
                  <div className="shimmer-line h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-3xl mb-2">📚</p>
              <p style={{ color: 'var(--text-muted)' }}>No history found</p>
            </div>
          ) : (
            filtered.map(item => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="card w-full text-left p-4 transition-all duration-150 hover:border-amber-400/50 group"
                style={{
                  borderColor: selected?.id === item.id ? 'var(--accent)' : 'var(--border)',
                  background: selected?.id === item.id ? 'var(--accent-soft)' : 'var(--card-bg)',
                }}
              >
                <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {TYPE_ICON[item.type] || '📄'} {item.topic}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: LEVEL_BADGE[item.level]?.bg || '#f3f4f6',
                      color: LEVEL_BADGE[item.level]?.text || '#374151',
                    }}>
                    {item.level}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(item.createdAt)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {loadingDetail && <LoadingSkeleton />}
          {!loadingDetail && selected && <ExplanationCard data={selected} />}
          {!loadingDetail && !selected && (
            <div className="card p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <p className="text-5xl mb-4">👈</p>
              <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                Select an item to view the full explanation
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
