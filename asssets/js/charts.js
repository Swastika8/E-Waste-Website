// Dashboard charts using Chart.js via CDN
(function(){
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  function formatNumber(n){ return Intl.NumberFormat().format(n); }

  function loadTotals(){
    // Simple aggregated totals stored locally for prototype
    const raw = localStorage.getItem('totals');
    if(raw) return JSON.parse(raw);
    const defaults = { wasteKg: 0, co2Kg: 0, copperKg: 0, goldG: 0, plasticKg: 0 };
    localStorage.setItem('totals', JSON.stringify(defaults));
    return defaults;
  }

  function renderCards(t){
    const map = [
      { id:'stat-waste', value: t.wasteKg, suffix:' kg', label:'Total e-waste processed' },
      { id:'stat-co2', value: t.co2Kg, suffix:' kg', label:'CO₂ saved' },
      { id:'stat-copper', value: t.copperKg, suffix:' kg', label:'Copper recovered' },
      { id:'stat-gold', value: t.goldG, suffix:' g', label:'Gold recovered' }
    ];
    map.forEach(s=>{
      const el = document.getElementById(s.id);
      if(el){ el.textContent = formatNumber(s.value) + s.suffix; }
    });
  }

  function renderImpactChart(t){
    const ctx = document.getElementById('impactChart');
    if(!ctx || typeof Chart === 'undefined') return;
    const data = {
      labels: ['CO₂ Saved (kg)', 'Copper (kg)', 'Gold (g)', 'Plastic (kg)'],
      datasets: [{
        label: 'Recovery Totals',
        data: [t.co2Kg, t.copperKg, t.goldG, t.plasticKg],
        backgroundColor: [
          'rgba(34,197,94,0.6)',
          'rgba(59,130,246,0.6)',
          'rgba(234,179,8,0.6)',
          'rgba(6,182,212,0.6)'
        ],
        borderColor: [
          'rgba(34,197,94,1)',
          'rgba(59,130,246,1)',
          'rgba(234,179,8,1)',
          'rgba(6,182,212,1)'
        ],
        borderWidth: 1,
      }]
    };
    new Chart(ctx, { type:'bar', data, options:{ responsive:true, plugins:{ legend:{ labels:{ color:'#e5eef7' } } }, scales:{ x:{ ticks:{ color:'#7a8aa0' } }, y:{ ticks:{ color:'#7a8aa0' } } } } });
  }

  ready(()=>{
    const totals = loadTotals();
    renderCards(totals);
    renderImpactChart(totals);
  });
})();


