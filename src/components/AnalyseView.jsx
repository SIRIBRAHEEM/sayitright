import { useMemo, useState } from 'react'
import { predict, TONES } from '../lib/classifier.js'
import { findHarshPhrases, softenText, styleNotes } from '../lib/softener.js'
import { TONE_COLORS, TONE_ADVICE } from '../lib/tones.js'

export default function AnalyseView({ model, initialText, onAnalysed }) {
  const [text, setText] = useState(initialText || '')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const harshHits = useMemo(() => (result ? findHarshPhrases(text) : []), [result, text])
  const softened = useMemo(() => (result ? softenText(text) : ''), [result, text])
  const notes = useMemo(() => (result ? styleNotes(text) : []), [result, text])

  function analyse() {
    if (!text.trim()) return
    const prediction = predict(model, text)
    setResult(prediction)
    setCopied(false)
    onAnalysed({
      text: text.trim(),
      tone: prediction.tone,
      confidence: Math.round(prediction.probabilities[prediction.tone] * 100),
      date: new Date().toISOString(),
    })
  }

  async function copySoftened() {
    try {
      await navigator.clipboard.writeText(softened)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div>
      <div className="view-head">
        <h2>Check a message</h2>
        <p>
          Paste a message before you send it. The model reads it here in your
          browser and tells you how it is likely to sound.
        </p>
      </div>

      <div className="card">
        <label htmlFor="message-box">Your message</label>
        <textarea
          id="message-box"
          className="big-textarea"
          placeholder="Type or paste your message here, for example an email to your lecturer or a text to your group members."
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setResult(null)
          }}
        />
        <div className="row" style={{ marginTop: '0.8rem' }}>
          <button className="btn" onClick={analyse} disabled={!text.trim()}>
            Check tone
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              setText('')
              setResult(null)
            }}
          >
            Clear
          </button>
          <span className="muted small">{text.trim().length} characters</span>
        </div>
      </div>

      {result && (
        <>
          <div className="card">
            <div className="muted small">Most likely tone</div>
            <div className="result-tone" style={{ color: TONE_COLORS[result.tone] }}>
              {result.tone}
            </div>
            <p className="muted">{TONE_ADVICE[result.tone]}</p>

            {TONES.map((tone) => (
              <div className="confidence-row" key={tone}>
                <span>{tone}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${Math.round(result.probabilities[tone] * 100)}%`,
                      background: TONE_COLORS[tone],
                    }}
                  />
                </div>
                <span>{Math.round(result.probabilities[tone] * 100)}%</span>
              </div>
            ))}

            {result.topWords.length > 0 && (
              <div style={{ marginTop: '0.9rem' }}>
                <div className="muted small">
                  Words that pushed the score towards {result.tone}:
                </div>
                <div>
                  {result.topWords.map((word) => (
                    <span className="chip chip-accent" key={word}>
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(harshHits.length > 0 || notes.length > 0) && (
            <div className="card">
              <h3>Ways to soften it</h3>
              {harshHits.length > 0 && (
                <div>
                  {harshHits.map((hit, i) => (
                    <div key={i} className="small" style={{ margin: '0.3rem 0' }}>
                      <span className="chip">{hit.found}</span>
                      <span className="muted"> could become </span>
                      <span className="chip chip-accent">{hit.suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
              {notes.length > 0 && (
                <ul className="note-list">
                  {notes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              )}
              {harshHits.length > 0 && (
                <>
                  <div className="muted small" style={{ margin: '0.9rem 0 0.4rem' }}>
                    Softer version:
                  </div>
                  <div className="softened-box">{softened}</div>
                  <div className="row" style={{ marginTop: '0.7rem' }}>
                    <button className="btn-ghost" onClick={copySoftened}>
                      {copied ? 'Copied' : 'Copy softer version'}
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        setText(softened)
                        setResult(null)
                      }}
                    >
                      Use this version
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
