// Simple TF.js classifier loader with fallback keyword heuristic
(function(){
  let model = null;
  let labels = ['phone','laptop','tv','other'];

  async function loadModel(url, labelList){
    if(labelList && Array.isArray(labelList) && labelList.length){ labels = labelList; }
    if(!url){ return null; }
    try{
      // Try load Teachable Machine metadata.json to get labels
      const metaUrl = url.replace(/model\.json(?:\?.*)?$/,'metadata.json');
      try{
        const resp = await fetch(metaUrl, { cache:'no-store' });
        if(resp.ok){
          const meta = await resp.json();
          const lm = meta?.labels || meta?.class_names;
          if(Array.isArray(lm) && lm.length){ labels = lm.map(String); }
        }
      }catch(e){ /* metadata optional */ }
      model = await tf.loadLayersModel(url);
      return model;
    }catch(err){ console.warn('Model load failed:', err); return null; }
  }

  async function predictFromImageElement(img){
    if(model){
      const size = model.inputs?.[0]?.shape?.[1] || 224;
      const t = tf.tidy(()=> tf.browser.fromPixels(img).resizeBilinear([size,size]).toFloat().div(255).expandDims(0));
      const probs = model.predict(t);
      const data = (await probs.data());
      const idx = data.indexOf(Math.max(...data));
      t.dispose(); probs.dispose?.();
      const raw = labels[idx] || 'other';
      return { label: mapToCategory(raw), confidence: data[idx]||0, rawLabel: raw };
    }
    // Fallback heuristic by filename or alt text
    const name = (img.alt || img.getAttribute('data-name') || '').toLowerCase();
    if(name.includes('phone')) return { label:'phone', confidence:0.9 };
    if(name.includes('laptop')) return { label:'laptop', confidence:0.9 };
    if(name.includes('tv')) return { label:'tv', confidence:0.9 };
    return { label:'phone', confidence:0.5 };
  }

  function mapToCategory(label){
    const l = (label||'').toLowerCase();
    if(l.includes('phone') || l.includes('mobile') || l.includes('smartphone')) return 'phone';
    if(l.includes('laptop') || l.includes('notebook')) return 'laptop';
    if(l.includes('tv') || l.includes('television') || l.includes('monitor')) return 'tv';
    if(l.includes('keyboard')) return 'keyboard';
    if(l.includes('mouse')) return 'mouse';
    return 'phone';
  }

  window.Classifier = { loadModel, predictFromImageElement };
})();



