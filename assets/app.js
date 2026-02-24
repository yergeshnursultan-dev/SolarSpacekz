// =====================================================
  // 0) Reveal on scroll
  // =====================================================
  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  const io = new IntersectionObserver((entries)=> {
    for(const e of entries){
      if(e.isIntersecting) e.target.classList.add("on");
    }
  }, {threshold: .12});
  revealEls.forEach(el=>io.observe(el));

  // =====================================================
  // 0b) Section background switch (әр блок басталғанда фон ауысады)
  // =====================================================
  const bgA = document.getElementById('bgA');
  const bgB = document.getElementById('bgB');
  let bgFlip = false;
  const BG_MAP = {
    topbar: "radial-gradient(circle at 18% 18%, rgba(56,189,248,.22), transparent 55%), radial-gradient(circle at 80% 20%, rgba(34,197,94,.16), transparent 60%), radial-gradient(circle at center, #0b1539, #050b1f 72%)",
    hero:   "radial-gradient(circle at 20% 35%, rgba(255,191,0,.22), transparent 58%), radial-gradient(circle at 75% 30%, rgba(249,115,22,.18), transparent 62%), radial-gradient(circle at 55% 80%, rgba(56,189,248,.10), transparent 65%), radial-gradient(circle at center, #0b1539, #050b1f 72%)",
    analytics: "radial-gradient(circle at 25% 30%, rgba(56,189,248,.20), transparent 60%), radial-gradient(circle at 78% 35%, rgba(168,85,247,.12), transparent 62%), radial-gradient(circle at 55% 82%, rgba(34,197,94,.10), transparent 65%), radial-gradient(circle at center, #0b1539, #050b1f 72%)",
    forecast:  "radial-gradient(circle at 25% 30%, rgba(34,197,94,.18), transparent 60%), radial-gradient(circle at 78% 40%, rgba(255,191,0,.16), transparent 62%), radial-gradient(circle at 55% 82%, rgba(249,115,22,.10), transparent 65%), radial-gradient(circle at center, #0b1539, #050b1f 72%)",
    summary:   "radial-gradient(circle at 20% 35%, rgba(148,163,184,.14), transparent 60%), radial-gradient(circle at 78% 35%, rgba(56,189,248,.12), transparent 62%), radial-gradient(circle at 55% 82%, rgba(34,197,94,.10), transparent 65%), radial-gradient(circle at center, #0b1539, #050b1f 72%)",
    panel:     "radial-gradient(circle at 25% 30%, rgba(34,197,94,.18), transparent 60%), radial-gradient(circle at 78% 35%, rgba(56,189,248,.12), transparent 62%), radial-gradient(circle at 55% 82%, rgba(255,191,0,.10), transparent 65%), radial-gradient(circle at center, #0b1539, #050b1f 72%)",
    order:     "radial-gradient(circle at 25% 30%, rgba(255,191,0,.16), transparent 60%), radial-gradient(circle at 78% 35%, rgba(34,197,94,.14), transparent 62%), radial-gradient(circle at 55% 82%, rgba(56,189,248,.10), transparent 65%), radial-gradient(circle at center, #0b1539, #050b1f 72%)",
  };
  function setSectionBG(key){
    const bg = BG_MAP[key] || BG_MAP.hero;
    if(!bgA || !bgB) return;
    const top = bgFlip ? bgA : bgB;
    const bottom = bgFlip ? bgB : bgA;
    top.style.background = bg;
    top.style.opacity = '1';
    bottom.style.opacity = '0';
    bgFlip = !bgFlip;
  }
  // initial
  setSectionBG('hero');

  const bgTargets = Array.from(document.querySelectorAll('[data-bg]'));
  const bgIO = new IntersectionObserver((entries)=>{
    // pick the most visible entry
    const vis = entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
    if(vis[0]){
      const key = vis[0].target.getAttribute('data-bg');
      setSectionBG(key);
    }
  }, {threshold:[0.25,0.35,0.5,0.65]});
  bgTargets.forEach(el=>bgIO.observe(el));


  // =====================================================
  // 1) Status helper
  // =====================================================
  const statusMessage = document.getElementById("statusMessage");
  const statusText = document.getElementById("statusText");
  const statusDot = document.getElementById("statusDot");
  function setStatus(type, text){
    statusMessage.classList.remove("ready","loading","error");
    if(type) statusMessage.classList.add(type);
    statusText.textContent = text;
    statusDot.className = "dot " + (type==="ready" ? "ok" : type==="loading" ? "warn" : type==="error" ? "" : "");
  }

  // =====================================================
  // 1b) Forecast status helper
  // =====================================================
  const forecastStatus = document.getElementById("forecastStatus");
  const forecastStatusText = document.getElementById("forecastStatusText");
  function setForecastStatus(type, text){
    if(!forecastStatus || !forecastStatusText) return;
    forecastStatus.classList.remove("ready","loading","error");
    if(type) forecastStatus.classList.add(type);
    const dot = forecastStatus.querySelector('.dot');
    if(dot) dot.className = "dot " + (type==="ready" ? "ok" : type==="loading" ? "warn" : "");
    forecastStatusText.textContent = text;
  }

  // =====================================================
  // 1c) MiniChart fallback (Chart.js жоқ болса да графиктер шықсын)
  // =====================================================
  function hasChartJS(){
    return (typeof window.Chart === "function");
  }

  function _canvasFromTarget(t){
    if(!t) return null;
    // Chart.js sometimes passes ctx
    if(t.canvas) return t.canvas;
    return t;
  }

  function _ensureGlobalTooltip(){
    let tip = document.getElementById('miniTip');
    if(tip) return tip;
    tip = document.createElement('div');
    tip.id = 'miniTip';
    tip.style.position = 'fixed';
    tip.style.zIndex = '9999';
    tip.style.pointerEvents = 'none';
    tip.style.padding = '8px 10px';
    tip.style.borderRadius = '12px';
    tip.style.background = 'rgba(2,6,23,.92)';
    tip.style.border = '1px solid rgba(148,163,184,.18)';
    tip.style.color = 'rgba(226,232,240,.95)';
    tip.style.fontSize = '12px';
    tip.style.lineHeight = '1.25';
    tip.style.boxShadow = '0 12px 30px rgba(0,0,0,.35)';
    tip.style.opacity = '0';
    tip.style.transform = 'translateY(6px)';
    tip.style.transition = 'opacity .12s ease, transform .12s ease';
    document.body.appendChild(tip);
    return tip;
  }

  function _showTip(html, x, y){
    const tip=_ensureGlobalTooltip();
    tip.innerHTML = html;
    const pad=12;
    // temporary show to measure
    tip.style.opacity = '1';
    tip.style.transform = 'translateY(0)';
    const r = tip.getBoundingClientRect();
    let left = x + pad;
    let top  = y + pad;
    if(left + r.width > window.innerWidth - 8) left = x - r.width - pad;
    if(top + r.height > window.innerHeight - 8) top = y - r.height - pad;
    tip.style.left = Math.max(8, left) + 'px';
    tip.style.top  = Math.max(8, top) + 'px';
  }
  function _hideTip(){
    const tip=document.getElementById('miniTip');
    if(!tip) return;
    tip.style.opacity = '0';
    tip.style.transform = 'translateY(6px)';
  }

  function MiniChart(target, cfg){
    const canvas = _canvasFromTarget(target);
    if(!canvas || !canvas.getContext) return {destroy(){}};
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 600;
    const h = canvas.clientHeight || 260;
    canvas.width = Math.max(1, Math.floor(w*dpr));
    canvas.height = Math.max(1, Math.floor(h*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);

    const padL=46, padR=14, padT=14, padB=34;
    const pw = Math.max(1, w - padL - padR);
    const ph = Math.max(1, h - padT - padB);
    const left=padL, top=padT;

    // background
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0,0,w,h);

    // solar disk background for sun-surface chart
    const wantDisk = (canvas.id === 'chartForecast');
    if(wantDisk){
      const cx = left + pw/2;
      const cy = top + ph/2;
      const R = Math.min(pw,ph) * 0.53; // bigger sun
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI*2);
      ctx.closePath();
      ctx.clip();
      const g = ctx.createRadialGradient(cx - R*0.25, cy - R*0.25, R*0.12, cx, cy, R);
      g.addColorStop(0, 'rgba(255,200,64,.22)');
      g.addColorStop(0.55, 'rgba(249,115,22,.10)');
      g.addColorStop(1, 'rgba(2,6,23,0)');
      ctx.fillStyle = g;
      ctx.fillRect(left, top, pw, ph);
      // subtle grain
      ctx.globalAlpha = 0.09;
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      for(let i=0;i<120;i++){
        const rx = cx + (Math.random()*2-1)*R;
        const ry = cy + (Math.random()*2-1)*R;
        if((rx-cx)*(rx-cx) + (ry-cy)*(ry-cy) <= R*R){
          ctx.fillRect(rx, ry, 1, 1);
        }
      }
      ctx.restore();
      // rim
      ctx.strokeStyle = 'rgba(255,255,255,.10)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI*2);
      ctx.stroke();
    }

    // axis titles
    const xTitle = cfg?.options?.scales?.x?.title?.text || '';
    const yTitle = cfg?.options?.scales?.y?.title?.text || '';

    // compute ranges
    let xMin=0, xMax=1, yMin=0, yMax=1;
    let labels = (cfg?.data?.labels || []);
    const ds = (cfg?.data?.datasets || []);
    const type = (cfg?.type || 'line');

    let hitPoints = []; // for tooltip

    if(type === 'scatter'){
      const all=[];
      for(const dset of ds){
        const arr = dset.data || [];
        for(const p of arr){
          const x = (typeof p.x === 'number') ? p.x : NaN;
          const y = (typeof p.y === 'number') ? p.y : NaN;
          if(isFinite(x) && isFinite(y)) all.push({x,y,raw:p, style:dset});
        }
      }
      if(all.length){
        xMin = Math.min(...all.map(p=>p.x));
        xMax = Math.max(...all.map(p=>p.x));
        yMin = Math.min(...all.map(p=>p.y));
        yMax = Math.max(...all.map(p=>p.y));
      }
      // respect explicit min/max
      const optX = cfg?.options?.scales?.x;
      const optY = cfg?.options?.scales?.y;
      if(optX && isFinite(optX.min)) xMin = optX.min;
      if(optX && isFinite(optX.max)) xMax = optX.max;
      if(optY && isFinite(optY.min)) yMin = optY.min;
      if(optY && isFinite(optY.max)) yMax = optY.max;
      if(xMin===xMax){xMin-=1; xMax+=1;}
      if(yMin===yMax){yMin-=1; yMax+=1;}

      // grid
      ctx.strokeStyle = 'rgba(148,163,184,.10)';
      ctx.lineWidth = 1;
      for(let i=0;i<=4;i++){
        const yy = top + (ph*i/4);
        ctx.beginPath(); ctx.moveTo(left, yy); ctx.lineTo(left+pw, yy); ctx.stroke();
      }
      for(let i=0;i<=4;i++){
        const xx = left + (pw*i/4);
        ctx.beginPath(); ctx.moveTo(xx, top); ctx.lineTo(xx, top+ph); ctx.stroke();
      }

      // plot points
      for(const p of all){
        const px = left + ((p.x-xMin)/(xMax-xMin))*pw;
        const py = top + (1-((p.y-yMin)/(yMax-yMin)))*ph;
        const r = (p.style.pointRadius ?? 2);
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI*2);
        const col = p.style.pointBackgroundColor || 'rgba(56,189,248,.95)';
        ctx.fillStyle = col;
        ctx.fill();
        hitPoints.push({px,py,r:Math.max(6,r+4), raw:p.raw, parsed:{x:p.x,y:p.y}, cfg});
      }
    } else {
      // line chart
      const n = labels.length;
      const numericLabels = (n>0 && labels.every(v=>typeof v==='number' && isFinite(v)));
      if(n>0){
        if(numericLabels){
          xMin = Math.min(...labels);
          xMax = Math.max(...labels);
          if(xMin===xMax){ xMin-=1; xMax+=1; }
        } else {
          xMin = 0; xMax = Math.max(1, n-1);
        }
      }
      const allY=[];
      const allY2=[];
      for(const dset of ds){
        const axis = dset.yAxisID || 'y';
        for(const y of (dset.data||[])) if(typeof y==='number' && isFinite(y)) (axis==='y2'?allY2:allY).push(y);
      }
      if(allY.length){ yMin=Math.min(...allY); yMax=Math.max(...allY); }
      let y2Min=yMin, y2Max=yMax;
      if(allY2.length){ y2Min=Math.min(...allY2); y2Max=Math.max(...allY2); }
      if(y2Min===y2Max){ y2Min-=1; y2Max+=1; }
      if(yMin===yMax){ yMin -= 1; yMax += 1; }

      // grid
      ctx.strokeStyle = 'rgba(148,163,184,.10)';
      ctx.lineWidth = 1;
      for(let i=0;i<=4;i++){
        const yy = top + (ph*i/4);
        ctx.beginPath(); ctx.moveTo(left, yy); ctx.lineTo(left+pw, yy); ctx.stroke();
      }

      // series
      for(const dset of ds){
        const arr = dset.data || [];
        ctx.save();
        ctx.lineWidth = dset.borderWidth || 2;
        ctx.strokeStyle = dset.borderColor || 'rgba(56,189,248,.85)';
        if(Array.isArray(dset.borderDash)) ctx.setLineDash(dset.borderDash);
        ctx.beginPath();
        let started=false;
        for(let i=0;i<arr.length;i++){
          const y = arr[i];
          if(y===null || y===undefined || !isFinite(y)) continue;
          const xVal = numericLabels ? labels[i] : i;
          const px = left + ((xVal-xMin)/(xMax-xMin))*pw;
          const axis = dset.yAxisID || 'y';
          const yLo = (axis==='y2') ? y2Min : yMin;
          const yHi = (axis==='y2') ? y2Max : yMax;
          const py = top + (1-((y-yLo)/(yHi-yLo)))*ph;
          if(!started){ ctx.moveTo(px,py); started=true; }
          else ctx.lineTo(px,py);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // axes
    ctx.strokeStyle = 'rgba(148,163,184,.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, top+ph);
    ctx.lineTo(left+pw, top+ph);
    ctx.stroke();

    // titles
    ctx.fillStyle = 'rgba(226,232,240,.80)';
    ctx.font = '12px ui-sans-serif, system-ui';
    if(xTitle){ ctx.fillText(xTitle, left + pw/2 - ctx.measureText(xTitle).width/2, h-10); }
    if(yTitle){
      ctx.save();
      ctx.translate(14, top + ph/2);
      ctx.rotate(-Math.PI/2);
      ctx.fillText(yTitle, -ctx.measureText(yTitle).width/2, 0);
      ctx.restore();
    }

    // tooltip events
    const labelCb = cfg?.options?.plugins?.tooltip?.callbacks?.label;
    const onMove = (ev)=>{
      if(!hitPoints.length) return;
      const rect = canvas.getBoundingClientRect();
      const mx = ev.clientX - rect.left;
      const my = ev.clientY - rect.top;
      let best=null, bestD=1e9;
      for(const p of hitPoints){
        const dx=mx-p.px, dy=my-p.py;
        const d=dx*dx+dy*dy;
        if(d < (p.r*p.r) && d<bestD){ bestD=d; best=p; }
      }
      if(best){
        let html='';
        if(typeof labelCb === 'function'){
          try{ html = String(labelCb({raw: best.raw, parsed: best.parsed})); }catch(e){ html=''; }
        }
        if(!html){
          html = `x=${best.parsed.x}, y=${best.parsed.y}`;
        }
        _showTip(html, ev.clientX, ev.clientY);
      } else {
        _hideTip();
      }
    };
    const onLeave = ()=> _hideTip();

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('click', onMove);

    return {
      destroy(){
        canvas.removeEventListener('mousemove', onMove);
        canvas.removeEventListener('mouseleave', onLeave);
        canvas.removeEventListener('click', onMove);
        // clear
        try{ ctx.clearRect(0,0,w,h); }catch(e){}
      }
    };
  }

  function createChart(target, cfg){
    // Chart.js болса — соны қолданамыз, болмаса MiniChart
    if(hasChartJS()){
      return new Chart(target, cfg);
    }
    return MiniChart(target, cfg);
  }

  // =====================================================
  // 2) Data stores (SME + X_CME)
  // =====================================================
  let Date_god=[], Mass=[], KE=[], Speed=[], MassDev=[];
  let maxM=0, maxKE=0, maxV=0;
  let meanM=0, meanKE=0, stdM=0, stdKE=0;

  let idx=0, playing=false, timer=null;

  let massChart, keChart, speedChart, devChart, corrChart, forecastChart;
  let chartForecast10, chartForecast10KE;

  // X_CME
  let DelayMinutes=[], Intensity=[];
  let XCMEEventTimes=[];
  let SMEEventTimes=[];
  let regionCounts=null;
  let regionX=[], regionY=[];
  let regionMaxAbs=0;
  let regionPoints=[];
  let delayPoints=[];

  // =====================================================
  // 3) SME load
  // =====================================================
  function loadData(){
    const smeFile = document.getElementById("fileInput").files[0];
    const xcmeFile = document.getElementById("xCmeInput").files[0];

    if(!smeFile){
      setStatus("error","SME файлы таңдалмады");
      alert("Алдымен SME TXT файлын таңда.");
      return;
    }
    setStatus("loading","Файлдар оқылуда...");

    const reader = new FileReader();
    reader.onload = (e)=>{
      const lines = e.target.result.split(/\r?\n/).filter(l=>l.trim()!=="");
      Date_god=[]; Mass=[]; KE=[]; Speed=[]; MassDev=[]; SMEEventTimes=[];

      for(const L of lines){
        const d = L.trim().split(/\s+/);
        if(d.length < 15) continue;

        const god=+d[0], mes=+d[1], den=+d[2], has=+d[3], min=+d[4], sec=+d[5];
        const T = has + min/60 + sec/3600;
        const dateYear = god + mes/12 + den/365 + T/(24*365);

        const speed=+d[8];
        const mass=+d[13];
        const ke=+d[14];

        Date_god.push(dateYear);
        Speed.push(speed);
        Mass.push(mass);
        KE.push(ke);
        // build a real Date for each SME row (needed for annual medians / forecast)
        try{
          const dt = new Date(god, (mes||1)-1, den||1, has||0, min||0, sec||0);
          if(!isNaN(dt)) SMEEventTimes.push(dt);
        }catch(e){}
      }

      if(Mass.length===0){
        setStatus("error","SME дерегі табылмады");
        alert("SME файл форматы күткенге сай емес (бағандар жетіспейді).");
        return;
      }

      maxM = Math.max(...Mass);
      maxKE = Math.max(...KE);
      maxV = Math.max(...Speed);

      meanM = Mass.reduce((a,b)=>a+b,0)/Mass.length;
      meanKE = KE.reduce((a,b)=>a+b,0)/KE.length;

      stdM = Math.sqrt(Mass.reduce((s,v)=>s+(v-meanM)**2,0)/Mass.length);
      stdKE = Math.sqrt(KE.reduce((s,v)=>s+(v-meanKE)**2,0)/KE.length);

      MassDev = Mass.map(m=>m-meanM);

      plotCoreCharts();
      updateAnimationSummary();

      if(xcmeFile){
        readXCMEFile(xcmeFile);
      } else {
        DelayMinutes=[]; Intensity=[];
        delayPoints=[];
        regionCounts=null; regionX=[]; regionY=[];
        regionPoints=[];
        regionMaxAbs=0;
        plotDelayAndRegionCharts();
        updateRegionSummary();
        updateForecastText();
        build10YearForecast();
        setStatus("ready","SME деректері дайын ✅ (X_CME таңдалмаған)");
      }
    };
    reader.onerror = ()=>{
      setStatus("error","SME оқу қатесі");
      alert("SME файлын оқу кезінде қате кетті.");
    };
    reader.readAsText(smeFile);
  }

  function readXCMEFile(file){
    const reader2 = new FileReader();
    reader2.onload = (e)=>{
      parseXCMEText(e.target.result);
      window.__nextFlare = computeNextFlare();
      plotDelayAndRegionCharts();
      updateRegionSummary();
      updateAnimationSummary();
      updateForecastText();
      build10YearForecast();
      setStatus("ready","SME + X_CME деректері дайын ✅");
    };
    reader2.onerror = ()=>{
      setStatus("error","X_CME оқу қатесі");
      alert("X_CME файлын оқу кезінде қате кетті.");
    };
    reader2.readAsText(file);
  }

  function parseXCMEText(text){
    const lines = text.split(/\r?\n/).filter(l=>l.trim()!=="");
    DelayMinutes=[]; Intensity=[];
    XCMEEventTimes=[];
    regionCounts={north:0,south:0,east:0,west:0,center:0};
    regionX=[]; regionY=[];
    regionPoints=[];
    delayPoints=[];

    for(const L of lines){
      const dRaw = L.trim().split(/\s+/);
      if(dRaw.length < 17) continue;

      let d = dRaw;
      if(dRaw[0].includes(".")){
        d = dRaw.slice(1);
        if(d.length < 17) continue;
      }

      const has = parseFloat(d[3])||0;
      const min = parseFloat(d[4])||0;
      const sec = parseFloat(d[5])||0;

      // event timestamp (X_CME)
      const yy = parseInt(d[0],10);
      const mm = parseInt(d[1],10);
      const dd = parseInt(d[2],10);
      const pad2 = (n)=> String(Math.max(0, n|0)).padStart(2,'0');
      const dateStr = (Number.isFinite(yy) && Number.isFinite(mm) && Number.isFinite(dd))
        ? `${yy}-${pad2(mm)}-${pad2(dd)} ${pad2(has)}:${pad2(min)}:${pad2(Math.round(sec||0))}`
        : '—';
      if(Number.isFinite(yy) && Number.isFinite(mm) && Number.isFinite(dd)){
        const dt = new Date(yy, (mm||1)-1, dd||1, has||0, min||0, sec||0);
        if(!isNaN(dt)) XCMEEventTimes.push(dt);
      }
      const has2 = parseFloat(d[15])||0;
      const min2 = parseFloat(d[16])||0;

      const coorYm = parseFloat(d[9])||0;
      const coorY  = parseFloat(d[10])||0;
      const coorXm = parseFloat(d[11])||0;
      const coorX  = parseFloat(d[12])||0;

      const IXX = parseFloat(d[13])||0;
      const IX  = parseFloat(d[14])||0;
      const I   = IX*IXX;

      const Time1 = has*60 + min + sec/60;
      const Time2 = has2*60 + min2;
      const delta = Time1 - Time2;

      DelayMinutes.push(delta);
      Intensity.push(I);

      // scatter for delay chart (кешігу)
      delayPoints.push({ x:I, y:delta, date: dateStr });

      const X = -(coorXm*coorX); // Батыс = −X, Шығыс = +X
      const Y = (coorYm*coorY);
      regionX.push(X);
      regionY.push(Y);

      // scatter for solar surface chart (күн беті картасы)
      regionPoints.push({ x:X, y:Y, delay: delta, I: I, date: dateStr });
      const absX=Math.abs(X), absY=Math.abs(Y);
      regionMaxAbs = Math.max(regionMaxAbs, absX, absY);
      const centerThreshold=10;

      if(absX<=centerThreshold && absY<=centerThreshold) regionCounts.center++;
      else if(absY>=absX){
        if(Y>0) regionCounts.north++;
        else if(Y<0) regionCounts.south++;
      } else {
        if(X>0) regionCounts.east++;
        else if(X<0) regionCounts.west++;
      }
    }
  }

  // =====================================================
  // 4) Summary
  // =====================================================
  function updateAnimationSummary(){
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML="";

    if(Mass.length>0){
      const iM = Mass.indexOf(maxM);
      const iE = KE.indexOf(maxKE);
      const iV = Speed.indexOf(maxV);

      const p1=document.createElement("p");
      p1.innerHTML = `<span class="pill-highlight">Max Mass</span> = ${maxM.toExponential(3)} г (T ≈ ${Date_god[iM].toFixed(2)} жыл)`;
      const p2=document.createElement("p");
      p2.innerHTML = `<span class="pill-highlight">Max E<sub>kin</sub></span> = ${maxKE.toExponential(3)} эрг (T ≈ ${Date_god[iE].toFixed(2)} жыл)`;
      const p3=document.createElement("p");
      p3.innerHTML = `<span class="pill-highlight">Max V</span> = ${maxV.toFixed(1)} км/с (T ≈ ${Date_god[iV].toFixed(2)} жыл)`;
      const p4=document.createElement("p");
      p4.innerHTML = `Орташа тәждік масса: <b>${meanM.toExponential(3)} г</b>`;

      resultsDiv.appendChild(p1);resultsDiv.appendChild(p2);resultsDiv.appendChild(p3);resultsDiv.appendChild(p4);
    }

    if(DelayMinutes.length>0){
      const n=DelayMinutes.length;
      const avg=DelayMinutes.reduce((a,b)=>a+b,0)/n;
      const minD=Math.min(...DelayMinutes), maxD=Math.max(...DelayMinutes);
      const pLag=document.createElement("p");
      pLag.innerHTML = `Кешігу статистикасы (X_CME): ⟨Δt⟩ ≈ <b>${avg.toFixed(1)} мин</b>, мин: ${minD.toFixed(1)} мин, макс: ${maxD.toFixed(1)} мин.`;
      resultsDiv.appendChild(pLag);
    } else {
      const pLag=document.createElement("p");
      pLag.innerHTML = `Кешігуді көру үшін X_CME.txt файлын жүкте.`;
      resultsDiv.appendChild(pLag);
    }
  }

  // =====================================================
  // 5) Sun animation
  // =====================================================
  function getSunRegion(m, ke, v){
    if(m > meanM + 2*stdM) return "Корона (CME белсенді)";
    if(ke > meanKE + 2*stdKE) return "Жарқ ету / flare аймағы";
    if(v > maxV*0.7) return "Радиациялық аймақ";
    if(m > meanM) return "Конвективті аймақ";
    return "Фотосфера";
  }

  function animateSun(){
    if(Mass.length===0) return;
    const m=Mass[idx], ke=KE[idx], v=Speed[idx];

    document.getElementById("yearShow").textContent = Date_god[idx].toFixed(2);

    const sunEl=document.getElementById("sun");
    const coronaEl=document.getElementById("corona");
    const flareEl=document.getElementById("flare");

    const scale=(m/maxM)*0.8+0.4;
    sunEl.style.transform=`scale(${scale})`;
    coronaEl.style.transform=`scale(${1+scale*0.42})`;

    const flareAlpha=Math.min(1,(ke/maxKE)*1.1);
    flareEl.style.background = `radial-gradient(circle, rgba(248,113,113,${flareAlpha}), transparent 70%)`;

    const hue=(v/maxV)*120;
    sunEl.style.filter=`hue-rotate(${hue}deg)`;

    document.getElementById("regionText").textContent = getSunRegion(m,ke,v);

    idx=(idx+1)%Mass.length;
  }

  function play(){ if(!playing){ timer=setInterval(animateSun, 90); playing=true; } }
  function pause(){ clearInterval(timer); playing=false; }
  function resetAnim(){
    idx=0; pause();
    document.getElementById("yearShow").textContent="–";
    document.getElementById("regionText").textContent="—";
    document.getElementById("sun").style.transform="scale(1)";
    document.getElementById("corona").style.transform="scale(1)";
    document.getElementById("flare").style.background="radial-gradient(circle, rgba(248,113,113,0.0), transparent 70%)";
  }

  // =====================================================
  // 6) Charts
  // =====================================================
  function destroyIfExists(ch){ if(ch && typeof ch.destroy==="function") ch.destroy(); }


  // --- Chart visual plugins: Solar disk + flare hotspots ---
  function _seededRand(seed){
    let t = (seed|0) % 2147483647;
    if(t<=0) t += 2147483646;
    return ()=> (t = (t * 16807) % 2147483647) / 2147483647;
  }
  function _drawFlare(ctx, x, y, size, alpha=1){
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x,y);

    // glow core
    ctx.shadowColor = "rgba(255,191,0,.95)";
    ctx.shadowBlur = size * 3.4;
    const g = ctx.createRadialGradient(0,0,0,0,0,size*1.9);
    g.addColorStop(0,   "rgba(255,255,255,0.95)");
    g.addColorStop(0.22,"rgba(255,220,120,0.90)");
    g.addColorStop(0.45,"rgba(255,191,0,0.80)");
    g.addColorStop(0.72,"rgba(249,115,22,0.35)");
    g.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0,0,size*1.9,0,Math.PI*2);
    ctx.fill();

    // rays
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,220,120,0.55)";
    ctx.lineWidth = Math.max(1, size*0.22);
    const rays = 7;
    const len = size * 3.0;
    for(let i=0;i<rays;i++){
      const a = (i/rays) * Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*size*1.2, Math.sin(a)*size*1.2);
      ctx.lineTo(Math.cos(a)*len,      Math.sin(a)*len);
      ctx.stroke();
    }

    ctx.restore();
  }

  const solarDiskPlugin = {
    id: 'solarDisk',
    beforeDraw(chart, args, opts){
      if(opts && opts.enabled===false) return;
      const area = chart.chartArea;
      if(!area) return;
      const {ctx} = chart;
      const w = area.right - area.left;
      const h = area.bottom - area.top;
      const cx = (area.left + area.right)/2;
      const cy = (area.top + area.bottom)/2;
      // Sun background a bit larger (график өлшемі өзгермейді)
      const r  = Math.min(w,h) * 0.58;

      ctx.save();
      ctx.beginPath();
      ctx.rect(area.left, area.top, w, h);
      ctx.clip();

      // subtle dark base
      ctx.fillStyle = 'rgba(2,6,23,0.14)';
      ctx.fillRect(area.left, area.top, w, h);

      // sun disk
      const g = ctx.createRadialGradient(cx - r*0.22, cy - r*0.18, r*0.10, cx, cy, r*1.05);
      g.addColorStop(0.00, 'rgba(255,245,220,0.88)');
      g.addColorStop(0.28, 'rgba(255,191,0,0.55)');
      g.addColorStop(0.55, 'rgba(249,115,22,0.22)');
      g.addColorStop(0.78, 'rgba(255,191,0,0.08)');
      g.addColorStop(1.00, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.fill();

      // texture (deterministic)
      const n = (chart.data?.datasets?.[0]?.data?.length || 0);
      const rand = _seededRand(n + 1337);
      ctx.globalAlpha = 0.32;
      for(let i=0;i<180;i++){
        const a = rand()*Math.PI*2;
        const rr = Math.sqrt(rand()) * r * 0.98;
        const x = cx + Math.cos(a)*rr;
        const y = cy + Math.sin(a)*rr;
        const s = rand()*1.6 + 0.2;
        ctx.fillStyle = (rand()>0.55) ? 'rgba(255,255,255,0.22)' : 'rgba(255,200,80,0.18)';
        ctx.beginPath();
        ctx.arc(x,y,s,0,Math.PI*2);
        ctx.fill();
      }

      ctx.restore();
    }
  };

  const hotspotFlaresPlugin = {
    id: 'hotspotFlares',
    afterDatasetsDraw(chart, args, opts){
      if(opts && opts.enabled===false) return;
      const ds = chart.data?.datasets?.[0];
      const pts = ds?.data || [];
      if(pts.length < 30) return;

      const xS = chart.scales.x;
      const yS = chart.scales.y;
      if(!xS || !yS) return;

      const xMin = xS.min, xMax = xS.max;
      const yMin = yS.min, yMax = yS.max;
      const bins = 14;
      const counts = new Array(bins*bins).fill(0);

      for(const p of pts){
        const x = (p.x ?? 0), y = (p.y ?? 0);
        const bx = Math.min(bins-1, Math.max(0, Math.floor((x - xMin)/(xMax-xMin) * bins)));
        const by = Math.min(bins-1, Math.max(0, Math.floor((y - yMin)/(yMax-yMin) * bins)));
        counts[by*bins + bx]++;
      }

      const idxs = counts.map((c,i)=>({c,i})).filter(o=>o.c>0).sort((a,b)=>b.c-a.c).slice(0,10);
      if(idxs.length===0) return;

      const {ctx} = chart;
      for(const {c,i} of idxs){
        const bx = i % bins;
        const by = Math.floor(i / bins);
        const vx = xMin + (bx + 0.5)/bins * (xMax-xMin);
        const vy = yMin + (by + 0.5)/bins * (yMax-yMin);
        const px = xS.getPixelForValue(vx);
        const py = yS.getPixelForValue(vy);
        const size = Math.min(14, 6 + Math.log(c+1)*2.2);
        _drawFlare(ctx, px, py, size, 0.88);
      }
    }
  };

  const delayFlaresPlugin = {
    id: 'delayFlares',
    afterDatasetsDraw(chart, args, opts){
      if(opts && opts.enabled===false) return;
      const ds = chart.data?.datasets?.[0];
      const pts = ds?.data || [];
      if(pts.length < 10) return;
      const xS = chart.scales.x;
      const yS = chart.scales.y;
      if(!xS || !yS) return;

      // top points by delay (y)
      const top = pts
        .map((p,i)=>({p,i,score: (p.y ?? 0)}))
        .sort((a,b)=>b.score-a.score)
        .slice(0,12);

      const {ctx} = chart;
      for(const t of top){
        const px = xS.getPixelForValue(t.p.x ?? 0);
        const py = yS.getPixelForValue(t.p.y ?? 0);
        _drawFlare(ctx, px, py, 7.5, 0.85);
      }
    }
  };

  function plotCoreCharts(){
    destroyIfExists(massChart); destroyIfExists(keChart); destroyIfExists(speedChart); destroyIfExists(devChart);

    massChart = createChart(document.getElementById("chartMass"), {
      type:"line",
      data:{ labels: Date_god, datasets:[{label:"M(t)", data:Mass, borderWidth:1.4, pointRadius:0}] },
      options:{ plugins:{legend:{display:false}}, scales:{ x:{title:{display:true,text:"T, жыл"}}, y:{title:{display:true,text:"M, г"}} } }
    });

    keChart = createChart(document.getElementById("chartKE"), {
      type:"line",
      data:{ labels: Date_god, datasets:[{label:"E_kin(t)", data:KE, borderWidth:1.4, pointRadius:0}] },
      options:{ plugins:{legend:{display:false}}, scales:{ x:{title:{display:true,text:"T, жыл"}}, y:{title:{display:true,text:"E_kin, эрг"}} } }
    });

    speedChart = createChart(document.getElementById("chartSpeed"), {
      type:"line",
      data:{ labels: Date_god, datasets:[{label:"V(t)", data:Speed, borderWidth:1.4, pointRadius:0}] },
      options:{ plugins:{legend:{display:false}}, scales:{ x:{title:{display:true,text:"T, жыл"}}, y:{title:{display:true,text:"V, км/с"}} } }
    });

    devChart = createChart(document.getElementById("chartMassDev"), {
      type:"line",
      data:{ labels: Date_god, datasets:[{label:"M-⟨M⟩", data:MassDev, borderWidth:1.2, pointRadius:0}] },
      options:{ plugins:{legend:{display:false}}, scales:{ x:{title:{display:true,text:"T, жыл"}}, y:{title:{display:true,text:"ΔM, г"}} } }
    });
  }

  function plotDelayAndRegionCharts(){
    destroyIfExists(corrChart); destroyIfExists(forecastChart);

    if(DelayMinutes.length>0 && Intensity.length>0){
      // keep only blue points (no flare overlays)
      const pts = (delayPoints && delayPoints.length)
        ? delayPoints
        : Intensity.map((I,i)=>({x:I,y:DelayMinutes[i]}));
      corrChart = createChart(document.getElementById("chartCorr"), {
        type:"scatter",
        data:{ datasets:[{
          label:"Δt vs I",
          data:pts,
          pointRadius:2,
          pointHoverRadius:4,
          pointBackgroundColor:"rgba(56,189,248,.95)",
          pointBorderColor:"rgba(56,189,248,.35)",
          pointBorderWidth:1
        }] },
        options:{ plugins:{
            legend:{display:false},
            tooltip:{
              callbacks:{
                label(ctx){
                  const r = ctx.raw || {};
                  const x = (r.x ?? ctx.parsed.x);
                  const y = (r.y ?? ctx.parsed.y);
                  const date = r.date ? ` | ${r.date}` : '';
                  const xText = (typeof x === 'number' && isFinite(x)) ? x.toExponential(3) : String(x);
                  const yText = (typeof y === 'number' && isFinite(y)) ? y.toFixed(1) : String(y);
                  return `I=${xText}, Δt=${yText} мин${date}`;
                }
              }
            }
          },
          scales:{
            x:{title:{display:true,text:"I (шартты бірлік)"}, type:"linear"},
            y:{title:{display:true,text:"Кешігу Δt, минут"}}
          }
        }
      });
    }

    if(regionCounts && (regionPoints.length>0 || regionX.length>0)){
      const pts = (regionPoints && regionPoints.length)
        ? regionPoints
        : regionX.map((x,i)=>({x:x, y:regionY[i]}));
      const bound = Math.max(20, Math.ceil((regionMaxAbs||100)/10)*10);
      forecastChart = createChart(document.getElementById("chartForecast"), {
        type:"scatter",
        // keep only blue points (no flare overlays)
        plugins:[solarDiskPlugin],
        data:{ datasets:[{
          label:"X_CME нүктелері",
          data:pts,
          pointRadius:1.6,
          pointHoverRadius:4,
          pointBackgroundColor:"rgba(56,189,248,.92)",
          pointBorderColor:"rgba(56,189,248,.22)",
          pointBorderWidth:1
        }] },
        options:{
          plugins:{
            legend:{display:false},
            tooltip:{
              callbacks:{
                label(ctx){
                  const r = ctx.raw || {};
                  const x = (r.x ?? ctx.parsed.x);
                  const y = (r.y ?? ctx.parsed.y);
                  const d = (typeof r.delay === 'number') ? ` | Δt=${r.delay.toFixed(1)} мин` : '';
                  const I = (typeof r.I === 'number') ? ` | I=${r.I.toExponential(2)}` : '';
                  const date = r.date ? ` | ${r.date}` : '';
                  const xText = (typeof x === 'number' && isFinite(x)) ? x.toFixed(1) : String(x);
                  const yText = (typeof y === 'number' && isFinite(y)) ? y.toFixed(1) : String(y);
                  return `X=${xText}, Y=${yText}${d}${I}${date}`;
                }
              }
            }
          },
          scales:{
            x:{type:'linear', min:-bound, max:bound, title:{display:true,text:'X: Батыс (−)  ↔  Шығыс (+)'}},
            y:{type:'linear', min:-bound, max:bound, title:{display:true,text:'Y: Оңтүстік (−)  ↔  Солтүстік (+)'}}
          }
        }
      });
    }
  }

  // =====================================================
  // 7) Region summary
  // =====================================================
  function updateRegionSummary(){
    const div=document.getElementById("spikeSummary");
    if(!div) return;
    if(!regionCounts){
      div.textContent="Деректер жүктелген соң бұл жерде кешігу мен Күн бөліктері бойынша қорытынды шығады.";
      return;
    }
    const entries=[
      {key:"north",label:"Солтүстік жартышар"},
      {key:"south",label:"Оңтүстік жартышар"},
      {key:"east",label:"Шығыс бөлігі"},
      {key:"west",label:"Батыс бөлігі"},
      {key:"center",label:"Орта/дискі центрі"},
    ];
    let maxLabel=entries[0].label, maxVal=regionCounts[entries[0].key];
    let total=0;
    for(const e of entries){
      const v=regionCounts[e.key]; total+=v;
      if(v>maxVal){maxVal=v; maxLabel=e.label;}
    }
    div.innerHTML = `
      <p><b>X_CME оқиғаларының Күн беті бойынша бөлінуі (картада: Батыс −X, Шығыс +X):</b></p>
      <p>Жалпы оқиға саны: <b>${total}</b></p>
      <ul style="margin:6px 0 6px 18px;padding:0;">
        <li>Солтүстік: ${regionCounts.north}</li>
        <li>Оңтүстік: ${regionCounts.south}</li>
        <li>Шығыс: ${regionCounts.east}</li>
        <li>Батыс: ${regionCounts.west}</li>
        <li>Орталық: ${regionCounts.center}</li>
      </ul>
      <p>Ең белсенді аймақ: <b>${maxLabel}</b>.</p>
      <p class="tiny">Бұл бөліну — қарапайым эвристика (оқу үшін).</p>
    `;
  }

  // =====================================================
  // 8) Calculator
  // =====================================================
  function calcMass(){
    const E=parseFloat(document.getElementById("calcE").value);
    const v_km=parseFloat(document.getElementById("calcV").value);
    const out=document.getElementById("calcResult");
    if(isNaN(E)||isNaN(v_km)||v_km===0){
      out.textContent="Алдымен E және v мәндерін дұрыс енгіз.";
      return;
    }
    const v_cms=v_km*1e5;
    const m=2*E/(v_cms*v_cms);
    out.innerHTML = `Есептелген тәждік масса: <b>${m.toExponential(3)} г</b>.`;
    updateForecastText();
  }

  // =====================================================
  // 9) AI Forecast (from loaded data) + Solar AI Q&A
  // =====================================================
  function updateForecastText(){
    const metricsRow=document.getElementById("aiMetricsRow");
    const modeChip=document.getElementById("aiModeChip");
    if(metricsRow) metricsRow.innerHTML="";

    if(Mass.length===0){
      if(modeChip) modeChip.textContent="mode: manual";
      return;
    }
    if(modeChip) modeChip.textContent="mode: dataset+QA";

    // avg delay
    let avgDelay=null;
    if(DelayMinutes.length>0) avgDelay = DelayMinutes.reduce((a,b)=>a+b,0)/DelayMinutes.length;

    // top region
    let topRegion="белгісіз";
    if(regionCounts){
      const map=[["north","солтүстік"],["south","оңтүстік"],["east","шығыс"],["west","батыс"],["center","орталық"]];
      let best=map[0][1], bestVal=regionCounts[map[0][0]];
      for(const [k,lab] of map){
        const v=regionCounts[k];
        if(v>bestVal){bestVal=v; best=lab;}
      }
      topRegion=best;
    }

    const massStr=meanM ? meanM.toExponential(3) : "—";
    const keStr=meanKE ? meanKE.toExponential(3) : "—";

    const addMetric=(html)=>{
      if(!metricsRow) return;
      const d=document.createElement("div");
      d.className="ai-metric";
      d.innerHTML=html;
      metricsRow.appendChild(d);
    };
    addMetric(`⭑ ⟨M⟩: <b>${massStr} г</b>`);
    addMetric(`⚡ ⟨E<sub>kin</sub>⟩: <b>${keStr} эрг</b>`);
    if(avgDelay!==null) addMetric(`⏱ ⟨Δt⟩: <b>${avgDelay.toFixed(1)} мин</b>`);
    if(regionCounts) addMetric(`☀ Белсенді аймақ: <b>${topRegion}</b>`);

    // push one summary message to chat (only once per load)
    if(window.__aiDatasetPushed) return;
    window.__aiDatasetPushed = true;

    let txt = `Деректер бойынша орташа тәждік масса ≈ <b>${massStr} г</b>, орташа энергия ≈ <b>${keStr} эрг</b>.`;
    if(avgDelay!==null){
      txt += `<br>Жарқ ету → CME арасындағы орташа кешігу ≈ <b>${avgDelay.toFixed(1)} минут</b>.`;
    } else {
      txt += `<br>Кешігу (Δt) қорытындысы үшін X_CME файлын қосымша жүкте.`;
    }
    if(regionCounts){
      txt += `<br>Белсенділік жиі байқалатын сектор: <b>${topRegion}</b>.`;
    }
    txt += `<br><span class="tiny">Ескерту: бұл — оқу үшін жасалған қарапайым статистикалық қорытынды.</span>`;
    addChat("assistant", txt);
  }

// =====================================================
// 10) Геолокация + "Келесі вспышка" таймері (sunrise-based)
// =====================================================
let currentLoc = null;

const sunriseStatus = document.getElementById("sunriseStatus");
const sunriseStatusText = document.getElementById("sunriseStatusText");
const sunriseDot = document.getElementById("sunriseDot");
const sunriseCountdown = document.getElementById("sunriseCountdown");

function setSunriseStatus(type, text){
  if(!sunriseStatus) return;
  sunriseStatus.classList.remove("ready","loading","error");
  if(type) sunriseStatus.classList.add(type);
  if(sunriseStatusText) sunriseStatusText.textContent = text;
  if(sunriseDot) sunriseDot.className = "dot " + (type==="ready" ? "ok" : type==="loading" ? "warn" : type==="error" ? "" : "warn");
}

const _rad = Math.PI/180;
const _dayMs = 86400000;

function _toJulian(date){ return date.valueOf()/_dayMs - 0.5 + 2440588; }
function _fromJulian(j){ return new Date((j + 0.5 - 2440588) * _dayMs); }
function _toDays(date){ return _toJulian(date) - 2451545; }
function _solarMeanAnomaly(d){ return _rad*(357.5291 + 0.98560028*d); }
function _eclipticLongitude(M){
  const C = _rad*(1.9148*Math.sin(M) + 0.02*Math.sin(2*M) + 0.0003*Math.sin(3*M));
  const P = _rad*102.9372;
  return M + C + P + Math.PI;
}
const _e = _rad*23.4397;
function _declination(L){ return Math.asin(Math.sin(L)*Math.sin(_e)); }
function _julianCycle(d, lw){ return Math.round(d - 0.0009 - lw/(2*Math.PI)); }
function _approxTransit(Ht, lw, n){ return 0.0009 + (Ht + lw)/(2*Math.PI) + n; }
function _solarTransitJ(ds, M, L){ return 2451545 + ds + 0.0053*Math.sin(M) - 0.0069*Math.sin(2*L); }
function _hourAngle(h, phi, d){ return Math.acos((Math.sin(h) - Math.sin(phi)*Math.sin(d))/(Math.cos(phi)*Math.cos(d))); }
function _getSetJ(h, lw, phi, dec, n, M, L){
  const w = _hourAngle(h, phi, dec);
  const a = _approxTransit(w, lw, n);
  return _solarTransitJ(a, M, L);
}

function getSunTimes(dateAtLocalMidnight, lat, lon){
  // Sunrise/sunset for given local date (midnight). Accurate enough for UI countdown.
  const lw = _rad * -lon;
  const phi = _rad * lat;

  const d = _toDays(dateAtLocalMidnight);
  const n = _julianCycle(d, lw);
  const ds = _approxTransit(0, lw, n);
  const M = _solarMeanAnomaly(ds);
  const L = _eclipticLongitude(M);
  const dec = _declination(L);

  const Jnoon = _solarTransitJ(ds, M, L);
  const h0 = _rad * -0.833; // sunrise altitude (refraction + sun radius)
  const Jset = _getSetJ(h0, lw, phi, dec, n, M, L);
  const Jrise = Jnoon - (Jset - Jnoon);

  return { sunrise: _fromJulian(Jrise), sunset: _fromJulian(Jset), solarNoon: _fromJulian(Jnoon) };
}

function _fmt2(n){ return String(n).padStart(2,"0"); }
function computeNextFlare(){
  if(!Array.isArray(XCMEEventTimes) || XCMEEventTimes.length < 2) return null;
  const times = XCMEEventTimes
    .filter(d=>d instanceof Date && !isNaN(d))
    .sort((a,b)=>a-b);
  const recent = times.slice(-80);
  if(recent.length < 2) return null;
  const deltas = [];
  for(let i=1;i<recent.length;i++){
    const dt = recent[i].getTime() - recent[i-1].getTime();
    if(Number.isFinite(dt) && dt > 0) deltas.push(dt);
  }
  if(deltas.length === 0) return null;
  deltas.sort((a,b)=>a-b);
  const median = deltas[Math.floor(deltas.length/2)];
  if(!Number.isFinite(median) || median <= 0) return null;
  const now = new Date();
  let next = new Date(recent[recent.length-1].getTime() + median);
  let guard = 0;
  while(next.getTime() < now.getTime() && guard < 20000){
    next = new Date(next.getTime() + median);
    guard++;
  }
  return {next, median_ms: median};
}

function _formatCountdownParts(ms){
  const s = Math.max(0, Math.floor(ms/1000));
  const days = Math.floor(s/86400);
  const rem = s%86400;
  const hh = Math.floor(rem/3600);
  const mm = Math.floor((rem%3600)/60);
  const ss = rem%60;
  return {days, hms: `${_fmt2(hh)}:${_fmt2(mm)}:${_fmt2(ss)}`};
}


function tickSunrise(){
  if(!sunriseCountdown) return;

  const now = new Date();
  // Prefer X_CME-based prediction
  if(!window.__nextFlare || !(window.__nextFlare.next instanceof Date)){
    window.__nextFlare = computeNextFlare();
  }

  const pred = window.__nextFlare;
  if(pred && pred.next){
    const diff = pred.next.getTime() - now.getTime();
    const parts = _formatCountdownParts(diff);
    const dEl = document.getElementById("sunDays");
    const tEl = document.getElementById("sunHMS");
    if(dEl) dEl.textContent = String(parts.days);
    if(tEl) tEl.textContent = parts.hms;
    if(!dEl || !tEl) sunriseCountdown.textContent = `${parts.days} күн ${parts.hms}`;
    setSunriseStatus("ready", `Болжам (X_CME): ${pred.next.toLocaleString()}`);
    return;
  }

  // Fallback: sunrise (егер X_CME болмаса)
  if(!currentLoc) return;
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let t = getSunTimes(today0, currentLoc.lat, currentLoc.lon).sunrise;
  if(t <= now){
    const tomorrow0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1);
    t = getSunTimes(tomorrow0, currentLoc.lat, currentLoc.lon).sunrise;
  }
  const diff = t.getTime() - now.getTime();
  const parts = _formatCountdownParts(diff);
  const dEl = document.getElementById("sunDays");
  const tEl = document.getElementById("sunHMS");
  if(dEl) dEl.textContent = String(parts.days);
  if(tEl) tEl.textContent = parts.hms;
  if(!dEl || !tEl) sunriseCountdown.textContent = `${parts.days} күн ${parts.hms}`;
  setSunriseStatus("ready", "Локация дайын");
}


