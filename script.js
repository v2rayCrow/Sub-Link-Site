/* script.js
   - دریافت لیست فایل‌های countries از GitHub API
   - واکشی هر فایل (download_url)
   - حذف 2 خط اول
   - پارس هر کانفیگ (پروتکل، شبکه حدسی)
   - نمایش کارت کشور + لیست کانفیگ‌ها + دکمهٔ کپی تکی
*/

const GITHUB_API_CONTENTS = 'https://api.github.com/repos/v2rayCrow/Sub-Link-Output/contents/countries';
const countriesContainer = document.getElementById('countries');
const themeToggle = document.getElementById('theme-toggle');

// تم از localStorage خوانده می‌شود
let dark = localStorage.getItem('v2_theme') === 'dark';
document.body.classList.toggle('dark', dark);

// تغییر تم
themeToggle.addEventListener('click', () => {
  dark = !dark;
  document.body.classList.toggle('dark', dark);
  localStorage.setItem('v2_theme', dark ? 'dark' : 'light');
});

// کپی لینک Sub/All
document.addEventListener('click', (e) => {
  if (e.target.matches('.copy-sub') || e.target.matches('.copy-all')) {
    const url = e.target.dataset.url;
    navigator.clipboard.writeText(url).then(() => {
      toast('لینک سابسکریپشن کپی شد.');
    }).catch(()=>toast('خطا در کپی کردن'));
  }
});

// توست ساده
function toast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style,{
    position:'fixed', right:'16px', bottom:'18px',
    background:'#111', color:'#fff', padding:'8px 12px',
    borderRadius:'10px', zIndex:9999, opacity:0, transition:'opacity 220ms'
  });
  document.body.appendChild(t);
  requestAnimationFrame(()=> t.style.opacity = '1');
  setTimeout(()=>{ t.style.opacity = '0'; setTimeout(()=>t.remove(),300); }, 1700);
}

