/* Fake but believable data for every demo. Nothing here is real. */
window.CHALK_DATA = {
  app: {
    name: "Chalkroom",
    pitch: "A live classroom your students can draw on, and you can quietly answer."
  },

  cls: {
    name: "Biology 101: Photosynthesis",
    short: "Biology 101",
    code: "BIO-7Q4",
    link: "chalkroom.app/j/BIO-7Q4",
    room: "Room 214"
  },

  teacher: { name: "Ms. Naomi Okafor", short: "Ms. Okafor" },

  // Shirt and hair colours for the seated students in the room illustration.
  students: [
    { name: "Aiden", hair: "#3B2A20", shirt: "#D9622B" },
    { name: "Priya", hair: "#1B1A1F", shirt: "#1E7566" },
    { name: "Mateo", hair: "#6B4226", shirt: "#C4506A" },
    { name: "Lena",  hair: "#C98B3C", shirt: "#2D5C9E" },
    { name: "Jun",   hair: "#1B1A1F", shirt: "#E8B043" },
    { name: "Sofia", hair: "#8A3B2A", shirt: "#5E8C3A" },
    { name: "Kwame", hair: "#24201C", shirt: "#B5651D" },
    { name: "Ruby",  hair: "#A0522D", shirt: "#3E8E9E" }
  ],

  // Lesson board, in board coordinates (500 x 250).
  board: {
    width: 500,
    height: 250,
    items: [
      { id: "title", type: "text", text: "Photosynthesis", x: 30, y: 58, size: 46, color: "#1E7566" },
      { id: "eq", type: "text", text: "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", x: 30, y: 112, size: 34, color: "#23211E" },
      { id: "arrow", type: "path", d: "M292 92 C320 70 350 70 378 92", color: "#D9622B", width: 4 },
      { id: "light", type: "text", text: "light", x: 318, y: 64, size: 26, color: "#D9622B" },
      { id: "lbl-light", type: "text", text: "Light reactions", x: 30, y: 186, size: 28, color: "#D9622B" },
      { id: "lbl-light-2", type: "text", text: "in the thylakoid", x: 30, y: 218, size: 24, color: "#23211E" },
      { id: "lbl-calvin", type: "text", text: "Calvin cycle", x: 282, y: 186, size: 28, color: "#2D5C9E" },
      { id: "lbl-calvin-2", type: "text", text: "in the stroma", x: 282, y: 218, size: 24, color: "#23211E" }
    ],
    // Areas the teacher can split the board into.
    modes: {
      whole: [{ id: "all", label: "Whole board", x: 0, y: 0, w: 500, h: 250 }],
      halves: [
        { id: "left", label: "Left half", x: 0, y: 0, w: 250, h: 250 },
        { id: "right", label: "Right half", x: 250, y: 0, w: 250, h: 250 }
      ],
      grid: [
        { id: "tl", label: "Top left", x: 0, y: 0, w: 250, h: 125 },
        { id: "tr", label: "Top right", x: 250, y: 0, w: 250, h: 125 },
        { id: "bl", label: "Bottom left", x: 0, y: 125, w: 250, h: 125 },
        { id: "br", label: "Bottom right", x: 250, y: 125, w: 250, h: 125 }
      ]
    }
  },

  // Example student questions. `region` is the snapshot crop; `ring` is the student's circle.
  questions: [
    {
      id: "q1", student: "Priya", time: "9:42",
      text: "Does the O₂ come from the CO₂ or from the water?",
      region: { x: 330, y: 62, w: 170, h: 96 },
      ring: { cx: 428, cy: 104, rx: 58, ry: 26 }
    },
    {
      id: "q2", student: "Mateo", time: "9:44",
      text: "Is the Calvin cycle the same thing as the dark reactions?",
      region: { x: 260, y: 150, w: 230, h: 80 },
      ring: { cx: 340, cy: 190, rx: 96, ry: 26 }
    },
    {
      id: "q3", student: "Ruby", time: "9:46",
      text: "If chloroplasts are green, why do they reflect green light?",
      region: { x: 10, y: 150, w: 230, h: 90 },
      ring: { cx: 120, cy: 196, rx: 100, ry: 24 }
    },
    {
      id: "q4", student: "Jun", time: "9:49",
      text: "Can plants make sugar at night from the starch they stored?",
      region: { x: 0, y: 20, w: 300, h: 120 },
      ring: { cx: 140, cy: 84, rx: 130, ry: 22 }
    },
    {
      id: "q5", student: "Aiden", time: "9:51",
      text: "Should the thylakoid be labelled inside or outside the stroma?",
      region: { x: 10, y: 160, w: 260, h: 84 },
      ring: { cx: 110, cy: 192, rx: 110, ry: 26 }
    }
  ],

  // Lesson notes, prepared before class. Each one can be pushed to the board or shown as a slide.
  notes: [
    { title: "Photosynthesis", lines: ["Plants turn light into chemical energy.", "Inputs: light, water, carbon dioxide."] },
    { title: "The big equation", lines: ["6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂", "Glucose is stored energy, oxygen is the by-product."] },
    { title: "Light reactions", lines: ["Happen in the thylakoid membrane.", "Light splits water and makes ATP and NADPH."] },
    { title: "Calvin cycle", lines: ["Happens in the stroma.", "Uses ATP and NADPH to fix carbon into sugar."] },
    { title: "Where the oxygen comes from", lines: ["The O₂ we breathe comes from water.", "CO₂ supplies the carbon, not the oxygen gas."] },
    { title: "Exit ticket", lines: ["1. Name the two stages of photosynthesis.", "2. Which molecule supplies the O₂?"] }
  ],

  // Scripted transcript of the teacher speaking, about two minutes. `t` is seconds from the start.
  transcript: [
    { t: 0, text: "Okay, let's settle in. Pencils down for a second." },
    { t: 7, text: "Today is photosynthesis, the process that feeds almost every living thing." },
    { t: 16, text: "Plants take in light, water and carbon dioxide, and they build sugar." },
    { t: 26, text: "The sugar is stored energy. The oxygen is what's left over." },
    { t: 36, text: "Look at the equation on the board. Six carbon dioxide and six water." },
    { t: 46, text: "Light is the energy that drives the whole thing, so it goes above the arrow." },
    { t: 58, text: "The light reactions happen in the thylakoid membrane." },
    { t: 68, text: "There, light splits water. That's where the oxygen comes from." },
    { t: 80, text: "Then the Calvin cycle takes place in the stroma, using that stored energy." },
    { t: 92, text: "It fixes carbon from the air into sugar, one step at a time." },
    { t: 104, text: "Good questions are already coming in, so keep them coming." },
    { t: 114, text: "Exit ticket in two minutes. Name both stages, and say where the oxygen comes from." }
  ]
};
