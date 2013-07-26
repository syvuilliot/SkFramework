define([
	'compose',
	'ksf/collections/ObservableObject',
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