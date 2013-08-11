module.exports = function (grunt) {

	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),
		jshint : {
			files : ['gruntfile.js', 'js/*.js'],
			options : {
				globals : {
					jQuery : true
				}
			}
		},
		csslint: {
			standard: {
				src: "css/jquery.multiDialog.css"
			}
		},
		concat : {
			options : {
				banner : '/*! v<%= pkg.version %> - <%= grunt.template.today("dd-mm-yyyy HH:MM") %> */\n'
			},
			standard : {
				src : [ 'js/jquery.multiDialog.js', 'js/jquery.ui.dialog.extended-*.js' ],
				dest : 'compiled/js/<%= pkg.name %>-<%= pkg.version %>.js'
			},
			standalone : {
				src : [ 'js/jquery.multiDialog.js', 'js/jquery/jquery-ui-*.custom.js', 'js/jquery.ui.dialog.extended-*.js' ],
				dest : 'compiled/js/<%= pkg.name %>-<%= pkg.version %>_standalone.js'
			}
		},
		uglify : {
			options: {
				report: 'min',
				preserveComments : 'some'
			},
			standard : {
				src : [ 'compiled/js/<%= pkg.name %>-<%= pkg.version %>.js' ],
				dest : 'compiled/js/<%= pkg.name %>-<%= pkg.version %>.min.js'
			},
			standalone : {
				src : [ 'compiled/js/<%= pkg.name %>-<%= pkg.version %>_standalone.js' ],
				dest : 'compiled/js/<%= pkg.name %>-<%= pkg.version %>_standalone.min.js'
			}
		},
		cssmin: {
			options: {
				report: 'min'
			},
			standard : {
				src: ['css/jquery.multiDialog.css'],
				dest: 'compiled/css/<%= pkg.name %>.css'
			},
			standalone : {
				src: ['css/*.css'],
				dest: 'compiled/css/<%= pkg.name %>_standalone.css'
			}
		},
		compress: {
			main: {
				options: {
					archive: '<%= pkg.name %>-<%= pkg.version %>.zip'
				},
				files: [
					{ src: ['./**', '!./node_modules/**', '!./*.zip'], dest: '<%= pkg.name %>-<%= pkg.version %>/' }
				]
			}
		},
		watch : {
			files : ['<%= jshint.files %>'],
			tasks : ['jshint']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-csslint');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-compress');

	grunt.registerTask('test', ['jshint']);
	
	grunt.registerTask('watch', ['watch']);

	// grunt.registerTask('default', ['jshint', 'csslint', 'concat', 'uglify', 'copy', 'cssmin', 'compress']);
	grunt.registerTask('default', ['concat', 'uglify', 'cssmin', 'compress']);

};