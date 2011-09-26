/**
 * @file: Implementation of FNV-1 32bit hash algorithm
 * @see: http://isthe.com/chongo/tech/comp/fnv/
 */


(function(exports){

    /**
     * Constant FNV-1 32bit prime number
     */
    var FNV132_PRIME = 16777619;


    /**
     * Constant FNV-1 32bit offset basis
     */
    var FNV132_INIT = 2166136261;


    /**
     * Create and initialize a new 32bit FNV-1 hash object.
     */
    function FNV132Hash() {
        this.hash = FNV132_INIT;
    }


    /**
     * Update the hash with the given string and return the new hash value. No
     * calculation is performed when the bytes-parameter is left out.
     */
    FNV132Hash.prototype.update = function (bytes) {
        var ah, al, bh, bl;
        for (var i=0; i<(bytes && bytes.length); i++) {
            // A rather complicated way to multiply this.hash times FNV132_PRIME.
            // Regrettably a workaround is necessary because the value of a Number
            // class is represented as a 64bit floating point internally. This can
            // lead to precision issues if the factors are big enough.
            //
            // Each factor is separated into two 16bit numbers by shifting left the
            // high part and masking the low one.
            ah = this.hash >>> 16;
            al = this.hash & 0xFFFF;
            bh = FNV132_PRIME >>> 16;
            bl = FNV132_PRIME & 0xFFFF;

            // Now the both low parts are multiplied. Also each low-high pair gets
            // multiplied. There is no reason to multiply the high-high pair
            // because overflow is guaranteed here.
            // The result is the sum of the three multiplications. Because of the
            // floating point nature of JavaScript numbers, bitwise operations are
            // *not* faster than multiplications. Therefore we do not use "<< 16"
            // here.
            this.hash = (al * bl) + ((ah * bl) * 0x10000) + ((al * bh) * 0x10000);

            this.hash ^= bytes.charCodeAt(i);
        }

        // Get rid of signum
        return this.hash >>> 0;
    }

    // CommonJS exports
    exports.Hash = FNV132Hash;

})(typeof exports === 'undefined' ? (this.fnv132={}) : exports);
