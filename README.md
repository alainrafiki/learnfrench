# Apprendre le Français — K–12 (Static Web App)

A free, kid-friendly French learning web app for homeschool grades K–12.  
Runs entirely on GitHub Pages — no server or database.

## Features
- Grade picker (K–12) reveals age-appropriate lessons
- Interactive activities: flashcards, multiple choice, match pairs, fill-in-the-blank, build-a-word (drag & drop), and TTS listen practice
- Progress auto-saved to `localStorage`
- PWA: installable and offline-capable

## Quick Start (GitHub Pages)
1. Create a new GitHub repo and upload this folder's contents.
2. In repo **Settings → Pages**, set **Source** to `Deploy from a branch`, and choose `main` + `/ (root)`.
3. Visit your Pages URL (e.g., `https://<you>.github.io/<repo>/`).

## Add / Edit Lessons
- Update `data/lessons_index.json` to add lessons per grade.
- Create lesson JSON files in `data/lessons/` with the same `id` used in the index.

### Lesson JSON format
```json
{
  "id": "g1-basics-1",
  "title": "Salutations de base",
  "activities": [
    {"type": "flashcards", "cards":[{"fr": "bonjour", "en": "hello"}]},
    {"type": "mcq", "prompt": "“bonjour” means…", "options": ["hello","goodbye","please"], "answer": 0},
    {"type": "match", "pairs":[{"left":"merci","right":"thank you"},{"left":"au revoir","right":"goodbye"}]},
    {"type": "fill", "prompt": "Complète: __ baguette", "answer": "la"},
    {"type": "build", "target": "fromage"},
    {"type": "speak", "phrase": "Je m'appelle..."}
  ]
}
```

## Accessibility
- Keyboard focus states
- Buttons have accessible labels
- Minimal color contrast preserved

## License
MIT
