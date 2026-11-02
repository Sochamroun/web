const SUBJECTS = [
  "គណិតវិទ្យា","ភាសាខ្មែរ","រូបវិទ្យា","គីមីវិទ្យា","ជីវវិទ្យា",
  "ផែនដីវិទ្យា និងបរិស្ថានវិទ្យា","ប្រវត្តិវិទ្យា","ភូមិវិទ្យា",
  "សីលធម៌-ពលរដ្ឋវិទ្យា","ភាសាបរទេស (អង់គ្លេស ឬ បារាំង)",
  "បច្ចេកវិទ្យាព័ត៌មានវិទ្យា (ICT)","អប់រំកាយ និងកីឡា","សេដ្ឋកិច្ច"
];
const DAYS = ["ចន្ទ","អង្គារ","ពុធ","ព្រហស្បតិ៍","សុក្រ","សៅរ៍"];
const STORAGE_KEY = "personalStudyPlanner_v1";
let activeUser = "";

const $ = id => document.getElementById(id);
const readData = () => { try{return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {users:{}}}catch{return {users:{}}} };
const writeData = data => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
function timeLabel(hour){return `${String(hour).padStart(2,"0")}:00 - ${String(hour+1).padStart(2,"0")}:00`}

function buildTable(){
  const body = $("scheduleBody");
  body.innerHTML = "";
  for(let hour=6;hour<18;hour++){
    const tr=document.createElement("tr");
    const time=document.createElement("td"); time.textContent=timeLabel(hour); tr.appendChild(time);
    DAYS.forEach((day,di)=>{
      const td=document.createElement("td"), select=document.createElement("select");
      select.setAttribute("aria-label",`${day} ${timeLabel(hour)}`);
      const empty=document.createElement("option"); empty.value=""; empty.textContent="— ជ្រើសរើស —"; select.appendChild(empty);
      SUBJECTS.forEach(subject=>{const op=document.createElement("option");op.value=subject;op.textContent=subject;select.appendChild(op)});
      select.dataset.key=`${hour}-${di}`;
      select.addEventListener("change",saveSchedule);
      td.appendChild(select);tr.appendChild(td);
    });
    body.appendChild(tr);
  }
}
function showToast(message){
  const t=$("toast");t.textContent=message;t.classList.add("show");
  clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove("show"),2200);
}
function updatePreview(){
  $("previewName").textContent=$("studentName").value.trim() || "មិនទាន់បញ្ចូល";
  $("previewTitle").textContent=$("scheduleTitle").value.trim() || "កាលវិភាគសិក្សាផ្ទាល់ខ្លួន";
}
function saveSchedule(){
  if(!activeUser)return;
  const data=readData();
  const user=data.users[activeUser] || {};
  const subjects={};
  document.querySelectorAll("#scheduleBody select").forEach(s=>{if(s.value)subjects[s.dataset.key]=s.value});
  user.name=$("studentName").value.trim() || activeUser;
  user.title=$("scheduleTitle").value;
  user.subjects=subjects;
  user.lastUpdated=new Date().toISOString();
  data.users[activeUser]=user;writeData(data);updatePreview();
}
function loadSchedule(name){
  activeUser=name;
  const data=readData(), user=data.users[name] || {};
  $("studentName").value=user.name || name;
  $("scheduleTitle").value=user.title || "កាលវិភាគសិក្សាផ្ទាល់ខ្លួន";
  document.querySelectorAll("#scheduleBody select").forEach(s=>s.value=(user.subjects||{})[s.dataset.key]||"");
  updatePreview();
  $("welcomeText").textContent=`សួស្តី ${user.name||name} • ចូលប្រើចុងក្រោយ៖ ${user.lastSignIn ? new Date(user.lastSignIn).toLocaleString("km-KH") : "ថ្ងៃនេះ"}`;
  $("loginView").hidden=true;$("appView").hidden=false;
}
$("loginForm").addEventListener("submit",e=>{
  e.preventDefault();
  const name=$("userName").value.trim();
  if(!name)return;
  const data=readData(), key=name.toLocaleLowerCase();
  const user=data.users[key]||{name,subjects:{}};
  user.name=name;user.lastSignIn=new Date().toISOString();
  data.users[key]=user;writeData(data);
  loadSchedule(key);
});
$("signOutBtn").addEventListener("click",()=>{saveSchedule();activeUser="";$("appView").hidden=true;$("loginView").hidden=false;$("userName").value=""});
$("studentName").addEventListener("input",()=>{updatePreview();saveSchedule()});
$("scheduleTitle").addEventListener("input",()=>{updatePreview();saveSchedule()});
$("saveBtn").addEventListener("click",()=>{saveSchedule();showToast("បានរក្សាទុកកាលវិភាគរួចរាល់")});
$("pngBtn").addEventListener("click",async()=>{
  saveSchedule();
  if(!window.html2canvas){showToast("មិនអាចផ្ទុក PNG library បានទេ");return}
  const original=$("scheduleCard"), clone=original.cloneNode(true);
  clone.id="exportClone";
  clone.style.cssText="position:fixed;left:-10000px;top:0;width:1200px;max-width:none;overflow:visible;background:#fff;padding:24px;border-radius:0";
  clone.querySelectorAll("select").forEach(s=>{
    const span=document.createElement("div");
    span.textContent=s.value || "";
    span.style.cssText="min-height:40px;display:flex;align-items:center;justify-content:center;padding:4px;font-family:Battambang,sans-serif;font-size:15px;color:#283247";
    s.parentNode.replaceChild(span,s);
  });
  const table=clone.querySelector("table");
  // Remove completely unused time rows, while preserving the time column.
  [...table.tBodies[0].rows].forEach(row=>{
    if([...row.cells].slice(1).every(cell=>!cell.textContent.trim())) row.remove();
  });
  // Hide day columns that contain no selected subject anywhere.
  for(let col=6;col>=1;col--){
    const hasValue=[...table.rows].slice(1).some(row=>row.cells[col] && row.cells[col].textContent.trim());
    if(!hasValue){[...table.rows].forEach(row=>row.cells[col]?.remove())}
  }
  // Keep a useful empty-state image if no subjects have been selected yet.
  if(!table.tBodies[0].rows.length){
    const tr=document.createElement("tr"),td=document.createElement("td");
    td.colSpan=table.tHead.rows[0].cells.length;td.textContent="សូមជ្រើសរើសមុខវិជ្ជា";tr.appendChild(td);table.tBodies[0].appendChild(tr);
  }
  document.body.appendChild(clone);
  try{
    await document.fonts.ready;
    const canvas=await html2canvas(clone,{scale:2,backgroundColor:"#ffffff",useCORS:true});
    const link=document.createElement("a");
    link.download=`study-schedule-${activeUser||"planner"}.png`;
    link.href=canvas.toDataURL("image/png");link.click();
    showToast("បានទាញយក PNG រួចរាល់");
  }catch(err){showToast("បង្កើត PNG មិនបានទេ សូមសាកល្បងម្ដងទៀត")}
  finally{clone.remove()}
});
buildTable();
