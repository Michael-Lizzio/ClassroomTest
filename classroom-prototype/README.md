# Chalkroom: a clickable prototype

Chalkroom is a collaborative virtual classroom for iOS, Android and the web. A teacher hosts a live class on an illustrated whiteboard. Students join from a QR code or a link, with no account, and can circle any part of the board to ask a question. Questions go to the teacher's private inbox. In Present mode, a projector screen rolls down over the board, showing slides from the teacher's notes with live captions.

This folder is a static demo for showing the idea to founder reviews, investors and early teachers. Nothing here talks to a server.

**Working name:** Chalkroom. **Alternatives:** Gradewell, Tallyroom.

## How to open it

Double-click `index.html`. No build step, no server, no npm.

Pages, in the order of the 3-minute tour below:

| Page | File | What it shows |
| --- | --- | --- |
| Overview | `index.html` | Name, pitch, looping hero animation, cards to each demo |
| Join | `join.html` | Phone frame: scan, name, joining, in class. Desktop: open the link |
| Classroom, student view | `classroom.html` | Teacher walks to the board and writes. Student and Teacher view switch |
| Teacher console | `teacher.html` | Live view, board areas, handwriting, lesson notes, questions inbox, roster, Whiteboard / Present switch |
| Ask a question | `ask.html` | Student phone (drag to circle, write, send) and teacher inbox side by side |
| Present mode | `present.html` | Projector screen, slides from notes, Prev / Next, captions with on/off |
| Every device | `devices.html` | Same class on iPhone, Android and desktop frames |
| Architecture | `architecture.html` | Supabase plan for the real app, covering the ten topics |

Each demo page has Play, Pause, Restart and a scrubber. The viewer can still click around by hand at any time. Most pages say "Prototype · simulated data" in the header.

Works offline except for the two Google Fonts (Caveat for board handwriting, Figtree for the UI). If the fonts don't load, the system fonts take over and the layout still holds.

## Art direction

**Warm flat illustration with chalk and marker accents.** A cream paper background, a warm wood-and-plaster classroom, a white board in an aluminium frame, and teal, orange, mustard and blue as marker colours. Handwriting uses Caveat, so the board looks written by hand. Everything else uses Figtree.

- Design tokens live in `assets/css/tokens.css` as CSS variables on `:root`: colour, type, space, radius, shadow and motion.
- Every illustration is inline SVG, built by `assets/js/chalk.js` (the room, the board, the teacher, the students, the projector screen, the QR stand-in).
- Motion uses CSS keyframes and the Web Animations API. UI changes take 150 to 400 ms. Scene moves take about a second. With `prefers-reduced-motion`, animations drop to near-zero duration and the projector screen fades instead of sliding.
- No purple-to-blue gradients, no emoji icons, no glassmorphism.

## Presenter script (3 minutes)

1. **Overview (20 s).** "This is Chalkroom. A live classroom where students draw on the board and teachers answer privately." Let the hero loop run once.
2. **Join (30 s).** Open `join.html`. Press Play. "No accounts. Scan the code, type a name, and you're in. On a laptop it's the same link." Point out that the phone and the desktop show the same join.
3. **Classroom (40 s).** Open `classroom.html`. Press Play. "The teacher walks to the board and writes. Text is typed out in time with her arm." Let the bottom-right area get revealed at the end. "Students see only what the teacher shows." Switch to Teacher view to show the HIDDEN marking.
4. **Teacher console (40 s).** Open `teacher.html`. Press Play. "Questions arrive in a private inbox, never on the board. Each one has a snapshot of exactly what was circled. Areas can be hidden, notes can be pushed to the board, and the same board goes into Present mode." Click one area toggle, then Push a note.
5. **Ask a question (40 s).** Open `ask.html`. Drag a circle on the phone's board, type a question, and send. "That's the real interaction. The circle is real, the question is real in this page, and the teacher gets it."
6. **Present mode (30 s).** Open `present.html`. Press Play. "The projector screen comes down, slides follow the notes, and captions type along the bottom." Turn captions off and on.
7. **Devices and architecture (15 s).** Open `devices.html`, then `architecture.html`. "The layout adapts from a phone to a laptop. The architecture page is the Supabase plan: Auth, Postgres, Realtime, Storage and Edge Functions, with transcription and privacy covered."

