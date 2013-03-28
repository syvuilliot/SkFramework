define([
	'dojo/_base/declare',	'dojo/dom-style',	'dojo/_base/lang',
	'../../../../utils/AttributeTree',
	'dijit/layout/BorderContainer',	'dijit/layout/ContentPane',
	'../FlexContainer',
	'../../ManyPlacer',	'../../MultiPlacers',	'../DijitInDijit',	'../DijitInDom',	'../ContainerInDijit',	'../InContainer'
], function(
	declare,				style,				lang,
	AttributeTree,
	BorderContainer,				ContentPane,
	FlexContainer,
	ManyPlacer,			MultiPlacers,			DijitInDijit,		DijitInDom,			ContainerInDijit,		InContainer
) {
	"strict mode";
	
	var App = declare([], {
		constructor: function() {
			this._placer = new ManyPlacer(new MultiPlacers([
				new DijitInDijit(),
				new ContainerInDijit(), new InContainer()
			]));

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

		init: function() {
			this._placer.putEach([
				[this.leftPanel, { region: 'left', splitter: 'true' }], [
				[this.rightPanel, { region: 'center' }], [
					[this.fixedContent, 100],
					[this.flexContent, 'flex']
				]]
			], this.root);
		}
	});

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
	
	window.app = new App();
	app.init();

	new DijitInDom().put(app.root, document.body);
});
