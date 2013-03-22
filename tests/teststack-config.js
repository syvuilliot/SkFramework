define({
	// Configuration options for the module loader; any AMD configuration options supported by the Dojo loader can be
	// used here
	loader: {
		packages: [
			{ name: 'chai', location: 'dojo2-teststack/chai', main: 'chai' }
		],
		paths: {
			"collections": "collections-amd",
			"frb": "frb-amd",
		}
	},

	// Non-functional test suite(s) to run in each browser
	suites: [
		'ksf/component/tests/Component',
		'ksf/component/tests/DomComponent'
	],

});