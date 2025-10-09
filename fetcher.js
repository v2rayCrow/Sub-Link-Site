// fetcher.js
// parses simple sub/all text lists and shows cards
// هدف: خواندن sub.txt و all.txt و نمایش کارت‌ها

function byId(id){return document.getElementById(id)}
const cardsEl = byId('cards')
const summaryEl = byId('summary')
const repoLink = byId('repo-link')
repoLink.href = "https://github.com/v2rayCrow/Sub-Link-Output"

async function fetchText(url){
  const res = await fetch(url, {cache: "no-store"})
  if(!res.ok) throw new Error("fetch failed: " + res.status)
  return await res.text()
}

// حذف رشته‌های خالی و کامنت
function normalizeLines(txt){
  return txt.split(/\r?\n/).map(s=>s.trim()).filter(s=>s && !s.startsWith("#"))
}

// try decode vmess base64 payload (if possible) and extract add:port and ps remark
function tryParseVmess(line){
  try{
    // vmess://<base64>
    let b = line.split('vmess://')[1]
    if(!b) return null
    // sometimes there are params after # remark
    b = b.split('#')[0].trim()
    const decoded = atob(b)
    const j = JSON.parse(decoded)
    return {
      proto: 'vmess',
      name: j.ps || j.ps || (line.split('#')[1]||''),
      host: j.add || '',
      port: j.port || '',
      raw: line
    }
  }catch(e){ return null }
}

function guessProtocol(line){
  if(line.startsWith('vmess://')) return 'vmess'
  if(line.startsWith('vless://')) return 'vless'
  if(line.startsWith('trojan://')) return 'trojan'
  if(line.startsWith('ss://')) return 'shadowsocks'
  if(line.startsWith('wg://') || line.includes('wireguard')) return 'wireguard'
  return 'unknown'
}

function parseLine(line){
  // try vmess fast parse
  if(line.startsWith('vmess://')){
    const p = tryParseVmess(line)
    if(p) return p
  }
  // fallback: simple guess and metadata from remark(#)
  const proto = guessProtocol(line)
  const remark = (line.split('#')[1] || '').trim()
  return { proto, name: remark || line.slice(0,40), host: '', port:'', raw: line }
}

function renderCard(item){
  const div = document.createElement('div')
  div.className = 'card'
  div.innerHTML = `
    <h3>${escapeHtml(item.name || 'بدون نام')}</h3>
    <div class="meta">
      <span class="badge">${item.proto}</span>
      <span class="small">${item.host ? item.host + (item.port? ':'+item.port:'') : ''}</span>
      <span class="small">${item.raw && item.raw.length>80 ? item.raw.slice(0,80)+'…' : ''}</span>
    </div>
    <div class="actions">
      <button class="btn" data-raw>کپی</button>
      <button class="btn" data-download>دانلود</button>
    </div>
  `
  const copyBtn = div.querySelector('[data-raw]')
  copyBtn.onclick = ()=>{ navigator.clipboard.writeText(item.raw).then(()=>copyBtn.textContent='کپی شد') }
  const dlBtn = div.querySelector('[data-download]')
  dlBtn.onclick = ()=>{
    const blob = new Blob([item.raw], {type:'text/plain;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = (item.name||'config') + '.txt'
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }
  return div
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]))
}

async function loadAll(){
  summaryEl.textContent = 'در حال واکشی فایل‌ها…'
  try{
    const [subText, allText] = await Promise.all([fetchText(SUB_TXT), fetchText(ALL_TXT)])
    const lines = normalizeLines(subText + '\n' + allText)
    const items = []
    const seen = new Set()
    for(const ln of lines){
      if(seen.has(ln)) continue
      seen.add(ln)
      const it = parseLine(ln)
      items.push(it)
    }
    // show summary
    summaryEl.textContent = `تعداد کانفیگ‌ها: ${items.length}`
    cardsEl.innerHTML = ''
    for(const it of items) cardsEl.appendChild(renderCard(it))
  }catch(err){
    summaryEl.textContent = 'خطا در بارگذاری: ' + err.message
  }
}

// controls
byId('reload').addEventListener('click', loadAll)
byId('q').addEventListener('input', (e)=>{
  const q = e.target.value.trim().toLowerCase()
  document.querySelectorAll('.card').forEach(card=>{
    const txt = card.innerText.toLowerCase()
    card.style.display = txt.includes(q) ? '' : 'none'
  })
})
byId('filter-proto').addEventListener('change', (e)=>{
  const v = e.target.value
  document.querySelectorAll('.card').forEach(card=>{
    const proto = card.querySelector('.badge').innerText
    card.style.display = (!v || proto===v) ? '' : 'none'
  })
})

loadAll()
