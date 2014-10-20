module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		browserify: {
			control: {
				src: ['src/L.Realtime.js'],
				dest: 'dist/leaflet-realtime.js',
				options: {
					transform: [
						[
							'browserify-shim',
							{
								'leaflet': 'global:L'
							}
						],
					],
					browserifyOptions: {
						standalone: 'L.Realtime'
					}
				}
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %> */\n\n'
			},
			build: {
				src: 'dist/leaflet-realtime.js',
				dest: 'dist/leaflet-realtime.min.js'
			}
		}
	});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.registerTask('default', ['browserify', 'uglify']);
};
