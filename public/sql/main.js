window.dg = {
	version: "v1.1.1",
	config: {},
	code: {},
	sql: {},
	language: {}
};


if ('serviceWorker' in navigator) {
	window.addEventListener('load', function() {
		navigator.serviceWorker.register('/sw.js');
	});
}


function addInstall() {
	var li = document.getElementById("instalar");
	var a = li.firstElementChild;

	var deferredPrompt;
	window.addEventListener('beforeinstallprompt', function(e) {
		e.preventDefault();
		deferredPrompt = e;
		li.style.display = 'block';
	});

	a.addEventListener('click', function(e) {
		e.preventDefault();
		deferredPrompt.prompt();
		deferredPrompt.userChoice.then(choiceResult => {
			if (choiceResult.outcome === 'accepted') {
				li.style.display = 'none';
			}
			deferredPrompt = null;
		});

		return false;
	});
}


$(function() {
	addInstall();

	document.getElementById("version").innerHTML = dg.version;
	dg.step.check();
});
