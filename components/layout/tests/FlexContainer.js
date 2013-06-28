define([
	'intern!object',	'intern/chai!assert',
	"put-selector/put",
	"../FlexContainer",
	'../../DomNode'
], function(
	registerSuite, assert,
	put,
	FlexContainer,
	DomNode
){
	var container = window.container = new FlexContainer({
		orientation: 'vertical'
	});
	var div1 = new DomNode('div');
	div1.domNode.innerHTML = 'First';
	div1.domNode.style.background = '#AFF';
	var div2 = new DomNode('div');
	div2.domNode.innerHTML = 'Flex';
	div2.domNode.style.background = '#FAF';
	var div3 = new DomNode('div');
	div3.domNode.innerHTML = 'Last';
	div3.domNode.style.background = '#FFA';

	container.addChild(div1);
	container.addChild(div2, { flex: true });
	container.addChild(div3);

	document.body.parentNode.style.height = '100%';
	document.body.style.height = '100%';
	document.body.style.margin = 0;
	
	var size = function() {
		container.bounds = {
			height: document.body.offsetHeight,
			width: document.body.offsetWidth
		};
		container.render();
	};

	document.body.appendChild(container.domNode);
	size();
	window.onresize = size;
});