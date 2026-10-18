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
    {id:"color",name:"Color Recall",emoji:"🟪",tag:"Memory",desc:"Remember the sequence and repeat it in the correct order.",instruction:"Watch the colors light up, then repeat the sequence. Each round adds one more color.",points:100},
    {id:"time",name:"Time Lock",emoji:"⏱️",tag:"Timing",desc:"Stop the clock as close as possible to the target time.",instruction:"Press Start, then stop when you think the target time has passed. The clock is hidden while you play.",points:100},
    {id:"size",name:"Size Sense",emoji:"📐",tag:"Perception",desc:"Use your visual intuition to estimate and compare sizes.",instruction:"Choose which object is closer to the real-world size described. This is a visual estimation game, not a scientific test.",points:100},
    {id:"reflex",name:"Reflex Rush",emoji:"⚡",tag:"Reflexes",desc:"React as fast as you can when the signal turns green.",instruction:"Wait for the signal to turn green, then tap as quickly as possible. Tapping early counts as a false start.",points:100},
    {id:"pattern",name:"Pattern Breaker",emoji:"🔷",tag:"Logic",desc:"Find the missing number in a sequence before time runs out.",instruction:"Find the rule behind each number sequence and choose the next number.",points:100}
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
    currentGame=id;gameMode=mode;gameDate=date;$("#gameTitle").textContent=g.name;$("#gameModeLabel").textContent=mode==="practice"?"PRACTICE MODE":mode==="daily"?"DAILY CHALLENGE":"CHALLENGE ARCHIVE";$("#gameInstructions").textContent=g.instruction;$("#gameRoundLabel").textContent=mode==="practice"?"Practice · Unlimited attempts":`Challenge date: ${dateLabel(date)}`;showModal("#gameModal");runGame(id);
  }
  function finishGame(score,summary){
    const stage=$("#gameStage");stage.innerHTML=`<div class="result-title">${score>=85?"Excellent run!":score>=60?"Nice effort!":"Keep practicing"}</div><div class="result-number">${score}<span style="font-size:1.1rem;color:#8c9ab6"> / 100</span></div><p class="result-copy">${summary}</p><button class="game-btn primary" id="saveAndClose">Save result & close</button><button class="game-btn" id="tryAgain">Try again</button>`;
    $("#saveAndClose").addEventListener("click",()=>{saveScore(currentGame,score,gameMode,gameDate);hideModal("#gameModal")});
    $("#tryAgain").addEventListener("click",()=>runGame(currentGame));
  }
  function runGame(id){
    if(cleanupGame){cleanupGame();cleanupGame=null}
    const stage=$("#gameStage");stage.innerHTML="";let round=1;$("#gameRoundLabel").textContent=gameMode==="practice"?"Practice · Unlimited attempts":`Challenge date: ${dateLabel(gameDate)}`;
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
      const target=10+(Math.floor(Math.random()*3)*5);let startAt=0,active=false,elapsedTimer=null;
      const chip=document.createElement("div");chip.className="target-chip";chip.textContent=`TARGET · ${target} SECONDS`;
      const read=document.createElement("div");read.className="timer-readout";read.textContent="00.00";
      const msg=document.createElement("p");msg.className="inline-note";msg.textContent="Start the clock, then stop when you think time is up.";
      let finished=false;
      const start=button("Start",()=>{if(finished)return;if(!active){active=true;startAt=performance.now();read.textContent="•••";start.textContent="Stop";msg.textContent="Clock is running. Trust your internal timer.";elapsedTimer=setTimeout(()=>{if(active){active=false;finished=true;read.textContent="Time's up";start.disabled=true;finishGame(0,"The timer reached its limit. Try again to improve your estimate.")}},target*2*1000);return}const elapsed=(performance.now()-startAt)/1000;active=false;finished=true;clearTimeout(elapsedTimer);read.textContent=elapsed.toFixed(2)+"s";const error=Math.abs(elapsed-target);finishGame(Math.max(0,Math.round(100-error*12)),`Target: ${target}s · Your estimate: ${elapsed.toFixed(2)}s · Error: ${error.toFixed(2)}s.`)},true);
      stage.append(chip,read,msg,start);cleanupGame=()=>{clearTimeout(elapsedTimer);active=false};
    } else if(id==="size"){
      const prompts=[{q:"Which is closer to 1 meter in height?",a:["A house cat","A kitchen counter","A two-story building"],correct:1},{q:"Which is closer to 10 meters long?",a:["A city bus","A pencil","A football field"],correct:0},{q:"Which is usually tallest?",a:["A giraffe","A house cat","A dining chair"],correct:0},{q:"Which is closest to 1 kilogram?",a:["A large watermelon","A paper clip","A small apple"],correct:0},{q:"Which is around 2 meters tall?",a:["A doorway","A smartphone","A coin"],correct:0}];
      const q=prompts[Math.floor(Math.random()*prompts.length)];const title=document.createElement("h3");title.textContent=q.q;const choices=document.createElement("div");choices.className="size-choices";let chosen=false;q.a.forEach((a,i)=>{const b=button(a,()=>{if(chosen)return;chosen=true;const ok=i===q.correct;finishGame(ok?100:Math.max(15,Math.round(55-Math.abs(i-q.correct)*25)),`${ok?"Correct!":"Not quite."} Best answer: ${q.a[q.correct]}.`)});b.classList.add("size-choice");choices.appendChild(b)});stage.append(title,choices);
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