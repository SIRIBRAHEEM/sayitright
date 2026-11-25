// Words and short phrases that often make a message sound harsh, each with
// a softer way to say the same thing. The list is deliberately small and
// hand written so every suggestion can be explained.

const REPLACEMENTS = [
  ['stop wasting my time', 'I have limited time, so please be brief'],
  ['shut up', 'please let me finish'],
  ['do it now', 'please do it when you can'],
  ['just do it', 'please go ahead'],
  ['hurry up', 'please move quickly if you can'],
  ['i do not care', 'it does not matter much to me'],
  ["i don't care", 'it does not matter much to me'],
  ['you never', 'it would help if you'],
  ['you always', 'sometimes you'],
  ['asap', 'as soon as you can'],
  ['immediately', 'as soon as you can'],
  ['incompetent', 'not up to standard'],
  ['ridiculous', 'hard to accept'],
  ['nonsense', 'does not make sense to me'],
  ['rubbish', 'not good enough'],
  ['stupid', 'not clear'],
  ['useless', 'not helpful'],
  ['terrible', 'below what I hoped'],
  ['awful', 'not good'],
  ['lazy', 'slow to respond'],
  ['whatever', 'that is fine'],
  ['obviously', 'as you may know'],
  ['must', 'please try to'],
  ['hate', 'really dislike'],
  ['dumb', 'not well thought out'],
  ['idiot', 'person'],
  ['thieves', 'people'],
  ['wrong', 'different from what I expected'],
]

// Find harsh phrases in a message. Returns a list of
// { found, suggestion, index } sorted by where they appear.
export function findHarshPhrases(text) {
  const lower = String(text || '').toLowerCase()
  const hits = []
  for (const [phrase, suggestion] of REPLACEMENTS) {
    let from = 0
    while (true) {
      const index = lower.indexOf(phrase, from)
      if (index === -1) break
      hits.push({ found: phrase, suggestion, index })
      from = index + phrase.length
    }
  }
  // If two hits overlap, keep the longer phrase.
  hits.sort((a, b) => a.index - b.index || b.found.length - a.found.length)
  const clean = []
  let coveredUntil = -1
  for (const hit of hits) {
    if (hit.index >= coveredUntil) {
      clean.push(hit)
      coveredUntil = hit.index + hit.found.length
    }
  }
  return clean
}

// Produce a softened copy of the message by swapping in the suggestions.
// Capitalisation of the first letter of a replaced phrase is kept.
export function softenText(text) {
  const hits = findHarshPhrases(text)
  if (hits.length === 0) return text
  let result = ''
  let cursor = 0
  for (const hit of hits) {
    result += text.slice(cursor, hit.index)
    let replacement = hit.suggestion
    const original = text.slice(hit.index, hit.index + hit.found.length)
    if (original[0] && original[0] === original[0].toUpperCase()) {
      replacement = replacement[0].toUpperCase() + replacement.slice(1)
    }
    result += replacement
    cursor = hit.index + hit.found.length
  }
  result += text.slice(cursor)
  return result
}

// Tone signals that are not words: shouting in caps and repeated
// exclamation marks. Returns short notes the UI can show.
export function styleNotes(text) {
  const notes = []
  const capsWords = String(text || '').match(/\b[A-Z]{3,}\b/g) || []
  if (capsWords.length > 0) {
    notes.push(
      `Words in ALL CAPS (${capsWords.slice(0, 3).join(', ')}) can read as shouting.`,
    )
  }
  const exclaims = (String(text || '').match(/!/g) || []).length
  if (exclaims >= 2) {
    notes.push('Repeated exclamation marks make a message sound tense.')
  }
  if (String(text || '').trim().length > 0 && !/[.!?]$/.test(String(text).trim())) {
    notes.push('Ending with a full stop can make the message sound calmer.')
  }
  return notes
}
