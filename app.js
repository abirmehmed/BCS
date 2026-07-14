(function(){
'use strict';

const STORAGE_KEY = 'bcs_practice_user_questions_v1';

// ── Persistence ────────────────────────────────────────────────
function loadUserQuestions(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function saveUserQuestions(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function allQuestions(){
  return [...SEED_QUESTIONS, ...loadUserQuestions()];
}

// ── State ──────────────────────────────────────────────────────
let currentSubject = null;   // subject id or null (=all)
let currentSubtopic = null;  // subtopic id or null (=all in subject)
let queue = [];
let qIndex = 0;
let score = 0;
let correctCount = 0, wrongCount = 0, skipCount = 0;
let missed = [];
let currentQ = null;
let currentOptions = [];
let answered = false;

// ── Elements ───────────────────────────────────────────────────
const screens = {
  home:    document.getElementById('homeScreen'),
  setup:   document.getElementById('setupScreen'),
  quiz:    document.getElementById('quizScreen'),
  results: document.getElementById('resultsScreen'),
  submit:  document.getElementById('submitScreen'),
};
function show(name){
  Object.values(screens).forEach(s=>s.classList.add('hidden'));
  screens[name].classList.remove('hidden');
}

// ── Home: subject grid ─────────────────────────────────────────
function renderSubjectGrid(){
  const grid = document.getElementById('subjectGrid');
  grid.innerHTML = '';
  const qs = allQuestions();
  SUBJECTS.forEach(sub=>{
    const count = qs.filter(q=>q.subject===sub.id).length;
    const card = document.createElement('button');
    card.className = 'subject-card';
    card.innerHTML = `
      <div class="subject-marks">${sub.marks}<span>marks</span></div>
      <div class="subject-name">${esc(sub.name)}</div>
      <div class="subject-count">${count} প্রশ্ন সংগ্রহে আছে</div>`;
    card.addEventListener('click', ()=>openSetup(sub.id));
    grid.appendChild(card);
  });
}

document.getElementById('submitNavBtn').addEventListener('click', openSubmitForm);
document.getElementById('homeNavBtn').addEventListener('click', ()=>{ renderSubjectGrid(); show('home'); });
document.getElementById('backFromSetup').addEventListener('click', ()=>{ renderSubjectGrid(); show('home'); });
document.getElementById('backFromSubmit').addEventListener('click', ()=>{ renderSubjectGrid(); show('home'); });

// ── Setup screen ───────────────────────────────────────────────
function openSetup(subjectId){
  currentSubject = subjectId;
  currentSubtopic = null;
  const sub = SUBJECTS.find(s=>s.id===subjectId);
  document.getElementById('setupTitle').textContent = sub.name;

  const wrap = document.getElementById('subtopicList');
  wrap.innerHTML = '';
  const qs = allQuestions().filter(q=>q.subject===subjectId);

  const allBtn = document.createElement('button');
  allBtn.className = 'subtopic-chip selected';
  allBtn.textContent = `সব মিলিয়ে (${qs.length})`;
  allBtn.addEventListener('click', ()=>selectSubtopic(null, allBtn));
  wrap.appendChild(allBtn);

  sub.subtopics.forEach(st=>{
    const n = qs.filter(q=>q.subtopic===st.id).length;
    const btn = document.createElement('button');
    btn.className = 'subtopic-chip';
    btn.textContent = `${st.name} (${n})`;
    btn.addEventListener('click', ()=>selectSubtopic(st.id, btn));
    wrap.appendChild(btn);
  });

  updateSetupCount();
  show('setup');
}

function selectSubtopic(id, btnEl){
  currentSubtopic = id;
  document.querySelectorAll('.subtopic-chip').forEach(b=>b.classList.remove('selected'));
  btnEl.classList.add('selected');
  updateSetupCount();
}

function questionsInScope(){
  return allQuestions().filter(q=>{
    if(q.subject !== currentSubject) return false;
    if(currentSubtopic && q.subtopic !== currentSubtopic) return false;
    return true;
  });
}

function updateSetupCount(){
  const n = questionsInScope().length;
  const countInput = document.getElementById('quizCount');
  countInput.max = n;
  if(parseInt(countInput.value)>n) countInput.value = Math.max(1,n);
  document.getElementById('setupAvailable').textContent =
    n ? `${n}টি প্রশ্ন পাওয়া যাচ্ছে এই পরিসরে।` : 'এই বিষয়ে এখনো কোনো প্রশ্ন যোগ করা হয়নি — নিচের ফর্ম থেকে যোগ করুন।';
  document.getElementById('startQuizBtn').disabled = n < 1;
}

document.getElementById('quizCount').addEventListener('input', updateSetupCount);

document.getElementById('startQuizBtn').addEventListener('click', ()=>{
  const pool = shuffle(questionsInScope());
  const n = Math.max(1, Math.min(parseInt(document.getElementById('quizCount').value)||10, pool.length));
  queue = pool.slice(0, n);
  qIndex = 0; score = 0; correctCount = 0; wrongCount = 0; skipCount = 0; missed = [];
  show('quiz');
  nextQuestion();
});

// ── Quiz engine ────────────────────────────────────────────────
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

function buildOptions(q){
  // Correct answer + up to 3 random distractors from the pool (pool may hold 3-7+).
  const pool = shuffle(q.distractors || []);
  const chosen = pool.slice(0, 3);
  // pad with generic filler only if the question truly lacks enough distractors
  while(chosen.length < 3) chosen.push('(বিকল্প অনুপস্থিত)');
  const opts = shuffle([q.correct, ...chosen]);
  return opts;
}

function nextQuestion(){
  answered = false;
  document.getElementById('nextBtn').disabled = true;
  document.getElementById('skipBtn').disabled = false;

  if(qIndex >= queue.length){ return finishQuiz(); }
  currentQ = queue[qIndex];
  currentOptions = buildOptions(currentQ);

  const sub = SUBJECTS.find(s=>s.id===currentQ.subject);
  const st  = sub.subtopics.find(s=>s.id===currentQ.subtopic);

  document.getElementById('quizProgress').textContent = `প্রশ্ন ${qIndex+1} / ${queue.length}`;
  document.getElementById('progressFill').style.width = ((qIndex)/queue.length*100)+'%';
  document.getElementById('scoreLive').textContent = score.toFixed(1);
  document.getElementById('quizTag').textContent = st ? st.name : sub.name;
  document.getElementById('questionText').textContent = currentQ.question;
  document.getElementById('explainBox').classList.add('hidden');

  const optWrap = document.getElementById('optionsWrap');
  optWrap.innerHTML = '';
  const labels = ['ক','খ','গ','ঘ'];
  currentOptions.forEach((opt,i)=>{
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.innerHTML = `<span class="opt-label">${labels[i]}</span><span>${esc(opt)}</span>`;
    btn.addEventListener('click', ()=>handleAnswer(opt, btn));
    optWrap.appendChild(btn);
  });
}

document.getElementById('skipBtn').addEventListener('click', ()=>{
  if(answered) return;
  skipCount++;
  qIndex++;
  nextQuestion();
});

function handleAnswer(chosenText, btnEl){
  if(answered) return;
  answered = true;
  document.getElementById('skipBtn').disabled = true;

  const isCorrect = chosenText === currentQ.correct;
  if(isCorrect){ correctCount++; score += 1; }
  else { wrongCount++; score -= 0.5; missed.push(currentQ); }

  document.querySelectorAll('.quiz-option').forEach(b=>{
    b.classList.add('locked');
    const txt = b.querySelector('span:last-child').textContent;
    if(txt === currentQ.correct) b.classList.add('correct');
    else if(b===btnEl) b.classList.add('wrong');
    else b.classList.add('dim');
  });

  document.getElementById('scoreLive').textContent = score.toFixed(1);
  if(currentQ.explanation){
    document.getElementById('explainText').textContent = currentQ.explanation;
    document.getElementById('explainBox').classList.remove('hidden');
  }
  document.getElementById('nextBtn').disabled = false;
}

document.getElementById('nextBtn').addEventListener('click', ()=>{
  qIndex++;
  nextQuestion();
});

function finishQuiz(){
  show('results');
  const attempted = correctCount + wrongCount;
  document.getElementById('finalScore').textContent = score.toFixed(1);
  document.getElementById('finalBreakdown').textContent =
    `${correctCount} সঠিক, ${wrongCount} ভুল, ${skipCount} স্কিপ — মোট ${queue.length}টি প্রশ্নের মধ্যে।`;
  const acc = attempted ? Math.round((correctCount/attempted)*100) : 0;
  document.getElementById('finalAccuracy').textContent = `${acc}% accuracy (attempted প্রশ্নের মধ্যে)`;

  const mc = document.getElementById('missedList');
  mc.innerHTML = '';
  if(!missed.length){
    mc.innerHTML = '<div class="empty-note">ভুল উত্তর নেই — চমৎকার! 🎉</div>';
  } else {
    missed.forEach(q=>{
      const row = document.createElement('div');
      row.className = 'missed-item';
      row.innerHTML = `<div class="missed-q">${esc(q.question)}</div>
        <div class="missed-a">সঠিক উত্তর: <b>${esc(q.correct)}</b></div>
        ${q.explanation ? `<div class="missed-exp">${esc(q.explanation)}</div>` : ''}`;
      mc.appendChild(row);
    });
  }
}

document.getElementById('retryBtn').addEventListener('click', ()=>{
  openSetup(currentSubject);
});
document.getElementById('homeFromResults').addEventListener('click', ()=>{
  renderSubjectGrid(); show('home');
});

// ── Submission form ────────────────────────────────────────────
document.getElementById('tabBulkBtn').addEventListener('click', ()=>{
  document.getElementById('tabBulkBtn').classList.add('selected');
  document.getElementById('tabSingleBtn').classList.remove('selected');
  document.getElementById('bulkSection').classList.remove('hidden');
  document.getElementById('singleSection').classList.add('hidden');
});
document.getElementById('tabSingleBtn').addEventListener('click', ()=>{
  document.getElementById('tabSingleBtn').classList.add('selected');
  document.getElementById('tabBulkBtn').classList.remove('selected');
  document.getElementById('singleSection').classList.remove('hidden');
  document.getElementById('bulkSection').classList.add('hidden');
});

function openSubmitForm(){
  populateSubjectSelect(document.getElementById('formSubject'), document.getElementById('formSubtopic'));
  populateSubjectSelect(document.getElementById('bulkSubject'), document.getElementById('bulkSubtopic'));
  show('submit');
}

function populateSubjectSelect(subjectSel, subtopicSel){
  subjectSel.innerHTML = '<option value="">বিষয় নির্বাচন করুন</option>' +
    SUBJECTS.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');
  subtopicSel.innerHTML = '<option value="">প্রথমে বিষয় নির্বাচন করুন</option>';
}

function wireSubjectSubtopic(subjectSel, subtopicSel){
  subjectSel.addEventListener('change', e=>{
    const sub = SUBJECTS.find(s=>s.id===e.target.value);
    if(!sub){ subtopicSel.innerHTML = '<option value="">প্রথমে বিষয় নির্বাচন করুন</option>'; return; }
    subtopicSel.innerHTML = sub.subtopics.map(st=>`<option value="${st.id}">${esc(st.name)}</option>`).join('');
  });
}
wireSubjectSubtopic(document.getElementById('formSubject'), document.getElementById('formSubtopic'));
wireSubjectSubtopic(document.getElementById('bulkSubject'), document.getElementById('bulkSubtopic'));

document.getElementById('questionForm').addEventListener('submit', e=>{
  e.preventDefault();
  const subject = document.getElementById('formSubject').value;
  const subtopic = document.getElementById('formSubtopic').value;
  const question = document.getElementById('formQuestion').value.trim();
  const correct = document.getElementById('formCorrect').value.trim();
  const distractorsRaw = document.getElementById('formDistractors').value.trim();
  const explanation = document.getElementById('formExplanation').value.trim();
  const msgEl = document.getElementById('formMessage');

  const distractors = distractorsRaw.split('\n').map(s=>s.trim()).filter(Boolean);

  if(!subject || !subtopic || !question || !correct || distractors.length < 3){
    msgEl.textContent = 'বিষয়, উপবিষয়, প্রশ্ন, সঠিক উত্তর আবশ্যক — এবং কমপক্ষে ৩টি ভুল অপশন দিতে হবে (একটি লাইনে একটি করে)।';
    msgEl.className = 'form-message error';
    return;
  }

  const list = loadUserQuestions();
  list.push({
    id: 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2,7),
    subject, subtopic, question, correct, distractors, explanation
  });
  saveUserQuestions(list);

  msgEl.textContent = 'প্রশ্নটি যোগ হয়েছে! এই ব্রাউজারে সংরক্ষিত থাকবে।';
  msgEl.className = 'form-message success';
  document.getElementById('questionForm').reset();
  document.getElementById('formSubtopic').innerHTML = '<option value="">প্রথমে বিষয় নির্বাচন করুন</option>';
});

// ── Bulk paste parser ────────────────────────────────────────────
// Expected per-question format (blank line between questions):
//   ১. প্রশ্নের লেখা?
//   (ক) অপশন১ (খ) অপশন২ (গ) অপশন৩ (ঘ) অপশন৪
//   উত্তর: (গ) অপশন৩
//   ব্যাখ্যা: ব্যাখ্যা টেক্সট (ঐচ্ছিক)
function parseBulkBlock(block){
  const lines = block.split('\n').map(l=>l.trim()).filter(Boolean);
  if(lines.length < 2) return { error: 'ব্লকটি অসম্পূর্ণ (কমপক্ষে প্রশ্ন + অপশন + উত্তর দরকার)' };

  const optIdx = lines.findIndex(l => /\(ক\)/.test(l));
  if(optIdx === -1) return { error: '(ক)(খ)(গ)(ঘ) ফরম্যাটে অপশন পাওয়া যায়নি' };

  const question = lines.slice(0, optIdx).join(' ').replace(/^[০-৯0-9]+[.।)]\s*/, '').trim();
  if(!question) return { error: 'প্রশ্নের লেখা খালি' };

  const ansIdx = lines.findIndex(l => /^উত্তর/.test(l));
  if(ansIdx === -1 || ansIdx < optIdx) return { error: '"উত্তর:" লাইন পাওয়া যায়নি' };

  const optionsText = lines.slice(optIdx, ansIdx).join(' ');
  const optRegex = /\((ক|খ|গ|ঘ)\)\s*([^()]+?)(?=\s*\((?:ক|খ|গ|ঘ)\)|$)/g;
  const options = {};
  let m;
  while((m = optRegex.exec(optionsText))){
    options[m[1]] = m[2].trim();
  }
  const foundKeys = Object.keys(options);
  if(foundKeys.length < 4) return { error: `৪টি অপশনের বদলে ${foundKeys.length}টি পাওয়া গেছে` };

  const ansMatch = lines[ansIdx].match(/উত্তর[:ঃ]?\s*\(?([ক-ঘ])\)?/);
  const correctLetter = ansMatch ? ansMatch[1] : null;
  if(!correctLetter || !options[correctLetter]) return { error: 'উত্তরের (ক/খ/গ/ঘ) শনাক্ত করা যায়নি' };

  const correct = options[correctLetter];
  const distractors = ['ক','খ','গ','ঘ'].filter(k=>k!==correctLetter).map(k=>options[k]);

  const restLines = lines.slice(ansIdx+1);
  const expIdx = restLines.findIndex(l=>/^ব্যাখ্যা/.test(l));
  const explanation = expIdx === -1 ? '' :
    restLines.slice(expIdx).join(' ').replace(/^ব্যাখ্যা[:ঃ]?\s*/, '').trim();

  return { question, correct, distractors, explanation };
}

function parseBulkText(text){
  const blocks = text.split(/\n\s*\n+/).map(b=>b.trim()).filter(Boolean);
  return blocks.map((b,i)=>({ blockNum: i+1, raw: b, ...parseBulkBlock(b) }));
}

document.getElementById('bulkAddBtn').addEventListener('click', ()=>{
  const subject = document.getElementById('bulkSubject').value;
  const subtopic = document.getElementById('bulkSubtopic').value;
  const text = document.getElementById('bulkText').value.trim();
  const resultEl = document.getElementById('bulkResult');

  if(!subject || !subtopic){
    resultEl.innerHTML = '<div class="form-message error">আগে বিষয় ও উপবিষয় বেছে নিন — বাল্কের সব প্রশ্ন এই বিষয়ে যোগ হবে।</div>';
    return;
  }
  if(!text){
    resultEl.innerHTML = '<div class="form-message error">টেক্সট বক্সে প্রশ্ন পেস্ট করুন।</div>';
    return;
  }

  const parsed = parseBulkText(text);
  const good = parsed.filter(p=>!p.error);
  const bad  = parsed.filter(p=>p.error);

  if(good.length){
    const list = loadUserQuestions();
    good.forEach(p=>{
      list.push({
        id: 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2,7),
        subject, subtopic,
        question: p.question, correct: p.correct, distractors: p.distractors, explanation: p.explanation
      });
    });
    saveUserQuestions(list);
    renderSubjectGrid();
  }

  let html = `<div class="form-message ${good.length?'success':'error'}">✅ ${good.length}টি প্রশ্ন যোগ হয়েছে।${bad.length?` ⚠️ ${bad.length}টি ব্লক পার্স করা যায়নি (নিচে দেখুন)।`:''}</div>`;
  if(good.length){
    html += '<div class="bulk-preview">' + good.slice(0,5).map(p=>
      `<div class="bulk-preview-item"><b>${esc(p.question)}</b><span>✓ ${esc(p.correct)}</span></div>`
    ).join('') + (good.length>5 ? `<div class="bulk-preview-more">+ আরও ${good.length-5}টি</div>` : '') + '</div>';
  }
  if(bad.length){
    html += '<div class="bulk-errors"><b>এই ব্লকগুলোতে সমস্যা হয়েছে:</b>' + bad.map(p=>
      `<div class="bulk-error-item">ব্লক #${p.blockNum}: ${esc(p.error)}<br><span class="bulk-error-raw">${esc(p.raw.slice(0,80))}${p.raw.length>80?'…':''}</span></div>`
    ).join('') + '</div>';
  }
  resultEl.innerHTML = html;

  if(good.length) document.getElementById('bulkText').value = bad.length ? bad.map(p=>p.raw).join('\n\n') : '';
});

// ── Export / Import (backup, since this is browser-only storage) ─
document.getElementById('exportBtn').addEventListener('click', ()=>{
  const data = JSON.stringify(loadUserQuestions(), null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bcs-practice-my-questions.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('importInput').addEventListener('change', e=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const incoming = JSON.parse(reader.result);
      if(!Array.isArray(incoming)) throw new Error('not an array');
      const existing = loadUserQuestions();
      const existingIds = new Set(existing.map(q=>q.id));
      const merged = existing.concat(incoming.filter(q=>q && q.id && !existingIds.has(q.id)));
      saveUserQuestions(merged);
      const msgEl = document.getElementById('formMessage');
      msgEl.textContent = `${merged.length - existing.length}টি নতুন প্রশ্ন যোগ হয়েছে (ইমপোর্ট থেকে)।`;
      msgEl.className = 'form-message success';
      renderSubjectGrid();
    }catch(err){
      const msgEl = document.getElementById('formMessage');
      msgEl.textContent = 'ফাইলটি পড়া যায়নি — সঠিক এক্সপোর্ট করা JSON ফাইল কিনা দেখুন।';
      msgEl.className = 'form-message error';
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

document.getElementById('clearBtn').addEventListener('click', ()=>{
  if(!confirm('আপনার যোগ করা সব প্রশ্ন এই ব্রাউজার থেকে মুছে যাবে (seed প্রশ্নগুলো থাকবে)। এগিয়ে যাবেন?')) return;
  saveUserQuestions([]);
  renderSubjectGrid();
  const msgEl = document.getElementById('formMessage');
  msgEl.textContent = 'সব ব্যবহারকারী-প্রশ্ন মুছে ফেলা হয়েছে।';
  msgEl.className = 'form-message success';
});

function esc(s){
  return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ── Init ───────────────────────────────────────────────────────
renderSubjectGrid();
show('home');

})();
