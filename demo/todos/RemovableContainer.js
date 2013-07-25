define([
	'compose',
	'ksf/dom/Composite',
	'ksf/components/dom/layout/HTMLContainer',
	'ksf/components/dom/HtmlElement',
	'ksf/dom/proxyEvent',
], function(
	compose,
	Composite,
	HTMLContainer,
	HtmlElement,
	proxyEvent
){
	return compose(
		Composite,
		function(args) {
			this._components.factories.addEach({
				removeBtn: function() {
					return new (compose(HtmlElement, proxyEvent.click))('button', { textContent: "X" });
				}
			});

			this._components.when('removeBtn', function(btn) {
				return btn.on('click', args.removeCallback);
			}.bind(this));

			this._layout.configs.addEach({
				default: [
					new HTMLContainer('div'), [
						args.content,
						'removeBtn'
					]
				]
			});
			this._layout.set('current', 'default');
		}
	);
});