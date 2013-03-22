define({
	// Configuration options for the module loader; any AMD configuration options supported by the Dojo loader can be
	// used here
	loader: {
		// Packages that should be registered with the loader in each testing environment
		packages: [ 'dojo2-teststack' ],
		map: { 'dojo2-teststack': { 'dojo-ts': 'dojo2-teststack/dojo' } },
		paths: {
			"collections": "collections-amd",
			"frb": "frb-amd",
		},
	},

	// Non-functional test suite(s) to run in each browser
	suites: [ 'SkFramework/utils/tests/Registry' ],

});