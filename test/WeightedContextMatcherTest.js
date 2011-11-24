var resolver = require('deltajs').resolver;

exports['should report match quality 1 if pattern matches subject'] = function(test) {
    var matcher = new resolver.WeightedContextMatcher(0);
    var subject = ['a', 'b', 'c'];
    var count;
    var result;

    matcher.setPattern(['a']);
    count = 0;
    result = matcher.matchQuality(0, function(offset, value) {
        count++;
        return subject[offset] === value;
    });
    test.equals(count, 1);
    test.equals(result, 1);

    matcher.setPattern(['b', 'c', undefined]);
    count = 0;
    result = matcher.matchQuality(1, function(offset, value) {
        count++;
        return subject[offset] === value;
    });
    test.equals(count, 3);
    test.equals(result, 1);

    matcher.setPattern([undefined, 'a']);
    count = 0;
    result = matcher.matchQuality(-1, function(offset, value) {
        count++;
        return subject[offset] === value;
    });
    test.equals(count, 2);
    test.equals(result, 1);

    test.done();
};

exports['should report match quality 0 if pattern does not matches subject'] = function(test) {
    var matcher = new resolver.WeightedContextMatcher(0);
    var subject = ['a', 'b', 'c'];
    var count;
    var result;

    matcher.setPattern(['b', 'x']);
    count = 0;
    result = matcher.matchQuality(0, function(offset, value) {
        count++;
        return subject[offset] === value;
    });
    test.equals(count, 1);
    test.equals(result, 0);

    test.done();
};

exports['should report match quality 1 if pattern and context match subject'] = function(test) {
    var matcher = new resolver.WeightedContextMatcher(1);
    var subject = ['a', 'b', 'c'];
    var count;
    var result;

    matcher.setPattern(['a'], [undefined], ['b']);
    count = 0;
    result = matcher.matchQuality(0, function(offset, value) {
        count++;
        return subject[offset] === value;
    });
    test.equals(count, 3);
    test.equals(result, 1);

    matcher.setPattern(['b', 'c', undefined], ['a'], [undefined]);
    count = 0;
    result = matcher.matchQuality(1, function(offset, value) {
        count++;
        return subject[offset] === value;
    });
    test.equals(count, 5);
    test.equals(result, 1);

    matcher.setPattern([undefined, 'a'], [undefined], ['b']);
    count = 0;
    result = matcher.matchQuality(-1, function(offset, value) {
        count++;
        return subject[offset] === value;
    });
    test.equals(count, 4);
    test.equals(result, 1);

    test.done();
};

exports['should report match quality 0.5 if only half of context match subject'] = function(test) {
    var matcher = new resolver.WeightedContextMatcher(1);
    var subject = ['a', 'b', 'c'];
    var count;
    var result;

    matcher.setPattern(['a'], ['x'], ['b']);
    count = 0;
    result = matcher.matchQuality(0, function(offset, value) {
        count++;
        return subject[offset] === value;
    });
    test.equals(count, 3);
    test.equals(result, 0.5);

    matcher.setPattern(['b', 'c', undefined], ['a'], ['x']);
    count = 0;
    result = matcher.matchQuality(1, function(offset, value) {
        count++;
        return subject[offset] === value;
    });
    test.equals(count, 5);
    test.equals(result, 0.5);

    matcher.setPattern([undefined, 'a'], ['x'], ['b']);
    count = 0;
    result = matcher.matchQuality(-1, function(offset, value) {
        count++;
        return subject[offset] === value;
    });
    test.equals(count, 4);
    test.equals(result, 0.5);

    test.done();
};
