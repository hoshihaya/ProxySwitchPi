async function applyProxySettings() {
  const { proxy, proxyType, domains } = await chrome.storage.sync.get(["proxy", "proxyType", "domains"]);
  if (proxy && proxyType && domains) {
    const proxyConfig = {
      mode: "pac_script",
      pacScript: {
        data: generatePacScript(proxy, proxyType, domains)
      }
    };
    chrome.proxy.settings.set({ value: proxyConfig, scope: "regular" }, () => {
      if (chrome.runtime.lastError) {
        console.error("Failed to apply proxy settings:", chrome.runtime.lastError);
      } else {
        console.log("Proxy settings applied successfully!");
      }
    });
  } else {
    console.warn("Proxy settings are missing or incomplete.");
  }
}

// 初回ロード時に適用
applyProxySettings();

// 設定が変更されたら適用
chrome.storage.onChanged.addListener(() => {
  applyProxySettings();
});

// PAC スクリプトを生成する関数
function generatePacScript(proxy, proxyType, domains) {
  let conditions = domains.map(domain => `shExpMatch(host, \"${domain}\")`).join(" || ");
  return `function FindProxyForURL(url, host) {
    if (${conditions}) {
      return "${proxyType.toUpperCase()} ${proxy}";
    }
    return "DIRECT";
  }`;
}
