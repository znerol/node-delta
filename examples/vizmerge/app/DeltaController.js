define(['dojo', 'dojo/data/ItemFileWriteStore'], function(dojo, ItemFileWriteStore) {
    function DeltaController(deltadoc, delegate) {
        this.deltadoc = deltadoc;
        this.store = undefined;
    }

    DeltaController.prototype.onSet = function(item, attribute, oldValue, newValue) {
        var handler = this.deltadoc.attached[item.id].handler;
        if (handler) {
            if (newValue) {
                handler.activate();
            }
            else {
                handler.deactivate();
            }
        }
    }

    DeltaController.prototype.getStore = function() {
        var op, items, i;
        if (!this.store) {
            items = [];
            for (i = 0; i < this.deltadoc.detached.length; i++) {
                op = this.deltadoc.detached[i];
                items.push({
                    'id': items.length,
                    'active': true, // FIXME get from handler
                    'description': op.toString()
                });
            }
            this.store = new ItemFileWriteStore({'data': {
                'identifier': 'id',
                'items' : items
            }});

            dojo.connect(this.store, 'onSet', this, this.onSet);
        }

        return this.store;
    }

    DeltaController.prototype.getOperationStatus = function(idx) {
        return this.deltadoc.attached[idx] && this.deltadoc.attached[idx].handler ? 1 : 0;
    }

    return DeltaController;
});
