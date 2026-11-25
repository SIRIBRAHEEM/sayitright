import { useMemo, useState } from 'react'
import {
  SendHorizonal,
  Eraser,
  Sparkles,
  Copy,
  Check,
  WandSparkles,
  Heart,
  Smile,
  Meh,
  Timer,
  Annoyed,
  MessageCircleHeart,
} from 'lucide-react'
import { predict, TONES } from '../lib/classifier.js'
import { findHarshPhrases, softenText, styleNotes } from '../lib/softener.js'
import { TONE_COLORS, TONE_ADVICE } from '../lib/tones.js'

const TONE_ICONS = {
  Polite: Heart,
  Friendly: Smile,
  Neutral: Meh,
  Urgent: Timer,
  Harsh: Annoyed,
}

// Semicircle gauge: the filled arc shows how sure the model is about the
// winning tone, coloured with that tone's colour.
function ToneGauge({ tone, confidence }) {
  const radius = 96
  const circumference = Math.PI * radius
  const filled = (confidence / 100) * circumference
  const Icon = TONE_ICONS[tone]
  return (
    <div className="gauge-wrap">
      <svg
        width="240"
        height="140"
        viewBox="0 0 240 140"
        role="img"
        aria-label={`${tone}, ${confidence} percent`}
      >
        <path
          d="M 24 128 A 96 96 0 0 1 216 128"
          fill="none"
          stroke="#ece7fb"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <path
          d="M 24 128 A 96 96 0 0 1 216 128"
          fill="none"
          stroke={TONE_COLORS[tone]}
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text
          x="120"
          y="104"
          textAnchor="middle"
          fontFamily="Nunito, sans-serif"
          fontWeight="900"
          fontSize="34"
          fill="#2b2340"
        >
          {confidence}%
        </text>
        <text
          x="120"
          y="126"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          fill="#7a7194"
        >
          model score
        </text>
      </svg>
      <div
        className="grid place-items-center w-11 h-11 rounded-full -mt-3"
        style={{ background: `${TONE_COLORS[tone]}22`, color: TONE_COLORS[tone] }}
      >
        <Icon size={24} strokeWidth={2.2} />
      </div>
    </div>
  )
}

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

  const confidence = result
    ? Math.round(result.probabilities[result.tone] * 100)
    : 0

  return (
    <div>
      <div className="view-head">
        <span className="eyebrow">
          <MessageCircleHeart size={13} />
          Tone checker
        </span>
        <h2>Check a message</h2>
        <p>
          Paste a message before you send it. The model reads it here in your
          browser and tells you how it is likely to sound.
        </p>
      </div>

      <div className="card">
        <label className="field-label" htmlFor="message-box">
          Your message
        </label>
        <textarea
          id="message-box"
          className="composer"
          placeholder="Type or paste your message here, for example an email to your lecturer or a text to your group members."
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setResult(null)
          }}
        />
        <div className="row" style={{ marginTop: '0.9rem' }}>
          <button className="btn" onClick={analyse} disabled={!text.trim()}>
            <SendHorizonal size={16} />
            Check tone
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              setText('')
              setResult(null)
            }}
          >
            <Eraser size={15} />
            Clear
          </button>
          <span className="muted small" style={{ marginLeft: 'auto' }}>
            {text.trim().length} characters
          </span>
        </div>
      </div>

      {result && (
        <>
          <div className="card fade-in">
            <div className="flex items-start gap-3">
              <div className="avatar-dot">
                <Sparkles size={17} />
              </div>
              <div className="min-w-0">
                <div className="muted small">Most likely tone</div>
                <div
                  className="result-tone"
                  style={{ color: TONE_COLORS[result.tone] }}
                >
                  {result.tone}
                </div>
                <p className="muted small" style={{ marginTop: '0.35rem' }}>
                  {TONE_ADVICE[result.tone]}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '0.8rem' }}>
              <ToneGauge tone={result.tone} confidence={confidence} />
            </div>

            <div style={{ marginTop: '1rem' }}>
              {TONES.map((tone) => (
                <div className="confidence-row" key={tone}>
                  <span className="font-semibold">{tone}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${Math.round(result.probabilities[tone] * 100)}%`,
                        background: TONE_COLORS[tone],
                      }}
                    />
                  </div>
                  <span className="muted">
                    {Math.round(result.probabilities[tone] * 100)}%
                  </span>
                </div>
              ))}
            </div>

            {result.topWords.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div className="muted small" style={{ marginBottom: '0.45rem' }}>
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
            <div className="card fade-in">
              <h3>
                <WandSparkles size={17} className="text-primary" />
                Ways to soften it
              </h3>
              {harshHits.length > 0 && (
                <div style={{ marginTop: '0.8rem' }}>
                  {harshHits.map((hit, i) => (
                    <div
                      key={i}
                      className="small"
                      style={{ margin: '0.35rem 0' }}
                    >
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
                  <div
                    className="muted small"
                    style={{ margin: '1rem 0 0.45rem' }}
                  >
                    Softer version:
                  </div>
                  <div className="softened-box">{softened}</div>
                  <div className="row" style={{ marginTop: '0.8rem' }}>
                    <button className="btn-ghost" onClick={copySoftened}>
                      {copied ? <Check size={15} /> : <Copy size={15} />}
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
