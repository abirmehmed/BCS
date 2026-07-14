// ── BCS Preliminary syllabus taxonomy ──────────────────────────
// Marks reflect the official 200-mark, 10-subject BPSC preliminary
// distribution. Sub-topic marks are shown where the syllabus splits
// them; subjects without an official numeric split just list topics
// as filters (no per-topic mark shown).
const SUBJECTS = [
  {
    id: 'bangla', name: 'বাংলা ভাষা ও সাহিত্য', marks: 35,
    subtopics: [
      { id: 'bangla-vasha', name: 'ভাষা', marks: 15 },
      { id: 'bangla-sahitya-prachin', name: 'সাহিত্য — প্রাচীন ও মধ্যযুগ', marks: 5 },
      { id: 'bangla-sahitya-adhunik', name: 'সাহিত্য — আধুনিক যুগ (১৮০০–বর্তমান)', marks: 15 },
    ]
  },
  {
    id: 'english', name: 'English Language & Literature', marks: 35,
    subtopics: [
      { id: 'english-language', name: 'Language', marks: 20 },
      { id: 'english-literature', name: 'Literature', marks: 15 },
    ]
  },
  {
    id: 'bangladesh', name: 'বাংলাদেশ বিষয়াবলি', marks: 30,
    subtopics: [
      { id: 'bd-history', name: 'রাজনৈতিক ইতিহাস ও মুক্তিযুদ্ধ', marks: null },
      { id: 'bd-economy', name: 'অর্থনীতি, কৃষি ও শিল্প-বাণিজ্য', marks: null },
      { id: 'bd-constitution', name: 'সংবিধান ও রাষ্ট্রকাঠামো', marks: null },
      { id: 'bd-general', name: 'জাতীয় অর্জন, ক্রীড়া, সংস্কৃতি ও গণমাধ্যম', marks: null },
    ]
  },
  {
    id: 'international', name: 'আন্তর্জাতিক বিষয়াবলি', marks: 20,
    subtopics: [
      { id: 'intl-history', name: 'বিশ্ব ইতিহাস ও ভূ-রাজনীতি', marks: null },
      { id: 'intl-orgs', name: 'আন্তর্জাতিক সংস্থা ও কূটনীতি', marks: null },
      { id: 'intl-current', name: 'সাম্প্রতিক আন্তর্জাতিক ঘটনা', marks: null },
    ]
  },
  {
    id: 'geography', name: 'ভূগোল, পরিবেশ ও দুর্যোগ ব্যবস্থাপনা', marks: 10,
    subtopics: [
      { id: 'geo-physical', name: 'ভূগোল ও পরিবেশ', marks: null },
      { id: 'geo-disaster', name: 'দুর্যোগ ব্যবস্থাপনা', marks: null },
    ]
  },
  {
    id: 'science', name: 'সাধারণ বিজ্ঞান', marks: 15,
    subtopics: [
      { id: 'sci-physics', name: 'পদার্থ বিজ্ঞান', marks: null },
      { id: 'sci-biology', name: 'জীববিজ্ঞান', marks: null },
      { id: 'sci-modern', name: 'আধুনিক বিজ্ঞান', marks: null },
    ]
  },
  {
    id: 'computer', name: 'কম্পিউটার ও তথ্যপ্রযুক্তি', marks: 15,
    subtopics: [
      { id: 'comp-computer', name: 'কম্পিউটার', marks: 10 },
      { id: 'comp-ict', name: 'তথ্যপ্রযুক্তি', marks: 5 },
    ]
  },
  {
    id: 'math', name: 'গাণিতিক যুক্তি', marks: 15,
    subtopics: [
      { id: 'math-arith', name: 'পাটিগণিত ও শতকরা', marks: null },
      { id: 'math-algebra', name: 'বীজগণিত ও সমীকরণ', marks: null },
      { id: 'math-geometry', name: 'জ্যামিতি', marks: null },
      { id: 'math-stats', name: 'সম্ভাবনা, পরিসংখ্যান ও বিন্যাস-সমাবেশ', marks: null },
    ]
  },
  {
    id: 'mental', name: 'মানসিক দক্ষতা', marks: 15,
    subtopics: [
      { id: 'mental-verbal', name: 'Verbal Reasoning', marks: null },
      { id: 'mental-problem', name: 'Problem Solving', marks: null },
      { id: 'mental-numerical', name: 'Numerical Ability', marks: null },
      { id: 'mental-space', name: 'Space Relation', marks: null },
    ]
  },
  {
    id: 'ethics', name: 'নৈতিকতা, মূল্যবোধ ও সুশাসন', marks: 10,
    subtopics: [
      { id: 'ethics-general', name: 'নৈতিকতা ও সুশাসন', marks: null },
    ]
  },
];

