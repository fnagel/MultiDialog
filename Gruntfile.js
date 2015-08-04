module.exports = function (grunt) {

	// Load grunt tasks automatically
	require('load-grunt-tasks')(grunt);

	// Time how long tasks take. Can help when optimizing build times
	require('time-grunt')(grunt);

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		jshint: {
			files: ["gruntfile.js", "js/*.js"],
			options: {
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
			files: ["css/jquery.multiDialog.css"],
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
		concat: {
			options: {
				banner: "/*! v<%= pkg.version %> - <%= grunt.template.today('dd-mm-yyyy HH:MM') %> */\n"
			},
			standard: {
				src: [
					"js/jquery.multiDialog.js",
					"js/jquery-ui.dialog.extended-*.js"
				],
				dest: "compiled/js/<%= pkg.name %>.js"
			},
			standalone: {
				src: [
					"js/jquery.multiDialog.js",
					"js/jquery/jquery-ui-*.custom.js",
					"js/jquery.ui.dialog.extended-*.js",
					"js/mobile/jquery.event.*.js"
				],
				dest: "compiled/js/<%= pkg.name %>.standalone.js"
			}
		},
		uglify: {
			options: {
				report: "min",
				preserveComments: "some"
			},
			standard: {
				src: [ "compiled/js/<%= pkg.name %>.js" ],
				dest: "compiled/js/<%= pkg.name %>.min.js"
			},
			standalone: {
				src: [ "compiled/js/<%= pkg.name %>.standalone.js" ],
				dest: "compiled/js/<%= pkg.name %>.standalone.min.js"
			}
		},
		cssmin: {
			options: {
				report: "min"
			},
			standard: {
				src: ["css/jquery.multiDialog.css"],
				dest: "compiled/css/<%= pkg.name %>.css"
			},
			standalone: {
				src: ["css/*.css"],
				dest: "compiled/css/<%= pkg.name %>.standalone.css"
			}
		},
		compress: {
			main: {
				options: {
					archive: "<%= pkg.name %>-<%= pkg.version %>.zip"
				},
				files: [ {
						src: ["./**", "!./node_modules/**", "!./*.zip"],
						dest: "<%= pkg.name %>-<%= pkg.version %>/"
				} ]
			}
		},
		watch: {
			scripts: {
				files: ["<%= jshint.files %>"],
				tasks: ["jshint"]
			},
			styles: {
				files: ["<%= csslint.files %>"],
				tasks: ["csslint"]
			}
		},
		clean: {
			options: {
				force: true
			},
			build: {
				src: ["./compiled", "./*.zip"]
			},
			docs: {
				src: ["./docs"]
			}
		},
		yuidoc: {
			compile: {
				name: "<%= pkg.name %>",
				description: "<%= pkg.description %>",
				version: "<%= pkg.version %> - <%= grunt.template.today('dd-mm-yyyy HH:MM') %>",
				url: "<%= pkg.homepage %>",
				logo: "https://drone.io/github.com/fnagel/MultiDialog/status.png",
				options: {
					force: true,
					paths: ["./js"],
					outdir: "docs/",
					tabtospace: 4
				}
			}
		}
	});

	grunt.registerTask("test", ["jshint", "csslint"]);

	grunt.registerTask("doc", ["clean:docs", "jshint", "yuidoc"]);

	grunt.registerTask("default", ["jshint", "csslint", "clean", "yuidoc", "concat", "uglify", "cssmin", "compress"]);

};