define([
	'compose',
	'ksf/dom/WithOrderedContent',
	'../HtmlElement'
], function(
	compose,
	WithOrderedContent,
	HtmlElement
){
	return compose(
		HtmlElement,
		WithOrderedContent,
		{
			_contentSetter: function(content) {
				WithOrderedContent.prototype._contentSetter.apply(this, arguments);
				this._applyContent(this.get('content'));
			}
		}
	);
});