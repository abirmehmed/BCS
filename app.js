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
function openSubmitForm(){
  populateSubjectSelect();
  show('submit');
}

function populateSubjectSelect(){
  const sel = document.getElementById('formSubject');
  sel.innerHTML = '<option value="">বিষয় নির্বাচন করুন</option>' +
    SUBJECTS.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');
  document.getElementById('formSubtopic').innerHTML = '<option value="">প্রথমে বিষয় নির্বাচন করুন</option>';
}

document.getElementById('formSubject').addEventListener('change', e=>{
  const sub = SUBJECTS.find(s=>s.id===e.target.value);
  const sel = document.getElementById('formSubtopic');
  if(!sub){ sel.innerHTML = '<option value="">প্রথমে বিষয় নির্বাচন করুন</option>'; return; }
  sel.innerHTML = sub.subtopics.map(st=>`<option value="${st.id}">${esc(st.name)}</option>`).join('');
});

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
