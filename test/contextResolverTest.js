(function(exports, resolver, tree) {
    exports['should match correct value with quality=1 without radius and context'] = function(test) {
        var r = new resolver.UniformDepthResolver(null, 0);
        var result;

        result = r.resolveByContext(0, ['a'], ['a'], [], []);
        test.equals(result.quality, 1);
        test.equals(result.index, 0);
        test.equals(result.offset, 0);
        test.done();
    };

    exports['must not match wrong value and report quality=0 without radius and context'] = function(test) {
        var r = new resolver.UniformDepthResolver(null, 0);
        var result;

        result = r.resolveByContext(0, ['a'], ['b'], [], []);
        test.equals(result.quality, 0);
        test.equals(result.index, -1);
        test.done();
    };

    exports['should match correct value with quality=1 when context matches'] = function(test) {
        var r = new resolver.UniformDepthResolver(null, 0);
        var result;

        result = r.resolveByContext(1, ['a', 'b', 'c'], ['b'], ['a'], ['c']);
        test.equals(result.quality, 1);
        test.equals(result.index, 1);
        test.equals(result.offset, 0);
        test.done();
    };

    exports['should match with quality=0.5 if only half of the context nodes match'] = function(test) {
        var r = new resolver.UniformDepthResolver(null, 0);
        var result;

        result = r.resolveByContext(1, ['a', 'b', 'c'], ['b'], ['a'], ['x']);
        test.equals(result.quality, 0.5);
        test.equals(result.index, 1);
        test.equals(result.offset, 0);

        result = r.resolveByContext(1, ['a', 'b', 'c'], ['b'], ['x'], ['c']);
        test.equals(result.quality, 0.5);
        test.equals(result.index, 1);
        test.equals(result.offset, 0);
        test.done();
    };

    exports['should match correct value with quality=1 if radius=1 value is is at offset=1'] = function(test) {
        var r = new resolver.UniformDepthResolver(null, 1);
        var result;

        result = r.resolveByContext(0, ['x', 'a', 'x'], ['a'], [], []);
        test.equals(result.quality, 1);
        test.equals(result.index, 1);
        test.equals(result.offset, 1);

        result = r.resolveByContext(2, ['x', 'a', 'x'], ['a'], [], []);
        test.equals(result.quality, 1);
        test.equals(result.index, 1);
        test.equals(result.offset, -1);

        test.done();
    };

    exports['must not match correct value if radius=1 but value is at offset=2'] = function(test) {
        var r = new resolver.UniformDepthResolver(null, 1);
        var result;

        result = r.resolveByContext(0, ['x', 'x', 'a'], ['a'], [], []);
        test.equals(result.quality, 0);
        test.equals(result.index, -1);

        result = r.resolveByContext(2, ['a', 'x', 'x'], ['a'], [], []);
        test.equals(result.quality, 0);
        test.equals(result.index, -1);

        test.done();
    };

    exports['example 1'] = function(test) {
        var r = new resolver.UniformDepthResolver(null, 4);
        var result, content, values, head, tail;

        content = 'xxyzx1234abc4321xxxx'.split('');
        values = 'abc'.split('');
        head = '1234'.split('');
        tail = '4321'.split('');

        result = r.resolveByContext(9, content, values, head, tail);
        test.equals(result.quality, 1);
        test.equals(result.index, 9);
        test.equals(result.offset, 0);

        result = r.resolveByContext(8, content, values, head, tail);
        test.equals(result.quality, 1);
        test.equals(result.index, 9);
        test.equals(result.offset, 1);

        result = r.resolveByContext(7, content, values, head, tail);
        test.equals(result.quality, 1);
        test.equals(result.index, 9);
        test.equals(result.offset, 2);

        result = r.resolveByContext(6, content, values, head, tail);
        test.equals(result.quality, 1);
        test.equals(result.index, 9);
        test.equals(result.offset, 3);

        result = r.resolveByContext(5, content, values, head, tail);
        test.equals(result.quality, 1);
        test.equals(result.index, 9);
        test.equals(result.offset, 4);

        test.done();
    };
}(
    typeof exports === 'undefined' ? (DeltaJS.contextResolverTest={}) : exports,
    typeof require === 'undefined' ? DeltaJS.resolver : require('deltajs').resolver,
    typeof require === 'undefined' ? DeltaJS.tree : require('deltajs').tree
));
