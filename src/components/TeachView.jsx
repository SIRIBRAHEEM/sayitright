import { useMemo, useState } from 'react'
import {
  GraduationCap,
  BarChart3,
  PlusCircle,
  Check,
  Trash2,
  Inbox,
} from 'lucide-react'
import { TONES, trainingAccuracy } from '../lib/classifier.js'
import { TONE_COLORS } from '../lib/tones.js'

export default function TeachView({ model, allExamples, userExamples, onAdd, onRemove }) {
  const [text, setText] = useState('')
  const [tone, setTone] = useState('Polite')
  const [saved, setSaved] = useState(false)

  const counts = useMemo(() => {
    const c = {}
    for (const t of TONES) c[t] = 0
    for (const ex of allExamples) c[ex.tone] = (c[ex.tone] || 0) + 1
    return c
  }, [allExamples])

  const accuracy = useMemo(
    () => Math.round(trainingAccuracy(model, allExamples) * 100),
    [model, allExamples],
  )

  function add() {
    if (!text.trim()) return
    onAdd({ text: text.trim(), tone })
    setText('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="view-head">
        <span className="eyebrow">
          <GraduationCap size={13} />
          Teach mode
        </span>
        <h2>Teach the model</h2>
        <p>
          The model learns from labelled examples. Add your own messages with
          the tone you intend, and it retrains straight away. Try adding a few
          harsh examples with a word it has never seen, then check that word in
          the Analyse view.
        </p>
      </div>

      <div className="card">
        <h3>
          <BarChart3 size={17} className="text-primary" />
          Training set right now
        </h3>
        <div className="stat-grid">
          {TONES.map((t) => (
            <div className="stat" key={t}>
              <div className="num" style={{ color: TONE_COLORS[t] }}>
                {counts[t]}
              </div>
              <div className="label">{t} examples</div>
            </div>
          ))}
          <div className="stat">
            <div className="num">{accuracy}%</div>
            <div className="label">correct on its own training examples</div>
          </div>
        </div>
        <p className="muted small" style={{ marginTop: '0.9rem' }}>
          That percentage is a sanity check on messages the model has already
          seen, not a score on new messages. New wording can still surprise it.
        </p>
      </div>

      <div className="card">
        <h3>
          <PlusCircle size={17} className="text-primary" />
          Add an example
        </h3>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <div>
            <label className="field-label" htmlFor="teach-text">
              Message
            </label>
            <textarea
              id="teach-text"
              className="composer"
              style={{ minHeight: '84px' }}
              placeholder="Write a short message, for example: Thank you so much for your help today."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="teach-tone">
              Its tone
            </label>
            <select
              id="teach-tone"
              className="input"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="row">
            <button className="btn" onClick={add} disabled={!text.trim()}>
              <PlusCircle size={16} />
              Add and retrain
            </button>
            {saved && (
              <span className="muted small inline-flex items-center gap-1">
                <Check size={14} className="text-success" />
                Added. The model has retrained.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Your added examples ({userExamples.length})</h3>
        {userExamples.length === 0 ? (
          <div className="empty-state">
            <div className="avatar-dot">
              <Inbox size={20} />
            </div>
            <p className="muted small">
              None yet. The model is running on the 125 built-in examples. Add
              one above to see it learn.
            </p>
          </div>
        ) : (
          <div style={{ marginTop: '0.6rem' }}>
            {userExamples.map((ex, i) => (
              <div className="example-row" key={i}>
                <div>
                  <span
                    className="tone-badge"
                    style={{ background: TONE_COLORS[ex.tone] }}
                  >
                    {ex.tone}
                  </span>{' '}
                  <span className="small">{ex.text}</span>
                </div>
                <button className="btn-danger" onClick={() => onRemove(i)}>
                  <Trash2 size={13} />
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
