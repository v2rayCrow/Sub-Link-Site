const countriesContainer = document.getElementById('countries-container');
const themeToggle = document.getElementById('theme-toggle');
let darkMode = false;

// نمونه داده کانفیگ‌ها (در عمل از لینک Sub و All واکشی می‌شوند)
const serverData = [
    {
        country: "Germany",
        flag: "🇩🇪",
        configs: [
            {name:"کانفیگ ۱", protocol:"VLESS", network:"TCP"},
            {name:"کانفیگ ۲", protocol:"VLESS", network:"WebSocket"}
        ]
    },
    {
        country: "Finland",
        flag: "🇫🇮",
        configs: [
            {name:"کانفیگ ۱", protocol:"VLESS", network:"TCP"}
        ]
    }
];

// افزودن کارت کشورها
serverData.forEach(country => {
    const card = document.createElement('div');
    card.className = 'card';
    
    card.innerHTML = `
        <div class="card-header">
            <h2>${country.flag} ${country.country}</h2>
        </div>
        <div class="config-list">
            ${country.configs.map(c => `<div class="config-item">${c.name} | ${c.protocol} | ${c.network} <button class="copy-config-btn" data-config="${c.name}">کپی</button></div>`).join('')}
        </div>
    `;

    // باز/بسته کردن لیست کانفیگ
    card.querySelector('.card-header').addEventListener('click', () => {
        const list = card.querySelector('.config-list');
        list.classList.toggle('show');
    });

    countriesContainer.appendChild(card);
});

// کپی لینک Sub و All
document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const link = type === 'sub' ? 'لینک Sub واقعی اینجا' : 'لینک All واقعی اینجا';
        navigator.clipboard.writeText(link);
        alert(`${type.toUpperCase()} کپی شد!`);
    });
});

// کپی کانفیگ تکی
document.addEventListener('click', e => {
    if (e.target.classList.contains('copy-config-btn')) {
        const configName = e.target.dataset.config;
        navigator.clipboard.writeText(configName);
        alert(`کانفیگ ${configName} کپی شد!`);
    }
});

// تغییر تم
themeToggle.addEventListener('click', () => {
    darkMode = !darkMode;
    document.body.classList.toggle('dark', darkMode);
});
