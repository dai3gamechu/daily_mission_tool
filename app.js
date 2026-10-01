const KEY='dai3_daily_mission_v1';
const FIXED=[['gold','Gold購入'],['truck','トラック 4台'],['raid','トラックレイド 5回'],['arena','終末のアリーナ 5回']];
const DEFAULT_TARGET=25, CYCLE_DAYS=30, CYCLE_ANCHOR=new Date(2026,9,5,9,0,0);
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const dateKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fmt=d=>`${d.getMonth()+1}/${d.getDate()}`;
function missionDate(now=new Date()){let d=new Date(now);if(d.getHours()<9)d.setDate(d.getDate()-1);d.setHours(9,0,0,0);return d}
function weekStart(d){let x=new Date(d),dow=x.getDay(),back=(dow-Number(state.settings.weekStart)+7)%7;x.setDate(x.getDate()-back);x.setHours(9,0,0,0);return x}
function cycleFor(d){let diff=Math.floor((d-CYCLE_ANCHOR)/86400000);let idx=Math.floor(diff/CYCLE_DAYS);let start=new Date(CYCLE_ANCHOR);start.setDate(start.getDate()+idx*CYCLE_DAYS);let end=new Date(start);end.setDate(end.getDate()+29);return {start,end,idx}}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch{return {}}}
let state=load();state.days??={};state.cycle??={};state.settings??={};state.settings.cycleTarget??=DEFAULT_TARGET;state.settings.weekStart??=6;
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function dayData(k){state.days[k]??={fixed:{},extras:[]};state.days[k].fixed??={};state.days[k].extras??=[];return state.days[k]}
function normalize(){const md=missionDate(),k=dateKey(md);dayData(k);save();return md}
function render(){const md=normalize(),k=dateKey(md),data=dayData(k);$('dateLabel').textContent=`${md.getFullYear()}年${md.getMonth()+1}月${md.getDate()}日`;
 const ws=weekStart(md),we=new Date(ws);we.setDate(we.getDate()+6);$('periodLabel').textContent=`今週 ${fmt(ws)} ～ ${fmt(we)}`;
 $('weekStartSelect').value=String(state.settings.weekStart);renderDaily(md,data);renderWeek(md);renderCycle(md);renderExtras(md,data)}
function renderDaily(md,data){const box=$('dailyTasks');box.innerHTML='';FIXED.forEach(([id,name])=>{let row=document.createElement('label');row.className='task'+(data.fixed[id]?' done':'');row.innerHTML=`<input type="checkbox" ${data.fixed[id]?'checked':''}><span class="task-name">${name}</span>`;row.querySelector('input').onchange=e=>{data.fixed[id]=e.target.checked;save();render()};box.append(row)});
 let done=FIXED.filter(([id])=>data.fixed[id]).length,total=FIXED.length;$('dailyCount').textContent=`${done} / ${total} 達成`;$('dailyDone').classList.toggle('hidden',done!==total)}
