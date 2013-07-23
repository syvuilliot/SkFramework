define([
	'intern!object',	'intern/chai!assert',
	'compose',
	'put-selector/put',
	'ksf/components/layout/FlexContainer',
	'ksf/components/HtmlElement',
	'../Sizeable',
	'../WithOuterSize'
], function(
	registerSuite,		assert,
	compose,
	put,
	FlexContainer,
	HtmlElement,
	Sizeable,
	WithOuterSize
){
	// create css rules
	var css = document.createElement("style");
	css.type = "text/css";
	document.head.appendChild(css);
	css.sheet.insertRule('.fixed { background-color: lightgray; }', css.sheet.cssRules.length);
	css.sheet.insertRule('.flex { background-color: lightblue; }', css.sheet.cssRules.length);

	var SizeableElmt = compose(
		HtmlElement,
		Sizeable,
		WithOuterSize,
		{
			updateRendering: function() {
				HtmlElement.prototype.updateRendering.apply(this, arguments);
				Sizeable.prototype.updateRendering.apply(this, arguments);
			}
		}
	);

	var container = window.container = new FlexContainer({
		orientation: 'vertical'
	});

	var div1 = new SizeableElmt('div', { innerHTML: 'Fixed - With a long content so that we can increase height of this bloc by resizing the viewport', className: 'fixed' });
	//div1.domNode.style.background = '#AFF';
	var div2 = new SizeableElmt('div', { innerHTML: 'Flex', className: 'flex' });
	//div2.domNode.style.background = '#FAF';
	var div3 = new SizeableElmt('div', { innerHTML: 'Fixed', className: 'fixed' });
	//div3.domNode.style.background = '#FFA';

	container.set('content', [
		div1,
		[div2, { flex: true }],
		div3
	]);

	document.body.parentNode.style.height = '100%';
	document.body.style.height = '100%';
	document.body.style.margin = 0;
	
	var size = function() {
		container.set('bounds', {
			height: document.body.offsetHeight,
			width: document.body.offsetWidth
		});
		container.updateRendering();
	};

	document.body.appendChild(container.get('domNode'));
	size();
	window.onresize = size;
});