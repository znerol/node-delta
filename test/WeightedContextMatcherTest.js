var contextmatcher = require('../lib/delta/contextmatcher');

exports['should report match quality 1 if pattern matches subject'] = function(test) {
    var matcher = new contextmatcher.WeightedContextMatcher(0);
    var subject = ['a', 'b', 'c'];
    var result;

    matcher.setPattern(['a']);
    result = matcher.matchQuality(subject, 0);
    test.equals(result, 1);

    matcher.setPattern(['b', 'c', undefined]);
    result = matcher.matchQuality(subject, 1);
    test.equals(result, 1);

    matcher.setPattern([undefined, 'a']);
    result = matcher.matchQuality(subject, -1);
    test.equals(result, 1);

    test.done();
};

exports['should report match quality 0 if pattern does not matches subject'] = function(test) {
    var matcher = new contextmatcher.WeightedContextMatcher(0);
    var subject = ['a', 'b', 'c'];
    var result;

    matcher.setPattern(['b', 'x']);
    result = matcher.matchQuality(subject, 0);
    test.equals(result, 0);

    test.done();
};

exports['should report match quality 1 if pattern and context match subject'] = function(test) {
    var matcher = new contextmatcher.WeightedContextMatcher(1);
    var subject = ['a', 'b', 'c'];
    var result;

    matcher.setPattern(['a'], [undefined], ['b']);
    result = matcher.matchQuality(subject, 0);
    test.equals(result, 1);

    matcher.setPattern(['b', 'c', undefined], ['a'], [undefined]);
    result = matcher.matchQuality(subject, 1);
    test.equals(result, 1);

    matcher.setPattern([undefined, 'a'], [undefined], ['b']);
    result = matcher.matchQuality(subject, -1);
    test.equals(result, 1);

    test.done();
};

exports['should report match quality 0.5 if only half of context match subject'] = function(test) {
    var matcher = new contextmatcher.WeightedContextMatcher(1);
    var subject = ['a', 'b', 'c'];
    var result;

    matcher.setPattern(['a'], ['x'], ['b']);
    result = matcher.matchQuality(subject, 0);
    test.equals(result, 0.5);

    matcher.setPattern(['b', 'c', undefined], ['a'], ['x']);
    result = matcher.matchQuality(subject, 1);
    test.equals(result, 0.5);

    matcher.setPattern([undefined, 'a'], ['x'], ['b']);
    result = matcher.matchQuality(subject, -1);
    test.equals(result, 0.5);

    test.done();
};

exports['should invoke equals callback with pattern values and specified flags'] = function(test) {
    var matcher = new contextmatcher.WeightedContextMatcher(1);
    var subject = ['a', 'b', 'c'];
    var expect = [
        {'subject': subject, 'offset': 1, 'value': 'head', 'flag': 'content'},
        {'subject': subject, 'offset': 0, 'value': 'cnt', 'flag': 'context'},
        {'subject': subject, 'offset': 2, 'value': 'tail', 'flag': 'context'}
    ];
    var actual = [];

    matcher.equal = function(subject, offset, value, flag) {
        actual.push({
            'subject': subject, 'offset': offset, 'value': value, 'flag': flag});
        return true;
    }

    matcher.setPattern(['head'], ['cnt'], ['tail']);
    result = matcher.matchQuality(subject, 1, 'content', 'context');
    test.deepEqual(actual, expect);

    test.done();
};
