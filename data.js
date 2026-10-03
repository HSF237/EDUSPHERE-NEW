'use strict';
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,8);
let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const fmt=s=>{const d=new Date(s+'T00:00:00');return DAYN[d.getDay()]+', '+d.getDate()+' '+MON[d.getMonth()]};
const short=s=>{const d=new Date(s+'T00:00:00');return d.getDate()+' '+MON[d.getMonth()]};
const T=new Date();while([0,6].includes(T.getDay()))T.setDate(T.getDate()-1);
const TODAY=iso(T);
const addDays=(s,n)=>{const d=new Date(s+'T00:00:00');d.setDate(d.getDate()+n);return iso(d)};
const wk=(s)=>{const d=new Date(s+'T00:00:00').getDay();return d>0&&d<6};
const DAYS=[];{let d=new Date(T);while(DAYS.length<14){if(d.getDay()%6)DAYS.unshift(iso(d));d.setDate(d.getDate()-1)}}
const CLASSES=['5A','5B','6A','6B','7A'];
const SUBJ=['Mathematics','English','Science','Social Science','Malayalam','Hindi','Computer'];
const NAMES=['Diya Nair','Rohan Das','Meera Pillai','Kabir Khan','Anika Roy','Yusuf Ali','Sara Thomas','Arjun Nambiar','Zoya Hameed','Vihaan Rao','Isha Kurian','Adil Rahman','Aarav Menon','Fatima Noor','Neel Varma','Tanvi Joseph','Hamza Iqbal','Riya Sharma','Dev Mohan','Aisha Basheer','Kiran Das','Lena George','Omar Faris','Nila Krishnan','Adhil Shan','Mira Jacob','Ishaan Pai','Zara Mathew','Rayan Siddiq','Anaya Reddy'];
const D={
 school:{name:'TISK English Medium School',code:'TISK-2026',year:'2026-27',address:'Kovvappuram, Kannur, Kerala',phone:'+91 94968 29330'},
 teachers:[
  {id:'t0',name:'Anita Nair',subj:'Mathematics',classes:['6A','6B','5A'],email:'anita@tisk.edu',phone:'98470 11001'},
  {id:'t1',name:'Rahul Varghese',subj:'English',classes:['6A','5B','7A'],email:'rahul@tisk.edu',phone:'98470 11002'},
  {id:'t2',name:'Shaheen Basheer',subj:'Science',classes:['6A','6B','7A'],email:'shaheen@tisk.edu',phone:'98470 11003'},
  {id:'t3',name:'Priya Menon',subj:'Malayalam',classes:['5A','5B','6A'],email:'priya@tisk.edu',phone:'98470 11004'},
  {id:'t4',name:'Joseph Mathew',subj:'Computer',classes:['6A','6B','7A'],email:'joseph@tisk.edu',phone:'98470 11005'}],
 classTeacher:{'5A':'t0','5B':'t1','6A':'t0','6B':'t2','7A':'t4'},
 subjects:[...SUBJ],
 students:NAMES.map((n,i)=>({id:'s'+i,name:n,cls:CLASSES[Math.floor(i/6)],roll:i%6+1,code:n.split(' ')[0].toUpperCase()+'-'+CLASSES[Math.floor(i/6)],phone:'9'+(400000000+i*7919).toString().padStart(9,'0')})),
 att:{},approvals:[],
 hw:[],diary:[],leaves:[],ann:[],notifs:[],chats:{},ptm:[],subs:[],exams:[],marks:{},tt:{},ttIdx:{},
 done:{}
};
const teacherOf=s=>D.teachers.find(t=>t.subj===s)||D.teachers[0];
const periodsT=['9:00','9:50','10:40','11:50','1:30','2:20'];
// timetable
CLASSES.forEach((c,ci)=>{D.tt[c]=[];for(let d=0;d<5;d++){D.tt[c][d]=[];for(let p=0;p<6;p++)D.tt[c][d][p]=SUBJ[(d*2+p+ci)%7]}});
// attendance
CLASSES.forEach(c=>{DAYS.forEach(d=>{D.att[d]=D.att[d]||{};D.students.filter(s=>s.cls===c).forEach(s=>{const r=rnd();D.att[d][s.id]=r<.88?'P':r<.95?'A':'L'})})});
D.att[DAYS[3]].s12='A';D.att[DAYS[8]].s12='A';D.att[TODAY]={}; // today unmarked
CLASSES.forEach(c=>DAYS.forEach((d,i)=>{if(d===TODAY)return;const st=i>=DAYS.length-3&&c!=='6A'?'pending':'approved';D.approvals.push({id:uid(),date:d,cls:c,status:st,by:D.teachers[D.classTeacher[c]==='t0'?0:D.teachers.findIndex(t=>t.id===D.classTeacher[c])].name})}));
// exams & marks
D.exams=[
 {id:'e1',name:'Unit Test 1',max:50,done:true,date:addDays(TODAY,-60)},
 {id:'e2',name:'Mid Term',max:100,done:true,date:addDays(TODAY,-30)},
 {id:'e3',name:'Unit Test 2',max:50,done:false,date:addDays(TODAY,9)}];
