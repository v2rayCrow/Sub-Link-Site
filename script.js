const GITHUB_API_CONTENTS = 'https://api.github.com/repos/v2rayCrow/Sub-Link-Output/contents/countries';
const countriesContainer = document.getElementById('countries');
const themeToggle = document.getElementById('theme-toggle');
let dark = localStorage.getItem('v2_theme') === 'dark';
document.body.classList.toggle('dark', dark);

themeToggle.addEventListener('click', () => {
  dark = !dark;
  document.body.classList.toggle('dark', dark);
  localStorage.setItem('v2_theme', dark ? 'dark' : 'light');
});

document.addEventListener('click', (e) => {
  if (e.target.matches('.copy-sub') || e.target.matches('.copy-all')) {
    const url = e.target.dataset.url;
    navigator.clipboard.writeText(url).then(() => { toast('لینک کپی شد.'); }).catch(()=>toast('خطا در کپی'));
  }
});

function toast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style,{position:'fixed',right:'16px',bottom:'18px',background:'#111',color:'#fff',padding:'8px 12px',borderRadius:'10px',zIndex:9999,opacity:0,transition:'opacity 220ms'});
  document.body.appendChild(t);
  requestAnimationFrame(()=> t.style.opacity = '1');
  setTimeout(()=>{ t.style.opacity=0; setTimeout(()=>t.remove(),300); },1700);
}

function detectProtocol(line){
  const m = line.match(/^([a-zA-Z0-9+-]+):\/\//);
  return m ? m[1].toLowerCase() : 'unknown';
}

function detectNetwork(line){
  const lower=line.toLowerCase();
  try{
    const qIndex=lower.indexOf('?'), fragIndex=lower.indexOf('#');
    const base=lower.substring(0,qIndex>-1?qIndex:(fragIndex>-1?fragIndex:lower.length));
    const query=qIndex>-1?lower.substring(qIndex+1,fragIndex>-1?fragIndex:undefined):'';
    if(query){
      if(/network=ws|network=websocket|type=ws/.test(query)) return 'websocket';
      if(/network=grpc|type=grpc/.test(query)) return 'grpc';
      if(/network=tcp|type=tcp/.test(query)) return 'tcp';
      if(/path=\/?ws|\/ws/.test(lower)) return 'websocket';
    }
  } catch(e){}
  if(/grpc/.test(lower)) return 'grpc';
  if(/ws|websocket/.test(lower)) return 'websocket';
  if(/tcp|plain/.test(lower)) return 'tcp';
  if(/udp/.test(lower)) return 'udp';
  if(/hysteria|hy2|hy/.test(lower)) return 'hysteria';
  return 'unknown';
}

function pluralConfigText(n){return `${n} کانفیگ`; }

async function fetchCountryFilesList(){
  countriesContainer.innerHTML=`<div class="loading">در حال دریافت لیست کشورها از GitHub…</div>`;
  try{
    const res=await fetch(GITHUB_API_CONTENTS);
    if(!res.ok) throw new Error('GitHub API error');
    const arr=await res.json();
    const files=arr.filter(f=>f.type==='file'&&/\.txt$/i.test(f.name));
    if(files.length===0){
      countriesContainer.innerHTML=`<div class="loading">فایلی پیدا نشد.</div>`;
      return;
    }
    countriesContainer.innerHTML='';
    for(const f of files) createCountryCard(f);
  }catch(err){
    countriesContainer.innerHTML=`<div class="loading">خطا در ارتباط با GitHub: ${err.message}</div>`;
    console.error(err);
  }
}

async function createCountryCard(fileObj){
  const name=fileObj.name;
  const downloadUrl=fileObj.download_url;
  const countryLabel=name.replace(/\.txt$/i,'');
  const card=document.createElement('article');
  card.className='card country-card';
  card.innerHTML=`
    <div class="country-header">
      <div class="flag" title="نمایش کانفیگ‌ها">${extractFlag(countryLabel)||'🏳️'}</div>
      <div>
        <div class="name">${stripFlagFromName(countryLabel)}</div>
        <div class="meta config-count">در حال بارگذاری…</div>
      </div>
    </div>
    <div class="show-all-btn" style="margin-bottom:6px;">
      <button class="btn copy-country" data-url="${downloadUrl}">همه کانفیگ‌ها</button>
    </div>
    <div class="config-list" aria-hidden="true"></div>
  `;
  countriesContainer.appendChild(card);

  const flagEl=card.querySelector('.flag');
  const metaEl=card.querySelector('.config-count');
  const listEl=card.querySelector('.config-list');
  const allBtn=card.querySelector('.copy-country');
  allBtn.addEventListener('click',()=>{navigator.clipboard.writeText(downloadUrl).then(()=>toast('لینک همه کانفیگ‌ها کپی شد'));});

  try{
    const res=await fetch(downloadUrl);
    if(!res.ok) throw new Error('fail to fetch file');
    const text=await res.text();
    const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const usable=lines.slice(2);
    const configLines=usable.filter(l=>/^[a-zA-Z0-9+-]+:\/\//.test(l));
    metaEl.textContent=pluralConfigText(configLines.length);

    const preview=5;
    const previewLines=configLines.slice(0,preview);
    const hiddenLines=configLines.slice(preview);

    const buildItem=(ln,idx)=>`<div class="config-item" data-line="${encodeURIComponent(ln)}" title="کلیک روی دکمه کپی">
      <div>
        <div class="config-title">کانفیگ ${stripFlagFromName(countryLabel)} ${idx+1}</div>
        <div class="config-meta">${detectProtocol(ln).toUpperCase()} • ${detectNetwork(ln)}</div>
      </div>
      <div class="config-actions">
        <button class="btn copy-config" data-raw="${encodeURIComponent(ln)}">کپی</button>
      </div>
    </div>`;

    listEl.innerHTML=previewLines.map(buildItem).join('');
    if(hiddenLines.length>0){
      const showBtn=document.createElement('button');
      showBtn.className='btn show-more-btn';
      showBtn.textContent='نمایش بقیه کانفیگ‌ها';
      listEl.appendChild(showBtn);
      showBtn.addEventListener('click',()=>{
        hiddenLines.forEach((ln,idx)=>{listEl.insertAdjacentHTML('beforeend',buildItem(ln,idx+preview));});
        showBtn.remove();
        listEl.classList.add('show');
      });
    }
  }catch(err){
    metaEl.textContent='خطا در بارگذاری';
    listEl.innerHTML=`<div class="config-item">خطا: ${err.message}</div>`;
    console.error(err);
  }

  flagEl.addEventListener('click',()=>{
    const show=listEl.classList.toggle('show');
    listEl.setAttribute('aria-hidden',show?'false':'true');
    flagEl.style.transform=show?'scale(1.06) rotate(-6deg)':'';
    setTimeout(()=>flagEl.style.transform=show?'scale(1.0)':'',220);
  });
}

function extractFlag(name){
  const m=name.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})+$/u);
  if(m) return m[0];
  return null;
}

function stripFlagFromName(name){
  return name.replace(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})+$/u,'').trim();
}

document.addEventListener('click',(e)=>{
  if(e.target.matches('.copy-config')){
    const enc=e.target.dataset.raw;
    const raw=decodeURIComponent(enc);
    navigator.clipboard.writeText(raw).then(()=>toast('کانفیگ کپی شد')).catch(()=>toast('خطا در کپی'));
  }
});

fetchCountryFilesList();
