High Level Diff and Patch Interface
===================================

The high level diff and patch interface of delta.js simplifies the usage of the
underlying algorithms. Using the factory classes and the high-level
implementaion of diff and patch it is easy to combine and configure the
required delta.js classes for many different use cases.

The delta.js module files are written in a way such that they are easily
convertible between the CommonJS and the AWM module formats. The following
examples provide a skeletton for your own diff and patch implementations.

Refer to the examples section to get an idea on how to implement your own diff
and patch commands using the delta.js framework.

Contents:

.. toctree::
   :maxdepth: 2

   highlevel-example.rst
   jsdoc/diff.Diff.rst
   jsdoc/patch.Patch.rst
   jsdoc/DiffSkelmatchFactory.rst
   jsdoc/DiffXCCFactory.rst
   jsdoc/ResolveXCCFactory.rst
   jsdoc/DeltaXMLFactory.rst
   jsdoc/DocumentXMLFactory.rst

   jsdoc/DeltaJSONFactory.rst
.. jsdoc/DocumentJSONFactory.rst
