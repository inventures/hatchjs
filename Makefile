## TEST

TESTER = ./node_modules/.bin/mocha
OPTS = --ignore-leaks -t 15000
TESTS = test/*.test.js


test:
	$(TESTER) $(OPTS) $(TESTS)
test-verbose:
	$(TESTER) $(OPTS) --reporter spec $(TESTS)
testing:
	$(TESTER) $(OPTS) --watch $(TESTS)
test-all: test
	$(MAKE) -C hatch_modules/core-widgets

## WORKFLOW

GITBRANCH = $(shell git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/\1/')

REPO = inventures/hatchjs
FROM = $(GITBRANCH)
TO = $(GITBRANCH)

install:
	node install

pull:
	git pull origin $(FROM)

safe-pull:
	git pull origin $(FROM) --no-commit

push: test
	git push origin $(TO)

feature:
	git checkout -b feature-$(filter-out $@,$(MAKECMDGOALS))
%:
	@:

deps: package.json
	npm install > deps

gst-clean:
	ifeq ($(findstring nothing to commit,$(shell git status 2>&1)),)
	 $(error Working copy contains uncommitted changes) 
	else
	endif


update:
	ifeq ($(findstring Already up-to-date,$(shell git pull origin $(FROM) 2>&1)),)
	  $(deps)
	else
	  $(error Local copy is up to date)
	endif


safe-update: gst-clean
	ifeq ($(findstring Already up-to-date,$(shell git pull origin $(FROM) 2>&1)),)
	  $(deps)
	  $(test)
	  $(shell git commit -m "Merge branch '$(FROM)' of $(REPO)")
	else
	  $(error Local copy is up to date)
	endif

pr: push
	open "https://github.com/$(REPO)/pull/new/inventures:master...$(GITBRANCH)"

# MAN DOCS

man/%.1: doc/cli/%.md scripts/doc.sh
	@[ -d man ] || mkdir man
	scripts/doc.sh $< $@

man/%.3: doc/api/%.md scripts/doc.sh
	@[ -d man ] || mkdir man
	scripts/doc.sh $< $@

man/html/%.3.html: doc/api/%.md scripts/doc.sh doc/footer.html
	@[ -d man/html ] || mkdir -p man/html
	scripts/doc.sh $< $@

man/html/%.1.html: doc/cli/%.md scripts/doc.sh
	@[ -d man/html ] || mkdir -p man/html
	scripts/doc.sh $< $@

man/html/changelog.3.html: CHANGELOG.md scripts/doc.sh
	scripts/doc.sh $< $@

MAN = $(API_MAN) $(CLI_MAN)
HTML: $(API_WEB) $(CLI_WEB)

web: $(HTML)
man: $(MAN)

all: $(MAN) $(HTML)

build: man

.PHONY: test doc
