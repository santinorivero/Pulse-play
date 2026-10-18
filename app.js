(() => {
  "use strict";
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const todayISO = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
  const dateFromISO = iso => { const [y,m,d]=iso.split("-").map(Number); return new Date(y,m-1,d); };
  const isoFromDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const dateLabel = iso => dateFromISO(iso).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});
  const load = (key, fallback) => { try { const v=JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key,JSON.stringify(value)); } catch {} };
  const games = [
    {id:"color",name:"Memoria de colores",emoji:"🟪",tag:"Memoria",desc:"Recordá la secuencia de colores y repetila en el orden correcto.",instruction:"Observá los colores que se iluminan y repetí la secuencia. Cada ronda suma un color más.",points:100},
    {id:"time",name:"Time Lock",emoji:"⏱️",tag:"Tiempo",desc:"Calculá cuánto tiempo pasó sin mirar un cronómetro.",instruction:"Memorizá la duración objetivo y detené el intento cuando creas que pasó ese tiempo.",points:100},
    {id:"size",name:"Estimación de tamaños",emoji:"📐",tag:"Percepción",desc:"Estimá tamaños reales comparando objetos y referencias visuales.",instruction:"Ajustá la silueta misteriosa usando la referencia conocida y confirmá tu estimación.",points:100},
    {id:"reflex",name:"Reflejos",emoji:"⚡",tag:"Reflejos",desc:"Reaccioná tan rápido como puedas cuando la señal se ponga verde.",instruction:"Esperá a que la señal se ponga verde y tocá lo más rápido posible. Anticiparte cuenta como falso inicio.",points:100},
    {id:"pattern",name:"Patrones",emoji:"🔷",tag:"Lógica",desc:"Descubrí la regla de una secuencia y elegí el siguiente número.",instruction:"Encontrá la regla detrás de cada secuencia numérica y elegí la respuesta correcta.",points:100}
  ];
  const gameIcons={color:"▦",time:"◷",size:"◇",reflex:"ϟ",pattern:"⌘"};
  let stats=load("pulse_stats",{daily:{},practice:0,bestDaily:0,completed:0,streak:0,lastPlayed:null,bests:{}});
  let archiveCursor=new Date(); archiveCursor.setDate(1);
  let currentGame=null, gameMode="practice", gameDate=todayISO(), cleanupGame=null, toastTimer=null;
  const toast=msg=>{const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400)};
  const currentDayData=(date=todayISO())=>stats.daily[date]||{scores:{},completed:false,total:0};
  const dailyTotal=(date=todayISO())=>Object.values(currentDayData(date).scores).reduce((a,b)=>a+(Number(b)||0),0);
  const dailyCompleted=(date=todayISO())=>Object.keys(currentDayData(date).scores).length;
  function saveScore(gameId,score,mode,date=todayISO()){
    score=Math.max(0,Math.min(100,Math.round(score)));
    if(mode==="practice"){stats.practice=(stats.practice||0)+1;stats.bests[gameId]=Math.max(stats.bests[gameId]||0,score);save("pulse_stats",stats);renderStats();return;}
    const d=currentDayData(date);
    if(d.scores[gameId]!==undefined){toast("Official score already saved for this date. Try practice to play again.");return;}
    d.scores[gameId]=score;d.total=dailyTotal(date);d.completed=Object.keys(d.scores).length===5;stats.daily[date]=d;
    if(d.completed){stats.completed=Object.values(stats.daily).filter(x=>x.completed).length;stats.bestDaily=Math.max(stats.bestDaily||0,d.total);updateStreak(date);}
    save("pulse_stats",stats);renderHome();renderStats();renderCalendar();
  }
  function updateStreak(date){
    const played=Object.keys(stats.daily).filter(k=>stats.daily[k].completed).sort();
    let streak=0, cursor=dateFromISO(date);
    for(let i=played.length-1;i>=0;i--){if(played[i]===isoFromDate(cursor)){streak++;cursor.setDate(cursor.getDate()-1);}else if(played[i]<isoFromDate(cursor))break;}
    stats.streak=streak;stats.lastPlayed=date;
  }
  function renderHome(){
    $("#todayDate").textContent=dateLabel(todayISO()); const count=dailyCompleted(), total=dailyTotal();
    $("#dailyProgressText").textContent=`${count} / 5 games completed`;$("#dailyTotal").textContent=`${total} / 500`;$("#dailyProgressBar").style.width=`${count*20}%`;
    $("#dailyGameList").innerHTML=games.map(g=>{const score=currentDayData().scores[g.id];return `<div class="daily-game"><span class="game-emoji">${g.emoji}</span><span class="game-name">${g.name}</span><span class="score-mini">${score===undefined?"— / 100":score+" / 100"}</span><button class="play-link" data-play="${g.id}" data-mode="daily" aria-label="Play ${g.name}">${score===undefined?"Play":"View"}</button></div>`}).join("");
    $("#dailyGameList").querySelectorAll("[data-play]").forEach(b=>b.addEventListener("click",()=>{if(currentDayData()[b.dataset.play]!==undefined)return;openGame(b.dataset.play,"daily",todayISO())}));
    $("#gamesGrid").innerHTML=games.map(g=>`<article class="game-card"><div class="game-art">${g.emoji}</div><h3>${g.name}</h3><p>${g.desc}</p><div class="game-card-bottom"><span class="game-tag">${g.tag}</span><button class="play-link" data-game="${g.id}">Practice ↗</button></div></article>`).join("");
    $("#gamesGrid").querySelectorAll("[data-game]").forEach(b=>b.addEventListener("click",()=>openGame(b.dataset.game,"practice",todayISO())));
  }
  function renderStats(){
    $("#streakStat").textContent=`${stats.streak||0} days`;$("#bestDailyStat").textContent=`${stats.bestDaily||0} pts`;$("#completedStat").textContent=stats.completed||0;$("#practiceStat").textContent=stats.practice||0;
    const rows=Object.keys(stats.daily).sort().reverse().slice(0,6);
    $("#historyList").innerHTML=rows.length?rows.map(date=>`<div class="history-row"><span>${dateLabel(date)}${stats.daily[date].completed?' · Completed':''}</span><span class="history-score">${stats.daily[date].total||0} pts</span></div>`).join(""):`<div class="empty-state">Your completed daily challenges will appear here.</div>`;
  }
  function renderCalendar(){
    const year=archiveCursor.getFullYear(),month=archiveCursor.getMonth();$("#archiveMonth").textContent=archiveCursor.toLocaleDateString(undefined,{month:"long",year:"numeric"});
    const first=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate(),offset=(first+6)%7;
    const labels=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    let html=labels.map(d=>`<div class="cal-weekday">${d}</div>`).join("");
    for(let i=0;i<offset;i++)html+='<button class="cal-day empty" tabindex="-1"></button>';
    for(let d=1;d<=days;d++){const date=isoFromDate(new Date(year,month,d));const cls=["cal-day",date===todayISO()?"today":"",currentDayData(date).completed?"played":""].filter(Boolean).join(" ");html+=`<button class="${cls}" data-date="${date}" aria-label="${dateLabel(date)}">${d}</button>`}
    $("#calendar").innerHTML=html;
    $$("#calendar [data-date]").forEach(b=>b.addEventListener("click",()=>selectArchiveDate(b.dataset.date)));
  }
  function selectArchiveDate(date){const d=currentDayData(date);$("#archiveSelection").innerHTML=`<strong>${dateLabel(date)}</strong><br>${d.completed?`Your saved score: ${d.total}/500.`:"Replay this day's challenge in archive mode."}<br><button class="btn btn-primary" style="margin-top:12px" id="playArchive">Play this challenge</button>`;$("#playArchive").addEventListener("click",()=>startDailySequence("archive",date));}
  function showModal(id){$(id).classList.remove("hidden");document.body.style.overflow="hidden"}
  function hideModal(id){$(id).classList.add("hidden");if($("#gameModal").classList.contains("hidden")&&$("#arenaModal").classList.contains("hidden"))document.body.style.overflow="";if(cleanupGame){cleanupGame();cleanupGame=null}}
  function openGame(id,mode="practice",date=todayISO()){
    const g=games.find(x=>x.id===id);if(!g)return;
    if(mode==="daily"&&currentDayData(date).scores[id]!==undefined){toast("You've already recorded this daily score. Try practice mode.");return}
    currentGame=id;gameMode=mode;gameDate=date;$("#gameTitle").textContent=g.name;$("#gameModeLabel").textContent=mode==="practice"?"PRACTICE MODE":mode==="daily"?"DAILY CHALLENGE":"CHALLENGE ARCHIVE";$("#gameInstructions").textContent=g.instruction;$("#gameRoundLabel").textContent=mode==="practice"?"Práctica · Intentos ilimitados":`Challenge date: ${dateLabel(date)}`;showModal("#gameModal");runGame(id);
  }
  function finishGame(score,summary){
    const stage=$("#gameStage");stage.innerHTML=`<div class="result-title">${score>=85?"¡Excelente!":score>=60?"¡Buen intento!":"¡Seguí practicando"}</div><div class="result-number">${score}<span style="font-size:1.1rem;color:#8c9ab6"> / 100</span></div><p class="result-copy">${summary}</p><button class="game-btn primary" id="saveAndClose">Guardar resultado y cerrar</button><button class="game-btn" id="tryAgain">Volver a jugar</button>`;
    $("#saveAndClose").addEventListener("click",()=>{saveScore(currentGame,score,gameMode,gameDate);hideModal("#gameModal")});
    $("#tryAgain").addEventListener("click",()=>runGame(currentGame));
  }
  function runGame(id){
    if(cleanupGame){cleanupGame();cleanupGame=null}
    const stage=$("#gameStage");stage.innerHTML="";let round=1;$("#gameRoundLabel").textContent=gameMode==="practice"?"Práctica · Intentos ilimitados":`Challenge date: ${dateLabel(gameDate)}`;
    const button=(label,fn,primary=false)=>{const b=document.createElement("button");b.className="game-btn"+(primary?" primary":"");b.textContent=label;b.addEventListener("click",fn);return b};
    if(id==="color"){
      let seq=[],input=[],showing=false,level=1,timer=null;
      const colors=["red","blue","green","yellow","purple"];
      const msg=document.createElement("p");msg.className="inline-note";msg.textContent="Press Start to begin.";
      const pads=document.createElement("div");pads.className="color-sequence";
      colors.forEach(c=>{const b=document.createElement("button");b.className="color-pad";b.dataset.color=c;b.setAttribute("aria-label",c);b.addEventListener("click",()=>{if(showing||!seq.length)return;input.push(c);b.classList.add("lit");setTimeout(()=>b.classList.remove("lit"),140);if(input[input.length-1]!==seq[input.length-1]){finishGame(Math.max(0,Math.round((level-1)*100/8)),`You reached level ${level-1}. Repeat the sequence to build your memory score.`);return}if(input.length===seq.length){level++;msg.textContent=`Correct! Level ${level-1} complete.`;setTimeout(next,500)}});pads.appendChild(b)});
      function flash(i=0){if(i>=seq.length){showing=false;input=[];msg.textContent=`Level ${level}: repeat ${seq.length} colors.`;return}showing=true;const b=pads.querySelector(`[data-color="${seq[i]}"]`);b.classList.add("lit");timer=setTimeout(()=>{b.classList.remove("lit");timer=setTimeout(()=>flash(i+1),180)},420)}
      function next(){seq.push(colors[Math.floor(Math.random()*colors.length)]);flash()}
      const start=button("Start sequence",()=>{seq=[];level=1;next();start.disabled=true},true);stage.append(msg,pads,start);cleanupGame=()=>clearTimeout(timer);
    } else if(id==="time"){
      // Cinco intentos; reloj oculto durante la medición. performance.now() evita deriva de setInterval.
      const seedText=(gameMode==="practice"?String(Math.random()):gameDate+"-time-lock");
      let seed=0; for(const ch of seedText) seed=(seed*31+ch.charCodeAt(0))>>>0;
      const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
      const difficulty=document.createElement("div");difficulty.className="game-toolbar";
      const diffLabel=document.createElement("label");diffLabel.textContent="Dificultad ";
      const diff=document.createElement("select");diff.className="game-select";diff.innerHTML='<option value="easy">Fácil · 2–6 s</option><option value="hard">Difícil · 7–15 s</option>';diffLabel.append(diff);
      const countLabel=document.createElement("label");countLabel.textContent="Rondas ";const count=document.createElement("select");count.className="game-select";count.innerHTML='<option>1</option><option>3</option><option selected>5</option><option>10</option>';countLabel.append(count);
      const customLabel=document.createElement("label");customLabel.textContent="Personalizada ";const custom=document.createElement("input");custom.type="number";custom.min="1";custom.max="20";custom.placeholder="1–20";custom.className="game-number";custom.setAttribute("aria-label","Cantidad personalizada de rondas");customLabel.append(custom);
      const setup=document.createElement("div");setup.className="time-setup";setup.append(diffLabel,countLabel,customLabel);
      const roundTitle=document.createElement("h3");roundTitle.className="round-heading";
      const targetChip=document.createElement("div");targetChip.className="target-chip";
      const read=document.createElement("div");read.className="timer-readout";read.textContent="— — —";
      const msg=document.createElement("p");msg.className="inline-note";msg.textContent="Memorizá la duración objetivo. Durante tu intento no verás el reloj.";
      const action=document.createElement("button");action.className="game-btn primary";action.textContent="Ver duración objetivo";action.onclick=begin;const resultBox=document.createElement("div");resultBox.className="round-result";
      let targets=[],roundIndex=0,startedAt=0,active=false,locked=false,total=0,roundScores=[],timeout=null,goal=0;
      function makeTargets(n){const min=diff.value==="easy"?2:7,max=diff.value==="easy"?6:15;targets=[];for(let i=0;i<n;i++)targets.push(Math.round((min+rand()*(max-min))*10)/10)}
      function begin(){if(locked)return; if(!targets.length){const n=Math.max(1,Math.min(20,Number(custom.value)||Number(count.value)||5));makeTargets(n);setup.hidden=true;}
        goal=targets[roundIndex];roundTitle.textContent=`Ronda ${roundIndex+1} de ${targets.length}`;targetChip.textContent=`DURACIÓN OBJETIVO · ${goal.toFixed(1)} s`;read.textContent=`${goal.toFixed(1)} s`;msg.textContent="Memorizá el tiempo que se muestra. Cuando estés listo, iniciá el intento.";action.textContent="Ya la memoricé · empezar";action.onclick=()=>startAttempt();action.disabled=false;resultBox.innerHTML="";}
      function startAttempt(){if(locked||active)return;active=true;startedAt=performance.now();read.textContent="TIEMPO OCULTO";msg.textContent="El reloj está oculto. Tocá DETENER cuando creas que pasó ese tiempo.";action.textContent="DETENER";action.onclick=stopAttempt;timeout=setTimeout(()=>{if(active){active=false;const elapsed=(performance.now()-startedAt)/1000;endRound(elapsed)}},60000)}
      function stopAttempt(){if(!active||locked)return;active=false;clearTimeout(timeout);endRound((performance.now()-startedAt)/1000)}
      function endRound(elapsed){locked=true;const error=Math.abs(elapsed-goal);const points=Math.max(0,Math.min(10,10*(1-error/Math.max(goal,1))));const score=Math.round(points*10)/10;total+=score;roundScores.push(score);const direction=elapsed<goal?"Te quedaste corto":"Te pasaste";read.textContent=elapsed.toFixed(2)+" s";targetChip.textContent=`OBJETIVO · ${goal.toFixed(1)} s`;msg.textContent=`${direction} por ${error.toFixed(2)} s.`;resultBox.innerHTML=`<div class="result-title">${score>=9?"¡Precisión excelente!":score>=6?"¡Buen intento!":"Seguí entrenando"}</div><div class="result-number">${score.toFixed(1)} <span>/ 10 puntos</span></div><p>Objetivo: <b>${goal.toFixed(1)} s</b> · Tu tiempo: <b>${elapsed.toFixed(2)} s</b> · Diferencia: <b>${error.toFixed(2)} s</b></p>`;action.textContent=roundIndex===targets.length-1?"Ver resultado final":"Siguiente ronda";action.disabled=false;action.onclick=()=>{if(roundIndex<targets.length-1){roundIndex++;locked=false;begin()}else{const finalScore=Math.round(total/targets.length*10);finishGame(finalScore,`Completaste ${targets.length} rondas. Puntaje medio: ${(total/targets.length).toFixed(1)}/10. Puntajes por ronda: ${roundScores.map(x=>x.toFixed(1)).join(" · ")}.`);}}}
      stage.append(setup,roundTitle,targetChip,read,msg,resultBox,action);cleanupGame=()=>{clearTimeout(timeout);active=false;locked=true};
    } else if(id==="size"){
      const objects=[
        {name:"Jirafa",measure:"altura",real:5.2,unit:"m",icon:"🦒",ref:"Persona adulta",refReal:1.75,refIcon:"🧍",fact:"Una jirafa adulta suele medir alrededor de 4,5 a 5,5 metros de altura."},
        {name:"Autobús urbano",measure:"longitud",real:12,unit:"m",icon:"🚌",ref:"Puerta",refReal:2.0,refIcon:"🚪",fact:"Muchos autobuses urbanos estándar miden cerca de 12 metros."},
        {name:"Gato doméstico",measure:"altura hasta el hombro",real:0.25,unit:"m",icon:"🐈",ref:"Botella grande",refReal:0.30,refIcon:"🧴",fact:"La altura al hombro de un gato doméstico suele rondar los 23–25 cm."},
        {name:"Avión comercial",measure:"envergadura",real:35.8,unit:"m",icon:"✈️",ref:"Autobús",refReal:12,refIcon:"🚌",fact:"La envergadura depende del modelo; este valor es aproximado y representa un avión de pasillo único grande."},
        {name:"Torre Eiffel",measure:"altura",real:330,unit:"m",icon:"🗼",ref:"Edificio de 10 pisos",refReal:30,refIcon:"🏢",fact:"La Torre Eiffel alcanza unos 330 metros incluyendo sus antenas."},
        {name:"Ballena azul",measure:"longitud",real:25,unit:"m",icon:"🐋",ref:"Autobús urbano",refReal:12,refIcon:"🚌",fact:"Las ballenas azules adultas pueden superar los 25 metros de longitud."},
        {name:"Lápiz",measure:"longitud",real:0.19,unit:"m",icon:"✏️",ref:"Teléfono",refReal:0.15,refIcon:"📱",fact:"Un lápiz escolar común mide aproximadamente 18–19 cm."},
        {name:"Cancha de fútbol",measure:"longitud",real:105,unit:"m",icon:"⚽",ref:"Autobús urbano",refReal:12,refIcon:"🚌",fact:"Una cancha profesional puede medir cerca de 105 metros de largo."},
        {name:"Elefante africano",measure:"altura al hombro",real:3.2,unit:"m",icon:"🐘",ref:"Persona adulta",refReal:1.75,refIcon:"🧍",fact:"Un elefante africano adulto puede superar los 3 metros de altura al hombro."},
        {name:"Luna",measure:"diámetro",real:3474,unit:"km",icon:"🌕",ref:"Tierra",refReal:12742,refIcon:"🌍",fact:"El diámetro de la Luna es aproximadamente el 27 % del diámetro terrestre."}
      ];
      let seed=0;const seedText=gameMode==="practice"?String(Math.random()):gameDate+"-size-sense";for(const ch of seedText)seed=(seed*31+ch.charCodeAt(0))>>>0;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
      let deck=[];if(gameMode==="practice"){deck=[...objects].sort(()=>rand()-.5).slice(0,5)}else{const offset=Math.floor(rand()*objects.length);deck=Array.from({length:5},(_,i)=>objects[(offset+i*3)%objects.length])}
      let idx=0,scale=1,estimate=0,locked=false,total=0;const roundTitle=document.createElement("h3");roundTitle.className="round-heading";const refCard=document.createElement("div");refCard.className="size-reference";const mystery=document.createElement("div");mystery.className="size-mystery";const slider=document.createElement("input");slider.type="range";slider.min="0.25";slider.max="4";slider.step="0.01";slider.value="1";slider.className="size-slider";slider.setAttribute("aria-label","Ajustar tamaño de la silueta misteriosa");const scaleLabel=document.createElement("div");scaleLabel.className="scale-readout";const controls=document.createElement("div");controls.className="size-controls";const minus=button("−",()=>adjust(-.1));const plus=button("+",()=>adjust(.1));const confirm=button("CONFIRMAR TAMAÑO",reveal,true);const result=document.createElement("div");result.className="round-result";const next=button("Siguiente objeto",nextRound,true);next.hidden=true;
      function draw(){const o=deck[idx];roundTitle.textContent=`Comparación ${idx+1} de ${deck.length} · ${o.measure}`;refCard.innerHTML=`<div><small>REFERENCIA CONOCIDA</small><h3>${o.ref}</h3><p>Medida real: <b>${o.refReal} ${o.unit}</b></p></div><div class="silhouette ref-silhouette" style="--sil-scale:1">${o.refIcon}</div>`;scale=1;slider.value="1";locked=false;result.innerHTML="";confirm.hidden=false;confirm.disabled=false;next.hidden=true;updateMystery();}
      function updateMystery(){const o=deck[idx];mystery.innerHTML=`<small>OBJETO MISTERIOSO</small><div class="silhouette mystery-silhouette" style="transform:scale(${scale});">${o.icon}</div><h3>${o.name}</h3><p>¿Cuál creés que es su ${o.measure}?</p>`;scaleLabel.textContent=`Tamaño estimado: ${scale.toFixed(2)}× la referencia`;}
      function adjust(delta){if(locked)return;scale=Math.max(.25,Math.min(4,Math.round((scale+delta)*100)/100));slider.value=String(scale);updateMystery()}
      slider.addEventListener("input",()=>{if(locked)return;scale=Number(slider.value);updateMystery()});minus.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowDown")adjust(-.1);if(e.key==="ArrowRight"||e.key==="ArrowUp")adjust(.1)});document.addEventListener("keydown",keyboard);function keyboard(e){if(!locked&&currentGame==="size"&& !$("#gameModal").classList.contains("hidden")){if(e.key==="ArrowLeft")adjust(-.05);if(e.key==="ArrowRight")adjust(.05)}}
      function reveal(){if(locked)return;locked=true;confirm.disabled=true;slider.disabled=true;minus.disabled=true;plus.disabled=true;const o=deck[idx];estimate=o.refReal*scale;const errorRatio=Math.abs(Math.log(estimate/o.real));const score=Math.max(0,Math.min(100,Math.round(100*Math.exp(-1.25*errorRatio))));total+=score;const pct=Math.abs((estimate-o.real)/o.real)*100;const too=estimate>o.real?"Te pasaste":estimate<o.real?"Te quedaste corto":"¡Exacto!";result.innerHTML=`<div class="result-title">${too}</div><div class="result-number">${score}<span> / 100 puntos</span></div><p>Medida real: <b>${o.real} ${o.unit}</b><br>Tu estimación: <b>${estimate.toFixed(2)} ${o.unit}</b><br>Error proporcional: <b>${pct.toFixed(1)} %</b></p><p class="fact-note">💡 ${o.fact}</p><p class="formula-note">Puntuación: 100 × e<sup>−1,25 × |ln(estimación/real)|</sup>. El doble y la mitad tienen la misma puntuación.</p>`;confirm.hidden=true;next.hidden=false;slider.disabled=true;minus.disabled=true;plus.disabled=true;}
      function nextRound(){idx++;if(idx>=deck.length){finishGame(Math.round(total/deck.length),`Puntaje medio de ${deck.length} comparaciones: ${Math.round(total/deck.length)}/100. La puntuación diaria se guarda una sola vez por fecha.`);return}slider.disabled=false;minus.disabled=false;plus.disabled=false;draw()}
      controls.append(minus,plus);stage.append(roundTitle,refCard,mystery,slider,scaleLabel,controls,confirm,next,result);draw();cleanupGame=()=>{document.removeEventListener("keydown",keyboard);locked=true};
    } else if(id==="reflex"){
      let state="wait",startAt=0,timer=null,tries=0;const pad=document.createElement("button");pad.className="reflex-pad";pad.textContent="Tap to start";const msg=document.createElement("p");msg.className="inline-note";msg.textContent="Wait for green, then tap as fast as you can.";
      function arm(){state="wait";pad.className="reflex-pad ready";pad.textContent="Wait…";msg.textContent="Don't tap yet!";timer=setTimeout(()=>{state="go";startAt=performance.now();pad.className="reflex-pad go";pad.textContent="TAP NOW!"},1200+Math.random()*2600)}
      pad.addEventListener("click",()=>{if(state==="idle"){arm();return}if(state==="wait"){clearTimeout(timer);state="idle";pad.className="reflex-pad";pad.textContent="Too soon!";msg.textContent="False start. Tap to try again.";return}if(state==="go"){const ms=Math.round(performance.now()-startAt);state="done";pad.className="reflex-pad";pad.textContent=ms+" ms";finishGame(Math.max(0,Math.min(100,Math.round(100-(ms-150)*.16))),`Reaction time: ${ms} ms. Device and network conditions can affect measurements.`);}});
      state="idle";stage.append(pad,msg);cleanupGame=()=>clearTimeout(timer);
    } else if(id==="pattern"){
      const qs=[{s:"2 · 4 · 6 · 8 · ?",a:[9,10,12],c:1,why:"Add 2 each time."},{s:"3 · 6 · 12 · 24 · ?",a:[36,48,42],c:1,why:"Double each number."},{s:"1 · 1 · 2 · 3 · 5 · ?",a:[7,8,9],c:1,why:"Each number is the sum of the previous two."},{s:"10 · 8 · 6 · 4 · ?",a:[1,2,3],c:1,why:"Subtract 2 each time."},{s:"1 · 4 · 9 · 16 · ?",a:[20,25,36],c:1,why:"These are square numbers."}];const q=qs[Math.floor(Math.random()*qs.length)];const prompt=document.createElement("div");prompt.className="pattern-question";prompt.textContent=q.s;const choices=document.createElement("div");choices.className="pattern-options";q.a.forEach((a,i)=>choices.appendChild(button(String(a),()=>finishGame(i===q.c?100:25,`${i===q.c?"Correct!":"Not quite."} ${q.why}`),i===q.c)));stage.append(prompt,choices);
    }
  }
  function startDailySequence(mode,date){const data=currentDayData(date);const available=games.filter(g=>data.scores[g.id]===undefined);if(!available.length){toast("You've completed all five games for this date.");return}openGame(available[0].id,mode==="archive"?"archive":"daily",date);if(mode==="archive"){gameMode="archive";$("#gameModeLabel").textContent="CHALLENGE ARCHIVE"}}
  function openArena(){showModal("#arenaModal");$("#arenaFeedback").textContent="Online matchmaking isn't connected yet. This starter version will not fake real players or matches."}
  $("#playDaily").addEventListener("click",()=>startDailySequence("daily",todayISO()));
  $$("[data-action]").forEach(b=>b.addEventListener("click",()=>{const a=b.dataset.action;if(a==="daily")startDailySequence("daily",todayISO());else if(a==="games")document.querySelector("#games").scrollIntoView({behavior:"smooth"});else if(a==="archive")document.querySelector("#archive").scrollIntoView({behavior:"smooth"});else if(a==="arena")openArena()}));
  $("#closeGame").addEventListener("click",()=>hideModal("#gameModal"));$("#restartGame").addEventListener("click",()=>{if(currentGame)runGame(currentGame)});
  $("#closeArena").addEventListener("click",()=>hideModal("#arenaModal"));
  $("#createRoom").addEventListener("click",()=>{$("#arenaFeedback").textContent="Private rooms require the online backend. No fake room was created. Next build step: connect room creation, secure invite codes and real-time presence.";});
  $("#joinRoom").addEventListener("click",()=>{const code=prompt("Enter your private room code:");if(code)$("#arenaFeedback").textContent=`Room ${code.trim().toUpperCase()} cannot be joined until the online backend is connected. This starter does not create simulated rooms.`});
  $("#quickMatch").addEventListener("click",()=>{$("#arenaFeedback").textContent="Quick Match is not live yet because no matchmaking server is connected. This honest placeholder will be replaced with a real queue and synchronized games.";});
  $("#prevMonth").addEventListener("click",()=>{archiveCursor.setMonth(archiveCursor.getMonth()-1);renderCalendar()});$("#nextMonth").addEventListener("click",()=>{archiveCursor.setMonth(archiveCursor.getMonth()+1);renderCalendar()});
  $("#profileBtn").addEventListener("click",()=>toast("Progress is saved locally on this device for now."));
  $("#menuBtn").addEventListener("click",()=>{const nav=$(".desktop-nav");if(nav.style.display==="flex"){nav.style.display="none"}else{nav.style.display="flex";nav.style.position="absolute";nav.style.top="64px";nav.style.left="0";nav.style.right="0";nav.style.padding="18px";nav.style.background="#080d1b";nav.style.flexDirection="column";nav.style.gap="18px";nav.style.borderBottom="1px solid #263754"}});
  $("#privacyLink").addEventListener("click",e=>{e.preventDefault();alert("Starter privacy note: this version stores your game progress in localStorage on this device. It does not currently create accounts or send game results to a server. Online multiplayer is not connected yet.")});
  $("#gameModal").addEventListener("click",e=>{if(e.target.id==="gameModal")hideModal("#gameModal")});$("#arenaModal").addEventListener("click",e=>{if(e.target.id==="arenaModal")hideModal("#arenaModal")});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){hideModal("#gameModal");hideModal("#arenaModal")}});
  renderHome();renderStats();renderCalendar();
})();