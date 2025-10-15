// فایل‌های Raw GitHub
const FILE_URLS = [
    "https://raw.githubusercontent.com/v2rayCrow/Sub-Link-Output/main/sub.txt",
    "https://raw.githubusercontent.com/v2rayCrow/Sub-Link-Output/main/all.txt"
];

const countriesContainer = document.getElementById("countries");
let data = {}; 

// تشخیص نوع پروتکل
function detectProtocol(config) {
    if (config.startsWith("vmess://")) {
        try { const obj = JSON.parse(atob(config.slice(8))); return `vmess - ${obj.net || "tcp"}`; } 
        catch { return "vmess"; }
    } else if (config.startsWith("ss://")) return "Shadowsocks";
    else if (config.startsWith("vless://")) return "vless";
    else if (config.startsWith("trojan://")) return "trojan";
    else return "Unknown";
}

// بارگذاری فایل‌ها
async function loadConfigs() {
    for (const url of FILE_URLS) {
        try {
            const res = await fetch(url);
            const text = await res.text();
            const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");

            lines.forEach(line => {
                let cfg = line.trim();

                // حذف خطوط اضافی (Provider یا آخرین آپدیت)
                if (cfg.includes("Provider") || cfg.includes("آخرین آپدیت") || cfg === "") return;

                // استخراج کشور از انتهای خط
                let country = "Unknown";
                const hashIdx = cfg.lastIndexOf("#");
                if (hashIdx !== -1) {
                    country = cfg.slice(hashIdx + 1).trim();
                    cfg = cfg.slice(0, hashIdx).trim();
                }

                if (!data[country]) data[country] = { flag: "", configs: [] };
                data[country].configs.push(line.trim());
            });
        } catch (e) {
            console.error("خطا در خواندن فایل:", url, e);
        }
    }

    buildCountryCards();
}

// ساخت کارت‌های کشور
function buildCountryCards() {
    for (const country in data) {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <span class="flag">${data[country].flag || ""}</span>
            <span class="name">${country}</span>
            <span class="count">${data[country].configs.length} کانفیگ</span>
        `;
        card.addEventListener("click", () => openCountryPage(country));
        countriesContainer.appendChild(card);
    }
}

// باز کردن صفحه جزئیات کشور
function openCountryPage(country) {
    document.body.innerHTML = `
        <header>
            <h1>${data[country].flag || ""} ${country}</h1>
        </header>
        <main class="country-page">
            <button id="copyAll">کپی همه کانفیگ‌ها و لینک سابسکریپشن</button>
            <div id="configs"></div>
            <button onclick="location.href='index.html'" style="margin-top:1rem;">بازگشت</button>
        </main>
    `;

    const configsContainer = document.getElementById("configs");
    const configs = data[country].configs;

    configs.forEach(cfg => {
        const card = document.createElement("div");
        card.className = "config-card";
        const type = detectProtocol(cfg);
        card.innerHTML = `
            <span>${type}</span>
            <span>${cfg}</span>
            <button onclick="copyText('${cfg}')">کپی</button>
        `;
        configsContainer.appendChild(card);
    });

    document.getElementById("copyAll").addEventListener("click", () => copyText(configs.join("\n")));
}

// تابع کپی
function copyText(text) {
    navigator.clipboard.writeText(text).then(() => alert("کپی شد!"))
    .catch(err => console.error("کپی انجام نشد: ", err));
}

// اجرا
loadConfigs();
