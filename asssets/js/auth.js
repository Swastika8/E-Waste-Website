// Auth: Firebase (if configured) else localStorage fallback
(function(){
  const hasFirebase = typeof firebase !== 'undefined' && firebase?.apps?.length >= 0;
  const cfgEl = document.getElementById('firebase-config');
  let app = null, auth = null, db = null;

  async function initFirebase(){
    if(!hasFirebase || !cfgEl) return false;
    try{
      const config = JSON.parse(cfgEl.textContent || '{}');
      if(!config || !config.apiKey){ return false; }
      app = firebase.initializeApp(config);
      auth = firebase.auth();
      db = firebase.firestore();
      return true;
    }catch(e){ console.warn('Firebase init failed', e); return false; }
  }

  // Local fallback store
  function lsGetUsers(){ return JSON.parse(localStorage.getItem('users')||'[]'); }
  function lsSetUsers(users){ localStorage.setItem('users', JSON.stringify(users)); }
  function lsSetCurrent(user){ localStorage.setItem('currentUser', JSON.stringify(user)); }
  function lsGetCurrent(){ const r = localStorage.getItem('currentUser'); return r?JSON.parse(r):null; }

  async function signUp(email, password, displayName){
    if(auth){
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: displayName||email });
      return { uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName };
    } else {
      const users = lsGetUsers();
      if(users.find(u=>u.email===email)) throw new Error('Email already registered');
      const user = { uid: 'ls_'+Date.now(), email, displayName: displayName||email };
      users.push(user); lsSetUsers(users); lsSetCurrent(user); return user;
    }
  }
  async function signIn(email, password){
    if(auth){
      const cred = await auth.signInWithEmailAndPassword(email, password);
      return { uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName };
    } else {
      const users = lsGetUsers();
      const user = users.find(u=>u.email===email);
      if(!user) throw new Error('Account not found');
      lsSetCurrent(user); return user;
    }
  }
  async function signOut(){
    if(auth){ await auth.signOut(); }
    localStorage.removeItem('currentUser');
    if(window.App){ try{ App.setPoints(0); }catch(_){} }
  }

  function updateNavbar(user){
    const loginBtn = document.getElementById('nav-login');
    const signupBtn = document.getElementById('nav-signup');
    const logoutBtn = document.getElementById('nav-logout');
    const profileLink = document.getElementById('nav-profile');
    if(user){
      loginBtn?.classList.add('hidden');
      signupBtn?.classList.add('hidden');
      logoutBtn?.classList.remove('hidden');
      if(profileLink){ profileLink.textContent = user.displayName || 'Profile'; }
    } else {
      loginBtn?.classList.remove('hidden');
      signupBtn?.classList.remove('hidden');
      logoutBtn?.classList.add('hidden');
      if(profileLink){ profileLink.textContent = 'Profile'; }
    }
  }

  function wireModal(){
    const logoutBtn = document.getElementById('nav-logout');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    logoutBtn?.addEventListener('click', async ()=>{ await signOut(); updateNavbar(null); if(window.App){ try{ App.setPoints(0); }catch(_){} } alert('Logged out'); });

    loginForm?.addEventListener('submit', async function(e){
      e.preventDefault();
      const email = this.querySelector('input[name=email]').value.trim();
      const password = this.querySelector('input[name=password]').value;
      try{ const u = await signIn(email, password); lsSetCurrent(u); updateNavbar(u); alert('Welcome '+(u.displayName||u.email)); }
      catch(err){ alert(err.message||'Login failed'); }
    });

    signupForm?.addEventListener('submit', async function(e){
      e.preventDefault();
      const email = this.querySelector('input[name=email]').value.trim();
      const password = this.querySelector('input[name=password]').value;
      const displayName = this.querySelector('input[name=displayName]').value.trim();
      try{ const u = await signUp(email, password, displayName); lsSetCurrent(u); updateNavbar(u); if(window.App){ try{ App.setPoints(0); }catch(_){} } alert('Account created'); }
      catch(err){ alert(err.message||'Sign up failed'); }
    });
  }

  document.addEventListener('DOMContentLoaded', async function(){
    const ok = await initFirebase();
    const current = lsGetCurrent();
    updateNavbar(current);
    wireModal();
    // Signal success to pages that want to redirect post-auth
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    function emitSuccess(){ document.dispatchEvent(new CustomEvent('auth:success')); }
    if(loginForm){
      const orig = loginForm.onsubmit;
      loginForm.addEventListener('submit', function(){ setTimeout(emitSuccess, 50); });
    }
    if(signupForm){
      const orig2 = signupForm.onsubmit;
      signupForm.addEventListener('submit', function(){ setTimeout(emitSuccess, 50); });
    }
  });

  // Expose minimal API
  window.Auth = { signIn, signUp, signOut };
})();


