# Chalkboard: Collaborative Virtual Classroom

A clickable prototype of a live, interactive virtual classroom for teaching and learning online.

## How to Open

Double-click `index.html` to open in your default browser. No build step, no server required. Works offline except for fonts (which are cached by the browser on first load).

Tested on Chrome, Safari, Firefox on desktop and Safari on iOS.

## Prototype Scope

**Working names:** Chalkboard, Whiteboard, LiveLearn
**Alternative names:** ClassroomSync, TeachFlow

This is a **simulated demo**, not production software. Every "live" behavior is scripted:
- Board drawing and text appearance are animated, not real-time synced
- Questions submitted by students trigger a scripted demo inbox update
- QR code scanning is animated
- Speech-to-text captions are scripted transcripts
- Participant presence is a static roster

What's real: the layout, interaction patterns, information architecture, and the technical architecture document (which covers how the real backend would work).

## Art Direction

**Style:** Warm, welcoming, hand-drawn aesthetic inspired by classroom whiteboards and chalk.

- **Color palette:** Soft blues and greens, warm cream (board background), with muted earth tones. Avoids harsh gradients and gradients and maintains high contrast for accessibility.
- **Typography:**
  - UI: System fonts (San Francisco, Helvetica Neue) for clarity and speed
  - Board handwriting: "Permanent Marker" cursive font for authentic writing effect
  - Readable at 12px minimum
- **Illustrations:** Inline SVG only. Simple, flat people and objects (teacher, student avatars, desks). No photorealism or highly detailed graphics.
- **Motion:** Subtle, purposeful. Things slide in (ease-out, 150–250 ms), fade in, or grow. Respects `prefers-reduced-motion`.
- **UI components:** Rounded corners, soft shadows, lots of white space. Cards and panels, not dense dashboards.

## Presenter Script (3 minutes)

**Goal:** Show founders, investors, and early teachers how Chalkboard works.

### Setup
1. Open `index.html` in a modern browser on a desktop (1440px or wider for best layout).
2. Walk through each demo in order, clicking Play to run the scripted timeline.

### The Flow

**Page 1: Home** (15 seconds)
- "Here's Chalkboard: a virtual classroom where teachers teach and students learn live, together."
- "The hero animation shows the core idea: a teacher writes on a board, students watch and can ask questions."

**Page 2: Join** (30 seconds)
- Click [Play] to run the demo.
- "Students join by scanning a QR code or clicking a link. They enter their name. No account needed."
- "Teachers share the QR code or a link with students. Students join instantly."
- Show both phone (left) and desktop (right) flows side-by-side.

**Page 3: Classroom** (30 seconds)
- Click [Play]. Text appears on the board as the teacher "writes."
- "Students see the classroom in real-time. The teacher writes on the board, students see it appear letter by letter."
- "The teacher is visible in the room, the students can see each other. It feels live."

**Page 4: Ask a Question** (45 seconds)
- "Students can tap or draw on the board to circle something and ask the teacher about it."
- Click [Play] on the Ask page. A circle is drawn on the board. A question is typed and sent.
- "The student's circle and question are sent to the teacher's inbox as a snapshot, privately. The teacher sees who asked, what they asked, and exactly what part of the board they're asking about."
- Show the question appearing in the teacher console on the right.

**Page 5: Teacher Console** (45 seconds)
- Navigate to teacher.html.
- "On the teacher side, everything is in one place: the student view (top-left), questions inbox (center), lesson notes (right), and the class roster (bottom)."
- Click on "Board Areas" options. "Teachers can hide parts of the board and reveal them one at a time, like a slide deck. Students see only what the teacher allows."
- Scroll through a few question cards. "Each question shows who asked, what they asked, a snapshot of the board, and when. Teachers can mark questions as answered or pin them for everyone."
- Show the roster: "The class code is here, the QR code would be here, and all students' names."

**Page 6: Present Mode** (30 seconds)
- Click [Play] on present.html.
- "Teachers can switch to Present mode. A projector screen pulls down over the whiteboard. Slides appear with the teacher's notes."
- "Live captions of what the teacher is saying appear at the bottom."
- Click Next/Prev to show slide navigation.
- "Students can turn captions on or off for accessibility."

**Page 7: Responsive Devices** (20 seconds)
- "The app works on iPhone, Android, and desktop, with layouts adapted to each screen size."
- Show devices.html with three device frames side-by-side.
- On a phone the board is stacked above controls. On desktop, you see the whole room.

**Page 8: Architecture** (30 seconds)
- "For the real app, we'd use:"
- Scroll to the System Diagram. "Expo for iOS and Android, React Native Web for web. All share one codebase."
- "Supabase handles auth, real-time sync over WebSockets, and the database."
- "Speech-to-text comes from Deepgram or Google Cloud."
- "The real app would handle 30 students in a class easily, and 1,000 classes at once for under $100/month."

**Summary** (15 seconds)
- "Chalkboard is live collaboration without the complexity. Teachers teach like they always did (write on a board, present slides). Students join from a link. Questions flow privately to the teacher. Everything is real-time."
- "No account creation, no login friction. Students join instantly and see the classroom."

**Total time: ~3 minutes.**

## Pages & What Each Shows

