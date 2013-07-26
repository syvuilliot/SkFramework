define([
	'compose',
	'ksf/base/ObservableObject',
	'ksf/dom/WithHTMLElement',
	'ksf/dom/WithCssClassStyle'
], function(
	compose,
	ObservableObject,
	WithHTMLElement,
	WithCssClassStyle
) {
	return compose(
		ObservableObject,
		WithHTMLElement,
		WithCssClassStyle,
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
			},

			_styleSetter: function(style) {
				this._style = style;
				this._applyStyle();
			},
			_styleGetter: function(style) {
				return this._style;
			}
		}
	);
});