// ── Seed questions ──────────────────────────────────────────────
// A small starter set (from your own 50th BCS বাংলা সমাধান sample) so
// the app isn't empty on first run. Everything you submit through the
// form gets added alongside these in your browser's local storage.
const SEED_QUESTIONS = [
  {
    id: 'seed-001', subject: 'bangla', subtopic: 'bangla-sahitya-adhunik',
    question: "'বালক' পত্রিকা প্রতিষ্ঠা কার কীর্তি?",
    correct: 'কাদম্বরী দেবী',
    distractors: ['স্বর্ণকুমারী', 'সেলিনা হোসেন', 'আল মাহমুদ'],
    explanation: "ঠাকুর বাড়ি থেকে প্রকাশিত শিশু-কিশোর পত্রিকা 'বালক'। জ্ঞানদানন্দিনী দেবীও এর সাথে যুক্ত ছিলেন এবং রবীন্দ্রনাথ ঠাকুর এর সম্পাদক ছিলেন।"
  },
  {
    id: 'seed-002', subject: 'bangla', subtopic: 'bangla-vasha',
    question: "'পরমেশ' শব্দটির সঠিক সন্ধি বিচ্ছেদ কোনটি?",
    correct: 'পরম + ঈশ',
    distractors: ['পরম + এশ', 'পরম + ইশ', 'পরম + ইস'],
    explanation: 'অ + ঈ = এ (গুণ সন্ধি)। পরম + ঈশ = পরমেশ।'
  },
  {
    id: 'seed-003', subject: 'bangla', subtopic: 'bangla-sahitya-adhunik',
    question: "তারাশঙ্কর বন্দ্যোপাধ্যায়ের 'কবি' গ্রন্থটিতে কোন বিষয়টি প্রাধান্য পেয়েছে?",
    correct: 'ডোম সম্প্রদায়ের জীবন কাহিনী',
    distractors: ['অসম ভালোবাসা', 'আদিবাসীদের জীবন চিত্র', 'পঞ্চাশের মন্বন্তর'],
    explanation: "তারাশঙ্কর বন্দ্যোপাধ্যায়ের 'কবি' উপন্যাসে বেদে ও ডোম সম্প্রদায়ের জীবন এবং কবিয়ালদের জীবন প্রাধান্য পেয়েছে।"
  },
  {
    id: 'seed-004', subject: 'bangla', subtopic: 'bangla-vasha',
    question: "'ই' এর মাত্রার উপরের অংশের নাম কী?",
    correct: 'চৈতন',
    distractors: ['আঁকড়ি', 'পাগড়ি', 'জোড় আঁকড়ি'],
    explanation: 'বর্ণের মাত্রার উপরের অংশকে চৈতন বা উষ্ণীষ বলা হয়।'
  },
  {
    id: 'seed-005', subject: 'bangla', subtopic: 'bangla-sahitya-prachin',
    question: 'বাংলা পুঁথি সাহিত্যের উদাহরণ কোনটি?',
    correct: 'আমীর হামজা',
    distractors: ['নূরনামা', 'গুপি চন্দ্রের সন্ন্যাস', 'মহুয়া'],
    explanation: "'আমীর হামজা' ফকির গরীবুল্লাহ রচিত একটি বিখ্যাত পুঁথি সাহিত্য।"
  },
  {
    id: 'seed-006', subject: 'bangla', subtopic: 'bangla-vasha',
    question: "'স্বর্গ' শব্দের সঠিক সমার্থক শব্দজোড়া কোনটি?",
    correct: 'ত্রিদিব, সুরপুর',
    distractors: ['হরিদশ্ব, বিবদান', 'ক্ষিতি, উর্বী', 'দিনমণি, দিন নাথ'],
    explanation: "ত্রিদিব ও সুরপুর উভয়ই 'স্বর্গ' শব্দের সমার্থক শব্দ।"
  },
  {
    id: 'seed-007', subject: 'bangla', subtopic: 'bangla-vasha',
    question: 'কোন বাক্যটি প্রয়োগগত দিক থেকে শুদ্ধ?',
    correct: 'আবশ্যক ব্যয়ে কার্পণ্য অনুচিত।',
    distractors: ['মাছ আকাশে উড়ে।', 'তাঁর খুব আনন্দ পেল।', 'সকল ছাত্রগণ পাঠে মনোযোগী।'],
    explanation: "'সকল ছাত্রগণ' বাহুল্য দোষে দুষ্ট। 'তাঁর আনন্দ পেল' সঠিক গঠন নয়। 'মাছ আকাশে উড়ে' যোগ্যতাহীন বাক্য।"
  },
  {
    id: 'seed-008', subject: 'bangla', subtopic: 'bangla-vasha',
    question: "'মা তাঁর সন্তানদের ভালোবাসেন' — এটি কোন্ ধরণের বাক্য?",
    correct: 'অস্তিবাচক',
    distractors: ['ইচ্ছাসূচক', 'অনুজ্ঞাসূচক', 'প্রশ্নবোধক'],
    explanation: 'এটি একটি সাধারণ বিবৃতিমূলক বা হ্যাঁ-বোধক (Assertive/Affirmative) বাক্য।'
  },
  {
    id: 'seed-009', subject: 'bangla', subtopic: 'bangla-sahitya-adhunik',
    question: 'কোনটি কাজী নজরুল ইসলামের প্রবন্ধ গ্রন্থ?',
    correct: 'যুগবাণী',
    distractors: ['মৃত্যুক্ষুধা', 'সিন্ধু হিন্দোল', 'অগ্নিবীণা'],
    explanation: 'মৃত্যুক্ষুধা (উপন্যাস), সিন্ধু হিন্দোল (কাব্য), অগ্নিবীণা (কাব্য)। যুগবাণী নজরুলের প্রবন্ধ গ্রন্থ।'
  },
  {
    id: 'seed-010', subject: 'bangla', subtopic: 'bangla-sahitya-prachin',
    question: "'কাআ তরুবর পঞ্চ বি ডাল' পদটির রচয়িতা কে?",
    correct: 'লুইপা',
    distractors: ['ভুসুরুপা', 'শবরপা', 'কাহ্নপা'],
    explanation: 'এটি চর্যাপদের ১ম পদ, যার রচয়িতা লুইপা।'
  },
];
