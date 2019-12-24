chrome.runtime.onInstalled.addListener(function () {

  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        // pageUrl: { hostEquals: 'developer.chrome.com' },
      })
      ],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });

  const getCpuInfo = () => chrome.system.cpu.getInfo(data => saveToChromeStorage('cpu', data));
  const getMemoryInfo = () => chrome.system.memory.getInfo(data => saveToChromeStorage('memory', data));

  getCpuInfo();
  getMemoryInfo();
  setInterval(getCpuInfo, 9650);
  setInterval(getMemoryInfo, 9650);
});


const saveToChromeStorage = (key, data) => chrome.storage.local.set({ [key]: data });