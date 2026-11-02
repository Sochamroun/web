const DAYS = ["ចន្ទ","អង្គារ","ពុធ","ព្រហស្បតិ៍","សុក្រ","សៅរ៍"];
const SUBJECTS = [
"គណិតវិទ្យា","ភាសាខ្មែរ","រូបវិទ្យា","គីមីវិទ្យា","ជីវវិទ្យា",
"ផែនដីវិទ្យា និងបរិស្ថានវិទ្យា","ប្រវត្តិវិទ្យា","ភូមិវិទ្យា",
"សីលធម៌-ពលរដ្ឋវិទ្យា","ភាសាបរទេស (អង់គ្លេស ឬ បារាំង)",
"បច្ចេកវិទ្យាព័ត៌មានវិទ្យា (ICT)","អប់រំកាយ និងកីឡា","សេដ្ឋកិច្ច","វេនសំអាត",
];
const HOURS = Array.from({length:12},(_,i)=>i+6);
let currentName = "";
const $ = id => document.getElementById(id);
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2400)}
function setState(message){$("saveState").textContent=message}
function makeTable(schedule={}){
  const head=$("scheduleTable").querySelector("thead tr");
  head.innerHTML='<th class="time-col">ម៉ោង / ថ្ងៃ</th>'+DAYS.map(d=>`<th>${d}</th>`).join("");
  const body=$("scheduleTable").querySelector("tbody");body.innerHTML="";
  HOURS.forEach(hour=>{
    const tr=document.createElement("tr");
    const time=document.createElement("td");time.className="time";
    time.textContent=`${String(hour).padStart(2,"0")}:00 - ${String(hour+1).padStart(2,"0")}:00`;tr.appendChild(time);
    DAYS.forEach((day,di)=>{
      const td=document.createElement("td"),select=document.createElement("select");
      select.setAttribute("aria-label",`${day} ${hour}:00`);
      select.dataset.key=`${day}_${hour}`;
      const blank=document.createElement("option");blank.value="";blank.textContent="— ជ្រើសរើស —";select.appendChild(blank);
      SUBJECTS.forEach(subject=>{const opt=document.createElement("option");opt.value=subject;opt.textContent=subject;select.appendChild(opt)});
      select.value=schedule[select.dataset.key]||"";
      select.classList.toggle("has-value",!!select.value);
      select.addEventListener("change",()=>{select.classList.toggle("has-value",!!select.value);setState("មានការកែប្រែមិនទាន់រក្សាទុក")});
      td.appendChild(select);tr.appendChild(td);
    });body.appendChild(tr);
  });
}
function collectSchedule(){const result={};document.querySelectorAll("#scheduleTable select").forEach(s=>{if(s.value)result[s.dataset.key]=s.value});return result}
async function api(url,data){const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const json=await res.json();if(!res.ok||!json.ok)throw new Error(json.error||"មានបញ្ហា");return json}
$("signinForm").addEventListener("submit",async e=>{
  e.preventDefault();const name=$("studentName").value.trim();if(!name)return;
  try{const result=await api("/api/signin",{name});currentName=name;$("welcomeName").textContent=name;makeTable(result.user.schedule||{});$("signinPanel").hidden=true;$("workspace").hidden=false;setState("ទិន្នន័យបានផ្ទុក");}
  catch(err){toast(err.message)}
});
$("saveBtn").addEventListener("click",async()=>{
  if(!currentName)return;$("saveBtn").disabled=true;
  try{await api("/api/save",{name:currentName,schedule:collectSchedule()});setState("បានរក្សាទុក");toast("បានរក្សាទុកក្នុង user.json");}
  catch(err){toast(err.message);setState("រក្សាទុកមិនបាន")}
  finally{$("saveBtn").disabled=false}
});
$("switchBtn").addEventListener("click",()=>{$("workspace").hidden=true;$("signinPanel").hidden=false;$("studentName").value="";currentName="";$("studentName").focus()});


$("pngBtn").addEventListener("click",async()=>{
  if(!currentName)return;
  if(typeof html2canvas!=="function"){
    toast("មិនអាចផ្ទុក PNG exporter បានទេ។ សូមពិនិត្យ Internet ហើយសាកម្ដងទៀត។");
    return;
  }
  const btn=$("pngBtn");btn.disabled=true;btn.textContent="កំពុងបង្កើត...";
  try{
    const target=$("scheduleTable");
    const canvas=await html2canvas(target,{
      backgroundColor:"#ffffff",scale:2,useCORS:true,
      windowWidth:Math.max(document.documentElement.clientWidth,target.scrollWidth)
    });
    const link=document.createElement("a");
    const safeName=currentName.replace(/[^\p{L}\p{N}_-]+/gu,"_");
    link.download=`timetable_${safeName}.png`;
    link.href=canvas.toDataURL("image/png");
    link.click();
    toast("បានទាញយកតារាងជា PNG ហើយ");
  }catch(err){toast("បង្កើតរូបភាពមិនបាន សូមសាកម្ដងទៀត")}
  finally{btn.disabled=false;btn.textContent="ទាញយក PNG"}
});
