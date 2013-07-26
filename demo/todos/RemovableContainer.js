define([
	'compose',
	'ksf/dom/composite/Composite',
	'ksf/components/dom/layout/HtmlContainer',
	'ksf/components/dom/HtmlElement',
	'ksf/dom/proxyEvent',
], function(
	compose,
	Composite,
	HtmlContainer,
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
					new HtmlContainer('div'), [
						args.content,
						'removeBtn'
					]
				]
			});
			this._layout.set('current', 'default');

			this._style.set('base', 'RemovableContainer');
		}
	);
});