| Page | Filename | Demonstrates |
|------|----------|---------------|
| Home | `index.html` | Hero animation, links to all demos |
| Join | `join.html` | QR scan, name entry, joining (phone + desktop) |
| Classroom | `classroom.html` | Live board, teacher character, students, animated writing |
| Teacher Console | `teacher.html` | Classroom view, board areas, questions inbox, lesson notes, roster |
| Ask a Question | `ask.html` | Drawing on board, question submission, teacher inbox update |
| Present Mode | `present.html` | Slides, live captions, navigation |
| Multi-Device | `devices.html` | iPhone, Android, desktop layouts side-by-side |
| Architecture | `architecture.html` | Tech stack, system diagram, data model, deployment plan |

## Running the Demos

Each demo page (except Home) has **Play**, **Pause**, and **Restart** buttons in the top bar. Click **Play** to run a 15–30 second scripted animation. You can also click around by hand (e.g., type a name, draw on the canvas, click buttons) and the scripted timeline will adapt.

**Timeline examples:**
- **Join page:** Automatically advances through QR scan → name entry → joining. Or manually enter your name and click "Join Class."
- **Ask page:** Draws a circle on the board, types a question, sends it. The question appears in the teacher's inbox. You can also draw manually.
- **Present page:** Advances through slides with captions. Or click Prev/Next to jump around.

## Assumptions & Design Decisions

1. **No real backend:** All "sync" between student and teacher is on one page with shared JavaScript state. A real app would use Supabase Realtime WebSockets.

2. **Simulated data:** One class (Biology 101), one teacher (Ms. Park), 8 students. Questions are pre-written. The QR code is a placeholder.

3. **Board is canvas-only:** No collaborative vector drawing or OT/CRDT reconciliation yet. The demo shows simple drawing and text. A real app would use a library like Excalidraw or Tldraw for reliable multi-user drawing.

4. **Accessibility:**
   - All text has sufficient contrast (WCAG AA).
   - Buttons are 44px minimum (touch target size).
   - Page animations respect `prefers-reduced-motion`.
   - Form inputs have labels.
   - Captions in Present mode are real text, not baked into images.

5. **Mobile responsiveness:** Tested at 390px (phone) and 1440px (desktop). Layouts adapt by reordering panels or hiding non-essential UI on small screens.

6. **No external dependencies:** HTML, CSS, vanilla JS only (except Google Fonts). No jQuery, no frameworks, no npm.

7. **Teacher console is simplified:** In a real app, teachers would have more granular control over questions, notes, and board state. This demo shows the key panels.

8. **Speech-to-text is scripted:** The demo shows what captions would look like, synced to a fake transcript. Real transcription would be streamed from Deepgram or Google Cloud.

## What Wasn't Built (and Why)

- **Collaborative drawing with OT/CRDT:** Would require a state management library and is overkill for a prototype.
- **Real user accounts & login flow:** The demo uses simulated participants. Real app would have Supabase Auth.
- **File upload & media:** The demo doesn't let teachers upload PDFs or images. A real app would use Supabase Storage.
- **Analytics & usage metrics:** The prototype doesn't track who clicks what or how long they spend on each page.
- **Moderation UI:** No admin panel for flagging or removing inappropriate questions.
- **Chat / messaging:** The demo focuses on the board and questions, not free-form chat.
- **Mobile app builds:** This is web-only. The architecture doc describes how Expo would build for iOS/Android.

## Open Questions for the Founder

1. **Pricing:** Freemium (free for teachers) or B2B (charge schools)? The architecture supports both.
2. **Teacher authentication:** Email only, or SSO (Google/Microsoft) for school districts?
3. **Recording:** Should teachers be able to replay past classes? Raises FERPA/privacy concerns.
4. **Parental controls:** Age verification and parental consent for users under 13?
5. **Integration:** API for gradebook systems (Clever, Schoology, Canvas)?

## Technical Notes

- **CSS variables:** Design tokens (colors, spacing, type) are in `assets/css/tokens.css`.
- **Demo engine:** Shared timeline logic in `assets/js/demo-engine.js` (DemoTimeline class).
- **Page scripts:** Each page has its own `assets/js/<page>.js` for timeline events and interactivity.
- **SVG:** All illustrations are hand-coded SVG, embedded inline in HTML. No images.
- **Browser support:** Modern browsers only (Chrome, Safari, Firefox, Edge from 2020+).

## Files

```
classroom-prototype/
├── index.html                       (Home)
├── join.html                        (Join flow)
├── classroom.html                   (Classroom view)
├── teacher.html                     (Teacher console)
├── ask.html                         (Ask a question)
├── present.html                     (Present mode)
├── devices.html                     (Multi-device)
├── architecture.html                (Architecture doc)
├── assets/
│   ├── css/
│   │   ├── tokens.css              (Design tokens)
│   │   └── app.css                 (Shared styles)
│   └── js/
│       ├── demo-engine.js          (Timeline engine)
│       ├── join.js                 (Join page logic)
│       ├── classroom.js            (Classroom page logic)
│       ├── ask.js                  (Ask page logic)
│       └── present.js              (Present page logic)
└── README.md                        (This file)
```

## Next Steps

**For investors:** Use this prototype to understand the product vision. The real work starts with teacher interviews and a MVP build (8–10 weeks).

**For engineers:** The architecture page has the tech stack, data schema, and build plan. Expo + Supabase + Deepgram is the recommended stack.

**For teachers:** Sign up for early access and test the real app when it's ready. Feedback from the classroom is gold.

---

Built as a clickable prototype with simulated behavior. No backend, no build step, no npm. Pure HTML, CSS, and JavaScript.

**Prototype · simulated data**
