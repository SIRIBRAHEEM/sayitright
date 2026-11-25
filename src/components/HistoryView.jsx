import { TONE_COLORS } from '../lib/tones.js'

export default function HistoryView({ history, onClear, onReuse }) {
  return (
    <div>
      <div className="view-head">
        <h2>History</h2>
        <p>
          Messages you have checked on this device. Nothing here leaves your
          browser.
        </p>
      </div>
      <div className="card">
        {history.length === 0 ? (
          <p className="muted">No checks yet. Analyse a message and it will show up here.</p>
        ) : (
          <>
            {history.map((item, i) => (
              <div className="history-item" key={i}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
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
                <p className="small" style={{ margin: '0.4rem 0' }}>
                  {item.text}
                </p>
                <button className="btn-ghost" onClick={() => onReuse(item.text)}>
                  Check again
                </button>
              </div>
            ))}
            <div style={{ marginTop: '1rem' }}>
              <button className="btn-danger" onClick={onClear}>
                Clear history
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
