# SayItRight

Check how your message sounds before you send it.

SayItRight reads a message you are about to send, for example an email to a
lecturer or a text to your group members, and predicts its tone: Polite,
Friendly, Neutral, Urgent, or Harsh. It shows the words that drove the
score, suggests softer wording for harsh phrases, and lets you teach it new
examples so it learns your own style. Everything runs in the browser. There
is no account, no server, and nothing you type leaves your device.

## How it works

The tone model is a multinomial naive Bayes classifier written from scratch
in plain JavaScript (`src/lib/classifier.js`). It is trained on 125 short
labelled messages (`src/lib/trainingData.js`, 25 per tone) and retrains
instantly whenever you add your own examples in the Teach view. Your added
examples and your check history are saved in localStorage on your device.

A small hand written list (`src/lib/softener.js`) spots harsh words and
phrases like "stupid" or "stop wasting my time" and suggests softer
alternatives, then builds a softened copy of the message you can paste.

## Run it

```
npm install
npm run dev
```

Other commands:

```
npm test        # 16 logic tests for the classifier and softener
npm run build   # production build into dist/
npm run lint    # oxlint over src and tests
node scripts/screenshots.mjs   # screenshots of every screen (after build)
```

## Built with

- React 19 and Vite
- Tailwind CSS with a shadcn-style design system written for this app
  (tokens in `tailwind.config.js`, shared components in `src/index.css`),
  plus Lucide icons. The look is a friendly chat app: soft lavender
  background, white message bubbles, big rounded corners, and a tone
  gauge that fills with the winning tone's colour.
- A naive Bayes text classifier written from scratch (no ML library)
- localStorage for user examples and history
- Nunito and Inter fonts, self hosted so the app works offline

## Known limits

- The training set is small (125 hand written examples) and English only.
- Naive Bayes counts words on their own, so it misses sarcasm and context.
- The percentages are model scores, not real world probabilities. The model
  is often more confident than it should be.
- The softener only knows a fixed list of phrases, and its grammar is
  sometimes rough. It is a suggestion, not a rewrite you must accept.
