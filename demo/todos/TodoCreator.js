define([
	'compose',
	'ksf/components/dom/HtmlElement',
	'../Todo'
], function(
	compose,
	HtmlElement,
	Todo
) {
	return compose(
		HtmlElement.prototype,
		function() {
			HtmlElement.call(this, 'input', { type: 'text', placeholder: "Add new todo" });

			this.get('domNode').addEventListener('change', function() {
				this._emit('newTodo', new Todo({ text: this.get("value") }));
				// reset input
				this.set('value', "");
			}.bind(this));
		}
	);
});