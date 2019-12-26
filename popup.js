'use strict';
console.log('%c Welcome :)', 'background: #222; color: #32cd32; padding: 1rem; font-size: 24px; font-weight: bold');

//#region cpuElements
const cpuMmodel = document.querySelector('.cpu-model');
const cpuBarsContainer = document.querySelector('.cpu-bars-container');
const cpuUsageTextContainer = document.querySelector('.cpu-usage-text-container');
//#endregion

//#region memoryElements
const totalMem = document.querySelector('.totalMem');
const freeMem = document.querySelector('.freeMem');
const usedMem = document.querySelector('.usedMem');
const usedMemoryBar = document.querySelector('.usedMemoryBar');
//#endregion

//#region tabElements
const tabListEl = document.querySelector('.tabList');
const currTab = document.querySelector('.currTab');
//#endregion

let isFirstRun = true;

const renderCPU = () => {
	if (isFirstRun) {
		initCPURender();
		isFirstRun = false;
		return 0;
	}
	updateCores();
};

const updateCores = () => {
	const barNodes = document.querySelectorAll('.cpu-usage-bar');
	const txtNodes = document.querySelectorAll('.cpu-usage-text');
	chrome.storage.local.get('cpu', function(data) {
		try {
			const { processors } = data.cpu;
			processors.forEach((core, i) => {
				const { usage } = core;
				const { idle, kernel, user, total } = usage;
				const coreUsage = ((kernel + user) / total) * 100;
				barNodes[i].style.height = coreUsage.toFixed(2) + '%';
				txtNodes[i].textContent = Math.round(coreUsage) + '%';
			});
		} catch (e) {
			console.log('e', e);
		}
	});
	return 0;
};

const initCPURender = () => {
	chrome.storage.local.get('cpu', function(data) {
		try {
			const { processors, modelName } = data.cpu;
			// Render CPU model
			cpuMmodel.textContent = modelName;

			// Create elements for each core and get initial data
			processors.forEach(core => {
				const cpuUsageContainerEl = document.createElement('div');
				const cpuUsageBarEl = document.createElement('div');
				const cpuUsageTxtEl = document.createElement('div');

				cpuUsageContainerEl.classList.add('bar-container');
				cpuUsageBarEl.classList.add('cpu-usage-bar');
				cpuUsageTxtEl.classList.add('cpu-usage-text');

				const { usage } = core;
				const { idle, kernel, user, total } = usage;
				const coreUsage = ((kernel + user) / total) * 100;

				cpuUsageBarEl.style.height = coreUsage.toFixed(2) + '%';
				cpuUsageTxtEl.textContent = Math.round(coreUsage) + '%';

				cpuUsageContainerEl.appendChild(cpuUsageBarEl);
				cpuUsageTextContainer.appendChild(cpuUsageTxtEl);

				cpuBarsContainer.appendChild(cpuUsageContainerEl);
			});
		} catch (e) {
			console.log('e', e);
		}
	});
	return 0;
};

const createKillBtn = id => {
	const spanEl = document.createElement('span');
	spanEl.classList.add('kill-btn');
	spanEl.setAttribute('value', id);
	spanEl.innerHTML = '&#x292C';

	spanEl.onclick = ev => {
		ev.stopPropagation();

		const parentEl = document.querySelector(`li[value='${Number(id)}']`);
		parentEl.classList.add('remove');

		chrome.tabs.remove(Number(id), () => setTimeout(() => parentEl.remove(), 260));
	};

	return spanEl;
};

const generateTab = data => {
	const { title, id } = data;
	const tabEl = document.createElement('li');
	tabEl.classList.add('tab');
	tabEl.setAttribute('title', title);
	tabEl.setAttribute('value', id);
	tabEl.textContent = `${title}`;

	tabEl.onclick = () => chrome.tabs.update(id, { highlighted: true, active: true });

	const killBtnEl = createKillBtn(id);

	tabEl.appendChild(killBtnEl);

	tabListEl.appendChild(tabEl);
};

const renderTabs = function() {
	// Render current tab
	chrome.tabs.query({ active: true }, tab => {
		const liEl = document.createElement('li');
		const { title, id } = tab[0];
		liEl.classList.add('tab', 'currTab');
		liEl.setAttribute('title', title);
		liEl.textContent = `${title}`;
		tabListEl.append(liEl);
	});

	chrome.storage.local.get('AUTO_SUSPEND', data => {
		chrome.tabs.query({ active: false }, tabs => {
			for (let i = tabs.length - 1; i >= 0; i--) {
				generateTab(tabs[i]);
			}
			if (data['AUTO_SUSPEND']) {
				discardTabs();
			}
		});
	});
};

const discardTabs = () => {
	chrome.tabs.query({ active: false }, function(tabs) {
		tabs.forEach((tab, i) => {
			chrome.tabs.discard(tabs[i].id, x => {
				console.log('DISCARDED ', x);
			});
		});
	});
};

// Render other tabs
// chrome.tabs.query({ active: false }, tabs => {
// 	for (let i = tabs.length - 1; i >= 0; i--) {
// 		generateTab(tabs[i]);
//   }
// });

const renderMemory = () => {
	chrome.storage.local.get('memory', function(data) {
		const { availableCapacity, capacity } = data.memory;

		const capacityGB = parseFloat(formatBytes(capacity, -1));
		const availableGB = parseFloat(formatBytes(availableCapacity, -1));

		const freeMemoryPercentage = availableGB / capacityGB;

		const usedMemPercentage = ((1 - freeMemoryPercentage) * 100) / 100; // -> 0.25
		// console.log('capacityGB, usedMemPercentage', capacityGB, usedMemPercentage);

		totalMem.innerHTML = Math.ceil(capacityGB) + ' GB TOTAL';
		freeMem.innerHTML = availableGB + ' GB FREE';
		usedMem.innerHTML = capacityGB * usedMemPercentage + ' GB USED';

		usedMemoryBar.style.width = Math.round(usedMemPercentage * 100) + '%';
		usedMemoryBar.style.opacity = Math.round(100 - usedMemPercentage);
	});
	return 0;
};

renderCPU();
renderMemory();
renderTabs();
setInterval(renderMemory, 10000);
setInterval(renderCPU, 10000);

function formatBytes(bytes, decimals = 2) {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
