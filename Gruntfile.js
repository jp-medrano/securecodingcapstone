"use strict";

var execFile = require("child_process").execFile;

var JS_FILES = ["Gruntfile.js", "app/assets/js/**", "config/config.js", "app/data/**/*.js",
    "app/routes/**/*.js", "server.js", "test/**/*.js"
];


module.exports = function(grunt) {
    // Project Configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        watch: {
            js: {
                files: JS_FILES,
                tasks: ["jshint"],
                options: {
                    livereload: true
                }
            },
            html: {
                files: ["app/views/**"],
                options: {
                    livereload: true
                }
            },
            css: {
                files: ["app/assets/css/**"],
                options: {
                    livereload: true
                }
            }
        },
        jshint: {
            all: JS_FILES,
            options: {
                jshintrc: true
            }
        },
        jsbeautifier: {
            files: JS_FILES.concat(["app/views/**", "app/assets/css/**"]),
            options: {
                html: {
                    braceStyle: "collapse",
                    indentChar: " ",
                    indentScripts: "keep",
                    indentSize: 4,
                    maxPreserveNewlines: 10,
                    preserveNewlines: true,
                    unformatted: ["a", "sub", "sup", "b", "i", "u", "pre"],
                    wrapLineLength: 0
                },
                css: {
                    indentChar: " ",
                    indentSize: 4
                },
                js: {
                    braceStyle: "collapse",
                    breakChainedMethods: false,
                    e4x: false,
                    evalCode: false,
                    indentChar: " ",
                    indentLevel: 0,
                    indentSize: 4,
                    indentWithTabs: false,
                    jslintHappy: false,
                    keepArrayIndentation: false,
                    keepFunctionIndentation: false,
                    maxPreserveNewlines: 10,
                    preserveNewlines: true,
                    spaceBeforeConditional: true,
                    spaceInParen: false,
                    unescapeStrings: false,
                    wrapLineLength: 0
                }
            }
        },
        concurrent: {
            tasks: ["nodemon", "watch"],
            options: {
                logConcurrentOutput: true
            }
        },
        if: {
            testSecurityDependenciesInstalled: {
                options: {
                    test: function() {
                        console.log("Checking to see if chromedriver is installed.");
                        try {
                            return require.resolve("chromedriver");
                        } catch (e) {
                            console.log(e);
                            console.log("We will now try to install it.");
                            console.log("If this fails, please try installing manually,");
                            console.log("there may be some help here:");
                            console.log("https://github.com/vuejs/vue-router/issues/261#issuecomment-218618180");
                            throw e;
                        }
                    }
                },
                ifTrue: ["mochaTest:security"],
                ifFalse: ["npm-install:chromedriver@^2.21.2", "mochaTest:security"]
            }
        },
        mochaTest: {
            options: {
                reporter: "spec"
            },
            unit: {
                src: ["test/unit/*.js"],
            },
            security: {
                src: ["test/security/*.js"]
            }
        },
        env: {
            test: {
                NODE_ENV: "test"
            }
        },
        retire: {
            js: [],
            node: ["./"],
            options: {
                verbose: true,
                packageOnly: true,
                jsRepository: "https://raw.github.com/bekk/retire.js/master/repository/jsrepository.json",
                nodeRepository: "https://raw.github.com/bekk/retire.js/master/repository/npmrepository.json",
            }
        }

    });

    // Load NPM tasks
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-mocha-test");
    grunt.loadNpmTasks("grunt-nodemon");
    grunt.loadNpmTasks("grunt-concurrent");
    grunt.loadNpmTasks("grunt-env");
    grunt.loadNpmTasks("grunt-jsbeautifier");
    grunt.loadNpmTasks("grunt-retire"); // run as: grunt retire
    grunt.loadNpmTasks("grunt-if");
    grunt.loadNpmTasks("grunt-npm-install");

    // Making grunt default to force in order not to break the project.
    grunt.option("force", true);

    // Fix for command injection: no shell string; the environment name is allowlisted
    // and passed to a child process through its env instead of being concatenated into a command.
    grunt.registerTask("db-reset", "(Re)init the database.", function(arg) {
        var allowedEnvs = ["development", "test", "production"];
        var finalEnv = process.env.NODE_ENV || arg || "development";
        if (allowedEnvs.indexOf(finalEnv) === -1) {
            grunt.fail.fatal("Invalid environment: " + finalEnv);
        }

        var done = this.async();

        execFile(
            process.execPath, ["artifacts/db-reset.js"], {
                env: Object.assign({}, process.env, { NODE_ENV: finalEnv })
            },
            function(err, stdout, stderr) {
                if (err) {
                    grunt.log.error("db-reset:");
                    grunt.log.error(err);
                    grunt.log.error(stderr);
                } else {
                    grunt.log.ok(stdout);
                }
                done();
            }
        );
    });

    // Code Validation, beautification task(s).
    grunt.registerTask("precommit", ["jsbeautifier", "jshint"]);

    // Test task.
    grunt.registerTask("test", ["env:test", "mochaTest:unit"]);

    // Security test task.
    grunt.registerTask("testsecurity", ["env:test", "if:testSecurityDependenciesInstalled"]);

    // start server.
    grunt.registerTask("run", ["precommit", "concurrent"]);

    // Default task(s).
    grunt.registerTask("default", ["precommit", "concurrent"]);
};
