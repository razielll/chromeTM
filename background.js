chrome.runtime.onInstalled.addListener(function () {
  const getCpuInfo = () => chrome.system.cpu.getInfo(data => saveToChromeStorage('cpu', data));
  const getMemoryInfo = () => chrome.system.memory.getInfo(data => saveToChromeStorage('memory', data));

  getCpuInfo();
  getMemoryInfo();
  setInterval(getCpuInfo, 9750);
  setInterval(getMemoryInfo, 9750);
});

const saveToChromeStorage = (key, data) => chrome.storage.local.set({ [key]: data });