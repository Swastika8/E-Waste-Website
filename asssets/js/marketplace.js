// Marketplace logic (single-page compatible)
(function(){
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    const form = document.getElementById('listing-form');
    const list = document.getElementById('listings');
    if(!form || !list) return;
    const listings = JSON.parse(localStorage.getItem('listings')||'[]');
    function render(){
      list.innerHTML = '';
      listings.forEach(item=>{
        const li = document.createElement('div');
        li.className = 'panel';
        li.innerHTML = '<strong>'+item.title+'</strong> — '+item.type+' — '+item.category+' — '+item.location;
        list.appendChild(li);
      });
    }
    render();
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      listings.push(data);
      localStorage.setItem('listings', JSON.stringify(listings));
      render();
      if(data.type==='donate'){ if(window.Points) Points.awardPoints('donation', 10); }
      form.reset();
    });
  });
})();


