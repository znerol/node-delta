define(['dojo/_base/declare', 'dojo/Evented'], function(declare, Evented) {
    return declare([Evented], {
        /**
         * Load a file-object into memory using HTML5 FileReader.
         */
        constructor: function(typere) {
            this.typere = typere || /^(text\/xml|text\/html|.*\+xml)$/;
        },

        load: function(file) {
            var reader;
            var me = this;

            if (!file) {
                throw new Error('Parameter Error: Must provide a file');
            }
            else if (!file.type.match(this.typere)) {
                alert('Filetype ' + file.type + ' is not supported');
            }
            else {
                reader = new FileReader();
                reader.onload = function(evt) {
                    me.emit('ready', {
                        'file': file,
                        'content': evt.target.result
                    });
                }
                reader.onerror = function(evt) {
                    alert('Failed to load document.');
                }
                reader.readAsText(file);
            }
        }
    });
});
