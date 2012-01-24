define(["require", "exports", "module"], function(require, exports, module) {
/**
 * @file: Implementation of FNV-1 32bit hash algorithm
 * @see: http://isthe.com/chongo/tech/comp/fnv/
 *
 * @module  fnv132
 */


/**
 * Constant FNV-1 32bit prime number
 *
 * @constant
 */
var FNV132_PRIME = 16777619;

/**
 * High 16 bits of FNV-1 32bit prime number
 *
 * @constant
 */
var FNV132_PRIME_H = (FNV132_PRIME >>> 16) & 0xFFFF;

/**
 * Low 16 bits of FNV-1 32bit prime number
 *
 * @constant
 */
var FNV132_PRIME_L = FNV132_PRIME & 0xFFFF;

/**
 * Constant FNV-1 32bit offset basis
 *
 * @constant
 */
var FNV132_INIT = 2166136261;

/**
 * Create and initialize a new 32bit FNV-1 hash object.
 *
 * @constructor
 */
function FNV132Hash() {
    this.hash = FNV132_INIT;
}


/**
 * Update the hash with the given string and return the new hash value. No
 * calculation is performed when the bytes-parameter is left out.
 */
FNV132Hash.prototype.update = function (bytes) {
    var i, ah, al;

    if (typeof bytes === 'undefined' || bytes === null) {
        return this.get();
    }

    if (typeof bytes === 'number') {
        // FXME: Actually we should test for non-integer numbers here.
        bytes = String.fromCharCode(
                (bytes & 0xFF000000) >>> 24,
                (bytes & 0x00FF0000) >>> 16,
                (bytes & 0x0000FF00) >>> 8,
                (bytes & 0x000000FF)
        );
    }

    if (typeof bytes !== 'string') {
        throw new Error(typeof bytes + ' not supported by FNV-1 Hash algorithm');
    }

    for (i=0; i<(bytes && bytes.length); i++) {
        // A rather complicated way to multiply this.hash times
        // FNV132_PRIME.  Regrettably a workaround is necessary because the
        // value of a Number class is represented as a 64bit floating point
        // internally. This can lead to precision issues if the factors are
        // big enough.
        //
        // Each factor is separated into two 16bit numbers by shifting left
        // the high part and masking the low one.
        ah = (this.hash >>> 16) & 0xFFFF;
        al = this.hash & 0xFFFF;

        // Now the both low parts are multiplied. Also each low-high pair
        // gets multiplied. There is no reason to multiply the high-high
        // pair because overflow is guaranteed here.  The result is the sum
        // of the three multiplications. Because of the floating point
        // nature of JavaScript numbers, bitwise operations are *not*
        // faster than multiplications. Therefore we do not use "<< 16"
        // here but instead "* 0x100000".
        this.hash = (al * FNV132_PRIME_L) +
            ((ah * FNV132_PRIME_L) * 0x10000) +
            ((al * FNV132_PRIME_H) * 0x10000);

        this.hash ^= bytes.charCodeAt(i);
    }

    // Get rid of signum
    return this.hash >>> 0;
};


/**
 * Return current hash value;
 */
FNV132Hash.prototype.get = function () {
    return this.hash >>> 0;
};

// CommonJS exports
exports.Hash = FNV132Hash;

});
