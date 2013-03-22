define({
	// Configuration options for the module loader; any AMD configuration options supported by the Dojo loader can be
	// used here
	loader: {
		// Packages that should be registered with the loader in each testing environment
	},

	// Non-functional test suite(s) to run in each browser
	suites: [
		'SkFramework/component/tests/Component',
		'SkFramework/component/tests/DomComponent'
	],

});