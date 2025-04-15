// enableProxy 状態に応じてアイコンを更新する関数
function updateActionIcon(enable) {
  if (enable) {
    chrome.action.setIcon({ path: "icons/green.png" }, () => {
      if (chrome.runtime.lastError) {
        console.error("Failed to set green icon: " + chrome.runtime.lastError.message);
      }
    });
  } else {
    chrome.action.setIcon({ path: "icons/grey.png" }, () => {
      if (chrome.runtime.lastError) {
        console.error("Failed to set grey icon: " + chrome.runtime.lastError.message);
      }
    });
  }
}

async function applyProxySettings() {
  // storageから proxy, proxyType, domains に加え enableProxy を取得
  const { proxy, proxyType, domains, enableProxy } = await chrome.storage.sync.get(["proxy", "proxyType", "domains", "enableProxy"]);

  // enableProxy の状態に応じてアイコンを更新
  updateActionIcon(enableProxy);

  // enableProxyがfalseの場合は、プロキシ設定を解除（直接接続）する
  if (!enableProxy) {
    chrome.proxy.settings.set({ value: { mode: "direct" }, scope: "regular" }, () => {
      if (chrome.runtime.lastError) {
        console.error("Failed to disable proxy:", chrome.runtime.lastError);
      } else {
        console.log("Proxy disabled, using direct connection.");
      }
    });
    return;
  }

  // enableProxy が true の場合は、必要な設定がそろっていれば PAC スクリプトでプロキシを適用
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
  let conditions = domains.map(domain => `shExpMatch(host, "${domain}")`).join(" || ");
  return `function FindProxyForURL(url, host) {
    if (${conditions}) {
      return "${proxyType.toUpperCase()} ${proxy}";
    }
    return "DIRECT";
  }`;
}
