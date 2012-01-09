NODE=node

SVGSRC:=logo-1.svg logo-2.svg
HTMSRC:=zappa-quote-1.html zappa-quote-2.html
SVGDST:=$(SVGSRC:.svg=.js)
HTMDST:=$(HTMSRC:.html=.js)

all: $(SVGDST) $(HTMDST)

%.js: %.svg
	$(NODE) wrap.js $< > $@

%.js: %.html
	$(NODE) wrap.js $< > $@
