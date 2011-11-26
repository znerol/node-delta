/**
 * @file:   Calculate matching quality of sequences as well as leading and
 *          trailing context.
 * @see:    * Sebastian Rönnau, Christian Pauli, and Uwe M. Borghoff. Merging
 *            changes in XML documents using reliable context fingerprints:
 *            http://dx.doi.org/10.1145/1410140.1410151
 *          * Original Sourcecode:
 *            https://launchpad.net/xcc
 */


/**
 * Create a new WeightedContextMatcher instance implementing the fuzzy
 * matching mechanism.
 *
 * @param radius    Maximum radius of the fingerprint. Values greater than
 *                  four are not recommended.
 */
function WeightedContextMatcher(radius) {
    var f, cf = 0;

    if (typeof radius === 'undefined') {
        radius = 4;
    }
    this.r = radius;

    // Match quality factors
    this.qf = [];

    // Cummulative match quality factor used for normalization
    this.cqf = [];

    // Precompute match quality factors for given fingerprint radius
    for (i = 0; i < this.r; i++) {
        f = 1/Math.pow(2, i);
        this.qf[i] = f;
        cf += f;
        this.cqf[i] = cf;
    }

    this.body = [];
    this.head = [];
    this.tail = [];
}


/**
 * Return true if subject at offset is equal to the candidate value. Override
 * this method if your values need special handling.
 */
WeightedContextMatcher.prototype.equalContent = function(subject, offset, value) {
    return subject[offset] === value;
};


/**
 * Return true if subject at offset is equal to the context value. Override
 * this method if your values need special handling.
 */
WeightedContextMatcher.prototype.equalContext = function(subject, offset, value) {
    return subject[offset] === value;
};


/**
 * Set the pattern consisting of the body and the context which should be
 * matched against candidates using matchQuality method subsequently.
 *
 * @param body  Array of context elements between head and tail
 * @param head  Array of leading context elements
 * @param tail  Array of trailing context elements
 */
WeightedContextMatcher.prototype.setPattern = function(body, head, tail) {
    this.body = body;
    this.head = head || [];
    this.tail = tail || [];
};


/**
 * Return a number between zero and one representing the match quality of
 * the pattern.
 *
 * @param offset    An integer representing the offset to the subject.
 */
WeightedContextMatcher.prototype.matchQuality = function(subject, offset)
{
    return this.matchContent(subject, offset) &&
        this.matchContext(subject, offset);
};


/**
 * Return 1 if every body-item of the pattern matches the candidates
 * exactly. Otherwise return 0.
 */
WeightedContextMatcher.prototype.matchContent = function(subject, offset) {
    var i, k, n;

    // Check value-array. Only consider positions where body matches.
    n = this.body.length;
    for (i = 0, k = offset; i < n; i++, k++) {
        if (!this.equalContent(subject, k, this.body[i])) {
            return 0;
        }
    }

    return 1;
};


/**
 * Return a number between 0 and 1 representing the match quality of the
 * pattern context with the candidate.
 */
WeightedContextMatcher.prototype.matchContext = function(subject, offset) {
    var i, k, n, f = 0, cf = 0;

    // Match context fingerprint if any
    if (this.qf.length && (this.head.length || this.tail.length)) {
        n = Math.min(this.head.length, this.qf.length);
        for (i = 0, k = offset - 1; i < n; i++, k--) {
            f += this.equalContext(subject, k, this.head[n-i-1]) * this.qf[i];
        }
        cf += n && this.cqf[n-1];

        n = Math.min(this.tail.length, this.qf.length);
        for (i = 0, k = offset + this.body.length; i < n; i++, k++) {
            f += this.equalContext(subject, k, this.tail[i]) * this.qf[i];
        }
        cf += n && this.cqf[n-1];

        // Normalize
        f /= cf;
    }
    else {
        f = 1;
    }

    return f;
};

exports.WeightedContextMatcher = WeightedContextMatcher;
