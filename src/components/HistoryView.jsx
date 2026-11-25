import { History, RotateCcw, Trash2, Inbox } from 'lucide-react'
import { TONE_COLORS } from '../lib/tones.js'

export default function HistoryView({ history, onClear, onReuse }) {
  return (
    <div>
      <div className="view-head">
        <span className="eyebrow">
          <History size={13} />
          On this device
        </span>
        <h2>History</h2>
        <p>
          Messages you have checked on this device. Nothing here leaves your
          browser.
        </p>
      </div>
      <div className="card">
        {history.length === 0 ? (
          <div className="empty-state">
            <div className="avatar-dot">
              <Inbox size={20} />
            </div>
            <p className="muted small">
              No checks yet. Analyse a message and it will show up here.
            </p>
          </div>
        ) : (
          <>
            {history.map((item, i) => (
              <div className="history-item" key={i}>
                <div
                  className="row"
                  style={{ justifyContent: 'space-between' }}
                >
                  <span
                    className="tone-badge"
                    style={{ background: TONE_COLORS[item.tone] }}
                  >
                    {item.tone} ({item.confidence}%)
                  </span>
                  <span className="muted small">
                    {new Date(item.date).toLocaleString()}
                  </span>
                </div>
                <p className="small" style={{ margin: '0.55rem 0' }}>
                  {item.text}
                </p>
                <button className="btn-ghost" onClick={() => onReuse(item.text)}>
                  <RotateCcw size={14} />
                  Check again
                </button>
              </div>
            ))}
            <div style={{ marginTop: '1rem' }}>
              <button className="btn-danger" onClick={onClear}>
                <Trash2 size={13} />
                Clear history
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