D.exams.slice(0,2).forEach(e=>{D.marks[e.id]={};D.students.forEach(s=>{const b=.5+.42*rnd();D.marks[e.id][s.id]={};SUBJ.forEach(j=>{D.marks[e.id][s.id][j]=Math.min(e.max,Math.round(e.max*Math.min(1,b+(rnd()-.5)*.25)))})})});
D.sched=[];SUBJ.forEach((j,i)=>CLASSES.forEach(c=>D.sched.push({id:uid(),exam:'e3',cls:c,subj:j,date:addDays(TODAY,9+i+(i>3?2:0)),time:'10:00 AM'})));
// homework
const hwT=[['Mathematics','Fractions worksheet 4.2','Solve questions 1–12 on page 58.'],['English','Write a paragraph: My Favourite Festival','Minimum 10 lines, neat handwriting.'],['Science','Plant parts diagram','Draw and label a flowering plant.'],['Malayalam','Reading practice','Read lesson 5 aloud twice.'],['Computer','Typing practice','15 minutes of home-row typing.'],['Social Science','Map work','Mark the 14 districts of Kerala.']];
hwT.forEach((h,i)=>D.hw.push({id:uid(),cls:'6A',subj:h[0],title:h[1],desc:h[2],due:addDays(TODAY,i<3?1+i:-1+(i-3)),by:teacherOf(h[0]).name}));
D.hw.push({id:uid(),cls:'6B',subj:'Mathematics',title:'Decimals practice',desc:'Exercise 3.1',due:addDays(TODAY,2),by:'Anita Nair'});
D.done={s12:{[D.hw[3].id]:true,[D.hw[4].id]:true,[D.hw[5].id]:true}};
D.students.filter(s=>s.cls==='6A').forEach(s=>{if(s.id==='s12')return;D.done[s.id]={};D.hw.forEach(h=>{if(h.cls==='6A'&&rnd()<.5)D.done[s.id][h.id]=true})});
// diary
[['Today we learnt equivalent fractions. Bring a ruler tomorrow.','Mathematics'],['Class test on Chapter 3 next week. Revise the notes.','Science'],['Library period moved to Friday.','English']].forEach((x,i)=>D.diary.push({id:uid(),cls:'6A',date:DAYS[DAYS.length-1-i],subj:x[1],text:x[0],by:teacherOf(x[1]).name}));
// leaves
D.leaves=[
 {id:uid(),sid:'s12',from:addDays(TODAY,-9),to:addDays(TODAY,-8),reason:'Fever and rest as per doctor.',status:'approved',note:'Get well soon.'},
 {id:uid(),sid:'s13',from:addDays(TODAY,1),to:addDays(TODAY,2),reason:'Family function out of town.',status:'pending',note:''},
 {id:uid(),sid:'s14',from:addDays(TODAY,3),to:addDays(TODAY,3),reason:'Dental appointment.',status:'pending',note:''}];
// announcements
D.ann=[
 {id:uid(),title:'Annual Day rehearsals begin',body:'Rehearsals for Annual Day start Monday after school. Students must carry their costumes list signed by parents.',aud:'All',by:'Principal',date:addDays(TODAY,-1),pin:true},
 {id:uid(),title:'Class 6A field trip',body:'We will visit the Kannur Fort on the 18th. Fee: ₹250. Consent form to be returned by Thursday.',aud:'6A',by:'Anita Nair',date:addDays(TODAY,-2),pin:false},
 {id:uid(),title:'Staff meeting – Friday',body:'All teachers: staff meeting in the library at 3:30 PM.',aud:'Teachers',by:'Principal',date:addDays(TODAY,-3),pin:false}];
