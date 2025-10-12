// لینک‌ها
const subLink = 'https://raw.githubusercontent.com/v2rayCrow/Sub-Link-Output/main/sub.txt#v2sourceSUB';
const allLink = 'https://raw.githubusercontent.com/v2rayCrow/Sub-Link-Output/main/all.txt#v2sourceALL';

// GitHub API
const owner = 'v2rayCrow';
const repo = 'Sub-Link-Output';
const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/countries`;
const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/main/countries/`;

// Toast
function showToast(msg){
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.display='block';
    setTimeout(()=>t.style.display='none',1800);
}

// کپی به کلیپ‌بورد
function copyToClipboard(text){
    navigator.clipboard.writeText(text).then(()=>showToast('✅ لینک کپی شد')).catch(()=>showToast('⚠️ کپی نشد'));
}

// دکمه‌ها
document.getElementById('btn-sub').onclick = ()=>copyToClipboard(subLink);
document.getElementById('btn-all').onclick = ()=>copyToClipboard(allLink);

// ساخت کارت‌ها
const grid = document.getElementById('grid');
function renderGrid(list){
    grid.innerHTML='';
    list.forEach(c=>{
        const card = document.createElement('div'); card.className='card';
        const flag = document.createElement('div'); flag.className='flag';
        if(c.emoji){
            const img = document.createElement('img');
            img.src = `https://flagcdn.com/w80/${Array.from(c.emoji).map(e=>String.fromCharCode(e.codePointAt(0)-0x1F1E6+65)).join('').toLowerCase()}.png`;
            img.style.width='100%'; img.style.height='100%';
            img.onerror=()=>flag.textContent=c.emoji;
            flag.appendChild(img);
        } else flag.textContent=c.emoji;
        const meta = document.createElement('div'); meta.className='meta';
        const title = document.createElement('div'); title.className='name'; title.textContent=c.name;
        meta.appendChild(title);
        const copyBtn = document.createElement('button'); copyBtn.className='copy'; copyBtn.textContent='کپی لینک';
        copyBtn.onclick=()=>copyToClipboard(c.url);
        card.appendChild(flag); card.appendChild(meta); card.appendChild(copyBtn);
        grid.appendChild(card);
    });
}

// بارگذاری کشورها از GitHub API
async function loadCountries(){
    try{
        const res = await fetch(apiBase);
        if(!res.ok) throw new Error('API failed');
        const data = await res.json();
        const countries = data.filter(f=>f.name.toLowerCase().endsWith('.txt'))
            .map(f=>{
                const nameNoExt = f.name.replace(/\.txt$/i,'');
                const emojiMatch = nameNoExt.match(/[\u{1F1E6}-\u{1F1FF}]{2}/u);
                const emoji = emojiMatch ? emojiMatch[0] : '🏳️';
                const displayName = nameNoExt.replace(/[\u{1F1E6}-\u{1F1FF}]/gu,'').trim() || nameNoExt;
                return {name: displayName, emoji, url: rawBase+encodeURIComponent(f.name), filename: f.name};
            });
        window._countries = countries;
        renderGrid(countries);
    }catch(e){
        showToast('خطا در بارگذاری کشورها',false);
        console.error(e);
    }
}
loadCountries();

// سرچ
document.getElementById('search').addEventListener('input',(e)=>{
    const val = e.target.value.toLowerCase();
    renderGrid((window._countries||[]).filter(c=>c.name.toLowerCase().includes(val)));
});
