// A small multinomial naive Bayes text classifier that runs fully in the
// browser. It learns from labelled example messages and predicts the tone
// of a new message. No server and no API key are involved.

export const TONES = ['Polite', 'Friendly', 'Neutral', 'Urgent', 'Harsh']

// Turn raw text into tokens. Words are lowercased. A few extra signals are
// added as special tokens because tone is not only about words: repeated
// exclamation marks, question marks, and words typed in ALL CAPS all say
// something about how a message will sound.
export function tokenize(text) {
  const tokens = []
  const raw = String(text || '')
  const exclaims = (raw.match(/!/g) || []).length
  for (let i = 0; i < Math.min(exclaims, 3); i++) tokens.push('__exclaim__')
  if (raw.includes('?')) tokens.push('__question__')
  const capsWords = raw.match(/\b[A-Z]{3,}\b/g) || []
  for (let i = 0; i < Math.min(capsWords.length, 3); i++) tokens.push('__caps__')
  const words = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2)
  return tokens.concat(words)
}

// Train a model from examples shaped like { text, tone }.
// Returns a plain object that predict() can use.
export function trainClassifier(examples) {
  const classCounts = {}
  const wordCounts = {}
  const classTotals = {}
  const vocab = new Set()

  for (const tone of TONES) {
    classCounts[tone] = 0
    wordCounts[tone] = {}
    classTotals[tone] = 0
  }

  for (const example of examples) {
    if (!TONES.includes(example.tone)) continue
    classCounts[example.tone] += 1
    for (const token of tokenize(example.text)) {
      vocab.add(token)
      wordCounts[example.tone][token] = (wordCounts[example.tone][token] || 0) + 1
      classTotals[example.tone] += 1
    }
  }

  return {
    classCounts,
    wordCounts,
    classTotals,
    vocabSize: Math.max(vocab.size, 1),
    totalExamples: examples.length,
  }
}

function logLikelihood(model, tone, token) {
  // Laplace smoothing so unseen words never produce a zero probability.
  const count = model.wordCounts[tone][token] || 0
  return Math.log((count + 1) / (model.classTotals[tone] + model.vocabSize))
}

// Predict the tone of a message. Returns the best tone, a probability for
// every tone, and the words that pushed the score towards the winning tone.
export function predict(model, text) {
  const tokens = tokenize(text)
  const totalDocs = TONES.reduce((sum, t) => sum + model.classCounts[t], 0) || 1
  const scores = {}

  for (const tone of TONES) {
    let score = Math.log((model.classCounts[tone] + 1) / (totalDocs + TONES.length))
    for (const token of tokens) {
      score += logLikelihood(model, tone, token)
    }
    scores[tone] = score
  }

  // Softmax turns log scores into probabilities that add up to 1.
  const max = Math.max(...Object.values(scores))
  const expScores = {}
  let expSum = 0
  for (const tone of TONES) {
    expScores[tone] = Math.exp(scores[tone] - max)
    expSum += expScores[tone]
  }
  const probabilities = {}
  for (const tone of TONES) {
    probabilities[tone] = expScores[tone] / expSum
  }

  const bestTone = TONES.reduce((a, b) => (probabilities[a] >= probabilities[b] ? a : b))

  // Explain the result: a word counts as evidence for the winning tone when
  // it is more likely under that tone than under the others on average.
  // Very common filler words are left out of the explanation so it stays
  // readable; they still count in the score itself.
  const FILLER = new Set([
    'the', 'and', 'for', 'are', 'is', 'it', 'to', 'of', 'in', 'on', 'a', 'an',
    'this', 'that', 'with', 'be', 'as', 'at', 'by', 'or', 'we', 'i', 'me', 'my',
    'am', 'so', 'if', 'but', 'not', 'no', 'do', 'will', 'have', 'has', 'was',
  ])
  const wordScores = {}
  for (const token of new Set(tokens)) {
    if (token.startsWith('__') || FILLER.has(token)) continue
    const own = logLikelihood(model, bestTone, token)
    const others = TONES.filter((t) => t !== bestTone).map((t) =>
      logLikelihood(model, t, token),
    )
    const averageOther = others.reduce((a, b) => a + b, 0) / others.length
    wordScores[token] = own - averageOther
  }
  const topWords = Object.entries(wordScores)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word)

  return { tone: bestTone, probabilities, topWords, tokenCount: tokens.length }
}

// Measure how often the model labels its own training examples correctly.
// This is a sanity check, not a true test score, and the app says so.
export function trainingAccuracy(model, examples) {
  if (examples.length === 0) return 0
  let correct = 0
  for (const example of examples) {
    if (predict(model, example.text).tone === example.tone) correct += 1
  }
  return correct / examples.length
}
