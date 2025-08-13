// activities.js — simple activity renderer/engine
// Activity types supported:
// - flashcards: {type:'flashcards', cards:[{fr,en}]}
// - mcq: {type:'mcq', prompt, options:[...], answer}
// - match: {type:'match', pairs:[{left,right}]}
// - fill: {type:'fill', prompt, answer}
// - build: {type:'build', target:'bonjour'} (drag letters)
// - speak: {type:'speak', phrase: 'bonjour' }  // TTS practice

export const Activities = (() => {
  let host, current, checked = false;
  const synth = window.speechSynthesis;

  function speak(text, lang='fr-FR'){
    try{
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      synth.cancel();
      synth.speak(u);
    }catch(e){ console.warn('TTS not available'); }
  }

  function mount(el){ host = el; host.innerHTML = ''; checked = false; }
  function setCurrent(c){ current = c; checked = false; }

  function render(activity){
    setCurrent(activity);
    mount(host);
    switch(activity.type){
      case 'flashcards': return renderFlashcards(activity);
      case 'mcq': return renderMCQ(activity);
      case 'match': return renderMatch(activity);
      case 'fill': return renderFill(activity);
      case 'build': return renderBuild(activity);
      case 'speak': return renderSpeak(activity);
      default:
        host.innerHTML = `<div class="cardlet">Type inconnu.</div>`;
    }
  }

  function check(){
    if(!current) return {correct:true, score:100};
    switch(current.type){
      case 'flashcards': return {correct:true, score:100}; // passive
      case 'mcq': return checkMCQ();
      case 'match': return checkMatch();
      case 'fill': return checkFill();
      case 'build': return checkBuild();
      case 'speak': return {correct:true, score:100};
      default: return {correct:true, score:100};
    }
  }

  // ---- Renderers ----
  function renderFlashcards({cards}){
    const wrap = document.createElement('div');
    wrap.className = 'activity';
    const list = document.createElement('div');
    list.className = 'list';
    cards.forEach(c => {
      const row = document.createElement('div');
      row.className = 'cardlet flashcard';
      row.innerHTML = `
        <div class="big">${c.fr}</div>
        <div class="muted">${c.en}</div>
        <button class="chip" aria-label="Écouter"><span class="material-icons">volume_up</span> Écouter</button>
      `;
      row.querySelector('button').addEventListener('click', ()=> speak(c.fr));
      list.appendChild(row);
    });
    wrap.appendChild(list);
    host.appendChild(wrap);
  }

  // MCQ
  function renderMCQ({prompt, options}){
    const wrap = document.createElement('div');
    wrap.className = 'activity cardlet';
    wrap.innerHTML = `<p class="big">${prompt}</p>`;
    const list = document.createElement('div'); list.className = 'list';
    options.forEach((opt, idx)=>{
      const btn = document.createElement('button');
      btn.className = 'btn'; btn.setAttribute('data-idx', idx);
      btn.innerHTML = opt;
      btn.addEventListener('click', ()=>{
        list.querySelectorAll('.btn').forEach(b=> b.classList.remove('primary'));
        btn.classList.add('primary'); btn.setAttribute('aria-pressed','true');
      });
      list.appendChild(btn);
    });
    wrap.appendChild(list);
    host.appendChild(wrap);
  }
  function checkMCQ(){
    const selected = host.querySelector('.activity .btn.primary');
    const idx = selected ? Number(selected.getAttribute('data-idx')) : -1;
    const ok = idx === current.answer;
    if(selected){
      selected.classList.toggle('correct', ok);
      selected.classList.toggle('incorrect', !ok);
    }
    checked = true;
    return {correct: ok, score: ok?100:0};
  }

  // Match
  function renderMatch({pairs}){
    // Shuffle
    function shuffle(a){ return a.map(v=>({v, r:Math.random()})).sort((a,b)=>a.r-b.r).map(o=>o.v); }
    const left = pairs.map(p=>p.left);
    const right = shuffle(pairs.map(p=>p.right));

    const wrap = document.createElement('div'); wrap.className = 'activity';
    const rowsL = document.createElement('div'); rowsL.className = 'list';
    const rowsR = document.createElement('div'); rowsR.className = 'list';

    left.forEach((l,i)=>{
      const item = document.createElement('div'); item.className = 'pill';
      item.innerHTML = `<span>${l}</span>
        <select class="input" data-left="${l}">
          <option value="">—</option>
          ${right.map(r=>`<option>${r}</option>`).join('')}
        </select>`;
      rowsL.appendChild(item);
    });
    wrap.appendChild(document.createElement('hr'));
    const grid = document.createElement('div'); grid.className='row'; grid.appendChild(rowsL);
    wrap.appendChild(grid);
    host.appendChild(wrap);
  }
  function checkMatch(){
    let correct = 0;
    const selects = host.querySelectorAll('select[data-left]');
    selects.forEach(sel=>{
      const l = sel.getAttribute('data-left');
      const r = sel.value;
      const ok = current.pairs.find(p=>p.left===l && p.right===r);
      sel.parentElement.classList.toggle('correct', !!ok);
      sel.parentElement.classList.toggle('incorrect', !ok);
      if(ok) correct++;
    });
    const score = Math.round((correct / current.pairs.length) * 100);
    checked = true;
    return {correct: score===100, score};
  }

  // Fill in the blank
  function renderFill({prompt}){
    const wrap = document.createElement('div'); wrap.className='activity cardlet';
    wrap.innerHTML = `<p class="big">${prompt}</p>
      <input class="input" id="fillAns" placeholder="Ta réponse" autocomplete="off"/>
      <p class="muted">Astuce: utilise l'article correct.</p>`;
    host.appendChild(wrap);
  }
  function checkFill(){
    const val = (host.querySelector('#fillAns')?.value || '').trim().toLowerCase();
    const ok = val === String(current.answer).toLowerCase();
    const input = host.querySelector('#fillAns');
    if(input){
      input.classList.toggle('correct', ok);
      input.classList.toggle('incorrect', !ok);
    }
    checked = true;
    return {correct: ok, score: ok?100:0};
  }

  // Build a word (drag letters)
  function renderBuild({target}){
    const wrap = document.createElement('div'); wrap.className='activity';
    const letters = target.split('');
    // randomize
    const shuffled = [...letters].sort(()=>Math.random()-.5);
    const bank = document.createElement('div'); bank.className='row';
    shuffled.forEach((ch,i)=>{
      const el = document.createElement('div'); el.className='drag-item'; el.textContent = ch; el.draggable=true;
      el.addEventListener('dragstart', e=> e.dataTransfer.setData('text/plain', ch));
      bank.appendChild(el);
    });
    const drop = document.createElement('div'); drop.className='drop-zone'; drop.textContent='Glisse les lettres ici';
    drop.addEventListener('dragover', e=> e.preventDefault());
    drop.addEventListener('drop', e=>{
      e.preventDefault();
      const ch = e.dataTransfer.getData('text/plain');
      const span = document.createElement('span'); span.className='drag-item'; span.textContent=ch;
      drop.appendChild(span);
    });
    wrap.appendChild(bank); wrap.appendChild(drop);
    host.appendChild(wrap);
  }
  function checkBuild(){
    const built = [...host.querySelectorAll('.drop-zone .drag-item')].map(s=>s.textContent).join('');
    const ok = built.toLowerCase() === String(current.target).toLowerCase();
    const drop = host.querySelector('.drop-zone');
    if(drop){
      drop.classList.toggle('correct', ok);
      drop.classList.toggle('incorrect', !ok);
    }
    checked = true;
    return {correct: ok, score: ok?100:0};
  }

  // Speak (TTS play)
  function renderSpeak({phrase}){
    const wrap = document.createElement('div'); wrap.className='activity center';
    const p = document.createElement('p'); p.className='big'; p.textContent = phrase;
    const btn = document.createElement('button'); btn.className='btn'; btn.innerHTML='<span class="material-icons">volume_up</span> Écouter';
    btn.addEventListener('click', ()=> speak(phrase));
    wrap.appendChild(p); wrap.appendChild(btn);
    host.appendChild(wrap);
  }

  return { mount, render, check };
})();
