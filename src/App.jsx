import { useMemo, useState } from 'react'
import {
  MessageCircleHeart,
  MessagesSquare,
  GraduationCap,
  History,
  ShieldCheck,
} from 'lucide-react'
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
  { id: 'analyse', label: 'Check a message', icon: MessageCircleHeart },
  { id: 'samples', label: 'Sample messages', icon: MessagesSquare },
  { id: 'teach', label: 'Teach the model', icon: GraduationCap },
  { id: 'history', label: 'History', icon: History },
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
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-mark">
              <MessageCircleHeart size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="brand-name">
                SayIt<span>Right</span>
              </div>
              <div className="brand-sub">
                Check how your message sounds before you send it.
              </div>
            </div>
          </div>
          <span className="model-pill">
            <ShieldCheck size={14} />
            Model trained on <strong>{allExamples.length} examples</strong>,
            runs on this device
          </span>
        </div>
        <div className="tabbar">
          <nav className="tabs" aria-label="Main">
            {VIEWS.map((v) => {
              const Icon = v.icon
              return (
                <button
                  key={v.id}
                  className={`tab ${view === v.id ? 'active' : ''}`}
                  onClick={() => setView(v.id)}
                >
                  <Icon size={16} />
                  {v.label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

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

      <footer className="foot-note">
        No account, no server, nothing you type leaves this device.
      </footer>
    </div>
  )
}
