/**
 * This file is your application’s main JavaScript file. It is listed as a dependency in run.js and will
 * automatically load when run.js loads.
 *
 * Because this file has the special filename “main.js”, and because we’ve registered the “app” package in run.js,
 * whatever object this module returns can be loaded by other files simply by requiring “app” (instead of “app/main”).
 *
 * Our first dependency is to the “dojo/has” module, which allows us to conditionally execute code based on
 * configuration settings or environmental information. Unlike a normal conditional, these branches can be compiled
 * away by the build system; see “staticHasFeatures” in app.profile.js for more information.
 *
 * Our second dependency is to the special module “require”; this allows us to make additional require calls using
 * relative module IDs within the body of our define function.
 *
 * In all cases, whatever function is passed to define() is only invoked once, and the return value is cached.
 *
 * More information about everything described about the loader throughout this file can be found at
 * http://livedocs.dojotoolkit.org/loader/amd.
 */
define([ 'dojo/has', 'require' ], function (has, require) {
    var app = {};

    if (has('host-browser')) {
        /*
         * This require call’s first dependency, “./Dialog”, uses a relative module identifier; you should use this
         * type of notation for dependencies *within* a package in order to ensure the package is fully portable. It
         * works like a path, where “./” refers to the current directory and “../” refers to the parent directory. If
         * you are referring to a module in a *different* package, you should *not* use a relative module identifier.
         *
         * The second dependency is a plugin dependency; in this case, it is a dependency on the special functionality
         * of the “dojo/domReady” plugin, which waits until the DOM is ready before finishing loading.
         * The “!” after the module name indicates you want to use special plugin functionality; if you were to
         * require just “dojo/domReady”, it would load that module just like any other module, without any of the
         * special plugin functionality.
         */
        require(['dojo', 'dojo/ready', 'dijit/registry', './dataurl',
            './XMLFileReader', './DeltaController',
            'dojo/data/ItemFileWriteStore', './DiffCommand', './PatchCommand',
            './Layout'],
        function (dojo, ready, registry, dataurl, XMLFileReader,
            DeltaController, ItemFileWriteStore, DiffCommand, PatchCommand,
            Layout) {

            var origReader = new XMLFileReader();
            var changedReader = new XMLFileReader();
            var patchReader = new XMLFileReader();
            var emptyData = {'data':{'identifier': 'id', 'items': []}};
            var emptyStore = new ItemFileWriteStore(emptyData);

            function reset() {
                app.command = undefined;
                app.deltaController = undefined;
                app.origSource = '';
                app.docMime = '';
                app.changedSource = '';
                app.patchSource = '';
                registry.byId('patchOperations').setStore(emptyStore);

                // Reset and wire up file inputs with input controller
                registry.byId('uploadOrig').reset();
                registry.byId('uploadChanged').reset();
                registry.byId('uploadPatch').reset();

                // Need to renew connection to upload inputNode after reset
                dojo.connect(registry.byId('uploadOrig').inputNode, 'change', function() {
                    origReader.load(this.files[0]);
                });
                dojo.connect(registry.byId('uploadChanged').inputNode, 'change', function() {
                    changedReader.load(this.files[0]);
                });
                dojo.connect(registry.byId('uploadPatch').inputNode, 'change', function() {
                    patchReader.load(this.files[0]);
                });
            }

            function refresh() {
                refreshButtons();
                refreshPreview();
            }

            function refreshButtons() {
                registry.byId('uploadChanged').set('disabled',
                        app.origSource === '' || !!app.command);
                registry.byId('uploadPatch').set('disabled',
                        app.origSource === '' || !!app.command);
                registry.byId('savePatch').set('disabled',
                        !app.command || app.command.type !== 'diff');
                registry.byId('saveResult').set('disabled', 
                        !app.command || app.command.type !== 'patch');
            }

            function refreshPreview() {
                // display operation in operation detail view
                if (app.command) {
                    dojo.byId('previewFrame').src = app.command.getPreview();
                }
                else if (app.origSource) {
                    dojo.byId('previewFrame').src =
                        dataurl('text/html', app.origSource);
                }
                else {
                    dojo.byId('previewFrame').src = 'about:blank';
                }
            }

            ready(function() {
                reset();

                // Connect readers
                origReader.on('ready', function(evt) {
                    reset();
                    app.origSource = evt.content;
                    app.docMime = evt.file.type;
                    refresh();
                });
                changedReader.on('ready', function(evt) {
                    app.changedSource = evt.content;
                    if (evt.file.type !== app.docMime) {
                        alert ('Changed version has no the same file type like the original. Please choose a different file');
                        return;
                    }
                    app.command = new DiffCommand(app.origSource, app.changedSource, app.docMime);
                    refreshButtons();

                    app.command.run();
                    app.deltaController = new DeltaController(app.command.delta);
                    registry.byId('patchOperations').setStore(app.deltaController.getStore());

                    refreshPreview();
                });
                patchReader.on('ready', function(evt) {
                    app.patchSource = evt.content;
                    app.command = new PatchCommand(app.origSource, app.patchSource, app.docMime);
                    refreshButtons();

                    app.command.run();
                    app.deltaController = new DeltaController(app.command.delta);
                    registry.byId('patchOperations').setStore(app.deltaController.getStore());

                    refreshPreview();
                });

                // Connect reset button
                dojo.connect(registry.byId('resetButton'), 'onClick', function() {
                    reset();
                    refresh();
                });

                // Wire up result buttons
                dojo.connect(registry.byId('savePatch'), 'onClick', function() {
                    window.open(app.command.getResult(), '_blank');
                });
                dojo.connect(registry.byId('saveResult'), 'onClick', function() {
                    window.open(app.command.getResult(), '_blank');
                });

                // Keep changes list unsortable
                registry.byId('patchOperations').canSort = function() {return false;};

                // React to click on changes list
                dojo.connect(registry.byId('patchOperations'), 'onRowClick', function(evt) {
                    var item = evt.grid.getItem(evt.rowIndex);
                    refreshPreview();
                });

                // Add custom row style for failed hunks
                dojo.connect(registry.byId('patchOperations'), 'onStyleRow', function(row) {
                    var grid = registry.byId('patchOperations');

                    if (app.command.type === 'patch') {
                        switch (app.deltaController.getOperationStatus(row.index)) {
                            case 1:
                                row.customClasses += ' opok';
                                break;
                            case 0:
                                row.customClasses += ' opfail';
                                break;
                        }
                    }
                    else {
                        row.customClasses += ' oplock';
                    }

                    grid.focus.styleRow(row);
                    grid.edit.styleRow(row);
                });

                refresh();
            });
        });
    }
    else {
        console.log('Hello from the server!');
    }
});
