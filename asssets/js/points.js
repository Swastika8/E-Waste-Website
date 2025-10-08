// Points utilities and totals updater
(function(){
  function loadTotals(){
    const raw = localStorage.getItem('totals');
    return raw ? JSON.parse(raw) : { wasteKg:0, co2Kg:0, copperKg:0, goldG:0, plasticKg:0 };
  }
  function saveTotals(t){ localStorage.setItem('totals', JSON.stringify(t)); }

  function awardPoints(reason, amount){
    App.requireAuth(()=>{
      const before = App.getPoints();
      App.addPoints(amount);
      App.bus.emit('points:awarded', { reason, amount, before, after: App.getPoints() });
    });
  }

  function applyRecovery(device){
    // Naive mappings for prototype
    const map = {
      phone:{ wasteKg:0.2, co2Kg:1.5, copperKg:0.03, goldG:0.03, plasticKg:0.05 },
      laptop:{ wasteKg:2.0, co2Kg:10, copperKg:0.3, goldG:0.1, plasticKg:0.4 },
      tv:{ wasteKg:8.0, co2Kg:35, copperKg:0.8, goldG:0.2, plasticKg:1.2 },
      keyboard:{ wasteKg:0.4, co2Kg:1.0, copperKg:0.02, goldG:0.0, plasticKg:0.2 },
      mouse:{ wasteKg:0.2, co2Kg:0.5, copperKg:0.01, goldG:0.0, plasticKg:0.1 },
    };
    let result = null;
    App.requireAuth(()=>{
      const t = loadTotals();
      const r = map[device] || map.phone;
      t.wasteKg += r.wasteKg;
      t.co2Kg += r.co2Kg;
      t.copperKg += r.copperKg;
      t.goldG += r.goldG;
      t.plasticKg += r.plasticKg;
      saveTotals(t);
      App.bus.emit('totals:updated', t);
      result = r;
    });
    return result;
  }

  window.Points = { awardPoints, applyRecovery };
})();


