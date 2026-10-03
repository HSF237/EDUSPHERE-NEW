// ---------- actions ----------
const me=()=>S.role==='parent'?'p':'t';
function enter(role){S.role=role;S.page='dashboard';S.side=false;S.auth={role:null,mode:'in',setup:false,err:''};S.cls=myClasses()[0];S.chat=null;render(true);toast('Welcome to EduSphere 👋')}
function go(p){S.page=p;S.side=false;if(!myClasses().includes(S.cls))S.cls=myClasses()[0];closeModal();render(true)}
const fdata=f=>Object.fromEntries(new FormData(f).entries());
const A={
 pickrole(el){S.auth={role:el.dataset.r,mode:'in',setup:false,err:''};render()},
 authback(){S.auth={role:null,mode:'in',setup:false,err:''};render()},
 authmode(el){S.auth.mode=el.dataset.v;S.auth.err='';render()},
 fill(el){const i=$('input[name=code]');i.value=el.dataset.v;i.focus()},
 demo(el){if(el.dataset.r==='parent')S.child='s12';if(el.dataset.r==='parent')S.cls='6A';closeModal();enter(el.dataset.r)},
 logout(){S.role=null;S.side=false;closeModal();render(true)},
 switch(){openModal('Switch role (demo)',`<div class="list">${['parent','teacher','principal'].map(r=>`<button class="btn out" data-a="demo" data-r="${r}" style="text-align:left">${{parent:'👨‍👩‍👧 Parent',teacher:'👩‍🏫 Teacher',principal:'🏫 Principal'}[r]}</button>`).join('')}</div>`)},
 menu(){S.side=!S.side;render()},
 scale(el){S.scale=Math.max(.85,Math.min(1.5,Math.round((S.scale+.1*el.dataset.d)*10)/10));LS.set('es-scale',S.scale);render()},
 hc(){S.hc=S.hc==='on'?'off':'on';LS.set('es-hc',S.hc);render()},
 theme(){S.theme=S.theme==='dark'?'light':'dark';LS.set('es-theme',S.theme);render()},
 go(el){go(el.dataset.p)},
 tab(el){S.tab[el.dataset.pg]=el.dataset.k;render()},
 close(){closeModal()},
 closebg(el,e){if(e.target===el)closeModal()},
 att(el){const d=S.attDate;D.att[d]=D.att[d]||{};D.att[d][el.dataset.sid]=el.dataset.v;render()},
 allp(){const d=S.attDate;D.att[d]=D.att[d]||{};clsStudents(S.cls).forEach(s=>D.att[d][s.id]='P');render();toast('All students marked present')},
 attsubmit(){const l=clsStudents(S.cls);if(l.some(s=>!D.att[S.attDate]?.[s.id]))return toast('Please mark every student first');
  const t=tch(S.teacherId);let a=D.approvals.find(x=>x.date===S.attDate&&x.cls===S.cls);if(a){a.status='pending'}else D.approvals.push({id:uid(),date:S.attDate,cls:S.cls,status:'pending',by:t.name});
  pushN('Attendance for Class '+S.cls+' ('+short(S.attDate)+') is waiting for approval',['principal'],'🛡️');
  l.forEach(s=>{if(D.att[S.attDate][s.id]==='A')pushN(s.name+' was marked absent on '+fmt(S.attDate),['parent'],'⚠️')});
  render();toast('Submitted to the principal ✔')},
 hwf(el){S.hwF=el.dataset.k;render()},
 delhw(el){D.hw=D.hw.filter(h=>h.id!==el.dataset.id);render();toast('Homework removed')},
 delsched(el){D.sched=D.sched.filter(h=>h.id!==el.dataset.id);render()},
 delsub(el){D.subs=D.subs.filter(h=>h.id!==el.dataset.id);render()},
 delann(el){D.ann=D.ann.filter(h=>h.id!==el.dataset.id);render();toast('Announcement deleted')},
 readall(){D.notifs.forEach(n=>{if(n.to.includes(S.role))n.read=true});render()},
 lv(el){const l=D.leaves.find(x=>x.id===el.dataset.id);l.status=el.dataset.v;l.note=l.status==='approved'?'Approved by class teacher.':'Please contact the class teacher.';pushN('Leave request for '+stu(l.sid).name+' was '+l.status,['parent'],l.status==='approved'?'✅':'❌');render();toast('Leave '+l.status)},
 apprv(el){const a=D.approvals.find(x=>x.id===el.dataset.id);a.status=el.dataset.v;if(a.status==='returned')pushN('Attendance for Class '+a.cls+' was returned for correction',['teacher'],'↩️');render();toast(a.status==='approved'?'Approved ✔':'Returned to teacher')},
 thread(el){S.chat=el.dataset.k;render()},
 chatwith(el){const s=stu(el.dataset.id);S.cls=s.cls;S.chat=s.id+':'+S.teacherId;closeModal();go('messages')},
 progress(el){progressModal(el.dataset.id)},
 editcell(el){S.cell=[+el.dataset.d,+el.dataset.p];openModal('Choose subject',`<div class="list">${SUBJ.map(j=>`<button class="btn out" data-a="setcell" data-v="${j}">${j}</button>`).join('')}</div>`)},
 setcell(el){D.tt[S.cls][S.cell[0]][S.cell[1]]=el.dataset.v;closeModal();render();toast('Timetable updated')},
 ptmbook(el){const e=D.ptm.find(x=>x.id===el.dataset.e);e.slots.forEach(s=>{if(s.sid===S.child)s.sid=null});e.slots[+el.dataset.i].sid=S.child;pushN(stu(S.child).name+'’s parent booked '+e.slots[+el.dataset.i].t+' for PTM',['teacher','principal'],'🤝');render();toast('Slot booked ✔')},
 ptmcancel(el){const e=D.ptm.find(x=>x.id===el.dataset.e);e.slots[+el.dataset.i].sid=null;render();toast('Booking cancelled')},
 notify(el){pushN(stu(el.dataset.id).name+' was absent on '+fmt(el.dataset.d)+' without leave. Please contact the class teacher.',['parent'],'⚠️');toast('Parent notified')},
 notifyall(){const u=unapproved();u.forEach(x=>pushN(x.s.name+' was absent on '+fmt(x.d)+' without leave.',['parent'],'⚠️'));toast(u.length+' parents notified')},
 dl(){const r=reportRows(S.res);download('edusphere-'+S.res+'.csv',csv(r));toast('Report downloaded')},
 print(){window.print()},
 tcls(el){const t=tch(S.teacherId),c=el.dataset.c2;if(t.classes.includes(c)){if(t.classes.length>1)t.classes=t.classes.filter(x=>x!==c)}else t.classes.push(c);if(!t.classes.includes(S.cls))S.cls=t.classes[0];render()},
 delT(el){if(el.dataset.id===S.teacherId)return toast('This is the demo teacher account');if(D.teachers.length<2)return;D.teachers=D.teachers.filter(t=>t.id!==el.dataset.id);render();toast('Teacher removed')},
 delC(el){const c=el.dataset.id;if(clsStudents(c).length)return toast('Move or remove its students first');if(CLASSES.length<2)return;CLASSES.splice(CLASSES.indexOf(c),1);delete D.tt[c];D.teachers.forEach(t=>t.classes=t.classes.filter(x=>x!==c));if(!t0ok())D.teachers[0].classes=[CLASSES[0]];if(S.cls===c)S.cls=CLASSES[0];render()},
 delS(el){const id=el.dataset.id;if(id===S.child)return toast('This is the demo parent’s child');D.students=D.students.filter(s=>s.id!==id);D.leaves=D.leaves.filter(l=>l.sid!==id);D.ptm.forEach(e=>e.slots.forEach(s=>{if(s.sid===id)s.sid=null}));render();toast('Student removed')},
 delJ(el){if(SUBJ.length<4)return toast('Keep at least 3 subjects');const j=el.dataset.id;SUBJ.splice(SUBJ.indexOf(j),1);CLASSES.forEach(c=>D.tt[c].forEach(r=>r.forEach((x,i)=>{if(x===j)r[i]=SUBJ[0]})));render()}
};
const t0ok=()=>D.teachers[0].classes.length>0;
function randMarks(s,e){D.marks[e.id]=D.marks[e.id]||{};D.marks[e.id][s.id]=D.marks[e.id][s.id]||{};SUBJ.forEach(j=>{if(D.marks[e.id][s.id][j]==null)D.marks[e.id][s.id][j]=Math.round(e.max*(.55+.4*rnd()))})}
const F={
 login(f){const a=S.auth,d=fdata(f);a.err='';
  if(a.role==='parent'){const s=D.students.find(x=>x.code===(d.code||'').trim().toUpperCase());if(!s){a.err='We couldn’t find that code. Try AARAV-6A.';return render()}S.child=s.id;S.cls=s.cls}
  if(a.role==='teacher'){if(!/.+@.+\..+/.test(d.email||''))a.err='Please enter a valid email.';else if((d.school||'').trim().toUpperCase()!==D.school.code)a.err='School code not recognised. Try '+D.school.code+'.';else if(a.mode==='join'&&!(d.name||'').trim())a.err='Please enter your name.';if(a.err)return render()}
  if(a.role==='principal'){if(!/.+@.+\..+/.test(d.email||''))a.err='Please enter a valid email.';else if(a.setup&&!(d.sname||'').trim())a.err='Please enter the school name.';if(a.err)return render();if(a.setup){D.school.name=d.sname.trim();D.school.address=d.saddr||D.school.address}}
  enter(a.role)},
 hw(f){const d=fdata(f);D.hw.unshift({id:uid(),cls:S.cls,subj:d.subj,title:d.title,desc:d.desc,due:d.due,by:tch(S.teacherId).name});pushN('New '+d.subj+' homework: '+d.title,['parent'],'📚');render();toast('Homework posted to Class '+S.cls)},
 diary(f){const d=fdata(f);D.diary.unshift({id:uid(),cls:S.cls,date:TODAY,subj:d.subj,text:d.text,by:tch(S.teacherId).name});pushN('New diary note in '+d.subj,['parent'],'📝');render();toast('Diary updated')},
 sched(f){const d=fdata(f);D.sched.push({id:uid(),exam:'e3',cls:S.cls,subj:d.subj,date:d.date,time:d.time||'10:00 AM'});render();toast('Added to schedule')},
 marks(f){const e=D.exams.find(x=>x.id===S.exam),d=fdata(f);let n=0;Object.entries(d).forEach(([sid,v])=>{if(v==='')return;D.marks[e.id]=D.marks[e.id]||{};D.marks[e.id][sid]=D.marks[e.id][sid]||{};D.marks[e.id][sid][S.subj]=Math.max(0,Math.min(e.max,+v));n++});pushN(S.subj+' marks published for '+e.name,['parent'],'🎯');render();toast(n+' marks saved')},
 leave(f){const d=fdata(f);if(d.to<d.from)return toast('“To” date must be after “From”');D.leaves.push({id:uid(),sid:S.child,from:d.from,to:d.to,reason:d.reason,status:'pending',note:''});pushN('New leave request from '+stu(S.child).name,['teacher','principal'],'🌴');render();toast('Leave request sent')},
 send(f){const d=fdata(f);if(!d.text.trim())return;const k=S.chat;(D.chats[k]=D.chats[k]||[]).push({f:me(),text:d.text.trim(),t:'Just now'});render();
  const rp=S.role==='parent'?['Thank you for the update. Noted!','Noted, we will work on this at home.','Sure, will do. Thank you!']:['Thank you for your message. I will check and get back shortly.','Noted. Happy to help!','Understood. See you at the PTM.'];
  setTimeout(()=>{(D.chats[k]=D.chats[k]||[]).push({f:S.role==='parent'?'t':'p',text:rp[Math.floor(Math.random()*rp.length)],t:'Just now'});if(S.page==='messages'&&S.chat===k)render()},1300)},
 ann(f){const d=fdata(f);D.ann.unshift({id:uid(),title:d.title,body:d.body,aud:d.aud,by:S.role==='principal'?'Principal':tch(S.teacherId).name,date:TODAY,pin:d.pin==='on'});pushN('New announcement: '+d.title,['parent'],'📣');render();toast('Announcement published')},
 ptm(f){const d=fdata(f),h=+d.h||10;D.ptm.push({id:uid(),title:d.title,date:d.date,venue:d.venue||'School Hall',slots:mkSlots(h)});pushN('New PTM scheduled: '+d.title,['parent','teacher'],'🤝');render();toast('Meeting created')},
 sub(f){const d=fdata(f);if(d.absent===d.sub)return toast('Choose two different teachers');D.subs.unshift({id:uid(),date:d.date,absent:d.absent,sub:d.sub,cls:d.cls,period:d.period,note:d.note});render();toast('Substitution logged')},
 exam(f){const d=fdata(f);const e={id:'e'+uid(),name:d.name,max:+d.max,done:false,date:d.date};D.exams.push(e);render();toast('Exam created')},
 addT(f){const d=fdata(f);D.teachers.push({id:'t'+uid(),name:d.name,subj:d.subj,classes:(d.classes||'').toUpperCase().split(',').map(x=>x.trim()).filter(x=>CLASSES.includes(x)),email:d.email||'',phone:''});render();toast('Teacher added')},
 addC(f){const c=fdata(f).name.trim().toUpperCase();if(!c||CLASSES.includes(c))return toast('Class already exists');CLASSES.push(c);D.tt[c]=D.tt[CLASSES[0]].map(r=>[...r]);D.classTeacher[c]=D.teachers[0].id;render();toast('Class added')},
 addS(f){const d=fdata(f);const n=clsStudents(d.cls).length;const s={id:'s'+uid(),name:d.name,cls:d.cls,roll:n+1,code:d.name.split(' ')[0].toUpperCase()+'-'+d.cls,phone:'9400000000'};D.students.push(s);D.exams.filter(e=>e.done).forEach(e=>randMarks(s,e));render();toast('Student added · code '+s.code)},
 addJ(f){const j=fdata(f).name.trim();if(!j||SUBJ.includes(j))return toast('Subject already exists');SUBJ.push(j);D.students.forEach(s=>D.exams.filter(e=>e.done).forEach(e=>randMarks(s,e)));render();toast('Subject added')},
 school(f){Object.assign(D.school,fdata(f));render();toast('School profile saved')}
};
const C={
 cls(el){S.cls=el.value;render()},attdate(el){S.attDate=el.value;render()},exam(el){S.exam=el.value;render()},subj(el){S.subj=el.value;render()},res(el){S.res=el.value;render()},
 setup(el){S.auth.setup=el.checked;render()},
 hwdone(el){const d=(D.done[S.child]=D.done[S.child]||{});d[el.dataset.id]=el.checked;render();if(el.checked)toast('Nice work! ✔')},
 darkt(el){A.theme()},hct(){A.hc()},pref(){toast('Preference saved')}
};
// ---------- events ----------
function sig(el){if(!el||el===document.body)return null;const d=el.dataset||{};const parts=Object.entries(d).map(([k,v])=>`[data-${k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}="${CSS.escape(v)}"]`).join('');if(parts)return el.tagName.toLowerCase()+parts;if(el.name)return `${el.tagName.toLowerCase()}[name="${CSS.escape(el.name)}"]`;return null}
const _render=render;
render=function(f){const ae=document.activeElement;const s=f?null:sig(ae);const inModal=ae&&ae.closest&&ae.closest('#modal-root');_render(f);if(s&&!inModal){const n=$(s);n&&n.focus({preventScroll:true})}const m=$('#msgs');if(m)m.scrollTop=m.scrollHeight};
document.addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(!el)return;const f=A[el.dataset.a];if(f){if(el.tagName==='A')e.preventDefault();f(el,e)}});
document.addEventListener('change',e=>{const el=e.target.closest('[data-c]');if(!el)return;const f=C[el.dataset.c];f&&f(el)});
document.addEventListener('submit',e=>{const f=e.target.closest('[data-f]');if(!f)return;e.preventDefault();const h=F[f.dataset.f];h&&h(f)});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){if($('#modal-root').innerHTML)closeModal();else if(S.side){S.side=false;render()}}
 if((e.key==='Enter'||e.key===' ')&&e.target.getAttribute&&e.target.getAttribute('role')==='button'&&e.target.dataset.a){e.preventDefault();e.target.click()}});
render();
