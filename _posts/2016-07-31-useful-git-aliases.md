---
layout: post
title: Useful git aliases
date: 2016-07-31 15:50:00 +0200
type: BlogPosting
categories: git
---
If you a using [git](https://git-scm.com/) as a beginner, its important to type in full git commands to get a full understanding of what each command does.

However, after using git for a while, you might start seeking easier ways to type out those commands as they become part of your daily routine. Here comes **git aliases** to the rescue.

An **'alias'** allows you to execute a given command using a pre-set string. This string acts as a shortcut to the original command. For example instead of typing ```git checkout -b <branch_name>``` to create a new branch, you can simple type
```git cob <branch_name>
```

There are two ways to setup aliases in git.

#### **1. Using *.gitconfig* file.**

This file is usually located at ~/.gitconfig.
Open it and add an alias using the format below
{% highlight yaml %}
[alias]
	<alias_name> = <command>
	<another_alias_name> = <another_commit>
{% endhighlight %}

#### **2. Using the *command line*.**

Simple type ```git config --global alias.<alias_name> <command>```
to create an alias from the command line.
If the ```<command>``` has spaces in between, add a single quotes(for unix) or double quotes (for windows) around it. An example for unix  ```git config --global alias.<another_alias_name> '<command with space>'```
This method actually adds the corresponding alias entry to the **.gitconfig** file.  

Below is a list of some useful git aliases.
{% highlight yaml %}
[alias]
	st = status
	ci = commit
	ciam = commit -am
	br = branch
	co = checkout
	cob = checkout -b
	df = diff
	dc = diff --cached
	lg = log
	lgp = log -p
	lgpr = log --graph --decorate --pretty=oneline --abbrev-commit
	sl = shortlog -s --
	ls = ls-files

	# Show files ignored by git:
	ign = ls-files -o -i --exclude-standard
{% endhighlight %}

Now you can type less :).
