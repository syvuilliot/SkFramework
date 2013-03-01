define([
	"../NewComponent"
], function(NewComponent) {
	// Attach a component on an existing node
	var existingNode = document.createElement('div');
	document.body.appendChild(existingNode);
	window.newComponent1 = new NewComponent({
		domNode: existingNode,
		title: "Component 1"
	});
	
	// Place auto-generated component's node into DOM
	window.newComponent2 = new NewComponent();
	document.body.appendChild(newComponent2.domNode);
	newComponent2.set('title', "Component 2");
	newComponent2.set('inDom');
});