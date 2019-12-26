const SUSPEND_OFF = document.querySelector('#suspend-off');
const SUSPEND_ON = document.querySelector('#suspend-on');

SUSPEND_OFF.addEventListener('click', function(e) {
	console.log('DSIABLE + ', e.target.value);
	chrome.storage.local.set({ AUTO_SUSPEND: false }, () => {
		chrome.storage.local.get('AUTO_SUSPEND', cb => {
			console.log('cb', cb);
		});
	});
});

SUSPEND_ON.addEventListener('click', function(e) {
	console.log('ENABLE');
	chrome.storage.local.set({ AUTO_SUSPEND: true }, () => {
		chrome.storage.local.get('AUTO_SUSPEND', cb => {
			console.log('cb', cb);
		});
	});
});

document.addEventListener('DOMContentLoaded', () => {
	chrome.storage.local.get('AUTO_SUSPEND', data =>
		data['AUTO_SUSPEND'] ? (SUSPEND_ON.checked = true) : (SUSPEND_OFF.checked = true)
	);
});