function applyLocation(lat, lon, label){
  currentLoc = {lat, lon, label: label || null};
  const locLabelEl = document.getElementById("locLabel");
  const latlonEl = document.getElementById("latlonLabel");
  if(locLabelEl) locLabelEl.textContent = `Локация: ${label || "custom"}`;
  if(latlonEl) latlonEl.textContent = `lat=${lat.toFixed(4)}, lon=${lon.toFixed(4)}`;
  tickSunrise();
}

function geoBlockedReason(){
  if(!window.isSecureContext){
    return "Геолокация тек HTTPS немесе localhost-та жұмыс істейді. Кеңес: VS Code → Live Server арқылы аш.";
  }
  return null;
}

function requestGeolocation(onSuccess, ui="sunrise"){
  const setUI = (type, text)=>{
    if(ui==="planner") setPlannerStatus(type, text);
    else if(ui==="none") return;
    else setSunriseStatus(type, text);
  };

  const reason = geoBlockedReason();
  if(reason){
    setUI("error","HTTPS/localhost керек");
    alert(reason);
    return;
  }
  if(!navigator.geolocation){
    setUI("error","Geolocation жоқ");
    alert("Браузер геолокацияны қолдамайды.");
    return;
  }

  setUI("loading","Геолокация анықталуда…");
  const opts = {enableHighAccuracy:false, timeout:8000, maximumAge:10*60*1000};

  navigator.geolocation.getCurrentPosition((pos)=>{
    onSuccess(pos.coords.latitude, pos.coords.longitude);
  }, (err)=>{
    let msg = "Рұқсат жоқ/қате";
    if(err && err.code===1) msg="Рұқсат берілмеді (Location: Block)";
    if(err && err.code===2) msg="Локация қолжетімсіз";
    if(err && err.code===3) msg="Таймаут (қайта бас)";
    setUI("error", msg);
    alert(`${msg}. Егер браузер сұраса — Allow таңда немесе қолмен координат енгіз.`);
  }, opts);
}


