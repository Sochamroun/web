const DAYS = ["ចន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍", "អាទិត្យ"];
const SUBJECTS = [
  "គណិតវិទ្យា",
  "ភាសាខ្មែរ",
  "រូបវិទ្យា",
  "គីមីវិទ្យា",
  "ជីវវិទ្យា",
  "ផែនដីវិទ្យា និងបរិស្ថានវិទ្យា",
  "ប្រវត្តិវិទ្យា",
  "ភូមិវិទ្យា",
  "សីលធម៌-ពលរដ្ឋវិទ្យា",
  "ភាសាបរទេស (អង់គ្លេស ឬ បារាំង)",
  "បច្ចេកវិទ្យាព័ត៌មានវិទ្យា (ICT)",
  "អប់រំកាយ និងកីឡា",
  "សេដ្ឋកិច្ច",
  "វេនសំអាត"
];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 6);
const STORAGE_KEY = "my-personal-study-timetable-v1";
const $ = id => document.getElementById(id);

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2300);
}

function saveSchedule() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collectSchedule()));
  $("saveState").textContent = "បានរក្សាទុកដោយស្វ័យប្រវត្តិ";
}

function collectSchedule() {
  const result = {};
  document.querySelectorAll("#scheduleTable select").forEach(select => {
    if (select.value) result[select.dataset.key] = select.value;
  });
  return result;
}

function makeTable(schedule = {}) {
  $("tableHead").innerHTML =
    '<th class="time-col">ម៉ោង / ថ្ងៃ</th>' +
    DAYS.map(day => `<th>${day}</th>`).join("");

  const body = $("tableBody");
  body.innerHTML = "";

  HOURS.forEach(hour => {
    const row = document.createElement("tr");
    const time = document.createElement("td");
    time.className = "time";
    time.textContent =
      `${String(hour).padStart(2, "0")}:00 - ${String(hour + 1).padStart(2, "0")}:00`;
    row.appendChild(time);

    DAYS.forEach(day => {
      const cell = document.createElement("td");
      const select = document.createElement("select");
      select.setAttribute("aria-label", `${day} ${hour}:00`);
      select.dataset.key = `${day}_${hour}`;

      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "— ជ្រើសរើស —";
      select.appendChild(empty);

      SUBJECTS.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        select.appendChild(option);
      });

      select.value = schedule[select.dataset.key] || "";
      select.classList.toggle("has-value", Boolean(select.value));
      select.addEventListener("change", () => {
        select.classList.toggle("has-value", Boolean(select.value));
        $("saveState").textContent = "កំពុងរក្សាទុក...";
        saveSchedule();
      });

      cell.appendChild(select);
      row.appendChild(cell);
    });

    body.appendChild(row);
  });
}

$("clearBtn").addEventListener("click", () => {
  if (!confirm("តើអ្នកចង់សម្អាតកាលវិភាគទាំងអស់មែនទេ?")) return;
  document.querySelectorAll("#scheduleTable select").forEach(select => {
    select.value = "";
    select.classList.remove("has-value");
  });
  saveSchedule();
  toast("បានសម្អាតកាលវិភាគ");
});

$("pngBtn").addEventListener("click", async () => {
  if (typeof html2canvas !== "function") {
    toast("មិនអាចផ្ទុក PNG exporter បានទេ។ សូមពិនិត្យ Internet។");
    return;
  }

  const button = $("pngBtn");
  const oldText = button.textContent;
  button.disabled = true;
  button.textContent = "កំពុងបង្កើត PNG...";

  try {
    // Build a clean export copy: remove unselected rows, but retain empty cells
    // within selected rows so the timetable still has spaces to fill in later.
    const source = $("scheduleTable");
    const clone = source.cloneNode(true);
    clone.querySelectorAll("tbody tr").forEach(row => {
      const hasSubject = [...row.querySelectorAll("select")].some(s => s.value);
      if (!hasSubject) {
        row.remove();
        return;
      }

      row.querySelectorAll("td").forEach(cell => {
        const select = cell.querySelector("select");
        if (!select) return;
        const value = select.value;
        cell.innerHTML = "";
        if (value) {
          const subject = document.createElement("div");
          subject.className = "export-subject";
          subject.textContent = value;
          cell.appendChild(subject);
        } else {
          cell.classList.add("export-empty");
        }
      });
    });

    const wrapper = document.createElement("div");
    wrapper.className = "export-sheet";
    const title = document.createElement("h1");
    title.textContent = "កាលវិភាគសិក្សាផ្ទាល់ខ្លួន";
    const meta = document.createElement("p");
    meta.textContent = "ម៉ោងសិក្សា៖ 06:00 – 18:00";
    wrapper.append(title, meta, clone);
    document.body.appendChild(wrapper);

    const canvas = await html2canvas(wrapper, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      width: wrapper.scrollWidth,
      windowWidth: Math.max(document.documentElement.clientWidth, wrapper.scrollWidth)
    });

    const link = document.createElement("a");
    link.download = "my-study-timetable.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    wrapper.remove();
    toast("បានទាញយកកាលវិភាគជា PNG");
  } catch (error) {
    document.querySelector(".export-sheet")?.remove();
    console.error(error);
    toast("បង្កើត PNG មិនបាន សូមសាកម្ដងទៀត");
  } finally {
    button.disabled = false;
    button.textContent = oldText;
  }
});

makeTable(readSchedule());
