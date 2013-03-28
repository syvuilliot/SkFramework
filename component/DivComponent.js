define([
	'compose',
	'./_DomComponent'
], function(
	compose,
	_DomComponent
) {
	/*
	 * Component using a DOM-node as view
	 */
	return compose(_DomComponent,
		function DivComponent(params) {
			this._components.addComponentFactory('domNode', function() {
				return document.createElement('div');
			});
		}
	);
});