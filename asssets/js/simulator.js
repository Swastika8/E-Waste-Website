// Simulator page logic
(function(){
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function(){
    const select = document.getElementById('device');
    const runBtn = document.getElementById('run');
    const out = document.getElementById('output');
    if(!select || !runBtn || !out) return;

    runBtn.addEventListener('click', function(){
      const device = select.value;
      const r = Points.applyRecovery(device);
      const pts = device==='tv'?12:device==='laptop'?8:device==='keyboard'?4:device==='mouse'?3:5;
      Points.awardPoints('simulate:'+device, pts);
      out.textContent = 'Recovered — CO₂: '+r.co2Kg+'kg, Copper: '+r.copperKg+'kg, Gold: '+r.goldG+'g, Plastic: '+r.plasticKg+'kg';
    });
  });
})();


