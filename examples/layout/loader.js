define([
	'./App',
	'dojo/domReady!'
], function (
	App
) {
	document.body.parentNode.style.height = '100%';
	document.body.style.height = '100%';
	document.body.style.margin = 0;
	document.body.style.overflow = 'hidden';

	var app = new App();

	var sizeApp = function() {
		app.bounds = {
			height: document.body.offsetHeight,
			width: document.body.offsetWidth
		};
		app.render();
	};

	app.render();
	document.body.appendChild(app.domNode);
	sizeApp();

	window.onresize = sizeApp;
});