/**
 * 📅 Timetable App
 * Author: Hồ Tăng Nhật Hiếu
 * Year: 2025
 */

const CONFIG = {
  anchorMonday: "2025-09-08", // Thứ 2 tuần 5
  anchorWeekNo: 5,
  minWeek: 5,
  maxWeek: 20,
  weekdays: ["Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6"],
  dayCols: [1,2,3,4,5],
  periods: 9
};

const COURSES = [
  { title:"Lịch sử ĐCSVN", groups:"KTĐ3+TĐH3+KHD3+KTX3", teacher:"ThS. GVC. Nguyễn Thị Hiền", room:"HT.4.1", day:1, periods:[1,4], weekRanges:[[6,10],[12,14]] },
  { title:"Lập trình nhúng", groups:"KHD3", teacher:"TS. Hà Xuân Vinh", room:"R.IV.1", day:2, periods:[6,9], weekRanges:[[5,10],[12,17]] },
  { title:"Thị giác máy tính", groups:"KHD3", teacher:"TS. Hoàng Hữu Trung", room:"R.IV.1", day:3, periods:[6,9], weekRanges:[[5,10],[12,17]] },
  { title:"Lập & quản lý dự án", groups:"KHD3", teacher:"PGS.TS. Nguyễn Quang Lịch", room:"P.2.12", day:4, periods:[1,3], weekRanges:[[5,10],[12,20]] },
  { title:"Khởi nghiệp", groups:"KHD3+KTX4", teacher:"TS. Hoàng Kim Toàn", room:"KN1", day:5, periods:[6,9], weekRanges:[[6,10],[12,18]] },
];

const TIMES = [
  [1, "07:00", "07:50"],
  [2, "07:55", "08:45"],
  [3, "08:50", "09:40"],
  [4, "09:45", "10:35"],
  [5, "10:40", "11:30"],
  [6, "13:00", "13:50"],
  [7, "13:55", "14:45"],
  [8, "14:50", "15:40"],
  [9, "15:45", "16:35"]
];

const oneDay = 86400000, oneWeek = 7*oneDay;
const toDate = (s)=>{ const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); };
const fmt = (d)=> d.toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"});
const mondayOf = (d)=>{ const x=new Date(d); const wd=(x.getDay()+6)%7; x.setDate(x.getDate()-wd); x.setHours(0,0,0,0); return x; };
const addDays=(d,n)=> new Date(d.getTime()+n*oneDay);
const addWeeks=(d,n)=> addDays(d,7*n);
const anchorMonday = mondayOf(toDate(CONFIG.anchorMonday));
const weekNoFromDateRaw=(any)=> CONFIG.anchorWeekNo + Math.floor((mondayOf(any)-anchorMonday)/oneWeek);
const clampWeek=(no)=> Math.min(CONFIG.maxWeek, Math.max(CONFIG.minWeek, no));
const weekNoFromDate=(any)=> clampWeek(weekNoFromDateRaw(any));
const mondayFromWeekNo=(no)=> addWeeks(anchorMonday, clampWeek(no) - CONFIG.anchorWeekNo);
const activeInWeek = (c,no)=> c.weekRanges.some(([a,b])=> no>=a && no<=b);

const theadRow = document.getElementById("theadRow");
const tbody = document.getElementById("tbody");
const subtitle = document.getElementById("subtitle");
const weekRange = document.getElementById("weekRange");
const btnPrev = document.getElementById("prevBtn");
const btnNext = document.getElementById("nextBtn");
const btnToday = document.getElementById("todayBtn");
const weekInput = document.getElementById("weekInput");
const periodBody = document.getElementById("periodBody");
const toggleThemeBtn = document.getElementById("toggleTheme");

let selectedDate = null;
let currentWeek = (()=> {
  const url = new URL(location.href); const q = +url.searchParams.get("w");
  const wk = Number.isFinite(q) ? q : weekNoFromDate(new Date());
  return clampWeek(wk);
})();

function renderHeader(mon){
  theadRow.innerHTML = "";
  const th0 = document.createElement("th"); th0.textContent = "Tiết"; theadRow.appendChild(th0);
  CONFIG.dayCols.forEach((dIdx)=>{
    const th = document.createElement("th");
    const date = addDays(mon, dIdx-1);
    th.innerHTML = `${CONFIG.weekdays[dIdx-1]}<div style="font-weight:400;color:#64748b;font-size:12px">${date.getDate().toString().padStart(2,"0")}/${(date.getMonth()+1).toString().padStart(2,"0")}</div>`;
    theadRow.appendChild(th);
  });
}

