const m=window.MODEL,$=id=>document.getElementById(id),fmt=n=>String(Math.round(n*1e8)/1e8);
const blue='#226bbb',orange='#b75b16',green='#12786d',ink='#172a39',muted='#71808b';
function fill(v){if(!v)return '#fff';const a=Math.sqrt(Math.abs(v)/19)*.78;const end=v<0?[63,132,203]:[226,144,76];return `rgb(${end.map(c=>Math.round(255+(c-255)*a)).join(',')})`}
function matrix(id,rows,labels,columns,groups){const el=$(id);el.style.gridTemplateColumns=`100px repeat(${columns.length},minmax(26px,1fr))`;el.innerHTML='<span></span>'+columns.map(c=>`<span class="col-label">${c}</span>`).join('')+rows.map((row,i)=>`<span class="row-label" data-group="${groups[i]||''}">${labels[i]}</span>`+row.map((v,j)=>`<div class="cell ${v===0?'blank':''}" data-group="${groups[i]||''}" style="background:${fill(v)};color:${v<0?blue:orange}" title="${labels[i]} / ${columns[j]} = ${v}">${v===0?'':v}</div>`).join('')).join('')}
const inputLabels=Array.from({length:32},(_,i)=>i===13?'a':i===14?'b':i>=15&&i<=22?m.ops[i-15]:`x${i}`);
matrix('up-matrix',m.fullUp.map((r,i)=>[...r,m.bias[i]]),m.groups.map((op,i)=>`${op} · h${i+1}`),[...inputLabels,'bias'],m.groups);
matrix('down-matrix',m.fullDown,Array.from({length:32},(_,i)=>i===23?'y23 · OUT':`y${i}`),m.groups.map((_,i)=>`h${i+1}`),[]);
const upNonzero=m.fullUp.flat().filter(Boolean).length+m.bias.filter(Boolean).length,downNonzero=m.fullDown.flat().filter(Boolean).length;
$('sparsity').textContent=`${((1-(upNonzero+downNonzero)/1365)*100).toFixed(1)}% zeros`;
$('up-count').textContent=`${upNonzero} / 693 nonzero`;$('down-count').textContent=`${downNonzero} / 672 nonzero`;
function draw(op,t,a,b){const indices=m.groups.map((n,i)=>n===op?i:-1).filter(i=>i>=0),height=Math.max(470,indices.length*170+100),width=1260;
 const canvas=$('circuit'),dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;canvas.style.aspectRatio=`${width}/${height}`;const c=canvas.getContext('2d');c.scale(dpr,dpr);c.fillStyle='white';c.fillRect(0,0,width,height);
 function text(s,x,y,size=16,color=ink){c.fillStyle=color;c.font=`${size}px system-ui, sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(s,x,y)}
 function circle(x,y,r,stroke=green,bg='white'){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=bg;c.fill();c.strokeStyle=stroke;c.lineWidth=2;c.stroke()}
 function edge(x1,y1,r1,x2,y2,r2,w,dashed=false){const dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy),ux=dx/l,uy=dy/l;const sx=x1+ux*r1,sy=y1+uy*r1,ex=x2-ux*r2,ey=y2-uy*r2;c.strokeStyle=w<0?blue:orange;c.globalAlpha=dashed?.32:.58;c.lineWidth=Math.abs(w)>1?2.3:1.5;c.setLineDash(dashed?[6,5]:[]);c.beginPath();c.moveTo(sx,sy);c.lineTo(ex,ey);c.stroke();c.setLineDash([]);c.globalAlpha=1;const f=x1>400?.67:.23,lx=sx+(ex-sx)*f,ly=sy+(ey-sy)*f;c.fillStyle='white';c.fillRect(lx-22,ly-11,44,22);text(fmt(w),lx,ly,14,w<0?blue:orange)}
 text('INPUT',120,25,13,muted);text('HIDDEN · ReLU',620,25,13,muted);text('OUTPUT',1120,25,13,muted);
 const hasB=indices.some(i=>m.weights[i][1]!==0),sources=[{name:'a',value:a,index:0},{name:'b',value:b,index:1},{name:op,value:1,index:m.ops.indexOf(op)+2}].filter(s=>s.name!=='b'||hasB);
 sources.forEach((s,j)=>s.y=85+(height-170)*(j/(sources.length-1)));
 const neurons=indices.map((i,j)=>({i,y:80+(height-160)*(j+.5)/indices.length}));
 neurons.forEach(({i,y})=>{sources.forEach(s=>{const w=m.weights[i][s.index];if(w)edge(120,s.y,43,620,y,73,w)});edge(620,y,73,1120,height/2,62,m.down[i],Math.abs(t.hidden[i])<1e-9)});
 sources.forEach(s=>{circle(120,s.y,43);text(s.name,120,s.y-13,14,muted);text(String(s.value),120,s.y+13,26)});
 neurons.forEach(({i,y})=>{const active=t.hidden[i]>1e-9;circle(620,y,73,active?green:'#aab6bd',active?'#f3fbf8':'white');text(`h${i+1}`,620,y-49,12,muted);const ws=[];if(m.weights[i][0])ws.push(`wₐ=${m.weights[i][0]}`);if(m.weights[i][1])ws.push(`wᵦ=${m.weights[i][1]}`);text(ws.join('  '),620,y-27,15);text(`wₒₚ=18  b=${m.bias[i]}`,620,y-6,14);text(`${fmt(t.pre[i])} → ${fmt(t.hidden[i])}`,620,y+25,23,active?green:muted)});
 circle(1120,height/2,62,green,'#f3fbf8');text('Σ',1120,height/2-24,18,muted);text(fmt(t.output),1120,height/2+10,38,green);
 text('Output register starts at 0',1120,height/2+98,13,muted);
 canvas.setAttribute('aria-label',`${op} neuron circuit. Inputs a=${a}${hasB?`, b=${b}`:''}. `+indices.map(i=>`h${i+1}: pre-activation ${fmt(t.pre[i])}, ReLU ${fmt(t.hidden[i])}, output weight ${m.down[i]}.`).join(' ')+` Output ${fmt(t.output)}.`);
 $('trace').textContent=indices.map(i=>`(${fmt(t.hidden[i])} × ${m.down[i]})`).join(' + ')+` = ${fmt(t.output)}`;
}
let currentOp='ADD';
function render(){
 const unary=['ABS','NEG'].includes(currentOp);
 $('input-b').disabled=unary;
 $('input-help').textContent=unary?'Integers −8 to 8 · b is not used':'Integers −8 to 8 · Updates live';
 const a=$('input-a').valueAsNumber,b=unary?0:$('input-b').valueAsNumber;
 const valid=n=>Number.isInteger(n)&&n>=-8&&n<=8;
 $('input-a').setAttribute('aria-invalid',String(!valid(a)));
 $('input-b').setAttribute('aria-invalid',String(!unary&&!valid(b)));
 const ok=valid(a)&&valid(b);
 $('input-error').textContent=ok?'':'Enter integers from −8 to 8.';
 $('circuit').hidden=!ok;$('trace').hidden=!ok;
 if(!ok){$('answer').textContent='—';return;}
 const t=executeMLP(m,currentOp,a,b);
 $('answer').textContent=`${currentOp}(${unary?fmt(a):`${fmt(a)}, ${fmt(b)}`}) = ${fmt(t.output)}`;
 draw(currentOp,t,a,b);
}
function select(op){currentOp=op;document.querySelectorAll('#opcodes button').forEach(b=>b.setAttribute('aria-pressed',b.textContent===op));document.querySelectorAll('[data-group]').forEach(el=>el.classList.toggle('selected',el.dataset.group===op));render()}
$('input-a').addEventListener('input',render);$('input-b').addEventListener('input',render);
$('reset').addEventListener('click',()=>{$('input-a').value='3';$('input-b').value='2';render()});
$('opcodes').innerHTML=m.ops.map(op=>`<button type="button" aria-pressed="false">${op}</button>`).join('');document.querySelectorAll('#opcodes button').forEach(b=>b.addEventListener('click',()=>select(b.textContent)));select('ADD');
