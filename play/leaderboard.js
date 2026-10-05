// Leaderboard with a local (per-browser) fallback and an optional shared backend.
// To share scores between visitors, set LB.url to a deployed endpoint (see leaderboard-backend.gs).
(function(){
  const LB={url:'',max:10};
  const key=g=>'lb_'+g;
  const loadLocal=g=>{try{return JSON.parse(localStorage.getItem(key(g))||'[]')}catch(e){return[]}};
  const saveLocal=(g,a)=>{try{localStorage.setItem(key(g),JSON.stringify(a))}catch(e){}};
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  LB.top=async(g,order)=>{let rows=null;
    if(LB.url){try{const r=await fetch(LB.url+'?game='+encodeURIComponent(g));const j=await r.json();if(Array.isArray(j))rows=j}catch(e){}}
    if(!rows)rows=loadLocal(g);
    rows.sort((a,b)=>order=='asc'?a.score-b.score:b.score-a.score);return rows.slice(0,LB.max)};
  LB.submit=async(g,name,score)=>{
    name=String(name||'').replace(/[^\w .\-]/g,'').trim().slice(0,12)||'anon';
    const rows=loadLocal(g);rows.push({name,score,t:Date.now()});saveLocal(g,rows.slice(-200));
    if(LB.url){try{await fetch(LB.url,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({game:g,name,score})})}catch(e){}}};
  // Render a leaderboard into `el`. If `pending` is a score, show a name form to submit it.
  LB.show=async(el,g,{order='desc',fmt=v=>v,pending=null}={})=>{
    const rows=await LB.top(g,order);
    let h='<h3>Leaderboard</h3>';
    if(pending!=null){h+=`<form class="lbform"><input maxlength="12" placeholder="Your name" autocomplete="off"><button class="on" type="submit">Submit ${esc(fmt(pending))}</button></form>`}
    h+=rows.length?'<table class="lb">'+rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${esc(fmt(r.score))}</td></tr>`).join('')+'</table>':'<p>No scores yet. Be the first.</p>';
    h+=`<div class="lbnote">${LB.url?'Shared leaderboard.':'Scores are stored in this browser only.'}</div>`;
    el.innerHTML=h;
    const f=el.querySelector('form');
    if(f)f.addEventListener('submit',async e=>{e.preventDefault();const b=f.querySelector('button');b.disabled=true;await LB.submit(g,f.querySelector('input').value,pending);LB.show(el,g,{order,fmt})});
  };
  window.LB=LB;
})();
