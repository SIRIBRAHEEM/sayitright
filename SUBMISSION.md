# SayItRight - Devpost submission text (AI OpenBuild)

Copy each block into the matching Devpost field.

---

## Project name

SayItRight

## Tagline

Check how your message sounds before you send it.

## About the project (the story)

### Inspiration

As a student I send a lot of messages where the tone matters: emails to
lecturers, reminders to group members, requests to class reps. More than
once I have sent a message that sounded fine in my head and landed badly.
I wanted a small tool that reads a draft the way a reader might, before I
press send. I also wanted the AI part to be real and visible, not a magic
API call, so I built a small machine learning model that runs entirely in
the browser and can be taught new examples by the user.

### What it does

You paste a message and SayItRight predicts its tone: Polite, Friendly,
Neutral, Urgent, or Harsh. It shows a confidence bar for every tone and the
exact words that pushed the score towards the winning tone. If the message
contains harsh phrases, it suggests softer alternatives and builds a
softened copy you can paste. In the Teach view you can label your own
messages and the model retrains on the spot, so you can watch it learn. A
history view keeps your past checks on your own device.

### How I built it

The app is React and Vite, styled with Tailwind CSS and a shadcn-style
design system I wrote for it (soft lavender chat look, white message
bubbles, a tone gauge, Lucide icons, Nunito and Inter fonts self hosted).
The AI is a multinomial naive Bayes text
classifier that I wrote from scratch in plain JavaScript. It tokenises the
message into words plus a few style signals (repeated exclamation marks,
question marks, words typed in ALL CAPS), then scores each tone using word
counts learned from 125 labelled example messages, with Laplace smoothing
so unseen words do not break it. The explanation comes from comparing how
likely each word is under the winning tone versus the others. The softener
is a small hand written list of harsh phrases with gentler replacements.
User examples and history are stored in localStorage. The fonts are self
hosted, so the whole app works offline with no server and no API key.

### Challenges I ran into

The hard part was making the explanation honest. Early on, the top words
for a Harsh result included filler words like "and" and "is", which are
true to the maths but useless to a reader. I kept those words in the score
but filtered them out of the explanation, and I say so in the code. Another
challenge was confidence: naive Bayes is famously overconfident, so many
results show 100 percent. Rather than hide that, the app presents the
numbers as model scores and the limitations section below owns up to it.

### What I learned

Writing a classifier from scratch taught me more than calling an API would
have. I now understand smoothing, priors, and why word independence is both
the strength and the weakness of naive Bayes. I also learned that a small,
explainable model that a user can teach beats a bigger black box for a tool
like this.

## The AI method, with sample inputs and outputs

Method: multinomial naive Bayes over word tokens plus style signals
(exclamation marks, question marks, ALL CAPS words), trained on 125
labelled messages (25 per tone) bundled in the app. Laplace smoothing with
alpha 1. Probabilities come from a softmax over the class log scores. The
model runs 100 percent in the browser; no model API, no server, no key.

Sample 1
Input: "Good morning sir, please I missed the test because I was sick. I would be grateful if you could allow me to write a make-up test. Thank you for your understanding."
Output: Polite, 100 percent. Top words: please, would, thank, good, grateful, sir.

Sample 2
Input: "You people are useless, nobody has sent their part and the deadline is tomorrow. Stop wasting my time."
Output: Harsh, 98 percent (Neutral 1, Urgent 1). Top words: people, stop, you, useless, nobody, wasting.
Softened version the app suggests: "You people are not helpful, nobody has sent their part and the deadline is tomorrow. I have limited time, so please be brief."

Sample 3
Input: "Please send your part of the project now, submission closes in two hours and we cannot submit without it."
Output: Urgent, 100 percent. Top words: now, send, please, submit, closes, part.

Sample 4
Input: "The departmental seminar will hold on Thursday at 10am in the main hall. Attendance is compulsory for final year students."
Output: Neutral, 100 percent. Top words: hall, seminar, main, students, hold, attendance.

Sample 5 (teaching the model a new word)
Input: "That was pure wahala, wahala everywhere."
Before teaching: Harsh 50 percent, Friendly 37 percent. The model is unsure because it has never seen the word wahala.
After adding three Harsh examples containing wahala in the Teach view: Harsh 97 percent, and wahala becomes the top word. This is the clearest proof in the app that the model really learns from examples.

## How I tested it

- 16 automated logic tests (node test runner) cover the tokenizer, one
  prediction per tone, probabilities summing to 1, the explanation output,
  the softener, style notes, odd inputs like empty text, and the teach and
  retrain flow. All 16 pass.
- The model labels 99.2 percent of its own 125 training examples correctly.
  That is a sanity check on messages it has already seen, not a score on
  new messages, and the app says so on the Teach screen.
- I checked every screen in a real browser with screenshots and confirmed
  zero console errors.

## Limitations (honest)

- Sarcasm fools it. Input: "Oh great, another delay. Just what I needed today." The model reads it as Urgent 47 percent and Friendly 30 percent, because it counts words like "great" on their own and cannot hear the tone behind them. Harsh only gets 14 percent.
- The training set is small: 125 short hand written messages, English only. Slang, Pidgin, and other languages are mostly unknown words to it until a user teaches them.
- The percentages are model scores, not real probabilities. Naive Bayes tends to be overconfident, which is why so many results show 100 percent.
- The softener only knows a fixed list of 28 harsh phrases. It can miss new insults, and its grammar is sometimes rough, for example turning "a stupid idea" into "a not clear idea". It is a suggestion to edit, not a finished rewrite.
- Word order is ignored. "Not bad at all" and "bad, not good at all" look similar to the model.

## Built with

React, Vite, Tailwind CSS (shadcn-style design system), JavaScript, a
naive Bayes classifier written from scratch, localStorage, Lucide icons,
Nunito and Inter fonts (self hosted).

## Team

Ibrahim (solo): idea, design, code, training data, testing, and the demo.

## AI assistance disclosure

An AI coding assistant helped me write and test the code for this project
and draft this submission text. The idea, the design choices, the training
examples, and the final product are mine. The tone model itself is a
classical naive Bayes classifier that I can explain line by line; no
external AI service is used at runtime.
