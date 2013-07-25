define([
	'compose',
	'ksf/base/ObservableObject',
	'ksf/dom/WithHTMLElement'
], function(
	compose,
	ObservableObject,
	WithHTMLElement
){
	return compose(
		ObservableObject,
		WithHTMLElement,
		{
			_tag: 'div'
		}
	);
});