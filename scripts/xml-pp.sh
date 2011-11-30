#!/bin/sh
xmllint --nsclean - | xmllint --c14n - | xmllint --format -
