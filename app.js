// app.js — SPA controller
import { storage } from './storage.js';
import { Activities } from './activities.js';

const gradeGrid = document.getElementById('gradeGrid');
const gradePicker = document.getElementById('gradePicker');
const lessonsView = document.getElementById('lessonsView');
const playerView = document.getElementById('playerView');

const lessonsTitle = document.getElementById('lessonsTitle');
const lessonsList = document.getElementById('lessonsList');
const backToGrades = document.getElementById('backToGrades');
const backToLessons = document.getElementById('backToLessons');

const progressBar = document.getElementById('progressBar');
const activityHost = document.getElementById('activityHost');
const lessonTitle = document.getElementById('lessonTitle');
const prevAct = document.getElementById('prevAct');
const checkAct = document.getElementById('checkAct');
const nextAct = document.getElementById('nextAct');

const homeBtn = document.getElementById('homeBtn');
const installBtn = document.getElementById('installBtn');

let allIndex = null;
let currentGrade = null;
let currentLesson = null;
let currentLessonData = null;
let actIdx = 0;
let actScores = [];

// ---- PWA Install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn?.addEventListener('click', async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  installBtn.hidden = true;
});

// ---- Init
window.addEventListener('load', async ()=>{
  try {
    const res = await fetch('data/lessons_index.json');
    allIndex = await res.json();
    renderGrades();
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('./sw.js');
    }
  } catch (e){
    console.error('Failed to load lessons index', e);
  }
});

homeBtn.addEventListener('click', ()=> showView('grades'));
backToGrades.addEventListener('click', ()=> showView('grades'));
backToLessons.addEventListener('click', ()=> showView('lessons'));
prevAct.addEventListener('click', ()=> setAct(Math.max(0, actIdx-1)));
nextAct.addEventListener('click', ()=> setAct(Math.min(currentLessonData.activities.length-1, actIdx+1)));
checkAct.addEventListener('click', ()=>{
  const res = Activities.check();
  actScores[actIdx] = Math.max(actScores[actIdx] || 0, res.score);
  updateProgress();
  // auto-advance if correct
  if(res.correct && actIdx < currentLessonData.activities.length-1){
    setTimeout(()=> setAct(actIdx+1), 300);
  }
});

function showView(which){
  gradePicker.hidden = which!=='grades';
  lessonsView.hidden = which!=='lessons';
  playerView.hidden = which!=='player';
}

function renderGrades(){
  gradeGrid.innerHTML = '';
  const grades = allIndex.grades; // array of {id,label}
  grades.forEach(g=>{
    const card = document.createElement('button');
    card.className = 'grade-card';
    card.setAttribute('role','listitem');
    card.innerHTML = `<div>
      <div class="grade-badge">${g.label}</div>
      <div class="muted">${g.subtitle || ''}</div>
    </div>
    <span class="material-icons" aria-hidden="true">chevron_right</span>`;
    card.addEventListener('click', ()=> openGrade(g.id));
    gradeGrid.appendChild(card);
  });
}

async function openGrade(gradeId){
  currentGrade = gradeId;
  const meta = allIndex.grades.find(g=>g.id===gradeId);
  lessonsTitle.textContent = `Niveau ${meta.label} — Leçons`;
  lessonsList.innerHTML = '';
  const lessons = (allIndex.lessons[gradeId] || []);
  lessons.forEach((l,i)=>{
    const row = document.createElement('div');
    row.className = 'lesson-item';
    const prog = storage.getGrade(gradeId).completed[l.id] ?? 0;
    row.innerHTML = `<div>
      <strong>${l.title}</strong>
      <div class="muted">${l.desc || ''}</div>
    </div>
    <div class="badges">
      <span class="badge">${l.type}</span>
      <span class="badge">${prog}%</span>
      <button class="btn" data-id="${l.id}"><span class="material-icons">play_arrow</span> Démarrer</button>
    </div>`;
    row.querySelector('button').addEventListener('click', ()=> openLesson(l));
    lessonsList.appendChild(row);
  });
  showView('lessons');
}

async function openLesson(lessonMeta){
  currentLesson = lessonMeta;
  lessonTitle.textContent = lessonMeta.title;
  const res = await fetch(`data/lessons/${lessonMeta.id}.json`);
  currentLessonData = await res.json();
  actIdx = 0; actScores = new Array(currentLessonData.activities.length).fill(0);
  Activities.mount(activityHost);
  setAct(0);
  showView('player');
}

function setAct(idx){
  actIdx = idx;
  progressBar.style.width = `${Math.round((idx)/currentLessonData.activities.length*100)}%`;
  const act = currentLessonData.activities[idx];
  Activities.render(act);
  // scroll to top on change
  playerView.scrollIntoView({behavior:'smooth', block:'start'});
}

function updateProgress(){
  const best = actScores.reduce((a,b)=> a+b, 0);
  const possible = currentLessonData.activities.length * 100;
  const pct = Math.round((best/possible)*100);
  progressBar.style.width = `${pct}%`;
  storage.setLessonProgress(currentGrade, currentLesson.id, pct);
}
