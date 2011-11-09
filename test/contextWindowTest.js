(function(exports, resolver) {
    exports['should be invoked 2 * radius + length times'] = function(test) {
        var result,
            c = new resolver.ContextWindow([], 2);

        result = 0;
        c.forEach(0, 1, 0, 0, function() {
            result++;
        });
        test.equals(result, 5);

        result = 0;
        c.forEach(0, 0, 1, 0, function() {
            result++;
        });
        test.equals(result, 5);

        test.done();
    };

    exports['callback parameters should be three arrays'] = function(test) {
        var count, result,
            c = new resolver.ContextWindow(['a','b','c','d','e','f'], 0);

        count = 0;
        c.forEach(2, 1, 2, 3, function(value, head, tail, offset) {
            result = [value, head, tail, offset];
            count++;
        });
        test.equals(count, 1);
        test.deepEqual(result, [['c'], ['a', 'b'], ['d','e','f'], 0]);

        test.done();
    };

    exports['should respond correctly to arbitrary center positions'] = function(test) {
        var count, result,
            c = new resolver.ContextWindow(['a','b','c','d','e','f'], 0);

        count = 0;
        c.forEach(-2, 1, 1, 1, function(value, head, tail, offset) {
            result = [value, head, tail, offset];
            count++;
        });
        test.equals(count, 1);
        test.deepEqual(result, [[undefined], [undefined], [undefined], 0]);

        count = 0;
        c.forEach(-1, 1, 1, 1, function(value, head, tail, offset) {
            result = [value, head, tail, offset];
            count++;
        });
        test.equals(count, 1);
        test.deepEqual(result, [[undefined], [undefined], ['a'], 0]);

        count = 0;
        c.forEach(0, 1, 1, 1, function(value, head, tail, offset) {
            result = [value, head, tail, offset];
            count++;
        });
        test.equals(count, 1);
        test.deepEqual(result, [['a'], [undefined], ['b'], 0]);

        count = 0;
        c.forEach(1, 1, 1, 1, function(value, head, tail, offset) {
            result = [value, head, tail, offset];
            count++;
        });
        test.equals(count, 1);
        test.deepEqual(result, [['b'], ['a'], ['c'], 0]);

        count = 0;
        c.forEach(5, 1, 1, 1, function(value, head, tail, offset) {
            result = [value, head, tail, offset];
            count++;
        });
        test.equals(count, 1);
        test.deepEqual(result, [['f'], ['e'], [undefined], 0]);

        count = 0;
        c.forEach(6, 1, 1, 1, function(value, head, tail, offset) {
            result = [value, head, tail, offset];
            count++;
        });
        test.equals(count, 1);
        test.deepEqual(result, [[undefined], ['f'], [undefined], 0]);

        count = 0;
        c.forEach(7, 1, 1, 1, function(value, head, tail, offset) {
            result = [value, head, tail, offset];
            count++;
        });
        test.equals(count, 1);
        test.deepEqual(result, [[undefined], [undefined], [undefined], 0]);

        test.done();
    };

    exports['if a radius is given, window should slide and fill empty slots with undefined'] = function(test) {
        var count, result = [],
            c = new resolver.ContextWindow(['a','b','c','d','e','f'], 2);

        count = 0;
        c.forEach(2, 1, 2, 3, function(value, head, tail, offset) {
            result.push([value, head, tail, offset]);
            count++;
        });
        test.equals(count, 5);
        test.deepEqual(result, [
                [['a'], [undefined, undefined], ['b','c','d'], -2],
                [['b'], [undefined, 'a'], ['c','d','e'], -1],
                [['c'], ['a', 'b'], ['d','e','f'], 0],
                [['d'], ['b', 'c'], ['e','f',undefined], 1],
                [['e'], ['c', 'd'], ['f',undefined,undefined], 2]
        ]);

        test.done();
    };

    exports['if value length is zero, starting point should be last element of head'] = function(test) {
        var count, result, c;

        c = new resolver.ContextWindow(['a','b'], 0);
        count = 0;
        result = [];
        c.forEach(0, 0, 1, 1, function(value, head, tail, offset) {
            result.push([value, head, tail, offset]);
            count++;
        });
        test.equals(count, 1);
        test.deepEqual(result, [
                [[], ['a'], ['b'], 0]
        ]);

        c = new resolver.ContextWindow(['a','b','c'], 1);
        count = 0;
        result = [];
        c.forEach(1, 0, 2, 1, function(value, head, tail, offset) {
            result.push([value, head, tail, offset]);
            count++;
        });
        test.equals(count, 3);
        test.deepEqual(result, [
                [[], [undefined, 'a'], ['b'], -1],
                [[], ['a', 'b'], ['c'], 0],
                [[], ['b', 'c'], [undefined], 1]
        ]);

        test.done();
    };

    exports['should not fail on border condiditons'] = function(test) {
        var count, result, c;

        c = new resolver.ContextWindow(['a','b'], 0);

        // set neither length nor head or tail -> zero length arrays
        count = 0;
        result = [];
        c.forEach(0, 0, 0, 0, function(value, head, tail, offset) {
            result.push([value, head, tail, offset]);
            count++;
        });
        test.equals(count, 1);
        test.deepEqual(result, [
                [[], [], [], 0]
        ]);

        // set length but no head and tail context
        count = 0;
        result = [];
        c.forEach(0, 1, 0, 0, function(value, head, tail, offset) {
            result.push([value, head, tail, offset]);
            count++;
        });
        test.equals(count, 1);
        test.deepEqual(result, [
                [['a'], [], [], 0]
        ]);

        // set head context length but no length or tail
        count = 0;
        result = [];
        c.forEach(0, 0, 1, 0, function(value, head, tail, offset) {
            result.push([value, head, tail, offset]);
            count++;
        });
        test.equals(count, 1);
        test.deepEqual(result, [
                [[], ['a'], [], 0]
        ]);

        // set tail context but no length or head
        count = 0;
        result = [];
        c.forEach(0, 0, 0, 1, function(value, head, tail, offset) {
            result.push([value, head, tail, offset]);
            count++;
        });
        test.equals(count, 1);
        test.deepEqual(result, [
                [[], [], ['b'], 0]
        ]);

        test.done();
    };
}(
    typeof exports === 'undefined' ? (DeltaJS.contextWindowTest={}) : exports,
    typeof require === 'undefined' ? DeltaJS.resolver : require('deltajs').resolver
));
