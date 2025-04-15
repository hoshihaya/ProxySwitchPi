function loadSettings() {
  chrome.storage.sync.get(["proxy", "proxyType", "domains", "enableProxy"], (data) => {
    if (data.proxy) document.getElementById("proxy").value = data.proxy;
    if (data.proxyType) document.getElementById("proxyType").value = data.proxyType;
    if (data.domains) document.getElementById("domains").value = data.domains.join("\n");
    // enableProxy が保存されていない場合は false をデフォルトに
    document.getElementById("toggleProxy").checked = data.enableProxy || false;
  });
}

// Enable Proxy のトグル操作に対するイベントリスナーを追加
document.getElementById("toggleProxy").addEventListener("change", (e) => {
  chrome.storage.sync.set({ enableProxy: e.target.checked });
});

document.getElementById("save").addEventListener("click", () => {
  const proxy = document.getElementById("proxy").value;
  const proxyType = document.getElementById("proxyType").value;
  const domains = document.getElementById("domains").value.split("\n").map(d => d.trim()).filter(d => d);
  chrome.storage.sync.set({ proxy, proxyType, domains });
});

document.getElementById("export").addEventListener("click", () => {
  chrome.storage.sync.get(["proxy", "proxyType", "domains", "enableProxy"], (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "proxy_settings.json";
    a.click();
  });
});

document.getElementById("import").addEventListener("click", () => {
  document.getElementById("importFile").click();
});

document.getElementById("importFile").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      chrome.storage.sync.set(data, loadSettings);
    };
    reader.readAsText(file);
  }
});

// 初回ロード時に設定を読み込む
loadSettings();
