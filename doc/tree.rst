Tree Utilities
==============

The tree module provides classes and methods for constructing and traversing
tree structures. It also serves as an abstraction of the underlying document
model which may be any of XML, JSON or custom document structure implemented
by a third party module.

Using the :js:class:`Node` class it is possible to quickly build up an ordered
tree structure. The :js:class:`Anchor` represents a location in a tree. It may
point directly at an existing node but also before the start or after the end
of the children list of an existing node.

The :js:class:`Matching` class is used by the diff algorithms to maintain a
mapping between matching nodes from the first and the second tree.

While Node implements methods to navigate thru the hierarchy, the class
:js:class:`DocumentOrderIndex` provides a way to resolve nodes relative to
others along the document order axis. The :js:class:`GenerationIndex` class
implements similar methods for navigating along all nodes of a given depth.

The classes :js:class:`NodeHashIndex` and :js:class:`TreeHashIndex` provide
mappings between nodes and their hash values. Those values are cached such that
subsequent access does not result in unnecessary computations.

Finally the :js:class:`SimpleTreeHash` class provides a simple algorithm for
calculating a digest value over a subtree.

Contents:

.. toctree::
   :maxdepth: 2

   jsdoc/Node.rst
   jsdoc/Anchor.rst
   jsdoc/Matching.rst
   jsdoc/DocumentOrderIndex.rst
   jsdoc/GenerationIndex.rst
   jsdoc/NodeHashIndex.rst
   jsdoc/TreeHashIndex.rst
   jsdoc/SimpleTreeHash.rst
