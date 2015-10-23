module.exports = function (grunt) {

    var path = require('path');
    var currentPath = path.resolve();
    var siteName = path.basename(currentPath);

    console.log('Running grunt for ' + siteName);

    grunt.initConfig({
        root: '.',
        dest: 'assets',
        siteName: siteName,
        currentPath: currentPath,

        // define source files and their destinations
        uglify: {
            dist: {
                files: {
                  '<%= dest %>/js/dist/main.min.js': ['<%= dest %>/js/dist/main.js']
                }
            }
        },
        watch: {
            options: {
                livereload: 1337
            },
            js:  {
                files: '<%= dest %>/js/src/**/*.js',
                tasks: [ 'concat:dist', 'uglify:dist', ]
                // tasks: [ 'concat:dist', 'uglify:dist', 'sftp-deploy' ]
            },
            css: {
                files: '<%= dest %>/scss/*.scss',
                tasks: [ 'sass:dist']
                // tasks: [ 'sass:dist', 'sftp-deploy']
            },
            templates: {
                files: '<%= root %>/templates/**/*'
                // tasks: [ 'sftp-deploy']
            }
        },
        concat: {
            options: {
                seperator: ';'
            },
            dist: {
                files: {
                    '<%= dest %>/js/dist/main.js': ['<%= dest %>/js/src/vendor/jquery-1.11.1.min.js', '<%= dest %>/js/src/vendor/*.js', '<%= dest %>/js/src/plugins.js', '<%= dest %>/js/src/main.js', '<%= dest %>/js/src/main/*.js',  '!<%= dest %>/js/src/vendor/modernizr-2.6.2.min.js'],
                    '<%= dest %>/js/dist/modernizr.min.js': ['<%= dest %>/js/src/vendor/modernizr-2.6.2.min.js']                
                }
            }
        },
        sass: {
            dist: {
                files: {
                    '<%= dest %>/css/ie9.css': ['<%= dest %>/scss/ie9.scss'],
                    '<%= dest %>/css/ie8.css': ['<%= dest %>/scss/ie8.scss']
                }
            },
            options: {
                compass: true
            }
        }

    });


    // load plugins
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-sass');

    // register at least this one task
    grunt.registerTask('default', [
        'concat:dist',
        'uglify:dist',
        'sass:dist'
        // 'sftp-deploy'
    ]);
};