document.getElementById("btnUseGeo")?.addEventListener("click", ()=>{
  requestGeolocation((lat, lon)=> applyLocation(lat, lon, "My location"), "sunrise");
});

const manualLoc = document.getElementById("manualLoc");
document.getElementById("btnManual")?.addEventListener("click", ()=>{
  if(!manualLoc) return;
  manualLoc.style.display = manualLoc.style.display==="none" ? "block" : "none";
});
document.getElementById("btnApplyManual")?.addEventListener("click", ()=>{
  const lat=parseFloat(document.getElementById("latIn")?.value);
  const lon=parseFloat(document.getElementById("lonIn")?.value);
  if(!isFinite(lat)||!isFinite(lon)){
    alert("lat/lon дұрыс енгіз.");
    return;
  }
  applyLocation(lat, lon, "Manual lat/lon");
});

// Таймер әр секунд сайын жаңарады
setSunriseStatus("loading","X_CME дерегі күтілуде…");
setInterval(()=>{ try{ tickSunrise(); } catch(e){} }, 1000);

// Әдепкі локация (Алматы) — геолокация істемесе де UI жұмыс істейді
applyLocation(43.2389, 76.8897, "Almaty");

  // =====================================================
  // 14) Reset
  // =====================================================
  function resetAll(){
    pause(); resetAnim();
    Date_god=[];Mass=[];KE=[];Speed=[];MassDev=[];
    SMEEventTimes=[]; XCMEEventTimes=[];
    maxM=0;maxKE=0;maxV=0;meanM=0;meanKE=0;stdM=0;stdKE=0;
    DelayMinutes=[];Intensity=[];regionCounts=null;regionX=[];regionY=[];
    destroyIfExists(massChart); destroyIfExists(keChart); destroyIfExists(speedChart); destroyIfExists(devChart);
    destroyIfExists(corrChart); destroyIfExists(forecastChart);
    destroyIfExists(chartForecast10); destroyIfExists(chartForecast10KE);
    destroyIfExists(chartForecast30); destroyIfExists(chartForecast30KE);
    document.getElementById("results").innerHTML="";
    document.getElementById("spikeSummary").textContent="Деректер жүктелген соң бұл жерде кешігу мен Күн бөліктері бойынша қорытынды шығады.";
    document.getElementById("calcResult").textContent="Нәтиже мұнда шығады.";
    document.getElementById("forecastNote").textContent="Дерек жүктелмеген. Алдымен SME TXT файлын жүкте.";
    const ln=document.getElementById("forecastLongNote");
    if(ln) ln.textContent="Дерек жүктелмеген. Алдымен SME TXT файлын жүкте.";
    const metricsRow=document.getElementById("aiMetricsRow");
    if(metricsRow) metricsRow.innerHTML="";
    const modeChip=document.getElementById("aiModeChip");
    if(modeChip) modeChip.textContent="mode: manual";
    const chatBody=document.getElementById("aiChatBody");
    if(chatBody) chatBody.innerHTML="";
    window.__aiDatasetPushed=false;
    if(typeof addChat==="function"){
      addChat("assistant","Сәлем! TXT деректерін жүктесең, мен графиктермен бірге қысқа қорытынды шығарып берем. Сұрағыңды жаза бер.");
    }
    setStatus("idle","Файлдар таңдалмады");
  }


  // =====================================================
  // 12) Built-in TXT loader (data folder)
  // =====================================================
  async function loadBuiltIn(){
    try{
      setStatus("loading","Дайын TXT жүктелуде...");
      let smeText = '';
      let xcmeText = '';
      const smeEl = document.getElementById('builtInSME');
      const xcEl = document.getElementById('builtInXCME');
      if(smeEl && xcEl){
        smeText = (smeEl.value || smeEl.textContent || '').trim();
        xcmeText = (xcEl.value || xcEl.textContent || '').trim();
      }
      if(!smeText || smeText.length < 1000){
        [smeText, xcmeText] = await Promise.all([
          fetch('data/SME_1996-01-01_2024-03-31-data.txt').then(r=>r.text()),
          fetch('data/X_CME.txt').then(r=>r.text()),
        ]);
      }

      // parse SME (same logic as loadData)
      const lines = smeText.split(/\r?\n/).filter(l=>l.trim()!=="" );
      Date_god=[]; Mass=[]; KE=[]; Speed=[]; MassDev=[]; SMEEventTimes=[];
      for(const L of lines){
        const d = L.trim().split(/\s+/);
        if(d.length < 15) continue;
        const god=+d[0], mes=+d[1], den=+d[2], has=+d[3], min=+d[4], sec=+d[5];
        const T = has + min/60 + sec/3600;
        const dateYear = god + mes/12 + den/365 + T/(24*365);
        const speed=+d[8];
        const mass=+d[13];
        const ke=+d[14];
        Date_god.push(dateYear);
        Speed.push(speed);
        Mass.push(mass);
        KE.push(ke);
        try{
          const dt = new Date(god, (mes||1)-1, den||1, has||0, min||0, sec||0);
          if(!isNaN(dt)) SMEEventTimes.push(dt);
        }catch(e){}
      }

      if(Mass.length===0){
        setStatus("error","SME дерегі табылмады");
        alert("SME файл форматы күткенге сай емес (бағандар жетіспейді).");
        return;
      }

      maxM = Math.max(...Mass);
      maxKE = Math.max(...KE);
      maxV = Math.max(...Speed);

      meanM = Mass.reduce((a,b)=>a+b,0)/Mass.length;
      meanKE = KE.reduce((a,b)=>a+b,0)/KE.length;

      stdM = Math.sqrt(Mass.reduce((s,v)=>s+(v-meanM)**2,0)/Mass.length);
      stdKE = Math.sqrt(KE.reduce((s,v)=>s+(v-meanKE)**2,0)/KE.length);

      MassDev = Mass.map(v=>v-meanM);

      // Parse X_CME
      parseXCMEText(xcmeText);
      window.__nextFlare = computeNextFlare();

      plotAll();
      plotDelayAndRegionCharts();
      updateRegionSummary();
      updateAnimationSummary();
      window.__aiDatasetPushed=false; // allow new summary push
      updateForecastText();
      build10YearForecast();

      setStatus("ready","Дайын деректер жүктелді ✅");
    }catch(err){
      console.error(err);
      setStatus("error","Дайын TXT ашылмады");
      alert("Дайын TXT файлдарын ашу мүмкін болмады. Кеңес: VS Code Live Server арқылы ашып көр.");
    }
  }
  window.loadBuiltIn = loadBuiltIn;

  // =====================================================
  // 13) Manual add (SME + X_CME)
  // =====================================================
  const manualBtn = document.getElementById("btnToggleManual");
  const manualWrap = document.getElementById("manualWrap");
  manualBtn?.addEventListener("click", ()=>{
    const show = manualWrap.style.display==="none";
    manualWrap.style.display = show ? "block" : "none";
  });

  function numVal(id){
    const v = Number(document.getElementById(id)?.value);
    return Number.isFinite(v) ? v : null;
  }

  document.getElementById("btnAddSME")?.addEventListener("click", ()=>{
    const y=numVal("mYear"), mo=numVal("mMon"), d=numVal("mDay"), h=numVal("mHour"), mi=numVal("mMin"), s=numVal("mSec");
    const sp=numVal("mSpeed"), m=numVal("mMass"), ke=numVal("mKE");
    if([y,mo,d,h,mi,s,sp,m,ke].some(v=>v===null)){
      alert("SME үшін барлық өрісті толтыр.");
      return;
    }
    const T = h + mi/60 + s/3600;
    const dateYear = y + mo/12 + d/365 + T/(24*365);

    Date_god.push(dateYear);
    Speed.push(sp);
    Mass.push(m);
    KE.push(ke);

    maxM = Math.max(maxM, m);
    maxKE = Math.max(maxKE, ke);
    maxV = Math.max(maxV, sp);

    meanM = Mass.reduce((a,b)=>a+b,0)/Mass.length;
    meanKE = KE.reduce((a,b)=>a+b,0)/KE.length;
    stdM = Math.sqrt(Mass.reduce((s2,v)=>s2+(v-meanM)**2,0)/Mass.length);
    stdKE = Math.sqrt(KE.reduce((s2,v)=>s2+(v-meanKE)**2,0)/KE.length);
    MassDev = Mass.map(v=>v-meanM);

    plotAll();
    window.__aiDatasetPushed=false;
    updateForecastText();
    build10YearForecast();
    setStatus("ready","SME жолы қосылды ✅");
  });

  document.getElementById("btnAddXCME")?.addEventListener("click", ()=>{
    const h=numVal("xH"), mi=numVal("xM"), s=numVal("xS");
    const h2=numVal("xH2"), mi2=numVal("xM2");
    const ixx=numVal("xIXX"), ix=numVal("xIX");
    if([h,mi,s,h2,mi2,ixx,ix].some(v=>v===null)){
      alert("X_CME үшін барлық өрісті толтыр.");
      return;
    }
    const t1 = h*3600 + mi*60 + s;
    const t2 = h2*3600 + mi2*60;
    let dtm = (t2 - t1)/60;
    if(!isFinite(dtm)) dtm = 0;
    DelayMinutes.push(dtm);
    Intensity.push(ixx + ix);

    if(!regionCounts){
      regionCounts={north:0,south:0,east:0,west:0,center:0};
      regionX=[]; regionY=[];
    }
    // manual rows: we can't know coordinates, so count as center by default
    regionCounts.center += 1;

    plotDelayAndRegionCharts();
    updateRegionSummary();
    updateAnimationSummary();
    window.__aiDatasetPushed=false;
    updateForecastText();
    setStatus("ready","X_CME жолы қосылды ✅");
  });

  // Export current SME data as TXT (minimal columns)
  document.getElementById("btnExportTXT")?.addEventListener("click", ()=>{
    if(Mass.length===0){
      alert("Алдымен SME дерегін жүкте немесе қолмен қос.");
      return;
    }
    // produce 15 columns: [Y M D h m s 0 0 speed 0 0 0 0 mass ke]
    const lines = [];
    for(let i=0;i<Mass.length;i++){
      // dateYear back to approx Y/M/D not possible precisely; export as index
      // We'll export as: YEAR=0 ... This is just a helper; better to edit original TXT if you need full format.
      lines.push(`0 0 0 0 0 0 0 0 ${Speed[i]} 0 0 0 0 ${Mass[i]} ${KE[i]}`);
    }
    const blob = new Blob([lines.join("\n")], {type:"text/plain;charset=utf-8"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="SME_export_minimal.txt";
    a.click();
    URL.revokeObjectURL(a.href);
    const hint=document.getElementById("exportHint");
    if(hint) hint.textContent="SME_export_minimal.txt дайын";
  });



// =====================================================
// 11) Plot wrapper (кей жерлерде plotAll деп шақырылады)
// =====================================================
function plotAll(){
  plotCoreCharts();
  plotDelayAndRegionCharts();
}

// =====================================================
// 12) Болжам: Flare тәуекелі + CME қауіптілігі (2030/2035/2040)
// =====================================================
function _linReg(xs, ys){
  const n = Math.min(xs.length, ys.length);
  if(n<2) return {a:0,b:ys[0]||0}; // y = a*x + b
  let sx=0, sy=0, sxx=0, sxy=0;
  for(let i=0;i<n;i++){
    const x=xs[i], y=ys[i];
    sx+=x; sy+=y; sxx+=x*x; sxy+=x*y;
  }
  const denom = (n*sxx - sx*sx);
  const a = denom===0 ? 0 : (n*sxy - sx*sy)/denom;
  const b = (sy - a*sx)/n;
  return {a,b};
}

function build10YearForecast(){
  const note = document.getElementById('forecastNote');
  const c1 = document.getElementById('chartForecast10');
  const c2 = document.getElementById('chartForecast10KE');
  if(!c1 || !c2) return;

  // ------------------------------
  // Target end year (absolute)
  // ------------------------------
  const targetYear = Number(window.__forecastTargetYear || 2030);

  // Helpers
  const _median = (arr)=>{
    const a = (arr||[]).filter(v=>Number.isFinite(v)).slice().sort((x,y)=>x-y);
    if(a.length===0) return null;
    const m = Math.floor(a.length/2);
    return a.length%2 ? a[m] : (a[m-1]+a[m])/2;
  };

  const _solve = (A, b)=>{
    // Gaussian elimination (A: n×n, b: n)
    const n = A.length;
    const M = A.map((row,i)=> row.slice().concat([b[i]]));
    for(let col=0; col<n; col++){
      // pivot
      let piv = col;
      for(let r=col+1; r<n; r++){
        if(Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
      }
      if(Math.abs(M[piv][col]) < 1e-12) continue;
      if(piv !== col){ const tmp=M[piv]; M[piv]=M[col]; M[col]=tmp; }
      const div = M[col][col];
      for(let c=col; c<=n; c++) M[col][c] /= div;
      for(let r=0; r<n; r++){
        if(r===col) continue;
        const f = M[r][col];
        if(Math.abs(f) < 1e-12) continue;
        for(let c=col; c<=n; c++) M[r][c] -= f*M[col][c];
      }
    }
    return M.map(row=>row[n]);
  };

  const _ols = (X, y)=>{
    const n = X.length;
    const p = X[0].length;
    // XtX and Xty
    const XtX = Array.from({length:p}, ()=> Array.from({length:p}, ()=>0));
    const Xty = Array.from({length:p}, ()=>0);
    for(let i=0;i<n;i++){
      for(let j=0;j<p;j++){
        Xty[j] += X[i][j]*y[i];
        for(let k=0;k<p;k++) XtX[j][k] += X[i][j]*X[i][k];
      }
    }
    const beta = _solve(XtX, Xty);
    const yhat = X.map(r=> r.reduce((s,v,idx)=> s + v*beta[idx], 0));
    const res = y.map((v,i)=> v - yhat[i]);
    const sd = Math.sqrt(res.reduce((s,v)=> s+v*v, 0) / Math.max(1,(n-p)));
    return {beta, sd, yhat};
  };

  const _features = (year, baseYear)=>{
    const t = year - baseYear;
    const w11 = 2*Math.PI/11;
    const w22 = 2*Math.PI/22;
    return [
      1,
      t,
      Math.sin(w11*t),
      Math.cos(w11*t),
      Math.sin(w22*t),
      Math.cos(w22*t),
    ];
  };

  // ---------------------------------
  // 1) Flare risk (X_CME → annual count)
  // ---------------------------------
  const flareByYear = new Map();
  if(Array.isArray(XCMEEventTimes)){
    for(const t of XCMEEventTimes){
      if(!(t instanceof Date) || isNaN(t)) continue;
      const y = t.getFullYear();
      flareByYear.set(y, (flareByYear.get(y)||0) + 1);
    }
  }
  const flareYears = Array.from(flareByYear.keys()).sort((a,b)=>a-b);
  const flareLast = flareYears.length ? flareYears[flareYears.length-1] : null;

  // ---------------------------------
  // 2) CME hazard (SME → annual medians of log10(Ekin) and v)
  // ---------------------------------
  const keByYear = new Map();
  const vByYear  = new Map();
  if(Array.isArray(SMEEventTimes) && SMEEventTimes.length===KE.length && SMEEventTimes.length===Speed.length){
    for(let i=0;i<SMEEventTimes.length;i++){
      const t = SMEEventTimes[i];
      const ke = +KE[i];
      const v  = +Speed[i];
      if(!(t instanceof Date) || isNaN(t)) continue;
      const y = t.getFullYear();
      if(ke>0){
        if(!keByYear.has(y)) keByYear.set(y, []);
        keByYear.get(y).push(Math.log10(ke));
      }
      if(v>0){
        if(!vByYear.has(y)) vByYear.set(y, []);
        vByYear.get(y).push(v);
      }
    }
  }
  const cmeYears = Array.from(new Set([...keByYear.keys(), ...vByYear.keys()])).sort((a,b)=>a-b);
  const cmeLast = cmeYears.length ? cmeYears[cmeYears.length-1] : null;

  // ------------------------------
  // Display range (last 30y window)
  // ------------------------------
  const minDataYear = Math.min(
    flareYears.length? flareYears[0] : 9999,
    cmeYears.length? cmeYears[0] : 9999
  );
  const maxDataYear = Math.max(
    flareLast ?? -9999,
    cmeLast ?? -9999
  );
  const endYear = Math.max(targetYear, (maxDataYear>0? maxDataYear:targetYear));
  const startYear = Math.max(minDataYear<9999? minDataYear : (endYear-30), endYear-30);
  const years = [];
  for(let y=startYear; y<=endYear; y++) years.push(y);

  // ------------------------------
  // Fit flare model (log(count+1))
  // ------------------------------
  let flareModel = null;
  const flareHist = years.map(y => (flareByYear.get(y) ?? null));
  const flareF = years.map(_=>null);
  const flareLo = years.map(_=>null);
  const flareHi = years.map(_=>null);

  if(flareYears.length>=12){
    const base = flareYears[0];
    const X = [];
    const yv = [];
    for(const y of flareYears){
      const c = flareByYear.get(y) || 0;
      X.push(_features(y, base));
      yv.push(Math.log(c + 1));
    }
    flareModel = _ols(X, yv);
    const lastObs = flareLast;
    for(const y of years){
      if(lastObs!==null && y>lastObs){
        const yh = _features(y, base).reduce((s,v,i)=> s + v*flareModel.beta[i], 0);
        const mu = Math.max(0, Math.exp(yh) - 1);
        const lo = Math.max(0, Math.exp(yh - 1.96*flareModel.sd) - 1);
        const hi = Math.max(0, Math.exp(yh + 1.96*flareModel.sd) - 1);
        const idx = years.indexOf(y);
        flareF[idx] = mu;
        flareLo[idx] = lo;
        flareHi[idx] = hi;
      }
    }
  }

  // ------------------------------
  // Fit CME models (annual medians)
  // ------------------------------
  const keMed = new Map();
  const vMed  = new Map();
  for(const y of cmeYears){
    keMed.set(y, _median(keByYear.get(y) || []));
    vMed.set(y, _median(vByYear.get(y) || []));
  }

  const keHist = years.map(y => (keMed.get(y) ?? null));
  const vHist  = years.map(y => (vMed.get(y) ?? null));

  const keF = years.map(_=>null), keLo = years.map(_=>null), keHi = years.map(_=>null);
  const vF  = years.map(_=>null), vLo  = years.map(_=>null), vHi  = years.map(_=>null);

  let keModel=null, vModel=null;
  if(cmeYears.length>=12){
    const base = cmeYears[0];
    // KE
    {
      const X=[]; const yv=[];
      for(const y of cmeYears){
        const val = keMed.get(y);
        if(val===null) continue;
        X.push(_features(y, base));
        yv.push(val);
      }
      if(yv.length>=10) keModel = _ols(X,yv);
    }
    // v
    {
      const X=[]; const yv=[];
      for(const y of cmeYears){
        const val = vMed.get(y);
        if(val===null) continue;
        X.push(_features(y, base));
        yv.push(val);
      }
      if(yv.length>=10) vModel = _ols(X,yv);
    }
    const lastObs = cmeLast;
    for(const y of years){
      if(lastObs!==null && y>lastObs){
        const idx = years.indexOf(y);
        if(keModel){
          const yh = _features(y, base).reduce((s,v,i)=> s + v*keModel.beta[i], 0);
          keF[idx] = yh;
          keLo[idx] = yh - 1.96*keModel.sd;
          keHi[idx] = yh + 1.96*keModel.sd;
        }
        if(vModel){
          const yh = _features(y, base).reduce((s,val,i)=> s + val*vModel.beta[i], 0);
          vF[idx] = Math.max(0, yh);
          vLo[idx] = Math.max(0, yh - 1.96*vModel.sd);
          vHi[idx] = Math.max(0, yh + 1.96*vModel.sd);
        }
      }
    }
  }

  // Save model snapshot for AI
  window.__forecastModel = {
    years,
    startYear,
    endYear,
    targetYear,
    flare: {lastYear: flareLast, hist: flareHist, forecast: flareF, lo: flareLo, hi: flareHi},
    cme:   {lastYear: cmeLast,  keHist, keF, keLo, keHi, vHist, vF, vLo, vHi}
  };

  // ------------------------------
  // Render charts
  // ------------------------------
  destroyIfExists(chartForecast10);
  destroyIfExists(chartForecast10KE);

  // Flare chart
  const flareHas = flareF.some(v=>typeof v==='number' && isFinite(v)) || flareHist.some(v=>typeof v==='number' && isFinite(v));
  chartForecast10 = createChart(c1, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: '95% аймақ (төмен)',
          data: flareLo,
          borderColor: 'rgba(56,189,248,0)',
          pointRadius: 0,
          tension: .22
        },
        {
          label: '95% аймақ',
          data: flareHi,
          borderColor: 'rgba(56,189,248,0)',
          backgroundColor: 'rgba(56,189,248,.12)',
          fill: '-1',
          pointRadius: 0,
          tension: .22
        },
        {
          label: 'Болжам: flare/жыл',
          data: flareF,
          borderColor: 'rgba(56,189,248,.95)',
          borderWidth: 2,
          pointRadius: 0,
          tension: .22
        },
        {
          label: 'Тарихи: flare/жыл',
          data: flareHist,
          borderColor: 'rgba(148,163,184,.85)',
          borderWidth: 2,
          pointRadius: 2,
          tension: .12
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: {
        x: { grid: { display: false } },
        y: {
          title: { display: true, text: 'оқиға/жыл' },
          grid: { color: 'rgba(148,163,184,.15)' },
          suggestedMin: 0
        }
      }
    }
  });

  // CME chart (dual-axis)
  const cmeHas = (keF.some(v=>typeof v==='number' && isFinite(v)) || keHist.some(v=>typeof v==='number' && isFinite(v)))
    && (vF.some(v=>typeof v==='number' && isFinite(v)) || vHist.some(v=>typeof v==='number' && isFinite(v)));
  chartForecast10KE = createChart(c2, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        // logE band
        { label:'log10(E) 95% төмен', data: keLo,  yAxisID:'y',  borderColor:'rgba(34,197,94,0)', pointRadius:0, tension:.22 },
        { label:'log10(E) 95% аймақ', data: keHi,  yAxisID:'y',  borderColor:'rgba(34,197,94,0)', backgroundColor:'rgba(34,197,94,.10)', fill:'-1', pointRadius:0, tension:.22 },
        { label:'Болжам: log10(Ekin)', data: keF,   yAxisID:'y',  borderColor:'rgba(34,197,94,.95)', borderWidth:2, pointRadius:0, tension:.22 },
        { label:'Тарихи: log10(Ekin)', data: keHist,yAxisID:'y',  borderColor:'rgba(148,163,184,.75)', borderWidth:2, pointRadius:2, tension:.12 },

        // v band
        { label:'v 95% төмен',        data: vLo,     yAxisID:'y2', borderColor:'rgba(167,139,250,0)', pointRadius:0, tension:.22 },
        { label:'v 95% аймақ',        data: vHi,     yAxisID:'y2', borderColor:'rgba(167,139,250,0)', backgroundColor:'rgba(167,139,250,.10)', fill:'-1', pointRadius:0, tension:.22 },
        { label:'Болжам: v (км/с)',   data: vF,      yAxisID:'y2', borderColor:'rgba(167,139,250,.95)', borderWidth:2, pointRadius:0, tension:.22 },
        { label:'Тарихи: v (км/с)',   data: vHist,   yAxisID:'y2', borderColor:'rgba(148,163,184,.55)', borderWidth:2, pointRadius:2, tension:.12 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: {
        x: { grid: { display: false } },
        y: {
          title: { display: true, text: 'log10(Ekin, эрг)' },
          grid: { color: 'rgba(148,163,184,.15)' }
        },
        y2: {
          position: 'right',
          title: { display: true, text: 'v (км/с)' },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });

  // Status + note
  if(!flareHas && !cmeHas){
    setForecastStatus('loading','Дерек күтілуде…');
    if(note) note.textContent = 'Болжам үшін SME және/немесе X_CME деректерін жүкте (немесе “Дайын TXT-ті ашу”).';
    return;
  }

  setForecastStatus('ready','Болжам дайын ✅');

  const parts = [];
  if(flareHas && flareLast!==null) parts.push(`Flare: соңғы жыл ${flareLast}, көкжиек ${targetYear}`);
  if(cmeHas && cmeLast!==null) parts.push(`CME: соңғы жыл ${cmeLast}, көкжиек ${targetYear}`);
  if(note) note.textContent = parts.join(' • ') || `Болжам ${targetYear} жылға дейін жаңартылды.`;
}



function _std(arr){
  if(!arr || arr.length===0) return 0;
  const m = arr.reduce((a,b)=>a+b,0)/arr.length;
  const v = arr.reduce((s,x)=>s+(x-m)*(x-m),0)/arr.length;
  return Math.sqrt(v);
}

function buildLongForecast(yearsAhead=30){
  const note = document.getElementById("forecastLongNote");
  const c1 = document.getElementById("chartForecast30");
  const c2 = document.getElementById("chartForecast30KE");
  if(!c1 || !c2) return;

  if(!window.__annualData){
    if(note) note.textContent = "Дерек жүктелмеген. Алдымен SME TXT файлын жүкте.";
    return;
  }
  const years = window.__annualData.years;
  const avgM = window.__annualData.avgM;
  const avgKE = window.__annualData.avgKE;

  const lastYear = years[years.length-1];
  const endYear = lastYear + Math.max(20, Math.min(30, yearsAhead)); // 20..30 жыл

  const allYears = [];
  for(let y=years[0]; y<=endYear; y++) allYears.push(y);

  const regM = _linReg(years, avgM);
  const regKE = _linReg(years, avgKE);

  const ampM = _std(avgM) * 0.25;   // цикл амплитудасы (шамамен)
  const ampKE = _std(avgKE) * 0.25;
  const w = 2*Math.PI/11; // 11 жылдық Күн циклі

  // Map actual annual averages onto full range
  const actualMMap = new Map();
  const actualKEMap = new Map();
  for(let i=0;i<years.length;i++){
    actualMMap.set(years[i], avgM[i]);
    actualKEMap.set(years[i], avgKE[i]);
  }

  const histM = allYears.map(y => y<=lastYear ? (actualMMap.get(y) ?? null) : null);
  const histKE = allYears.map(y => y<=lastYear ? (actualKEMap.get(y) ?? null) : null);

  const fwdM = allYears.map(y => y>lastYear ? (regM.a*y + regM.b + ampM*Math.sin(w*(y-years[0]))) : null);
  const fwdKE = allYears.map(y => y>lastYear ? (regKE.a*y + regKE.b + ampKE*Math.sin(w*(y-years[0]))) : null);

  window.__forecastLongModel = {
    years: allYears,
    lastYear,
    endYear,
    mass: {hist: histM, forecast: fwdM},
    ke: {hist: histKE, forecast: fwdKE},
    meta: {cycleYears:11, ampM, ampKE, reg:{mass:regM, ke:regKE}}
  };

  destroyIfExists(chartForecast30);
  destroyIfExists(chartForecast30KE);

  chartForecast30 = createChart(c1, {
    type:"line",
    data:{labels:allYears, datasets:[
      {label:"Тарихи ⟨M⟩", data:histM, borderWidth:2, pointRadius:0, tension:.22},
      {label:"Болжам ⟨M⟩", data:fwdM, borderDash:[6,6], borderWidth:2, pointRadius:0, tension:.22},
    ]},
    options:{responsive:true, plugins:{legend:{display:true}},
      scales:{x:{ticks:{maxRotation:0}, grid:{display:false}}, y:{grid:{color:"rgba(148,163,184,.15)"}}}}
  });

  chartForecast30KE = createChart(c2, {
    type:"line",
    data:{labels:allYears, datasets:[
      {label:"Тарихи ⟨Ekin⟩", data:histKE, borderWidth:2, pointRadius:0, tension:.22},
      {label:"Болжам ⟨Ekin⟩", data:fwdKE, borderDash:[6,6], borderWidth:2, pointRadius:0, tension:.22},
    ]},
    options:{responsive:true, plugins:{legend:{display:true}},
      scales:{x:{ticks:{maxRotation:0}, grid:{display:false}}, y:{grid:{color:"rgba(148,163,184,.15)"}}}}
  });

  if(note){
    note.textContent = `Ұзақ болжам ${endYear} жылға дейін құрылды. (Тарихи дерек соңғы жыл: ${lastYear})`;
  }
}

// =====================================================
// 13) Solar AI chat (ChatGPT стилі)
// =====================================================
function addChat(role, html){
  const body = document.getElementById("aiChatBody");
  if(!body) return null;
  const row = document.createElement("div");
  row.className = "msg " + (role==="user" ? "user" : "assistant");
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = html;
  row.appendChild(bubble);
  body.appendChild(row);
  body.scrollTop = body.scrollHeight;
  return bubble;
}

function _safeNum(x){
  return (x===null || x===undefined || !Number.isFinite(x)) ? null : x;
}

function aiAnswer(q){
  const query = String(q||"").toLowerCase();
  if(query.length===0) return "Сұрақ жаза бер 🙂";

  if(Mass.length===0){
    if(query.includes("қалай") || query.includes("не істей") || query.includes("жүкте")){
      return `Файлдарды жүктеу үшін жоғарыдағы <b>SME TXT</b> файлын таңда да “Файлдарды өңдеу” бас.<br>Қаласаң “Дайын TXT-ті ашу” батырмасын қолдана аласың.`;
    }
    return `Қазір дерек жоқ. Алдымен SME TXT жүктесең, мен орташа мәндер, тренд және 2030 дейін болжам шығарып берем.`;
  }

  if(query.includes("орташа") || query.includes("average") || query.includes("mean")){
    const m = meanM ? meanM.toExponential(3) : "—";
    const k = meanKE ? meanKE.toExponential(3) : "—";
    let ans = `Орташа тәждік масса: <b>${m} г</b><br>Орташа энергия: <b>${k} эрг</b>`;
    if(DelayMinutes.length>0){
      const avg = DelayMinutes.reduce((a,b)=>a+b,0)/DelayMinutes.length;
      ans += `<br>Орташа кешігу: <b>${avg.toFixed(1)} минут</b>`;
    }
    return ans;
  }

  if(query.includes("болжам") || query.includes("forecast") || query.includes("2030")){
    if(!window.__forecastModel){
      build10YearForecast();
    }
    const fm = window.__forecastModel;
    if(!fm) return "Болжам үшін модель табылмады (дерек жоқ болуы мүмкін).";
    const end = fm.targetYear || fm.endYear;
    const flareLast = fm.flare?.lastYear ?? null;
    const cmeLast = fm.cme?.lastYear ?? null;
    const idx = fm.years.indexOf(end);
    const flareY = (idx>=0 && fm.flare?.forecast) ? fm.flare.forecast[idx] : null;
    const keY = (idx>=0 && fm.cme?.keF) ? fm.cme.keF[idx] : null;
    const vY  = (idx>=0 && fm.cme?.vF)  ? fm.cme.vF[idx]  : null;

    let ans = `Болжам көкжиегі: <b>${end}</b>.`;
    if(flareLast!==null) ans += `<br>Flare дерегінің соңғы жылы: <b>${flareLast}</b>.`;
    if(cmeLast!==null) ans += `<br>CME дерегінің соңғы жылы: <b>${cmeLast}</b>.`;
    if(_safeNum(flareY)!==null) ans += `<br>${end} үшін flare тәуекелі (оқиға/жыл): <b>${flareY.toFixed(1)}</b>`;
    if(_safeNum(keY)!==null) ans += `<br>${end} үшін log10(Ekin): <b>${keY.toFixed(2)}</b>`;
    if(_safeNum(vY)!==null) ans += `<br>${end} үшін v: <b>${Math.round(vY)} км/с</b>`;
    ans += `<br><span class="tiny">Ескерту: тренд + 11/22 жылдық цикл (оқу үшін).</span>`;
    return ans;
  }

  if(query.includes("205") || query.includes("206") || query.includes("30 жыл") || query.includes("ұзақ") || query.includes("long")){
    if(!window.__forecastLongModel){
      try{ if(!window.__annualData) build10YearForecast(); }catch(e){}
      try{ buildLongForecast(30); }catch(e){}
    }
    const lm = window.__forecastLongModel;
    if(!lm) return "Ұзақ болжам үшін модель табылмады (дерек жоқ болуы мүмкін).";
    const end = lm.endYear;
    const last = lm.lastYear;
    const target = end; // ең соңғы жыл
    const idx = lm.years.indexOf(target);
    const mT = idx>=0 ? lm.mass.forecast[idx] : null;
    const keT = idx>=0 ? lm.ke.forecast[idx] : null;

    let ans = `Ұзақ болжам <b>${end}</b> жылға дейін құрылған. Соңғы тарихи жыл: <b>${last}</b>.`;
    if(_safeNum(mT)!==null) ans += `<br>${target} үшін тәждік масса: <b>${mT.toExponential(3)} г</b>`;
    if(_safeNum(keT)!==null) ans += `<br>${target} үшін энергия: <b>${keT.toExponential(3)} эрг</b>`;
    ans += `<br><span class="tiny">Ескерту: тренд + 11 жылдық цикл (оқу үшін).</span>`;
    return ans;
  }

  if(query.includes("формула") || query.includes("теңдеу") || query.includes("m =") || query.includes("e =")){
    return `Негізгі байланыс: <b>E = 0.5·m·v²</b> → <b>m = 2E / v²</b>.<br>v: км/с болса, см/с-қа ауыстыру керек (×10⁵).`;
  }

  if(query.includes("аймақ") || query.includes("бөлік") || query.includes("north") || query.includes("south")){
    if(!regionCounts) return "Аймақтық қорытынды үшін X_CME дерегін де жүктеген дұрыс.";
    const map = [
      ["north","солтүстік"],["south","оңтүстік"],["east","шығыс"],["west","батыс"],["center","орталық"],
    ];
    let best = map[0][1], bestVal = regionCounts[map[0][0]];
    for(const [k,lab] of map){
      if(regionCounts[k] > bestVal){ bestVal = regionCounts[k]; best = lab; }
    }
    return `X_CME бойынша белсенді аймақ: <b>${best}</b> (оқиғалар саны: ${bestVal}).`;
  }

  return `Түсіндім. “орташа”, “2030 болжам”, “формула”, “аймақ” сияқты сұрақ қойып көр.`;
}

function _escapeHtml(str){
  return String(str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}
function _asHtmlLines(text){
  return _escapeHtml(text).replace(/\n/g,"<br>");
}
function _getQuickStats(){
  const n = Mass.length;
  if(n===0) return {n:0};
  const mean = (arr)=> arr.reduce((a,b)=>a+b,0)/arr.length;
  const meanM = mean(Mass);
  const meanKE = mean(KE);
  const meanV = mean(Speed);
  return {
    n,
    meanM,
    meanKE,
    meanV,
    lastYear: Date_god.length ? Math.floor(Date_god[Date_god.length-1]) : null
  };
}

const AI_ENABLED = false; // уақытша: OpenAI Billing қосқанда true қыл

function initAI(){
  const body = document.getElementById("aiChatBody");
  if(body && body.children.length===0){
    addChat("assistant","Сәлем! Мен Solar AI — деректерге негізделген қысқа қорытынды және есеп шығаратын бөлім. Сұрағыңды жаза бер.");
  }
  const input = document.getElementById("aiInput");
  const send = document.getElementById("btnSendAI");
  const fileInput = document.getElementById("aiFile");
  const fileNote = document.getElementById("aiFileNote");
  const setFileNote = (txt)=>{ if(fileNote) fileNote.textContent = txt; };
  if(!window.__aiDoc) window.__aiDoc = null;
  if(fileNote && !fileNote.textContent) setFileNote('Файл: жоқ');

  fileInput?.addEventListener('change', ()=>{
    const f = fileInput.files && fileInput.files[0];
    if(!f){ window.__aiDoc=null; setFileNote('Файл: жоқ'); return; }
    if(f.size > 2_500_000){
      addChat('assistant', '📎 Файл тым үлкен. .txt/.csv/.json форматын 2.5MB-тан кіші етіп жүкте.');
      fileInput.value='';
      window.__aiDoc=null;
      setFileNote('Файл: жоқ');
      return;
    }
    const r = new FileReader();
    r.onload = ()=>{
      const text = String(r.result || '');
      window.__aiDoc = {name:f.name, size:f.size, text};
      setFileNote('Файл: ' + f.name);
      addChat('assistant', `📎 Файл жүктелді: <b>${_escapeHtml(f.name)}</b> (${Math.round(f.size/1024)} KB). Қаласаң: “құжатты қысқаша қорыт” деп жаз.`);
    };
    r.onerror = ()=> addChat('assistant','📎 Файл оқу қатесі.');
    r.readAsText(f);
  });

  const modeChip = document.getElementById("aiModeChip");
  const metrics = document.getElementById("aiMetricsRow");

  const setMode = (txt)=>{
    if(modeChip) modeChip.textContent = txt;
  };
  const setMetrics = (obj)=>{
    if(!metrics) return;
    metrics.innerHTML = "";
    if(!obj) return;
    const items = [];
    if(obj.model) items.push(`model: ${obj.model}`);
    if(Number.isFinite(obj.total_tokens)) items.push(`tokens: ${obj.total_tokens}`);
    if(Number.isFinite(obj.latency_ms)) items.push(`latency: ${Math.round(obj.latency_ms)}ms`);
    if(items.length===0) return;
    for(const t of items){
      const span = document.createElement("span");
      span.className="ai-chip";
      span.textContent=t;
      metrics.appendChild(span);
    }
  };

  const sendNow = async ()=>{
    const q = (input?.value || "").trim();
    if(!q) return;

    addChat("user", _escapeHtml(q));
    if(input) input.value = "";

    if(!AI_ENABLED){
      addChat("assistant", "⛔ Solar AI уақытша өшірулі. OpenAI Billing қосқанда қосылады.");
      return;
    }

    const bubble = addChat("assistant", '<span class="typing">Жауап дайындалып жатыр…</span>');
    setMode("mode: connecting…");
    setMetrics(null);

    const local = aiAnswer(q);
    setMode('mode: offline');
    setMetrics(null);
    if(bubble) bubble.innerHTML = local;
    else addChat('assistant', local);
  };

  send?.addEventListener("click", sendNow);
  input?.addEventListener("keydown", (e)=>{
    if(e.key==="Enter" && !e.shiftKey){
      e.preventDefault();
      sendNow();
    }
  });
}
initAI();

// =====================================================
// 14) Solar Panel Planner (геолокация/адрес)
// =====================================================
let plannerLoc = null;
let lastPlan = null;

const geoStatus = document.getElementById("geoStatus");
const geoText = document.getElementById("geoText");
const geoDot = document.getElementById("geoDot");

function setPlannerStatus(type, text){
  if(!geoStatus) return;
  geoStatus.classList.remove("ready","loading","error");
  if(type) geoStatus.classList.add(type);
  if(geoText) geoText.textContent = text;
  if(geoDot) geoDot.className = "dot " + (type==="ready" ? "ok" : type==="loading" ? "warn" : type==="error" ? "" : "warn");
}

function suggestOrientation(lat){
  const tilt = Math.min(60, Math.max(5, Math.round(Math.abs(lat)*0.9 + 5)));
  const azimuth = lat >= 0 ? 180 : 0; // солт. жартышарда -> оңтүстікке қарату
  return {tilt, azimuth};
}

function azToCompass(az){
  const a = ((az%360)+360)%360;
  const dirs = [
    'Солтүстік','Солт-шығыс','Шығыс','Оңт-шығыс','Оңтүстік','Оңт-батыс','Батыс','Солт-батыс'
  ];
  return dirs[Math.round(a/45)%8];
}

function estimateEnergy(dcKW){
  const psh = 4.2; // kWh/kW/day rough
  const loss = 0.78;
  const daily = dcKW * psh * loss;
  const yearly = daily * 365;
  return {daily, yearly};
}

function renderPlan(out){
  const el = document.getElementById("panelOut");
  if(!el) return;
  el.innerHTML = `
    <div class="row" style="justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
      <div>
        <div style="font-weight:900">Нәтиже</div>
        <div class="tiny">lat=${out.lat.toFixed(4)}, lon=${out.lon.toFixed(4)}</div>
      </div>
      <div class="status-pill ready"><span class="dot ok"></span><span class="tiny">Есеп дайын</span></div>
    </div>
    <div class="divider"></div>
    <div class="grid2">
      <div class="glass" style="margin:0"><div class="glass-inner">
        <div style="font-weight:900">📍 Орналасу</div>
        <div class="tiny">lat=${out.lat.toFixed(4)}, lon=${out.lon.toFixed(4)}</div>
        <div class="divider" style="margin:10px 0"></div>
        <div style="font-weight:900">🧭 Панель бағыты</div>
        <div class="tiny">Ұсынылатын бағыт: <b>${azToCompass(out.azimuth)}</b> (экваторға қарай)</div>
        <div class="tiny" style="opacity:.85">Азимут (жуық): ${out.azimuth}°</div>
        <div class="tiny" style="opacity:.85">Ескерту: бұл — жуық бағдарлау. Нақты жобада шатыр/көлеңке ескеріледі.</div>
      </div></div>
      <div class="glass" style="margin:0"><div class="glass-inner">
        <div style="font-weight:900">⚡ Энергия</div>
        <div class="tiny">Жүйе: <b>${out.dcKW.toFixed(2)} кВт</b> (DC)</div>
        <div class="tiny">Тәулігіне: <b>${out.daily.toFixed(1)} кВт·сағ</b></div>
        <div class="tiny">Жылына: <b>${out.yearly.toFixed(0)} кВт·сағ</b></div>
      </div></div>
    </div>
    <div class="divider"></div>
    <div class="tiny" style="opacity:.85">Ескерту: бұл — шамамен бағалау. Нақты есеп үшін көлеңке/климат/шатыр бұрышы ескеріледі.</div>
  `;
}

async function geocodeAddress(q){
  const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(q);
  const res = await fetch(url, {headers: {"Accept":"application/json"}});
  const arr = await res.json();
  if(!arr || !arr[0]) return null;
  return {lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon), display: arr[0].display_name};
}

function planWithLatLon(lat, lon, sourceLabel){
  const sysKW = parseFloat(document.getElementById("sysKW")?.value || "0") || 0;
  const pc = parseFloat(document.getElementById("panelCount")?.value || "0") || 0;
  const pw = parseFloat(document.getElementById("panelW")?.value || "0") || 0;

  const computedKW = (pc>0 && pw>0) ? (pc*pw/1000) : 0;
  const dcKW = (sysKW>0 ? sysKW : computedKW) || computedKW || sysKW || 0;

  const orient = suggestOrientation(lat);
  const energy = estimateEnergy(dcKW || 1);

  lastPlan = {
    source: sourceLabel || "manual",
    lat, lon,
    dcKW: dcKW || 0,
    tilt: orient.tilt,
    azimuth: orient.azimuth,
    daily: energy.daily,
    yearly: energy.yearly
  };

  renderPlan(lastPlan);
  setPlannerStatus("ready", `Дайын: ${sourceLabel || "есеп"}`);
}

document.getElementById("btnUseHere")?.addEventListener("click", ()=>{
  requestGeolocation((lat, lon)=>{
    applyLocation(lat, lon, "My location");
    plannerLoc = {lat, lon};
    setPlannerStatus("ready","Локация алынды");
    planWithLatLon(lat, lon, "Geo");
  }, "planner");
});

document.getElementById("btnPlan")?.addEventListener("click", async ()=>{
  const parts = [
    document.getElementById("countryIn")?.value,
    document.getElementById("cityIn")?.value,
    document.getElementById("districtIn")?.value,
    document.getElementById("addrIn")?.value
  ].map(v=>(v||"").trim()).filter(Boolean);
  const addr = parts.join(", ");
  try{
    setPlannerStatus("loading","Есептелуде…");
    if(addr){
      const g = await geocodeAddress(addr);
      if(!g || !isFinite(g.lat) || !isFinite(g.lon)){
        setPlannerStatus("error","Адрес табылмады");
        alert("Адрес табылмады. Геолокация қолдан немесе координатты қолмен енгіз.");
        return;
      }
      plannerLoc = {lat:g.lat, lon:g.lon};
      setPlannerStatus("ready","Адрес табылды");
      planWithLatLon(g.lat, g.lon, "Address");
    } else if(plannerLoc){
      planWithLatLon(plannerLoc.lat, plannerLoc.lon, "Saved");
    } else if(currentLoc){
      planWithLatLon(currentLoc.lat, currentLoc.lon, "Top");
    } else {
      setPlannerStatus("error","Локация жоқ");
      alert("Адрес енгіз немесе геолокация қолдан.");
    }
  } catch(e){
    console.error(e);
    setPlannerStatus("error","Қате");
    alert("Есептеу кезінде қате. Интернет болса — адреспен қайта көр, болмаса геолокация қолдан.");
  }
});

// =====================================================
// 15) Тапсырыс модалі (жөнелту жоқ — тек көрсетеді)
// =====================================================
const modal = document.getElementById("modal");
const btnOrder = document.getElementById("btnOrder");
const btnClose = document.getElementById("btnClose");
const btnSubmit = document.getElementById("btnSubmit");
const btnClearOrder = document.getElementById("btnClearOrder");

function openModal(){
  if(!modal) return;
  modal.classList.add("open"); modal.classList.add("on");
  if(lastPlan){
    const ordAddr = document.getElementById("ordAddr");
    const ordKW = document.getElementById("ordKW");
    if(ordAddr) ordAddr.value = (function(){
      const parts = [
        document.getElementById("countryIn")?.value,
        document.getElementById("cityIn")?.value,
        document.getElementById("districtIn")?.value,
        document.getElementById("addrIn")?.value
      ].map(v=>(v||"").trim()).filter(Boolean);
      return (parts.join(", ") || "").trim();
    })() || `lat=${lastPlan.lat.toFixed(4)}, lon=${lastPlan.lon.toFixed(4)}`;
    if(ordKW) ordKW.value = lastPlan.dcKW ? String(lastPlan.dcKW.toFixed(2)) : "";
  }
}
function closeModal(){
  if(!modal) return;
  modal.classList.remove("open"); modal.classList.remove("on");
}

btnOrder?.addEventListener("click", openModal);
btnClose?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e)=>{
  if(e.target === modal) closeModal();
});

btnSubmit?.addEventListener("click", async ()=>{
  const payload = {
    name: (document.getElementById("ordName")?.value || "").trim(),
    phone: (document.getElementById("ordPhone")?.value || "").trim(),
    address: (document.getElementById("ordAddr")?.value || "").trim(),
    system_kw: (document.getElementById("ordKW")?.value || "").trim(),
    note: (document.getElementById("ordNote")?.value || "").trim(),
    calc: lastPlan || null,
    created_at: new Date().toISOString()
  };
  const pre = document.getElementById("ordPayload");
  if(pre) pre.textContent = JSON.stringify(payload, null, 2);
});

btnClearOrder?.addEventListener("click", ()=>{
  ["ordName","ordPhone","ordAddr","ordKW","ordNote"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value = "";
  });
  const pre = document.getElementById("ordPayload");
  if(pre) pre.textContent = "{ }";
});

// =====================================================
// Auto-load built-in TXT on first open
// =====================================================
// Сайт ашылғанда public/data ішіндегі дайын TXT автоматты түрде оқылады.
// Егер дерек already loaded болса — қайталамайды.
window.addEventListener("load", ()=>{
  setTimeout(()=>{
    try{
      if(Array.isArray(Mass) && Mass.length===0 && typeof loadBuiltIn === "function"){
        loadBuiltIn();
      }
    }catch(e){}
  }, 250);
});


// Forecast horizon controls (2030/2035/2040)
(function(){
  try{
    window.__forecastTargetYear = window.__forecastTargetYear || 2030;
    const seg = document.getElementById('forecastSeg');
    if(!seg) return;
    const btns = Array.from(seg.querySelectorAll('.seg-btn'));
    btns.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        btns.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const y = Number(btn.dataset.year || 2030);
        window.__forecastTargetYear = (y>1900 ? y : 2030);
        try{ build10YearForecast(); }catch(e){}
      });
    });
  }catch(e){}
})();