const timeOfPeriod = (p)=> {
  const f = TIMES.find(row=>row[0]===p);
  return f ? {start: f[1], end: f[2]} : null;
};
const timeOfSpan = (p1,p2)=> {
  const a=timeOfPeriod(p1), b=timeOfPeriod(p2);
  return (a&&b) ? `${a.start}–${b.end}` : "";
};

function buildTable(weekNo){
  weekNo = clampWeek(weekNo);
  const mon = mondayFromWeekNo(weekNo);
  const sun = addDays(mon,6);

  subtitle.textContent = `Tuần ${weekNo} • ${fmt(mon)} – ${fmt(sun)}`;
  weekRange.textContent = `${fmt(mon)} → ${fmt(sun)}`;
  weekInput.value = weekNo;
  btnPrev.disabled = (weekNo <= CONFIG.minWeek);
  btnNext.disabled = (weekNo >= CONFIG.maxWeek);

  renderHeader(mon);

  tbody.innerHTML = "";
  const rows = CONFIG.periods, cols = CONFIG.dayCols.length;
  const filled = Array.from({length: rows+1}, ()=> Array(cols+1).fill(false));

  for(let p=1;p<=rows;p++){
    const tr = document.createElement("tr");
    const thp = document.createElement("th");
    const t = timeOfPeriod(p);
    thp.innerHTML = `<div>${p}</div><div class="small">${t.start}–${t.end}</div>`;
    tr.appendChild(thp);

    CONFIG.dayCols.forEach((dIdx, colI)=>{
      if (filled[p][colI]) return;
      const course = COURSES.find(c => c.day===dIdx && activeInWeek(c, weekNo) && c.periods[0]===p);

      if (course){
        const span = course.periods[1] - course.periods[0] + 1;
        const td = document.createElement("td");
        td.rowSpan = span;
        const timeSpan = timeOfSpan(course.periods[0], course.periods[1]);
        td.innerHTML = `
          <div class="course">
            <div class="title">${course.title}</div>
            <div class="meta">${course.room} • ${course.groups}</div>
            <div class="meta">${course.teacher}</div>
            <div class="meta">(${timeSpan})</div>
          </div>`;
        tr.appendChild(td);
        for(let k=0;k<span;k++){ if (p+k<=rows) filled[p+k][colI] = true; }
      } else {
        const covering = COURSES.find(c => c.day===dIdx && activeInWeek(c, weekNo) && c.periods[0]<p && c.periods[1]>=p);
        if (covering){
          filled[p][colI] = true;
        } else {
          const td = document.createElement("td");
          td.className += " empty";
          td.textContent = "—";
          tr.appendChild(td);
        }
      }
    });

    tbody.appendChild(tr);
  }

  const u = new URL(location.href);
  u.searchParams.set("w", weekNo);
  history.replaceState(null,"",u.toString());
}

(function renderPeriodTable(){
  periodBody.innerHTML = TIMES.map(([i, start, end]) =>
    `<tr><td>${i}</td><td>${start}</td><td>${end}</td></tr>`
  ).join("");
})();

function step(delta){ 
  currentWeek = clampWeek(currentWeek + delta);
  buildTable(currentWeek); 
}
btnPrev.addEventListener("click", ()=> step(-1));
btnNext.addEventListener("click", ()=> step(+1));
btnToday.addEventListener("click", ()=> { 
  selectedDate = new Date(); 
  currentWeek = weekNoFromDate(selectedDate); 
  buildTable(currentWeek); 
});

document.getElementById("weekPill").addEventListener("click", ()=> weekInput.focus());
weekInput.addEventListener("change", ()=>{
  const v = clampWeek(parseInt(weekInput.value,10) || CONFIG.minWeek);
  selectedDate = null;
  currentWeek = v; buildTable(currentWeek);
});

/* ===== Theme Toggle ===== */
const savedTheme = localStorage.getItem("theme") || "light";
document.body.setAttribute("data-theme", savedTheme);
toggleThemeBtn.textContent = savedTheme==="dark" ? "☀️ Light" : "🌙 Dark";

toggleThemeBtn.addEventListener("click", ()=>{
  let current = document.body.getAttribute("data-theme");
  let next = current==="dark" ? "light" : "dark";
  document.body.setAttribute("data-theme", next);
  toggleThemeBtn.textContent = next==="dark" ? "☀️ Light" : "🌙 Dark";
  localStorage.setItem("theme", next);
});

/* ===== INIT ===== */
buildTable(currentWeek);