// تشخیص پروتکل (از ابتدای خط)
function detectProtocol(line){
  const m = line.match(/^([a-zA-Z0-9+-]+):\/\//);
  return m ? m[1].toLowerCase() : 'unknown';
}

// حدس شبکه (heuristic)
// بررسی پارامترهای query و کلمات شناخته‌شده
function detectNetwork(line){
  const lower = line.toLowerCase();
  // بررسی پارامترها
  try {
    // تلاش برای parse کردن بعد از پروتکل (ممکن است base64 یا فرمت دیگر باشد)
    const qIndex = lower.indexOf('?');
    const fragIndex = lower.indexOf('#');
    const base = lower.substring(0, qIndex > -1 ? qIndex : (fragIndex > -1 ? fragIndex : lower.length));
    const query = qIndex > -1 ? lower.substring(qIndex+1, fragIndex > -1 ? fragIndex : undefined) : '';
    if(query){
      if(/network=ws|network=websocket|type=ws/.test(query)) return 'websocket';
      if(/network=grpc|type=grpc/.test(query)) return 'grpc';
      if(/network=tcp|type=tcp/.test(query)) return 'tcp';
      if(/path=\/?ws|\/ws/.test(lower)) return 'websocket';
    }
  } catch(e){}
  // بررسی محتوای کلی متن
  if(/grpc/.test(lower)) return 'grpc';
  if(/ws|websocket/.test(lower)) return 'websocket';
  if(/tcp|plain/.test(lower)) return 'tcp';
  if(/udp/.test(lower)) return 'udp';
  // نوع‌های خاص (hysteria, hy)
  if(/hysteria|hy2|hy/.test(lower)) return 'hysteria';
  // اگر نشد:
  return 'unknown';
}

// نمایش تعداد کانفیگ (فقط برای meta روی کارت)
function pluralConfigText(n){
  return `${n} کانفیگ`;
}

// دریافت لیست فایل‌ها از GitHub API
async function fetchCountryFilesList(){
  countriesContainer.innerHTML = `<div class="loading">در حال دریافت لیست کشورها از GitHub…</div>`;
  try {
    const res = await fetch(GITHUB_API_CONTENTS);
    if(!res.ok) throw new Error('GitHub API error');
    const arr = await res.json();
    // arr شامل اشیاء با name و download_url است
    const files = arr.filter(f => f.type === 'file' && /\.txt$/i.test(f.name));
    if(files.length === 0){
      countriesContainer.innerHTML = `<div class="loading">فایلی در پوشه countries پیدا نشد.</div>`;
      return;
    }
    countriesContainer.innerHTML = ''; // پاک کردن پیام
    // بارگزاری فایل‌ها (هر فایل -> کارت)
    for(const f of files){
      createCountryCard(f);
    }
  } catch(err){
    countriesContainer.innerHTML = `<div class="loading">خطا در ارتباط با GitHub: ${err.message}</div>`;
    console.error(err);
  }
}

// ساخت کارت (و واکشی محتوا)
async function createCountryCard(fileObj){
  // نام فایل و URL دانلود
  const name = fileObj.name;            // مثال: Germany🇩🇪.txt
  const downloadUrl = fileObj.download_url; // مستقیم به فایل raw

  // استخراج نام کشور (تا اولین نقطه یا .txt)
  const countryLabel = name.replace(/\.txt$/i,'');

  // کارت HTML پایه
  const card = document.createElement('article');
  card.className = 'card country-card';
  card.innerHTML = `
    <div class="country-header">
      <div class="flag" title="نمایش کانفیگ‌ها">${extractFlag(countryLabel) || '🏳️'}</div>
      <div>
        <div class="name">${stripFlagFromName(countryLabel)}</div>
        <div class="meta config-count">در حال بارگذاری…</div>
      </div>
    </div>
    <div class="config-list" aria-hidden="true"></div>
  `;
  countriesContainer.appendChild(card);

  const flagEl = card.querySelector('.flag');
  const metaEl = card.querySelector('.config-count');
  const listEl = card.querySelector('.config-list');

  // واکشی محتوا
  try {
    const res = await fetch(downloadUrl);
    if(!res.ok) throw new Error('fail to fetch file');
    const text = await res.text();
    // هر خط جدا
    const lines = text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    // حذف دو خط اول (تبلیغ)
    const usable = lines.slice(2);
    // فقط خطوطی که با protocol:// شروع می‌شوند
    const configLines = usable.filter(l => /^[a-zA-Z0-9+-]+:\/\//.test(l));
    // update meta
    metaEl.textContent = pluralConfigText(configLines.length);

    // حالا ساخت آیتم‌ها (هر کدام با شماره)
    if(configLines.length === 0){
      listEl.innerHTML = `<div class="config-item">کانفیگ موجود نیست</div>`;
    } else {
      listEl.innerHTML = configLines.map((ln, idx) => {
        const protocol = detectProtocol(ln);
        const network = detectNetwork(ln);
        const short = `کانفیگ ${stripFlagFromName(countryLabel)} ${idx+1}`;
        // نمایش فارسی شکیل: short | protocol | network
        return `
          <div class="config-item" data-line="${encodeURIComponent(ln)}" title="کلیک روی دکمه کپی برای کپی کامل">
            <div>
              <div class="config-title">${short}</div>
              <div class="config-meta">${protocol.toUpperCase()}  •  ${network}</div>
            </div>
            <div class="config-actions">
              <button class="btn copy-config" data-raw="${encodeURIComponent(ln)}">کپی</button>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch(err){
    metaEl.textContent = 'خطا در بارگذاری';
    listEl.innerHTML = `<div class="config-item">خطا: ${err.message}</div>`;
    console.error(err);
  }

  // کلیک روی flag => باز/بسته شدن لیست
  flagEl.addEventListener('click', () => {
    const show = listEl.classList.toggle('show');
    listEl.setAttribute('aria-hidden', show ? 'false' : 'true');
    // انیمیشن کوچک برای flag
    flagEl.style.transform = show ? 'scale(1.06) rotate(-6deg)' : '';
    setTimeout(()=> flagEl.style.transform = show ? 'scale(1.0)' : '', 220);
  });
}

// extract emoji flag (اگر موجود)
function extractFlag(name){
  // emoji flags معمولاً در انتهای نام قرار دارد.
  // تلاش می‌کنیم emoji را جدا کنیم (حروف غیر ascii)
  const m = name.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})+$/u);
  if(m) return m[0];
  // fallback: سعی کنیم اگر نام شامل 🇩🇪 شبیه کدها باشه، آن را نمایش دهیم (عموماً فایل‌ها emoji واقعی دارند)
  return null;
}

// حذف پرچم از نام برای نمایش اسم کشور
function stripFlagFromName(name){
  // حذف emoji انتهایی
  return name.replace(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})+$/u, '').trim();
}

// رویداد دکمه‌های کپی کانفیگ (delegation)
document.addEventListener('click', (e) => {
  // کپی کانفیگ تکی
  if(e.target.matches('.copy-config')){
    const enc = e.target.dataset.raw;
    const raw = decodeURIComponent(enc);
    navigator.clipboard.writeText(raw).then(()=> toast('کانفیگ کپی شد')).catch(()=> toast('خطا در کپی'));
  }
});

// شروع فرایند
fetchCountryFilesList();
