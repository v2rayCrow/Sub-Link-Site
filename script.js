// نمونه داده‌ها، می‌توانید از فایل sub.txt یا all.txt بخوانید
const data = {
    "USA": {
        "flag": "🇺🇸",
        "sub": "https://example.com/usa_sub.txt",
        "configs": [
            "vmess://ew0KICAidHlwZSI6ICJ2bWVzcyIsDQogICJuZXQiOiAid3MiLA0KICAiaG9zdCI6ICJleGFtcGxlLmNvbSIsDQogICJwb3J0IjogIjQ0MyIsDQogICJpZCI6ICJhYmNkLWVmZ2gtMTIzNCIsDQogICJuYW1lIjogIlVzYS1UZXN0IiwNCiAgImFkZCI6ICJleGFtcGxlLmNvbSIsDQogICJ0bHMiOiAiIn0="
        ]
    },
    "Finland": {
        "flag": "🇫🇮",
        "sub": "https://example.com/finland_sub.txt",
        "configs": [
            "ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpmYWtlcGFzc0BleGFtcGxlLmNvbQ=="
        ]
    }
};

// صفحه اصلی
const countriesContainer = document.getElementById("countries");

function detectProtocol(config) {
    if (config.startsWith("vmess://")) {
        try {
            const decoded = atob(config.slice(8));
            const obj = JSON.parse(decoded);
            return `vmess - ${obj.net || "tcp"}`;
        } catch (e) {
            return "vmess";
        }
    } else if (config.startsWith("ss://")) {
        return "Shadowsocks";
    } else if (config.startsWith("vless://")) {
        return "vless";
    } else if (config.startsWith("trojan://")) {
        return "trojan";
    } else {
        return "Unknown";
    }
}

// ساخت کارت‌های کشور
for (const country in data) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
        <span class="flag">${data[country].flag}</span>
        <span class="name">${country}</span>
        <span class="count">${data[country].configs.length} کانفیگ</span>
    `;
    card.addEventListener("click", () => openCountryPage(country));
    countriesContainer.appendChild(card);
}

// باز کردن صفحه جزئیات کشور
function openCountryPage(country) {
    document.body.innerHTML = `
        <header>
            <h1>${data[country].flag} ${country}</h1>
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

    document.getElementById("copyAll").addEventListener("click", () => {
        const allConfigs = configs.join("\n");
        copyText(allConfigs);
    });
}

// تابع کپی
function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("کپی شد!");
    }).catch(err => {
        console.error("کپی انجام نشد: ", err);
    });
}
