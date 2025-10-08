// Simple app bootstrap: navbar active state, points display, and pub/sub
(function(){
  const routes = [
    { hash: '#dashboard', id: 'nav-dashboard', section: 'section-dashboard' },
    { hash: '#simulator', id: 'nav-simulator', section: 'section-simulator' },
    { hash: '#marketplace', id: 'nav-marketplace', section: 'section-marketplace' },
    { hash: '#ai', id: 'nav-ai', section: 'section-ai' },
    { hash: '#leaderboard', id: 'nav-leaderboard', section: 'section-leaderboard' },
    { hash: '#profile', id: 'nav-profile', section: 'section-profile' }
  ];

  function setActiveNavAndView(){
    const hash = location.hash || '#dashboard';
    routes.forEach(r=>{
      const link = document.getElementById(r.id);
      const sec = document.getElementById(r.section);
      if(!link || !sec) return;
      if(hash === r.hash){
        link.classList.add('active');
        sec.classList.remove('hidden');
      } else {
        link.classList.remove('active');
        sec.classList.add('hidden');
      }
    });
  }

  // Points header display
  function getUserPointsKey(){
    const user = getCurrentUser();
    const uid = user && user.uid ? user.uid : 'guest';
    return 'points:'+uid;
  }
  function getPoints(){
    const key = getUserPointsKey();
    const raw = localStorage.getItem(key);
    return raw ? parseInt(raw,10) : 0;
  }
  function setPoints(v){
    const key = getUserPointsKey();
    localStorage.setItem(key, String(v));
    document.querySelectorAll('[data-points]').forEach(el=>{ el.textContent = String(v); });
  }
  function addPoints(delta){ setPoints(getPoints() + delta); }

  // Simple pub/sub for modules
  const bus = {
    on(evt, cb){ document.addEventListener(evt, (e)=>cb(e.detail)); },
    emit(evt, detail){ document.dispatchEvent(new CustomEvent(evt,{ detail })); }
  };
  function getCurrentUser(){
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  }
  function requireAuth(onAuthed){
    const user = getCurrentUser();
    if(user){ onAuthed && onAuthed(user); return; }
    const next = encodeURIComponent(location.href);
    location.href = 'auth.html?next='+next;
  }
  window.App = { getPoints, setPoints, addPoints, bus, getCurrentUser, requireAuth };

  document.addEventListener('DOMContentLoaded', ()=>{
    setActiveNavAndView();
    if(localStorage.getItem('points') === null){ setPoints(0); }
    else { setPoints(getPoints()); }
    window.addEventListener('hashchange', setActiveNavAndView);
  });
})();


