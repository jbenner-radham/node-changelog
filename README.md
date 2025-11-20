@radham/changelog
=================

A CLI tool for managing [Keep a Changelog](https://keepachangelog.com/) changelogs.

Features
--------

- Initialize new changelogs.
- Draft new releases or promote unreleased versions.
- Add unreleased sections to changelogs.
- Automatically creates and manages version links.

Install
-------

...

Usage
-----

```sh-session
$ changelog --help

  A CLI tool for managing "Keep a Changelog" changelogs.

  Usage
    $ changelog [OPTIONS] <COMMAND>

  Options
    --bullet-list-marker, -b    Use this marker for bullet lists ("*", "+", or
                                "-"). Defaults to "-".
    --heading-style, -H         Use this style of headings ("atx" or "setext").
                                Defaults to "setext".
    --help, -h                  Display this message.
    --separate-definitions, -s  Separate definitions with blank lines.
    --version, -v               Display the application version.

  Commands
    init [CHANGELOG]        Initialize a new changelog.
    release [CHANGELOG]     Create a new release or promote an unreleased version.
    unreleased [CHANGELOG]  Add an unreleased section to the changelog.
```

License
-------

The BSD 3-Clause License. See the [license file](LICENSE) for details.
