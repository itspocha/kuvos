import { connect } from './cdp.mjs';
const BASE = 'http://127.0.0.1:' + (process.env.SERVE_PORT || 8765);
const { send, ev, goto, close } = await connect();
const sleep = ms => new Promise(r => setTimeout(r, ms));

for (const [w, h, label] of [[1280, 900, 'desktop'], [390, 800, 'mobile']]) {
  await goto(BASE + '/index.html', w, h, w < 768);
  await sleep(800);
  const r = await ev(`(async()=>{
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    // record every frame while smooth-scrolling the whole page
    const frames=[]; let last=performance.now(), stop=false;
    const tick=t=>{ frames.push(t-last); last=t; if(!stop) requestAnimationFrame(tick); };
    requestAnimationFrame(t=>{last=t; requestAnimationFrame(tick);});
    const H=document.documentElement.scrollHeight-innerHeight;
    const steps=90;
    for(let i=0;i<=steps;i++){ scrollTo(0, H*i/steps); await sleep(16); }
    stop=true; await sleep(60);
    const f=frames.filter(x=>x>0&&x<400);
    f.sort((a,b)=>a-b);
    const pct=p=>f[Math.floor(f.length*p)];
    const longTasks=performance.getEntriesByType('longtask')||[];
    return {frames:f.length, median:+pct(.5).toFixed(1), p95:+pct(.95).toFixed(1),
            worst:+f[f.length-1].toFixed(1),
            over32:f.filter(x=>x>32).length, over50:f.filter(x=>x>50).length,
            fps:+(1000/pct(.5)).toFixed(1)};
  })()`);
  console.log(`${label} (${w}x${h}):`);
  console.log(`  frames ${r.frames} · median ${r.median}ms (${r.fps} fps) · p95 ${r.p95}ms · worst ${r.worst}ms`);
  console.log(`  dropped: ${r.over32} frames >32ms, ${r.over50} frames >50ms`);
}

// which properties actually animate — confirm nothing triggers layout
await goto(BASE + '/index.html', 1280, 900);
const props = await ev(`(()=>{
  const out=new Set();
  for(const s of document.styleSheets){
    let rules; try{rules=s.cssRules}catch(e){continue}
    for(const r of rules){
      if(r.style && r.style.transitionProperty) out.add('T:'+r.style.transitionProperty);
      if(r.style && r.style.animationName && r.style.animationName!=='none') out.add('A:'+r.style.animationName);
    }
  }
  return [...out].sort();
})()`);
console.log('\nanimated properties in use:');
console.log('  ' + props.join('\n  '));
close();
