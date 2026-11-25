import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  tokenize,
  trainClassifier,
  predict,
  trainingAccuracy,
  TONES,
} from '../src/lib/classifier.js'
import { findHarshPhrases, softenText, styleNotes } from '../src/lib/softener.js'
import { BASE_EXAMPLES, SAMPLE_MESSAGES } from '../src/lib/trainingData.js'

const model = trainClassifier(BASE_EXAMPLES)

test('tokenizer lowercases words and adds style signals', () => {
  const tokens = tokenize('PLEASE send it NOW!!')
  assert.ok(tokens.includes('please'))
  assert.ok(tokens.includes('send'))
  assert.ok(tokens.includes('__exclaim__'))
  assert.ok(tokens.includes('__caps__'))
})

test('training set covers all five tones with 25 examples each', () => {
  assert.equal(BASE_EXAMPLES.length, 125)
  for (const tone of TONES) {
    assert.equal(BASE_EXAMPLES.filter((e) => e.tone === tone).length, 25)
  }
})

test('predicts a courteous email as Polite', () => {
  const result = predict(
    model,
    'Good morning sir, please may I submit my assignment tomorrow? Thank you for your understanding.',
  )
  assert.equal(result.tone, 'Polite')
})

test('predicts a warm message as Friendly', () => {
  const result = predict(model, 'Happy birthday! You are the best, I am so happy for you.')
  assert.equal(result.tone, 'Friendly')
})

test('predicts a plain notice as Neutral', () => {
  const result = predict(model, 'The library opens at 8am and closes at 6pm on weekdays.')
  assert.equal(result.tone, 'Neutral')
})

test('predicts a deadline message as Urgent', () => {
  const result = predict(model, 'Please send the file now, the deadline is in one hour.')
  assert.equal(result.tone, 'Urgent')
})

test('predicts an insulting message as Harsh', () => {
  const result = predict(model, 'This is nonsense, you are useless and lazy.')
  assert.equal(result.tone, 'Harsh')
})

test('probabilities add up to 1 and stay between 0 and 1', () => {
  const result = predict(model, 'Thank you very much for your help.')
  const total = Object.values(result.probabilities).reduce((a, b) => a + b, 0)
  assert.ok(Math.abs(total - 1) < 1e-9)
  for (const p of Object.values(result.probabilities)) {
    assert.ok(p >= 0 && p <= 1)
  }
})

test('explanation lists words that support the winning tone', () => {
  const result = predict(model, 'Please kindly approve my request, thank you.')
  assert.equal(result.tone, 'Polite')
  assert.ok(result.topWords.length > 0)
})

test('model labels most of its own training examples correctly', () => {
  const accuracy = trainingAccuracy(model, BASE_EXAMPLES)
  assert.ok(accuracy >= 0.85, `accuracy was ${accuracy}`)
})

test('sample messages all get a sensible tone', () => {
  const expected = {
    'Email to a lecturer': 'Polite',
    'Angry group chat message': 'Harsh',
    'Urgent reminder': 'Urgent',
    'Class notice': 'Neutral',
    'Message to a friend': 'Friendly',
    'Harsh reply to fix': 'Harsh',
  }
  for (const sample of SAMPLE_MESSAGES) {
    assert.equal(predict(model, sample.text).tone, expected[sample.label], sample.label)
  }
})

test('teaching the model a new word changes its prediction', () => {
  const before = predict(model, 'That was pure wahala, wahala everywhere.')
  const taught = trainClassifier(
    BASE_EXAMPLES.concat([
      { text: 'This wahala is too much, I am tired of wahala.', tone: 'Harsh' },
      { text: 'Wahala wahala, nothing works in this place.', tone: 'Harsh' },
      { text: 'Stop this wahala and fix the problem.', tone: 'Harsh' },
    ]),
  )
  const after = predict(taught, 'That was pure wahala, wahala everywhere.')
  assert.equal(after.tone, 'Harsh')
  assert.ok(
    after.probabilities.Harsh > before.probabilities.Harsh,
    'Harsh probability should rise after teaching',
  )
})

test('softener finds harsh words and suggests replacements', () => {
  const hits = findHarshPhrases('That was a stupid idea, you never listen.')
  const found = hits.map((h) => h.found)
  assert.ok(found.includes('stupid'))
  assert.ok(found.includes('you never'))
  for (const hit of hits) assert.ok(hit.suggestion.length > 0)
})

test('softenText swaps in the suggestions and keeps the rest', () => {
  const softened = softenText('That was a stupid idea.')
  assert.equal(softened, 'That was a not clear idea.')
  assert.equal(softenText('Thank you for your help.'), 'Thank you for your help.')
})

test('style notes flag caps and repeated exclamation marks', () => {
  const notes = styleNotes('SEND IT NOW!!!')
  assert.ok(notes.some((n) => n.includes('ALL CAPS')))
  assert.ok(notes.some((n) => n.includes('exclamation')))
})

test('empty and odd inputs do not crash the predictor', () => {
  assert.ok(TONES.includes(predict(model, '').tone))
  assert.ok(TONES.includes(predict(model, '12345 !!!').tone))
  assert.ok(TONES.includes(predict(model, 'xyzzy plover').tone))
})
