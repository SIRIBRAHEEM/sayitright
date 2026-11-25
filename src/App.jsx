import { useMemo, useState } from 'react'
import AnalyseView from './components/AnalyseView.jsx'
import TeachView from './components/TeachView.jsx'
import SamplesView from './components/SamplesView.jsx'
import HistoryView from './components/HistoryView.jsx'
import { trainClassifier } from './lib/classifier.js'
import { BASE_EXAMPLES } from './lib/trainingData.js'
import {
  loadUserExamples,
  saveUserExamples,
  loadHistory,
  saveHistory,
} from './lib/storage.js'

const VIEWS = [
  { id: 'analyse', label: 'Check a message' },
  { id: 'samples', label: 'Sample messages' },
  { id: 'teach', label: 'Teach the model' },
  { id: 'history', label: 'History' },
]

export default function App() {
  const [view, setView] = useState('analyse')
  const [userExamples, setUserExamples] = useState(() => loadUserExamples())
  const [history, setHistory] = useState(() => loadHistory())
  const [draftText, setDraftText] = useState('')
  const [draftKey, setDraftKey] = useState(0)

  const allExamples = useMemo(
    () => BASE_EXAMPLES.concat(userExamples),
    [userExamples],
  )
  const model = useMemo(() => trainClassifier(allExamples), [allExamples])

  function addExample(example) {
    const next = userExamples.concat(example)
    setUserExamples(next)
    saveUserExamples(next)
  }

  function removeExample(index) {
    const next = userExamples.filter((_, i) => i !== index)
    setUserExamples(next)
    saveUserExamples(next)
  }

  function recordHistory(item) {
    const next = [item].concat(history)
    setHistory(next)
    saveHistory(next)
  }

  function clearHistory() {
    setHistory([])
    saveHistory([])
  }

  function loadIntoChecker(text) {
    setDraftText(text)
    setDraftKey((k) => k + 1)
    setView('analyse')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div>
          <div className="logo">
            SayIt<span>Right</span>
          </div>
          <div className="tagline">
            Check how your message sounds before you send it.
          </div>
        </div>
        <nav className="nav">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className={view === v.id ? 'active' : ''}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          Model trained on <strong>{allExamples.length} examples</strong>,
          running fully in your browser. No account, no server, nothing you
          type leaves this device.
        </div>
      </aside>

      <main className="main">
        {view === 'analyse' && (
          <AnalyseView
            key={draftKey}
            model={model}
            initialText={draftText}
            onAnalysed={recordHistory}
          />
        )}
        {view === 'samples' && <SamplesView onPick={loadIntoChecker} />}
        {view === 'teach' && (
          <TeachView
            model={model}
            allExamples={allExamples}
            userExamples={userExamples}
            onAdd={addExample}
            onRemove={removeExample}
          />
        )}
        {view === 'history' && (
          <HistoryView
            history={history}
            onClear={clearHistory}
            onReuse={loadIntoChecker}
          />
        )}
      </main>
    </div>
  )
}
