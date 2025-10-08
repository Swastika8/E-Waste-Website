// AI Classifier page logic (prototype)
(function(){
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function(){
    const input = document.getElementById('image');
    const result = document.getElementById('result');
    const simulateBtn = document.getElementById('simulate');
    const video = document.getElementById('camera');
    const snapBtn = document.getElementById('snap');
    const modelUrlEl = document.getElementById('model-url');
    const manualWrapper = document.getElementById('manual-wrapper');
    const manualSelect = document.getElementById('manual-category');
    const wrongBtn = document.getElementById('wrong-btn');
    if(!input || !result || !simulateBtn) return;

    let predicted = null;

    // Optional external model URL (e.g., /assets/models/model.json)
    let modelLoaded = false;
    const params = new URLSearchParams(location.search);
    const qpModel = params.get('model');
    const modelUrl = (qpModel || (modelUrlEl ? modelUrlEl.value.trim() : ''));
    if(window.Classifier && modelUrl){ Classifier.loadModel(modelUrl, ['phone','laptop','tv','other']).then(m=>{ modelLoaded = !!m; toggleManual(); }); }
    else { toggleManual(); }

    function toggleManual(){
      if(manualWrapper){ if(modelLoaded) manualWrapper.classList.add('hidden'); else manualWrapper.classList.remove('hidden'); }
    }

    input.addEventListener('change', function(){
      const file = input.files && input.files[0];
      if(!file){ result.textContent = 'No file selected.'; return; }
      const img = new Image();
      img.alt = file.name;
      img.onload = async function(){
        if(modelLoaded && window.Classifier){
          const pred = await Classifier.predictFromImageElement(img);
          predicted = pred.label;
          result.textContent = 'Predicted: '+pred.label.toUpperCase()+' ('+Math.round((pred.confidence||0)*100)+'%)';
        } else {
          predicted = manualSelect ? manualSelect.value : heuristic(file.name).label;
          result.textContent = 'Predicted (manual): '+predicted.toUpperCase();
        }
      };
      img.src = URL.createObjectURL(file);
    });

    // Camera capture
    // If Teachable Machine is available and a model URL is provided, use continuous webcam predictions
    let tmModel = null, tmWebcam = null, tmLabels = [];
    let tmRunning = false;
    let nativeStream = null;
    async function initTeachableMachine(folderUrl){
      try{
        const base = folderUrl.endsWith('/') ? folderUrl : folderUrl.replace(/model\.json(?:\?.*)?$/,'');
        const modelURL = base.endsWith('/') ? base+"model.json" : base+"/model.json";
        const metadataURL = base.endsWith('/') ? base+"metadata.json" : base+"/metadata.json";
        tmModel = await tmImage.load(modelURL, metadataURL);
        const total = tmModel.getTotalClasses();
        tmLabels = [];
        for(let i=0;i<total;i++){ tmLabels.push(i); }
        if(video){
          const flip = true;
          tmWebcam = new tmImage.Webcam(200, 200, flip);
          await tmWebcam.setup();
          await tmWebcam.play();
          tmRunning = true;
          // Replace video preview with TM canvas
          const container = video.parentElement;
          if(container){ container.replaceChild(tmWebcam.canvas, video); }
          window.requestAnimationFrame(loop);
        }
      }catch(e){ /* fallback silently */ }
    }
    async function loop(){
      if(!tmRunning || !tmWebcam) return;
      tmWebcam.update();
      await tmPredict();
      window.requestAnimationFrame(loop);
    }
    async function tmPredict(){
      const prediction = await tmModel.predict(tmWebcam.canvas);
      let best = { className:'', probability:0 };
      prediction.forEach(p=>{ if(p.probability>best.probability) best=p; });
      const mapped = mapBest(best.className);
      predicted = mapped;
      result.textContent = 'Predicted: '+mapped.toUpperCase()+' ('+best.probability.toFixed(2)+')';
    }
    function mapBest(name){
      const l = (name||'').toLowerCase();
      if(l.includes('phone')||l.includes('mobile')||l.includes('smartphone')) return 'phone';
      if(l.includes('laptop')||l.includes('notebook')) return 'laptop';
      if(l.includes('tv')||l.includes('television')||l.includes('monitor')) return 'tv';
      if(l.includes('keyboard')) return 'keyboard';
      if(l.includes('mouse')) return 'mouse';
      return manualSelect ? manualSelect.value : 'phone';
    }

    if(video && navigator.mediaDevices?.getUserMedia){
      navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' } }).then(stream=>{ nativeStream = stream; video.srcObject = stream; video.play(); }).catch(()=>{});
      // If a TM folder or model.json is provided, init TM (overrides manual capture)
      if(modelUrl){ initTeachableMachine(modelUrl); }
      snapBtn?.addEventListener('click', async function(){
        // Manual capture path (when not using TM continuous)
        if(tmModel){ return; }
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const img = new Image();
        img.src = canvas.toDataURL('image/png');
        img.onload = async function(){
          if(modelLoaded && window.Classifier){
            const pred = await Classifier.predictFromImageElement(img);
            predicted = pred.label;
            result.textContent = 'Predicted: '+pred.label.toUpperCase()+' ('+Math.round((pred.confidence||0)*100)+'%)';
          } else {
            predicted = manualSelect ? manualSelect.value : 'phone';
            result.textContent = 'Predicted (manual): '+predicted.toUpperCase();
          }
        };
      });
    }

    // Wrong prediction -> enable manual override
    wrongBtn?.addEventListener('click', function(){
      // Stop TM webcam loop and release native camera
      if(tmRunning){ tmRunning = false; }
      if(tmWebcam){ try{ tmWebcam.stop(); }catch(_){} }
      if(nativeStream){ try{ nativeStream.getTracks().forEach(t=>t.stop()); }catch(_){} }
      if(video){ try{ video.pause(); video.srcObject = null; video.style.display = 'none'; }catch(_){} }
      if(tmWebcam && tmWebcam.canvas){ try{ tmWebcam.canvas.style.display = 'none'; }catch(_){} }

      predicted = manualSelect ? manualSelect.value : predicted;
      if(manualWrapper){ manualWrapper.classList.remove('hidden'); }
      result.textContent = 'Overridden manually: '+(predicted||'phone').toUpperCase();
    });

    simulateBtn.addEventListener('click', function(){
      if(!predicted){ alert('Upload or capture an image first.'); return; }
      const r = Points.applyRecovery(predicted);
      if(!r) return; // redirected to auth
      const pts = predicted==='tv'?12:predicted==='laptop'?8:predicted==='keyboard'?4:predicted==='mouse'?3:5;
      Points.awardPoints('classify:'+predicted, pts);
      alert('Classified and simulated '+predicted+'. +'+pts+' pts');
    });
  });

  function heuristic(name){
    const n = (name||'').toLowerCase();
    if(n.includes('phone')) return { label:'phone', confidence:0.9 };
    if(n.includes('laptop')) return { label:'laptop', confidence:0.9 };
    if(n.includes('tv')) return { label:'tv', confidence:0.9 };
    return { label:'phone', confidence:0.5 };
  }
})();


