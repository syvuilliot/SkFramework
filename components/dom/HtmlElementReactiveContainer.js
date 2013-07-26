define([
	'compose',
	'./HtmlElement',
	'ksf/dom/WithOrderedContent',
], function(
	compose,
	HtmlElement,
	WithOrderedContent
){
	return compose(
		HtmlElement,
		WithOrderedContent,
		{
			_contentSetter: function(cmps){
				WithOrderedContent.prototype._contentSetter.call(this, cmps);
				this.updateRendering();
			},
		}
	);
});
