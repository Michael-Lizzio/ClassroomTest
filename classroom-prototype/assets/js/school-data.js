/* Principal's view: fake school data. Times are minutes since midnight. Nothing here is real. */
window.SCHOOL_DATA = {
  school: {
    name: "Lakeview High School",
    principal: { name: "Dr. Rachel Mensah", short: "Dr. Mensah" },
    now: 10 * 60 + 2, // 10:02, the start of the scripted day
    blocks: [
      { id: "A", label: "Block A", start: 8 * 60, end: 8 * 60 + 50 },
      { id: "B", label: "Block B", start: 8 * 60 + 55, end: 9 * 60 + 45 },
      { id: "C", label: "Block C", start: 9 * 60 + 50, end: 10 * 60 + 40 },
      { id: "D", label: "Block D", start: 10 * 60 + 45, end: 11 * 60 + 35 },
      { id: "E", label: "Block E", start: 11 * 60 + 40, end: 12 * 60 + 30 },
      { id: "F", label: "Block F", start: 12 * 60 + 35, end: 13 * 60 + 25 }
    ]
  },

  // Eight classes running in parallel during Block C. `exit` counts responses rated 1 to 4.
  classes: [
    { id: "c1", name: "Algebra II", room: "Room 104", teacher: "Mr. Idris Haddad", tid: "t1", start: 9 * 60 + 50,
      enrolled: 28, present: 27, exit: [0, 1, 6, 12], onTask: 91, questionsOpen: 1, pulse: [3.1, 3.3, 3.2, 3.5, 3.4, 3.6],
      segments: [["Warm-up", 5], ["Teach", 18], ["Practice", 20], ["Exit ticket", 7]], flags: [], lesson: "Quadratic formula, practice set 3" },
    { id: "c2", name: "Biology 101: Photosynthesis", room: "Room 214", teacher: "Ms. Naomi Okafor", tid: "t2", start: 9 * 60 + 52,
      enrolled: 31, present: 29, exit: [2, 5, 9, 6], onTask: 78, questionsOpen: 5, pulse: [3.2, 3.0, 2.9, 2.8, 2.7, 2.6],
      segments: [["Warm-up", 5], ["Teach", 20], ["Practice", 15], ["Exit ticket", 5]],
      flags: [{ name: "Kwame", note: "Stuck on the Calvin cycle", kind: "learning" }], lesson: "Light and dark reactions" },
    { id: "c3", name: "English 10", room: "Room 118", teacher: "Ms. Lena Brandt", tid: "t3", start: 9 * 60 + 48,
      enrolled: 26, present: 24, exit: [0, 2, 8, 9], onTask: 84, questionsOpen: 2, pulse: [3.4, 3.5, 3.3, 3.4, 3.3, 3.4],
      segments: [["Reading circle", 12], ["Discussion", 20], ["Writing", 15], ["Exit ticket", 3]],
      flags: [{ name: "Jun", note: "Left the room twice", kind: "behaviour" }], lesson: "Discussion: narrator reliability" },
    { id: "c4", name: "World History", room: "Room 207", teacher: "Mr. Tomas Ruiz", tid: "t4", start: 9 * 60 + 51,
      enrolled: 30, present: 28, exit: [1, 3, 10, 8], onTask: 88, questionsOpen: 0, pulse: [3.0, 3.1, 3.2, 3.1, 3.2, 3.1],
      segments: [["Hook", 4], ["Source analysis", 22], ["Debate", 18], ["Exit ticket", 6]], flags: [], lesson: "Primary sources, 1918 treaty" },
    { id: "c5", name: "Chemistry", room: "Room 309", teacher: "Ms. Grace Kim", tid: "t5", start: 9 * 60 + 50,
      enrolled: 24, present: 24, exit: [1, 2, 7, 11], onTask: 90, questionsOpen: 3, pulse: [3.2, 3.3, 3.4, 3.3, 3.4, 3.3],
      segments: [["Lab brief", 6], ["Lab", 28], ["Data", 12], ["Exit ticket", 4]], flags: [], lesson: "Titration lab, group data" },
    { id: "c6", name: "Physical Education", room: "Gym B", teacher: "Mr. Dev Patel", tid: "t6", start: 9 * 60 + 55,
      enrolled: 34, present: 31, exit: [0, 2, 6, 9], onTask: 82, questionsOpen: 0, pulse: [3.3, 3.2, 3.4, 3.3, 3.3, 3.4],
      segments: [["Warm-up", 10], ["Drills", 25], ["Game", 10], ["Cool-down", 3]], flags: [], lesson: "Passing drills, then small-sided game" },
    { id: "c7", name: "Art Studio", room: "Studio 2", teacher: "Ms. Amara Johnson", tid: "t7", start: 9 * 60 + 49,
      enrolled: 18, present: 18, exit: [0, 0, 4, 10], onTask: 95, questionsOpen: 0, pulse: [3.6, 3.6, 3.7, 3.7, 3.6, 3.7],
      segments: [["Demo", 10], ["Studio time", 30], ["Critique", 8]], flags: [], lesson: "Value studies in charcoal" },
    { id: "c8", name: "Computer Science", room: "Lab 4", teacher: "Mr. Owen Walsh", tid: "t8", start: 9 * 60 + 53,
      enrolled: 22, present: 20, exit: [3, 4, 6, 3], onTask: 74, questionsOpen: 4, pulse: [3.1, 2.9, 2.8, 2.7, 2.6, 2.6],
      segments: [["Intro", 5], ["Code along", 20], ["Build", 18], ["Exit ticket", 4]],
      flags: [{ name: "Sofia", note: "Stuck on loops", kind: "learning" }], lesson: "Loops and conditionals" }
  ],

  teachers: [
    { id: "t1", name: "Mr. Idris Haddad", subject: "Mathematics", years: 11, onTime: 96, reply: 4, feedback: 4.7, helpRaised: 2, trend: [3.2, 3.3, 3.4, 3.2, 3.5, 3.4, 3.5, 3.6], notes: ["Strong pacing; exit tickets read carefully (Mar).", "Offer one more worked example in Practice (Oct)."] },
    { id: "t2", name: "Ms. Naomi Okafor", subject: "Biology", years: 7, onTime: 88, reply: 9, feedback: 4.4, helpRaised: 5, trend: [3.4, 3.3, 3.1, 3.2, 3.0, 2.9, 2.8, 2.6], notes: ["New Calvin cycle unit; exit ticket scores dipping.", "Asked for a co-teacher walkthrough (this week)."] },
    { id: "t3", name: "Ms. Lena Brandt", subject: "English", years: 9, onTime: 92, reply: 6, feedback: 4.6, helpRaised: 1, trend: [3.3, 3.4, 3.5, 3.3, 3.4, 3.3, 3.4, 3.4], notes: ["Discussion structure praised by students (Feb)."] },
    { id: "t4", name: "Mr. Tomas Ruiz", subject: "History", years: 14, onTime: 94, reply: 5, feedback: 4.5, helpRaised: 0, trend: [3.1, 3.0, 3.2, 3.1, 3.2, 3.1, 3.0, 3.1], notes: ["Source-analysis unit to be shared with the department."] },
    { id: "t5", name: "Ms. Grace Kim", subject: "Chemistry", years: 5, onTime: 97, reply: 3, feedback: 4.8, helpRaised: 0, trend: [3.2, 3.4, 3.3, 3.4, 3.3, 3.5, 3.3, 3.3], notes: ["Lab safety record excellent (Jan)."] },
    { id: "t6", name: "Mr. Dev Patel", subject: "Physical Education", years: 6, onTime: 90, reply: 8, feedback: 4.3, helpRaised: 1, trend: [3.3, 3.3, 3.2, 3.4, 3.3, 3.2, 3.3, 3.3], notes: ["Gym sound system reported repeatedly (Sep to Oct)."] },
    { id: "t7", name: "Ms. Amara Johnson", subject: "Art", years: 12, onTime: 99, reply: 2, feedback: 4.9, helpRaised: 0, trend: [3.6, 3.7, 3.6, 3.6, 3.7, 3.6, 3.7, 3.7], notes: ["Exhibition planning on track."] },
    { id: "t8", name: "Mr. Owen Walsh", subject: "Computer Science", years: 3, onTime: 85, reply: 12, feedback: 4.1, helpRaised: 3, trend: [3.4, 3.2, 3.1, 3.0, 2.9, 2.8, 2.7, 2.6], notes: ["First year teaching loops; pairing with Mr. Patel on pacing (Oct)."] }
  ],

  // Help requests: teachers raise them from the console; the principal works the queue.
  // kind: safeguard | behaviour | learning | tech | resource
  requests: [
    { id: "r1", kind: "behaviour", classId: "c3", student: "Jun", at: 9 * 60 + 58, status: "open", text: "Jun has left the room twice in ten minutes. Could you do a check-in when you're free?" },
    { id: "r2", kind: "tech", classId: "c6", student: "", at: 10 * 60 + 0, status: "open", text: "Gym sound system is cutting out during the game. Facilities needed." }
  ],

  kinds: {
    safeguard: { label: "Safeguarding", tone: "rose", priority: 1, route: "Counsellor + safeguarding lead" },
    behaviour: { label: "Behaviour", tone: "orange", priority: 2 },
    learning: { label: "Learning support", tone: "teal", priority: 3 },
    tech: { label: "Room or tech", tone: "blue", priority: 3 },
    resource: { label: "Resource or cover", tone: "mustard", priority: 4 }
  },

  // Activity seeded in each class log before the day's demo starts.
  classLog: {
    c2: ["09:58 Ms. Okafor shared the Calvin cycle slides", "10:00 Five open questions in the inbox"],
    c3: ["09:55 Discussion started", "09:58 Jun left the room (you will see a help request)"],
    c8: ["09:58 Exit ticket scores dipped", "10:01 Four open questions in the inbox"]
  }
};
