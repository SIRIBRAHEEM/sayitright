import { MessagesSquare, MessageCircle } from 'lucide-react'
import { SAMPLE_MESSAGES } from '../lib/trainingData.js'

export default function SamplesView({ onPick }) {
  return (
    <div>
      <div className="view-head">
        <span className="eyebrow">
          <MessagesSquare size={13} />
          Try one
        </span>
        <h2>Sample messages</h2>
        <p>
          Not sure what to type? Pick one of these and the app will load it
          into the checker for you.
        </p>
      </div>
      <div className="sample-grid">
        {SAMPLE_MESSAGES.map((sample) => (
          <button
            className="sample-card bubble"
            key={sample.label}
            onClick={() => onPick(sample.text)}
          >
            <h4>
              <MessageCircle size={15} className="text-primary" />
              {sample.label}
            </h4>
            <p>{sample.text}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
