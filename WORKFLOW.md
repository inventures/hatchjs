# Workflow

We are using workflow similar to [gitflow][gitflow], general idea: make commit
for some feature development into separate branch, then publish it and make pull
request to the `master` branch. It is recommended to start feature branches with
`feature/` refix.

This project uses Makefile to organize workflow as easy as [1][pull], [2][feature], [3][pr]

### 1.1. `make pull`: pulling changes

To get changes from `origin` remote use:

    make pull

this command just does `git pull origin $current-branch` command.

### 1.2. `make update`: smart pulling changes

To pull changes and perform some additional stuff use:

    make update

it will pull changes, install dependencies and run tests.

### 1.3. `make safe-update`: safe pulling changes

To pull changes safely use:

    make safe-update

it will pull changes with --no-commit flag, update dependencies and then run
tests and only commit merge when nothing was broken in tests.

### 2. `make feature`: working on feature

Run this command before start working on new feature (before first commit):

    make feature name-of-thing

this command will create new branch named `feature-name-of-thing`.

### 3. `make pr`: make pull request

When feature is done, run

    make pr

command to create pull request in GitHub

[gitflow]: http://nvie.com/posts/a-successful-git-branching-model/
