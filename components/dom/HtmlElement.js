define([
	'compose',
	'ksf/base/ObservableObject',
	'ksf/dom/WithHTMLElement'
], function(
	compose,
	ObservableObject,
	WithHTMLElement
) {
	return compose(
		ObservableObject,
		WithHTMLElement,
		function(tag, attrs) {
			this._tag = tag;
			this.createRendering();
			if (attrs) {
				this.setEach(attrs);
			}
		},
		{
			_Getter: function(prop) {
				return this._domNode[prop];
			},
			_Setter: function(prop, value) {
				this._applyDomAttr(prop, value);
			},
			_Detector: function(prop){
				return this._domNode.hasOwnProperty(prop);
			}
		}
	);
});