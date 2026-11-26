/* StudyAI Notification Centre — Settings + in-app inbox + opt-in local reminders */
(function () {
  'use strict';
  if (window.__studyAINotificationsV1) return;
  window.__studyAINotificationsV1 = true;
  const KEY='studyai.notifications.v1';
  const defaults={enabled:true,study:true,quiz:true,goals:true,community:true,updates:true,sound:false,time:'18:00',quietStart:'22:00',quietEnd:'07:00',items:[]};
  let state;
  try { state={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}; } catch(e){ state={...defaults}; }
  const save=()=>{ try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){} };
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const now=()=>new Date().toISOString();
  const quiet=()=>{
    const t=new Date(), n=t.getHours()*60+t.getMinutes();
    const m=v=>{const a=String(v||'').split(':').map(Number);return (a[0]||0)*60+(a[1]||0)};
    const a=m(state.quietStart),b=m(state.quietEnd);
    return a>b ? n>=a||n<b : n>=a&&n<b;
  };
  function notify(title,body,kind='updates',url=''){
    if(!state.enabled || state[kind]===false) return;
    const item={id:Date.now()+'-'+Math.random().toString(36).slice(2),title,body,kind,at:now(),read:false,url};
    state.items.unshift(item); state.items=state.items.slice(0,100); save(); render();
    if(!quiet() && 'Notification' in window && Notification.permission==='granted'){
      try { const n=new Notification(title,{body,icon:'./icon-192.png',tag:'studyai-'+kind,renotify:false}); n.onclick=()=>{window.focus();if(url)location.hash=url;n.close();}; }catch(e){}
    }
  }
  function render(){
    const root=document.getElementById('saiNotificationSettings');
    if(root){
      root.querySelector('[data-notif-list]').innerHTML=state.items.length?state.items.map(x=>'<button type="button" class="saiNotifItem '+(x.read?'read':'unread')+'" data-open="'+esc(x.id)+'"><span class="saiNotifDot"></span><span><b>'+esc(x.title)+'</b><small>'+esc(x.body)+'</small><em>'+new Date(x.at).toLocaleString()+'</em></span></button>').join(''):'<p class="saiNotifEmpty">You are all caught up. New notifications will appear here.</p>';
      const count=state.items.filter(x=>!x.read).length;
      root.querySelector('[data-notif-count]').textContent=count+' unread';
    }
    const badge=document.querySelector('#saiNotifBell b');
    if(badge){const n=state.items.filter(x=>!x.read).length;badge.textContent=n>99?'99+':String(n);badge.hidden=!n;}
  }
  function inject(){
    const settings=document.getElementById('settings');
    if(settings&&!document.getElementById('saiNotificationSettings')){
      const card=document.createElement('div'); card.id='saiNotificationSettings';card.className='card';
      card.innerHTML='<div class="saiNotifHead"><div><h2>🔔 Notification Centre</h2><p class="muted">Manage reminders and see your complete notification history.</p></div><span data-notif-count>0 unread</span></div>'+
      '<div class="saiNotifGrid">'+[
        ['enabled','All notifications','Master switch for StudyAI notifications.'],
        ['study','Study reminders','Daily study-time reminders.'],
        ['quiz','Quiz updates','Quiz reminders and result alerts.'],
        ['goals','Study goals & streaks','Goal and streak reminders.'],
        ['community','Community activity','Followers, messages and community activity.'],
        ['updates','StudyAI announcements','New features and important updates.'],
        ['sound','Notification sound','Play a sound for in-app alerts.']
      ].map(([k,t,d])=>'<label class="saiNotifToggle"><span><b>'+t+'</b><small>'+d+'</small></span><input type="checkbox" data-pref="'+k+'" '+(state[k]?'checked':'')+'></label>').join('')+'</div>'+
      '<div class="saiNotifTimes"><label>Daily reminder time <input type="time" data-pref="time" value="'+esc(state.time)+'"></label><label>Quiet hours start <input type="time" data-pref="quietStart" value="'+esc(state.quietStart)+'"></label><label>Quiet hours end <input type="time" data-pref="quietEnd" value="'+esc(state.quietEnd)+'"></label></div>'+
      '<div class="saiNotifActions"><button type="button" class="btn" data-permission>Enable device notifications</button><button type="button" class="btn alt" data-test>Send test notification</button><button type="button" class="btn alt" data-readall>Mark all as read</button><button type="button" class="btn alt" data-clear>Clear history</button></div>'+
      '<h3 class="saiNotifSubhead">All notifications</h3><div data-notif-list class="saiNotifList"></div>'+
      '<p class="saiNotifNote">Device notifications require browser permission. Scheduled reminders run while StudyAI is open; server-triggered alerts (such as new messages while offline) need a connected notification service.</p>';
      settings.appendChild(card);
    }
    const top=document.querySelector('.studyTopbar');
    if(top&&!document.getElementById('saiNotifBell')){
      const b=document.createElement('button');b.id='saiNotifBell';b.type='button';b.className='saiNotifBell';b.setAttribute('aria-label','Open notifications');b.innerHTML='🔔<b hidden>0</b>';
      b.addEventListener('click',()=>{location.hash='#settings';setTimeout(()=>document.getElementById('saiNotificationSettings')?.scrollIntoView({behavior:'smooth'}),120);});
      top.appendChild(b);
    }
    if(!document.getElementById('saiNotifCss')){
      const st=document.createElement('style');st.id='saiNotifCss';st.textContent='#saiNotificationSettings{margin-top:18px;padding:20px;border:1px solid #e5e7ff;background:linear-gradient(135deg,#fff,#f8f7ff 65%,#fff6fb)}.saiNotifHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.saiNotifHead h2{margin:0 0 5px;font-size:20px}.saiNotifHead p{margin:0}.saiNotifHead>[data-notif-count]{font-size:12px;color:#635bff;font-weight:800;background:#eeedff;padding:7px 10px;border-radius:30px}.saiNotifGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:18px 0}.saiNotifToggle{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px;border:1px solid #e8e9f5;border-radius:13px;background:#fff}.saiNotifToggle b,.saiNotifToggle small{display:block}.saiNotifToggle small{font-size:11px;color:#68738a;margin-top:3px}.saiNotifToggle input{width:19px;height:19px;accent-color:#635bff;flex:none}.saiNotifTimes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.saiNotifTimes label{font-size:12px;font-weight:700;color:#47516a}.saiNotifTimes input{display:block;width:100%;margin-top:6px;padding:10px;border:1px solid #dfe2f0;border-radius:10px;background:#fff}.saiNotifActions{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.saiNotifActions .btn{font-size:12px}.saiNotifSubhead{margin:18px 0 8px}.saiNotifList{display:grid;gap:7px}.saiNotifItem{display:flex;text-align:left;gap:10px;padding:11px;border:1px solid #e8e9f5;border-radius:12px;background:#fff;color:#15213b}.saiNotifItem.unread{background:#f5f4ff;border-color:#d8d4ff}.saiNotifItem small,.saiNotifItem em{display:block;font-size:11px;color:#68738a;margin-top:3px;font-style:normal}.saiNotifDot{width:9px;height:9px;border-radius:50%;background:#635bff;margin-top:5px;flex:none}.saiNotifItem.read .saiNotifDot{background:#cbd0df}.saiNotifEmpty,.saiNotifNote{font-size:12px;color:#68738a}.saiNotifBell{position:relative;border:1px solid #e5e7f5;background:#fff;border-radius:12px;padding:9px 12px;font-size:18px;cursor:pointer}.saiNotifBell b{position:absolute;right:-6px;top:-7px;min-width:18px;padding:2px 5px;border-radius:20px;background:#ff4fa3;color:white;font-size:10px}.saiNotifBell b[hidden]{display:none}@media(max-width:600px){.saiNotifGrid,.saiNotifTimes{grid-template-columns:1fr}.saiNotifHead{flex-wrap:wrap}}';
      document.head.appendChild(st);
    }
    render();
  }
  document.addEventListener('change',e=>{const k=e.target?.dataset?.pref;if(!k)return;state[k]=e.target.type==='checkbox'?e.target.checked:e.target.value;save();render();});
  document.addEventListener('click',e=>{
    const b=e.target.closest('#saiNotificationSettings button');if(!b)return;
    if(b.hasAttribute('data-permission')){if(!('Notification'in window)){alert('This browser does not support device notifications.');return;}Notification.requestPermission().then(p=>alert(p==='granted'?'Device notifications enabled.':'Notification permission was not granted.'));return;}
    if(b.hasAttribute('data-test')){notify('StudyAI test notification','Your Notification Centre is working.','updates');return;}
    if(b.hasAttribute('data-readall')){state.items.forEach(x=>x.read=true);save();render();return;}
    if(b.hasAttribute('data-clear')){if(confirm('Clear all notification history?')){state.items=[];save();render();}return;}
    const id=b.dataset.open;if(id){const x=state.items.find(n=>n.id===id);if(x){x.read=true;save();render();if(x.url)location.hash=x.url;}}
  });
  let lastDay='';
  function dailyCheck(){
    if(!state.enabled||!state.study)return;
    const d=new Date(),day=d.toLocaleDateString('en-CA'),hm=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
    if(hm===state.time&&day!==lastDay&&!quiet()){lastDay=day;notify('📚 Time to study!','Your daily StudyAI study reminder is here.','study');}
  }
  document.addEventListener('DOMContentLoaded',inject);
  if(document.readyState!=='loading')inject();
  setInterval(()=>{inject();dailyCheck();},30000);
  window.StudyAINotifications={send:(title,body,kind='updates',url='')=>notify(title,body,kind,url),list:()=>state.items.slice()};
})();