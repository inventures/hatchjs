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

## WORKFLOW

GITBRANCH = $(shell git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/\1/')

REPO = marcusgreenwood/hatchjs
FROM = $(GITBRANCH)
TO = $(GITBRANCH)

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
	open "https://github.com/$(REPO)/pull/new/marcusgreenwood:master...$(GITBRANCH)"

.PHONY: test doc
