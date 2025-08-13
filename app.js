let allIndex = {};
let currentGrade = null;

// Elements
const gradeGrid = document.getElementById("gradeGrid");
const gradePicker = document.getElementById("gradePicker");
const gradeView = document.getElementById("gradeView");
const gradeViewTitle = document.getElementById("gradeViewTitle");
const lessonList = document.getElementById("lessonList");
const lessonView = document.getElementById("lessonView");
const lessonTitle = document.getElementById("lessonTitle");
const lessonContent = document.getElementById("lessonContent");
const homeBtn = document.getElementById("homeBtn");
const backToGrade = document.getElementById("backToGrade");

// Load lessons index on startup
window.addEventListener("DOMContentLoaded", () => {
  fetch("data/lessons_index.json")
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
      return res.json();
    })
    .then(data => {
      allIndex = data;
      renderGrades();
    })
    .catch(err => {
      console.error("Failed to load lessons_index.json", err);
      gradeGrid.innerHTML = `<p class="error">Impossible de charger les niveaux.</p>`;
    });
});

// Render grade buttons
function renderGrades() {
  gradeGrid.innerHTML = "";
  if (!allIndex.grades || !Array.isArray(allIndex.grades)) {
    gradeGrid.innerHTML = `<p class="error">Aucun niveau trouvé.</p>`;
    return;
  }

  allIndex.grades.forEach(g => {
    const card = document.createElement("button");
    card.className = "grade-card";
    card.setAttribute("role", "listitem");
    card.innerHTML = `
      <div>
        <div class="grade-badge">${g.label}</div>
        <div class="muted">${g.subtitle || ""}</div>
      </div>
      <span class="material-icons" aria-hidden="true">chevron_right</span>
    `;
    card.addEventListener("click", () => openGrade(g.id));
    gradeGrid.appendChild(card);
  });
}

// Open a grade's lessons
function openGrade(gradeId) {
  currentGrade = allIndex.grades.find(g => g.id === gradeId);
  if (!currentGrade) return;

  gradePicker.classList.add("hidden");
  gradeView.classList.remove("hidden");
  lessonView.classList.add("hidden");

  gradeViewTitle.textContent = `Leçons — ${currentGrade.label}`;
  renderLessonsForGrade(gradeId);
}

// Render lessons list for a grade
function renderLessonsForGrade(gradeId) {
  lessonList.innerHTML = "";
  const lessons = allIndex.lessons?.filter(l => l.grade === gradeId) || [];

  if (lessons.length === 0) {
    lessonList.innerHTML = `<p class="muted">Aucune leçon pour ce niveau.</p>`;
    return;
  }

  lessons.forEach(lesson => {
    const btn = document.createElement("button");
    btn.className = "lesson-item";
    btn.setAttribute("role", "listitem");
    btn.textContent = lesson.title;
    btn.addEventListener("click", () => openLesson(lesson));
    lessonList.appendChild(btn);
  });
}

// Open a lesson's details
function openLesson(lesson) {
  gradeView.classList.add("hidden");
  lessonView.classList.remove("hidden");

  lessonTitle.textContent = lesson.title;
  if (lesson.content) {
    lessonContent.innerHTML = lesson.content;
  } else if (lesson.file) {
    fetch(`data/${lesson.file}`)
      .then(res => res.text())
      .then(html => (lessonContent.innerHTML = html))
      .catch(err => {
        console.error("Failed to load lesson file", err);
        lessonContent.innerHTML = `<p class="error">Impossible de charger cette leçon.</p>`;
      });
  } else {
    lessonContent.innerHTML = `<p class="muted">Aucun contenu pour cette leçon.</p>`;
  }
}

// Navigation
homeBtn.addEventListener("click", () => {
  gradePicker.classList.remove("hidden");
  gradeView.classList.add("hidden");
  lessonView.classList.add("hidden");
});

backToGrade.addEventListener("click", () => {
  gradeView.classList.remove("hidden");
  lessonView.classList.add("hidden");
});
