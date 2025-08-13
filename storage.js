// storage.js — local progress tracking
const STORAGE_KEY = 'fr_k12_progress_v1';

export const storage = {
  load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  },
  save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  getGrade(grade) {
    const db = this.load();
    return db[grade] || { completed: {}, stars: 0 };
  },
  setLessonProgress(grade, lessonId, progress) {
    const db = this.load();
    db[grade] = db[grade] || { completed: {}, stars: 0 };
    db[grade].completed[lessonId] = progress;
    // award a star for 100%
    if (progress === 100) db[grade].stars = (db[grade].stars || 0) + 1;
    this.save(db);
  }
};
