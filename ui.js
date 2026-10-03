// ---------- state & UI helpers ----------
const LS={get(k,d){try{return localStorage.getItem(k)??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const S={role:null,page:'dashboard',tab:{},cls:'6A',teacherId:'t0',child:'s12',attDate:TODAY,side:false,chat:null,hwF:'all',exam:'e2',subj:'Mathematics',auth:{role:null,mode:'in',setup:false,err:''},
 theme:LS.get('es-theme',matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'),scale:parseFloat(LS.get('es-scale','1')),hc:LS.get('es-hc','off'),res:'att'};
const NAV={
 teacher:[['dashboard','Home','🏠'],['attendance','Attendance','✅'],['homework','Homework','📚'],['diary','Class Diary','📝'],['timetable','Timetable','🗓️'],['exams','Exams & Marks','🎯'],['students','Students','🧑‍🎓'],['leave','Leave Requests','🌴'],['messages','Messages','💬'],['announcements','Announcements','📣'],['ptm','Parent Meetings','🤝'],['substitutes','Substitutes','🔁'],['settings','Settings','⚙️']],
 parent:[['dashboard','Home','🏠'],['attendance','Attendance','✅'],['homework','Homework','📚'],['diary','Class Diary','📝'],['timetable','Timetable','🗓️'],['exams','Exams & Report','🎯'],['leave','Apply Leave','🌴'],['messages','Messages','💬'],['announcements','Announcements','📣'],['ptm','Parent Meetings','🤝'],['notifications','Notifications','🔔'],['settings','Settings','⚙️']],
 principal:[['dashboard','Overview','🏠'],['analytics','Analytics','📊'],['approvals','Approvals','🛡️'],['manage','Manage School','🏫'],['timetable','Timetables','🗓️'],['exams','Exams','🎯'],['announcements','Announcements','📣'],['ptm','Parent Meetings','🤝'],['substitutes','Substitutes','🔁'],['reports','Reports','📄'],['settings','Settings','⚙️']]};
const ROLEN={teacher:'Teacher',parent:'Parent',principal:'Principal'};
const badge=(t,c='')=>`<span class="badge ${c}">${esc(t)}</span>`;
const card=(h,b,x='')=>`<section class="card ${x}">${h?`<h2>${h}</h2>`:''}${b}</section>`;
const stat=(l,v,i,c='')=>`<div class="stat ${c}"><span class="si" aria-hidden="true">${i}</span><div><div class="sv">${v}</div><div class="sl">${l}</div></div></div>`;
const head=(t,sub,act='')=>`<div class="ph"><div><h1>${t}</h1>${sub?`<p class="sub">${sub}</p>`:''}</div><div class="pa">${act}</div></div>`;
const empty=(t)=>`<div class="empty"><div style="font-size:2rem" aria-hidden="true">🌱</div>${t}</div>`;
function tabs(pg,list){const cur=S.tab[pg]&&list.find(x=>x[0]===S.tab[pg])?S.tab[pg]:list[0][0];return{cur,html:`<div class="tabs" role="tablist">${list.map(([k,l])=>`<button role="tab" aria-selected="${k===cur}" class="${k===cur?'on':''}" data-a="tab" data-pg="${pg}" data-k="${k}">${l}</button>`).join('')}</div>`}}
const bars=(items,suf='%')=>items.map(i=>`<div class="bar"><span>${esc(i.l)}</span><div class="bt" role="img" aria-label="${esc(i.l)} ${i.v}${suf}"><i style="width:${Math.min(100,i.v)}%"></i></div><b>${i.v}${suf}</b></div>`).join('');
const myClasses=()=>S.role==='teacher'?tch(S.teacherId).classes:S.role==='parent'?[stu(S.child).cls]:CLASSES;
const clsSel=(label='Class')=>`<label class="sel">${label}<select data-c="cls" aria-label="${label}">${myClasses().map(c=>`<option ${c===S.cls?'selected':''}>${c}</option>`).join('')}</select></label>`;
const field=(l,n,t='text',v='',x='')=>`<label class="f">${l}<input name="${n}" type="${t}" value="${esc(v)}" ${x}></label>`;
const opts=(arr,sel)=>arr.map(a=>{const [v,l]=Array.isArray(a)?a:[a,a];return `<option value="${esc(v)}" ${v===sel?'selected':''}>${esc(l)}</option>`}).join('');
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;$('#toasts').append(t);setTimeout(()=>t.remove(),3200)}
function openModal(title,body){const r=$('#modal-root');r.innerHTML=`<div class="ov" data-a="closebg"><div class="md" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h2 style="margin:0">${title}</h2><button class="ib" data-a="close" aria-label="Close dialog">✕</button></header>${body}</div></div>`;const f=r.querySelector('input,select,textarea,button.btn')||r.querySelector('.ib');f&&f.focus()}
const closeModal=()=>{$('#modal-root').innerHTML=''};
const unread=()=>D.notifs.filter(n=>n.to.includes(S.role)&&!n.read).length;
// ---------- auth ----------
function authView(){
 const a=S.auth;
 const top=`<div class="hero"><div class="logo" aria-hidden="true">🎓</div><h1>EduSphere</h1><p class="sub">Attendance, homework, marks and messages — all in one friendly place.</p></div>`;
 if(!a.role)return `<div class="auth"><div class="ab">${top}<h2 style="text-align:center;margin-top:1.4rem">Who are you?</h2><div class="roles">
 <button class="rc" data-a="pickrole" data-r="parent"><div class="big">👨‍👩‍👧</div><h3>Parent</h3><p class="sub">See your child’s attendance, homework, marks and talk to teachers.</p></button>
 <button class="rc" data-a="pickrole" data-r="teacher"><div class="big">👩‍🏫</div><h3>Teacher</h3><p class="sub">Mark attendance, post homework, enter marks and manage leave.</p></button>
 <button class="rc" data-a="pickrole" data-r="principal"><div class="big">🏫</div><h3>Principal</h3><p class="sub">School-wide analytics, approvals, staff, classes and reports.</p></button></div>
 <p class="demo" style="text-align:center">Prototype with sample data — pick any role to explore every feature.</p></div></div>`;
 const r=a.role;
 let form='';
 if(r==='parent')form=`<p class="sub">Enter the private code from your child’s school card.</p>${field('Student code','code','text','','placeholder="e.g. AARAV-6A" autocomplete="off" required')}<p class="sub">Demo code: <button type="button" class="chip" data-a="fill" data-v="AARAV-6A">AARAV-6A</button></p>`;
 if(r==='teacher')form=`<div class="tabs"><button type="button" class="${a.mode==='in'?'on':''}" data-a="authmode" data-v="in">Sign in</button><button type="button" class="${a.mode==='join'?'on':''}" data-a="authmode" data-v="join">Join school</button></div>
  ${a.mode==='join'?field('Full name','name','text','','required'):''}${field('Email','email','email','anita@tisk.edu','required')}${a.mode==='join'?field('Main subject','subj','text',''):field('Password','pw','password','demo1234','required')}${field('School code','school','text','TISK-2026','required')}`;
 if(r==='principal')form=`${field('Email','email','email','principal@tisk.edu','required')}${field('Password','pw','password','demo1234','required')}
  <label class="tog" style="border:0"><span><b>Set up a new school</b><br><span class="sub">Create your school profile in 30 seconds</span></span><span class="sw"><input type="checkbox" data-c="setup" ${a.setup?'checked':''} aria-label="Set up a new school"><span></span></span></label>
  ${a.setup?`<div class="row">${field('School name','sname','text','','required')}${field('Place','saddr','text','')}</div>`:''}`;
 return `<div class="auth"><div class="ab" style="max-width:480px">${top}<form class="card form" data-f="login" style="margin-top:1.2rem" novalidate><div style="display:flex;align-items:center;gap:.5rem"><button type="button" class="ib" data-a="authback" aria-label="Back to role selection">←</button><h2 style="margin:0">${ROLEN[r]} sign in</h2></div>
 ${a.err?`<div class="badge bad" role="alert" style="border-radius:10px;padding:.5rem .8rem">${esc(a.err)}</div>`:''}${form}
 <button class="btn" type="submit">${a.mode==='join'?'Join school':a.setup?'Create school & continue':'Continue'}</button>
 ${r!=='parent'?`<button class="btn out" type="button" data-a="demo" data-r="${r}">Skip – use demo account</button>`:`<button class="btn out" type="button" data-a="demo" data-r="parent">Skip – use demo account</button>`}</form></div></div>`;
}
// ---------- shell ----------
function shell(){
 const nav=NAV[S.role];const cur=nav.find(n=>n[0]===S.page)||(S.page==='notifications'?['notifications','Notifications','🔔']:nav[0]);
 const u=unread();
 const who=S.role==='teacher'?'Ms. '+tch(S.teacherId).name:S.role==='parent'?'Parent of '+stu(S.child).name.split(' ')[0]:'Principal';
 return `<div class="shell"><aside class="side ${S.side?'open':''}" aria-label="Main navigation"><div class="brand"><span class="logo" aria-hidden="true">🎓</span>EduSphere</div>
 <nav class="nav">${nav.map(n=>`<button data-a="go" data-p="${n[0]}" ${n[0]===S.page?'aria-current="page"':''}><span class="ni" aria-hidden="true">${n[2]}</span>${n[1]}</button>`).join('')}</nav>
 <div class="who"><b>${esc(who)}</b><br><span class="sub">${esc(D.school.name)}</span><br><button class="btn sm out" style="margin-top:.6rem" data-a="switch">Switch role</button> <button class="btn sm out" style="margin-top:.6rem" data-a="logout">Log out</button></div></aside>
 <div class="mc"><header class="top"><button class="ib menu" data-a="menu" aria-label="Open menu" aria-expanded="${S.side}">☰</button><strong>${cur[2]} ${cur[1]}</strong><span class="sp"></span>
 <button class="ib" data-a="scale" data-d="-1" aria-label="Smaller text">A−</button><button class="ib" data-a="scale" data-d="1" aria-label="Larger text">A+</button>
 <button class="ib" data-a="hc" aria-pressed="${S.hc==='on'}" aria-label="High contrast">HC</button>
 <button class="ib" data-a="theme" aria-label="Switch to ${S.theme==='dark'?'light':'dark'} theme">${S.theme==='dark'?'☀️':'🌙'}</button>
 <button class="ib" data-a="go" data-p="notifications" aria-label="Notifications, ${u} unread">🔔${u?`<span class="dot">${u}</span>`:''}</button></header>
 <main id="main" tabindex="-1">${pageHTML()}</main></div>
 <nav class="bottom" aria-label="Quick navigation">${nav.slice(0,4).map(n=>`<button data-a="go" data-p="${n[0]}" ${n[0]===S.page?'aria-current="page"':''}><span class="ni" aria-hidden="true">${n[2]}</span>${n[1].split(' ')[0]}</button>`).join('')}<button data-a="menu"><span class="ni" aria-hidden="true">☰</span>More</button></nav></div>`;
}
function render(focusMain){
 const app=$('#app');const y=window.scrollY;
 document.documentElement.dataset.theme=S.theme;document.documentElement.dataset.hc=S.hc;document.documentElement.style.setProperty('--scale',S.scale);
 app.innerHTML=S.role?shell():authView();
 if(focusMain){const m=$('#main');m&&m.focus({preventScroll:true});window.scrollTo(0,0)}else window.scrollTo(0,y);
}
