define([
	'compose',
	'./HtmlElement',
	'ksf/dom/WithReactiveOrderedContent',
], function(
	compose,
	HtmlElement,
	WithReactiveOrderedContent
){
	return compose(
		HtmlElement,
		WithReactiveOrderedContent
	);
});