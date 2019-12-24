'use strict'

const cpuMmodel = document.getElementById('cpuMmodel');
const numCores = document.getElementById('numCores');
const cpuBarsContainer = document.getElementById('cpu-bars-container');
const cpuUsageTextContainer = document.getElementById('cpu-usage-text-container');

const totalMem = document.getElementById('totalMem');
const freeMem = document.getElementById('freeMem');
const usedMem = document.getElementById('usedMem');
const usedMemoryBar = document.getElementById('usedMemoryBar');

const tabListEl = document.getElementById('tabList');
const currTab = document.querySelector('.currTab');


let isFirstRun = true;

const getCpuUsage = () => {
  chrome.storage.local.get('cpu', (data) => {
    const { modelName, numOfProcessors, archName, features } = data.cpu;
    cpuMmodel.innerHTML = modelName;
    numCores.innerHTML = numOfProcessors + ' Cores'
  })
};

const getCoresUsage = () => {
  if (isFirstRun) init();
  else updateCoreUsage();
};

const updateCoreUsage = () => {
  const cpuUsageBars = document.querySelectorAll('.cpu-usage-bar')
  chrome.storage.local.get('cpu', (data) => {
    try {
      const { processors } = data.cpu;
      cpuUsageBars.forEach((usageBar, i) => {
        const { usage } = processors[i];
        const { idle, kernel, user, total } = usage;
        const coreUsage = (kernel + user) / total * 100;
        // console.log('core usage', coreUsage);
        usageBar.style.height = Math.round(coreUsage) + '%';
      })
    } catch (e) { console.log('e', e) }
  })
}

function init() {
  chrome.storage.local.get('cpu', (data) => {
    try {
      const { processors } = data.cpu;
      processors.forEach((core) => {
        const barContainerEl = document.createElement('div');
        barContainerEl.classList.add('bar-container')

        const { usage } = core;
        const { idle, kernel, user, total } = usage;

        const coreUsage = (kernel + user) / total * 100;

        const cpuUsageBar = createCpuUageBar(coreUsage);
        const cpuUsageTxt = createCpuUsageText(coreUsage);

        barContainerEl.appendChild(cpuUsageBar);
        cpuUsageTextContainer.appendChild(cpuUsageTxt);

        cpuBarsContainer.appendChild(barContainerEl);
      })
    } catch (e) { console.log('e', e) }
  })
  isFirstRun = false;
}


const createCpuUageBar = (coreUsage) => {
  const cpuUsageBarEl = document.createElement('div');
  cpuUsageBarEl.classList.add('cpu-usage-bar');
  cpuUsageBarEl.style.height = Math.round(coreUsage) + '%';
  return cpuUsageBarEl;
};

const createCpuUsageText = (coreUsage) => {
  const cpuUsageTxtEl = document.createElement('div');
  cpuUsageTxtEl.classList.add('cpu-usage-text');
  cpuUsageTxtEl.innerHTML = Math.round(coreUsage) + '%';
  return cpuUsageTxtEl;
};

const renderCurrTab = () => {
  return chrome.tabs.query({ active: true }, tab => {
    const currTab = document.createElement('li');
    const { title, id } = tab[0];
    currTab.classList.add('tab', 'currTab');
    currTab.setAttribute('title', title)
    currTab.textContent = `${title}`
    tabListEl.append(currTab);
  });
};

const createTab = (data) => {
  const { title, id } = data;
  const tabEl = document.createElement('li');
  tabEl.classList.add('tab');
  tabEl.setAttribute('title', title);
  tabEl.setAttribute('value', id);
  tabEl.textContent = `${title}`;

  tabEl.onclick = () => chrome.tabs.update(id, { highlighted: true, active: true });

  const killBtnEl = createKillBtn(id);
  tabEl.appendChild(killBtnEl);

  return tabEl;
}

const createKillBtn = (id) => {
  const killBtnEl = document.createElement('span');
  killBtnEl.classList.add('kill-btn');
  killBtnEl.setAttribute('value', id);
  killBtnEl.innerHTML = '&#x292C';

  killBtnEl.onclick = (ev) => {
    ev.stopPropagation();

    const parentEl = document.querySelector(`li[value='${Number(id)}']`);
    parentEl.classList.add('remove');

    chrome.tabs.remove(Number(id), () => setTimeout(() => parentEl.remove(), 260));
  };

  return killBtnEl;
};

const generateInactiveTab = (data) => {
  const tabEl = createTab(data)
  tabListEl.appendChild(tabEl);
  return 0;
};

const renderInactiveTabs = () => chrome.tabs.query({ active: false }, tabs => {
  // console.log('Total inactive tabs:', tabs.length);
  // this is used to render the list from the LAST item first, so most recent item is shown on top
  for (let i = tabs.length - 1; i >= 0; i--) generateInactiveTab(tabs[i]);
});

const getTabList = () => {
  renderCurrTab();
  renderInactiveTabs();
  return 0;
};

const getMemoryUsage = () => {
  chrome.storage.local.get('memory', function (data) {
    const { availableCapacity, capacity } = data.memory;

    const capacityGB = (parseFloat(formatBytes(capacity, -1)))
    const availableGB = (parseFloat(formatBytes(availableCapacity, -1)))

    const freeMemoryPercentage = (availableGB / capacityGB);

    const usedMemPercentage = ((1 - freeMemoryPercentage) * 100) / 100; // -> 0.25
    // console.log('capacityGB, usedMemPercentage', capacityGB, usedMemPercentage);

    totalMem.innerHTML = Math.ceil(capacityGB) + ' GB TOTAL';
    freeMem.innerHTML = (availableGB) + ' GB FREE';
    usedMem.innerHTML = (capacityGB * usedMemPercentage) + ' GB USED';

    usedMemoryBar.style.width = Math.round(usedMemPercentage * 100) + '%';
    usedMemoryBar.style.opacity = Math.round(100 - usedMemPercentage);
  });
};


getCpuUsage()
getMemoryUsage()
getCoresUsage()
getTabList();
setInterval(getMemoryUsage, 10000);
setInterval(getCoresUsage, 10000);









function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
