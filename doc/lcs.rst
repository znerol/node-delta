LCS Algorithm
=============

The LCS module provides methods to calculate the Longst Common Subsequence
between two sequences using Myers O(ND) Difference Algorithm.

By overriding the ``equals`` method of the LCS object one can implement custom
equality tests such that the implementation can be used for lists of any type,
not only for strings.

**Example Code**

.. code-block:: javascript

    // Consider that list_a and list_b are sequences of objects with a name and
    // a value property.
    var lcs = require('./delta/lcs');

    lcsinst = new lcs.LCS(list_a, list_b);

    // Override equality test function of lcs instance.
    lcsinst.equals = function(a, b) {
        return a.value === b.value;
    };

    // Perform lcs computation
    lcsinst.forEachCommonSymbol(function(a, b) {
        console.log(a.name + ' and ' + b.name + ' take part in the lcs');
    });

.. seealso::
    Eugene W. Myers, `An O(ND) Difference Algorithm and Its Variations
        <http://dx.doi.org/10.1007/BF01840446>`_, 1986
   

Contents:

.. toctree::
   :maxdepth: 2

   jsdoc/LCS.rst
   jsdoc/KPoint.rst
   jsdoc/Limit.rst