function renderWeek(md){const ws=weekStart(md),grid=$('weekGrid');grid.innerHTML='';let achieved=0,elapsed=0;Array.from({length:7},(_,i)=>['日','月','火','水','木','金','土'][(Number(state.settings.weekStart)+i)%7]).forEach((dow,i)=>{let d=new Date(ws);d.setDate(d.getDate()+i);let k=dateKey(d),isToday=k===dateKey(md),past=d<md,ok=!!state.days[k]?.fixed?.gold;let mark,cls;if(ok){mark='✓';cls='ok';achieved++}else if(past){mark='×';cls='miss'}else if(isToday){mark='●';cls='current'}else{mark='－';cls='future'}if(past||isToday)elapsed++;let el=document.createElement('div');el.className=`day ${cls}${isToday?' today':''}`;el.innerHTML=`<div class="dow">${dow}</div><div class="mark">${mark}</div><small>${fmt(d)}</small>`;grid.append(el)});$('goldScore').textContent=`${achieved} / ${elapsed}日達成`}
function renderCycle(md){const c=cycleFor(md),ck=dateKey(c.start);state.cycle[ck]??={days:{}};let rec=state.cycle[ck];rec.days??={};rec.manualAdjustment??=0;let target=Math.max(1,Math.min(CYCLE_DAYS,Number(state.settings.cycleTarget)||DEFAULT_TARGET));state.settings.cycleTarget=target;let today=dateKey(md),autoCount=Object.values(rec.days).filter(Boolean).length,count=Math.max(0,Math.min(CYCLE_DAYS,autoCount+rec.manualAdjustment)),dayNo=Math.floor((md-c.start)/86400000)+1;dayNo=Math.max(1,Math.min(CYCLE_DAYS,dayNo));let doneToday=!!rec.days[today],daysLeft=CYCLE_DAYS-dayNo+1,remainingOpportunities=Math.max(0,daysLeft-(doneToday?1:0)),needed=Math.max(0,target-count),grace=remainingOpportunities-needed;
 $('cycleDates').textContent=`${fmt(c.start)} ～ ${fmt(c.end)}（30日間）`;$('cycleCount').textContent=`${count} / ${target}日 達成`;$('progressBar').style.width=`${Math.min(100,count/target*100)}%`;$('daysLeft').textContent=`${remainingOpportunities}日`;$('needed').textContent=`あと${needed}回`;$('grace').textContent=needed===0?'達成済み':grace>=0?`${grace}日`:`${Math.abs(grace)}回不足`;
 let graceBox=$('grace').closest('div');graceBox.classList.remove('grace-warning','grace-danger');if(needed>0&&grace===0)graceBox.classList.add('grace-danger');else if(needed>0&&grace>=1&&grace<=3)graceBox.classList.add('grace-warning');else if(grace<0)graceBox.classList.add('grace-danger');
 $('cycleStatus').textContent=count>=target?'サイクル達成！':`${dayNo}日目`;
 let targetMinus=$('targetMinus'),targetPlus=$('targetPlus');$('targetCount').textContent=`${target}日`;targetMinus.disabled=target<=1;targetPlus.disabled=target>=CYCLE_DAYS;targetMinus.onclick=()=>{if(target<=1)return;state.settings.cycleTarget=target-1;save();render()};targetPlus.onclick=()=>{if(target>=CYCLE_DAYS)return;state.settings.cycleTarget=target+1;save();render()};
 let minus=$('cycleMinus'),plus=$('cyclePlus');$('cycleManualCount').textContent=`${count}回`;minus.disabled=count<=0;plus.disabled=count>=CYCLE_DAYS;minus.onclick=()=>{if(count<=0)return;rec.manualAdjustment--;save();render()};plus.onclick=()=>{if(count>=CYCLE_DAYS)return;rec.manualAdjustment++;save();render()};
 let btn=$('cycleToggle'),done=!!rec.days[today];btn.textContent=done?'✓ 今日のアイテム購入：達成済み':'今日のアイテム購入を達成にする';btn.classList.toggle('done-today',done);btn.onclick=()=>{rec.days[today]=!done;save();render()};
 $('cycleNote').textContent=count>=target?`${target}回達成済みです。残りの日は購入しなくても目標達成です。`:grace===0?'⚠ 猶予なし：残りの日はすべて達成が必要です。':grace<0?`⚠ 現在の残り日数では${target}回に届きません。`:`現在、${grace}日まで未達成でも${target}回に到達できます。`;save()}
function renderExtras(md,data){let box=$('extraTasks');box.innerHTML='';data.extras.forEach((t,i)=>{let row=document.createElement('div');row.className='task'+(t.done?' done':'');row.innerHTML=`<input type="checkbox" ${t.done?'checked':''}><span class="task-name"></span><button class="delete" title="削除">×</button>`;row.querySelector('.task-name').textContent=t.name;row.querySelector('input').onchange=e=>{t.done=e.target.checked;save();render()};row.querySelector('.delete').onclick=()=>{data.extras.splice(i,1);save();render()};box.append(row)})}
$('addForm').onsubmit=e=>{e.preventDefault();let input=$('newTask'),name=input.value.trim();if(!name)return;let md=normalize();dayData(dateKey(md)).extras.push({name,done:false});input.value='';save();render()};

function backupData(){
 const payload={app:'dai3_daily_mission',version:1,exportedAt:new Date().toISOString(),state};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const a=document.createElement('a'),now=new Date();
 a.href=URL.createObjectURL(blob);
 a.download=`mission-backup-${dateKey(now)}-${pad(now.getHours())}${pad(now.getMinutes())}.json`;
 document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(a.href);
}
function restoreData(file){
 const reader=new FileReader();
 reader.onload=()=>{
  try{
   const parsed=JSON.parse(reader.result);
   const restored=parsed?.app==='dai3_daily_mission' ? parsed.state : parsed;
   if(!restored || typeof restored!=='object' || Array.isArray(restored))throw new Error('invalid');
   if(!confirm('現在の保存データを、このバックアップの内容で置き換えます。よろしいですか？'))return;
   state=restored;state.days??={};state.cycle??={};state.settings??={};state.settings.cycleTarget??=DEFAULT_TARGET;state.settings.weekStart??=6;save();render();alert('バックアップから復元しました。');
  }catch{alert('このファイルは有効なバックアップではありません。')}
  $('restoreFile').value='';
 };
 reader.onerror=()=>{alert('バックアップファイルを読み込めませんでした。');$('restoreFile').value=''};
 reader.readAsText(file);
}
$('weekStartSelect').onchange=e=>{state.settings.weekStart=Number(e.target.value);save();render()};
$('backupBtn').onclick=backupData;
$('restoreBtn').onclick=()=>$('restoreFile').click();
$('restoreFile').onchange=e=>{const file=e.target.files?.[0];if(file)restoreData(file)};

$('resetBtn').onclick=()=>{if(confirm('すべての達成履歴と追加ミッションを削除します。よろしいですか？')){localStorage.removeItem(KEY);location.reload()}};
render();setInterval(render,60000);