## What is simulated and what would be real

| Area | In this prototype | In the real app |
| --- | --- | --- |
| Live sync between student and teacher | Shared JavaScript event bus on the same page | Supabase Realtime channel per session (Broadcast, Presence, Postgres Changes) |
| Board writing | Scripted timeline; the teacher's typed text is drawn with the same handwriting code | Board items written by the teacher and stored in Postgres |
| Captions | Scripted transcript, typed out at double speed | Streaming speech-to-text, interim and final captions |
| QR code | Decorative pattern seeded from the link. **It is not a scannable code.** | A real QR code encoding `https://chalkroom.app/j/<code>` |
| QR scanning | Animated scan line | Native camera scanning, universal and app links |
| Join | Name entry and a short "joining" state | Join code validated by an Edge Function; anonymous sign-in |
| Questions and snapshots | Snapshot of the board at the moment of asking | Snapshot stored in Storage, questions in Postgres under RLS |
| Students and roster | Eight fake students, fixed names | Real participants and Presence |
| Notes | Six prepared notes, editable in the console | Stored per class, pushed or shown per session |
| Data | Fake class "Biology 101: Photosynthesis", Ms. Naomi Okafor, eight students | Real data only |

The architecture page (`architecture.html`) describes the real system. Its prices and plan limits are planning estimates and need checking against current vendor pages.

## Assumptions

- **Platform:** Expo / React Native for mobile, with the same code for the web. The prototype itself is plain HTML, CSS and JavaScript, as asked.
- **Board size:** a 500 × 250 board in board units, split into areas of whole board, two halves, or a 2 × 2 grid.
- **Demo length:** every timeline is 13 to 60 seconds. The Present demo plays the two-minute transcript at double speed, so the 2-minute transcript fits a 1-minute timeline.
- **Students:** six to twelve, fake names. Eight are shown.
- **Hidden areas:** students get no hint that an area exists beyond a blank space. Teachers see hidden areas dimmed and tagged HIDDEN.
- **Captions:** shown only in Present mode, as asked, and they're real text (`aria-live`), so screen readers pick them up.
- **Browser support:** current Chrome, Safari, Edge and Firefox on desktop, and current iOS and Android browsers. No Internet Explorer.
- **Pointer drawing:** a tap makes a dot, a drag makes a circle around the stroke. Both work with mouse, touch and pen.
- **Accessibility:** semantic headings and landmarks, buttons not divs for controls, a visible focus ring, touch targets at least 44 px, and a keyboard-operable timeline scrubber.
- **Layout:** checked at 1440 px and 390 px with no horizontal scroll.

## Open questions

1. Do teachers want video of themselves, or is the board plus voice enough for the MVP? (The architecture page assumes board plus voice.)
2. Is the consent route school-authorised first, or direct to parents? This decides whether COPPA work starts in the MVP or in v1.
3. Which speech-to-text provider? Deepgram is the proposed default, but cost should be re-tested at 100 classes.
4. What is the pricing unit: per school, per teacher, or per seat?
5. Should students see each other's questions if the teacher pins them? The current prototype says no.

## Files

```
classroom-prototype/
  index.html  join.html  classroom.html  teacher.html
  ask.html  present.html  devices.html  architecture.html
  assets/css/tokens.css  assets/css/app.css
  assets/js/demo-engine.js   shared timeline: play, pause, restart, scrub
  assets/js/chalk.js         shared SVG scene, teacher, board, screen, QR stand-in
  assets/js/data.js          fake class, students, questions, notes, transcript
  assets/js/inbox.js         teacher's questions inbox
  assets/js/<page>.js        one per demo page
  README.md
```
