define([
	'dojo/_base/declare',	'dojo/dom-style',	'dojo/_base/lang',
	'../../../../utils/AttributeTree',
	'dijit/layout/BorderContainer',	'dijit/layout/ContentPane',
	'../FlexContainer',
	'../../MultiPlacer',	'../DijitInDijit',	'../DijitInDom',	'../DomInDijit',	'../ContainerInDijit',	'../InContainer'
], function(
	declare,				style,				lang,
	AttributeTree,
	BorderContainer,				ContentPane,
	FlexContainer,
	MultiPlacer,			DijitInDijit,		DijitInDom,			DomInDijit,			ContainerInDijit,		InContainer
) {
	"strict mode";
	
	var App = declare([], {
		constructor: function() {
			this._placement = new AttributeTree();
			this._placer = new MultiPlacer([new DijitInDijit(), new DijitInDom(), new DomInDijit(),
				new ContainerInDijit(), new InContainer()]);

			this.root = new BorderContainer({style: "height: 100%; width: 100%;"});
			this.leftPanel = new ContentPane({
            	content: "ContentPane",
            	style: {
            		background: "#AAF"
            	}
            });
            this.rightPanel = new FlexContainer();
            this.flexContent = document.createElement('div');
			this.flexContent.innerHTML = "FlexContainer.flex";
			this.fixedContent = document.createElement('div');
			this.fixedContent.innerHTML = "FlexContainer.fixed";
		},

		layout: function() {
			this.root.startup();
			this._placer.put(this.leftPanel, this.root, {
				region: 'left'
			});
			this._placer.put(this.rightPanel, this.root, {
				region: 'center'
			});

			this._placer.put(this.fixedContent, this.rightPanel, 100);
			this._placer.put(this.flexContent, this.rightPanel, 'flex');
		}
	});

	Object.defineProperty(App.prototype, 'domNode', {
		get: function() {
			return this.root.domNode;
		}
	});
	
	window.app = new App();
	document.body.appendChild(app.domNode);

	// Set styles for html & body: fullscreen
	style.set(document.getElementsByTagName('html')[0], {
		width: '100%',
		height: '100%',
		margin: 0,
		padding: 0
	});
	style.set(document.body, {
		width: '100%',
		height: '100%',
		margin: 0,
		padding: 0
	});

	app.layout();
});