// notifications
D.notifs=[
 {id:uid(),to:['parent'],icon:'📣',text:'New announcement: Annual Day rehearsals begin',time:'1 day ago',read:false},
 {id:uid(),to:['parent'],icon:'📚',text:'New Mathematics homework: Fractions worksheet 4.2',time:'2 days ago',read:false},
 {id:uid(),to:['parent'],icon:'✅',text:'Leave request approved for Aarav Menon',time:'9 days ago',read:true},
 {id:uid(),to:['teacher'],icon:'🌴',text:'2 leave requests are waiting for review',time:'Today',read:false},
 {id:uid(),to:['principal'],icon:'🕵️',text:'Attendance for 5B, 7A is waiting for approval',time:'Today',read:false}];
// chats
D.chats['s12:t0']=[{f:'t',text:'Hello! Aarav did very well in the Mid Term. Keep it up.',t:'Mon 4:10 PM'},{f:'p',text:'Thank you ma’am! He has been practising daily.',t:'Mon 6:30 PM'}];
D.chats['s13:t0']=[{f:'p',text:'Ma’am, Fatima will be absent tomorrow. Applied for leave.',t:'Yesterday'}];
// ptm
const mkSlots=(st)=>[0,1,2,3,4,5].map(i=>({t:(st+Math.floor(i/2))+':'+(i%2?'30':'00')+(st+Math.floor(i/2)>=12?' PM':' AM'),sid:null,cls:'6A'}));
D.ptm=[{id:uid(),title:'Term 1 Parent–Teacher Meeting',date:addDays(TODAY,12),venue:'School Hall',slots:[...mkSlots(10)].map((s,i)=>(i===1?{...s,sid:'s14'}:s))}];
// substitutes
D.subs=[{id:uid(),date:addDays(TODAY,-2),absent:'Shaheen Basheer',sub:'Joseph Mathew',cls:'6A',period:3,note:'Science – revision'}];
// ---------- helpers ----------
const clsStudents=c=>D.students.filter(s=>s.cls===c);
const stu=id=>D.students.find(s=>s.id===id);
const tch=id=>D.teachers.find(t=>t.id===id);
const initials=n=>n.split(' ').map(x=>x[0]).slice(0,2).join('');
const attPct=(sid,days=DAYS)=>{let p=0,t=0;days.forEach(d=>{const v=D.att[d]&&D.att[d][sid];if(v){t++;if(v!=='A')p++}});return t?Math.round(p/t*100):100};
const clsAtt=(c,days=DAYS)=>{const a=clsStudents(c).map(s=>attPct(s.id,days));return a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0};
const total=(eid,sid)=>SUBJ.reduce((a,j)=>a+(D.marks[eid]?.[sid]?.[j]||0),0);
const pctOf=(eid,sid)=>{const e=D.exams.find(x=>x.id===eid);return Math.round(total(eid,sid)/(e.max*SUBJ.length)*100)};
const grade=p=>p>=90?'A+':p>=80?'A':p>=70?'B+':p>=60?'B':p>=50?'C':'D';
const gtone=p=>p>=75?'ok':p>=55?'warn':'bad';
const rank=(eid,sid)=>{const c=stu(sid).cls;const l=clsStudents(c).map(s=>[s.id,total(eid,s.id)]).sort((a,b)=>b[1]-a[1]);return l.findIndex(x=>x[0]===sid)+1};
const avgMark=(c,eid)=>{const l=clsStudents(c);return Math.round(l.reduce((a,s)=>a+pctOf(eid,s.id),0)/l.length)};
const hasLeave=(sid,d)=>D.leaves.some(l=>l.sid===sid&&l.status==='approved'&&d>=l.from&&d<=l.to);
const unapproved=()=>{const r=[];DAYS.forEach(d=>D.students.forEach(s=>{if(D.att[d]?.[s.id]==='A'&&!hasLeave(s.id,d))r.push({d,s})}));return r.reverse()};
const pushN=(text,to,icon='🔔')=>{D.notifs.unshift({id:uid(),to,icon,text,time:'Just now',read:false})};
const csv=(rows)=>rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
const download=(name,text)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
