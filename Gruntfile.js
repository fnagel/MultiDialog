module.exports = function (grunt) {

	grunt.initConfig({
		pkg : grunt.file.readJSON("package.json"),
		jshint : {
			files : ["gruntfile.js", "js/*.js"],
			options : {
				"boss": true,
				"curly": true,
				"eqeqeq": true,
				"eqnull": true,
				"expr": true,
				"immed": true,
				"noarg": true,
				"onevar": true,
				"quotmark": "double",
				"smarttabs": true,
				"trailing": true,
				"undef": true,
				"unused": true,
				"node": true,
				"browser": true,
				"globals": {
					"jQuery": true
				}
			}
		},
		csslint: {
			files : ["css/jquery.multiDialog.css"],
			options: {
				"adjoining-classes": false,
				"box-model": false,
				"compatible-vendor-prefixes": false,
				"duplicate-background-images": false,
				"import": false,
				"important": false,
				"outline-none": false,
				"overqualified-elements": false,
				"text-indent": false
			}
		},
		concat : {
			options : {
				banner : "/*! v<%= pkg.version %> - <%= grunt.template.today('dd-mm-yyyy HH:MM') %> */\n"
			},
			standard : {
				src : [
					"js/jquery.multiDialog.js",
					"js/jquery.ui.dialog.extended-*.js"
				],
				dest : "compiled/js/<%= pkg.name %>-<%= pkg.version %>.js"
			},
			standalone : {
				src : [
					"js/jquery.multiDialog.js",
					"js/jquery/jquery-ui-*.custom.js",
					"js/jquery.ui.dialog.extended-*.js",
					"js/mobile/jquery.event.*.js"
				],
				dest : "compiled/js/<%= pkg.name %>-<%= pkg.version %>_standalone.js"
			}
		},
		uglify : {
			options: {
				report: "min",
				preserveComments : "some"
			},
			standard : {
				src : [ "compiled/js/<%= pkg.name %>-<%= pkg.version %>.js" ],
				dest : "compiled/js/<%= pkg.name %>-<%= pkg.version %>.min.js"
			},
			standalone : {
				src : [ "compiled/js/<%= pkg.name %>-<%= pkg.version %>_standalone.js" ],
				dest : "compiled/js/<%= pkg.name %>-<%= pkg.version %>_standalone.min.js"
			}
		},
		cssmin: {
			options: {
				report: "min"
			},
			standard : {
				src: ["css/jquery.multiDialog.css"],
				dest: "compiled/css/<%= pkg.name %>.css"
			},
			standalone : {
				src: ["css/*.css"],
				dest: "compiled/css/<%= pkg.name %>_standalone.css"
			}
		},
		compress: {
			main: {
				options: {
					archive: "<%= pkg.name %>-<%= pkg.version %>.zip"
				},
				files: [
					{ src: ["./**", "!./node_modules/**", "!./*.zip"], dest: "<%= pkg.name %>-<%= pkg.version %>/" }
				]
			}
		},
		watch : {
			scripts: {
				files : ["<%= jshint.files %>"],
				tasks : ["jshint"]
			},
			styles: {
				files : ["<%= csslint.files %>"],
				tasks : ["csslint"]
			}
		},
		clean : {
			options: {
				force: true
			},
			build: {
				src: ["./compiled", "./*.zip"]
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-csslint");
	grunt.loadNpmTasks("grunt-contrib-cssmin");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-contrib-compress");
	grunt.loadNpmTasks("grunt-contrib-clean");

	grunt.registerTask("test", ["jshint", "csslint"]);
	
	grunt.registerTask("default", ["jshint", "csslint", "clean", "concat", "uglify", "cssmin", "compress"]);

};