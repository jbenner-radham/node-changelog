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

  A tool for managing Keep a Changelog changelogs.

  Usage
    $ changelog [OPTIONS] <COMMAND>

  Options
    --bullet-list-marker, -b    Use this marker for bullet lists ("*", "+", or
                                "-"). Defaults to "-".
    --change-type, -c           Create a section stub for this change type
                                ("added", "changed", "deprecated", "fixed",
                                "removed", or "security"). Can be specified
                                multiple times.
    --heading-style, -H         Use this style of headings ("atx" or "setext").
                                Defaults to "setext".
    --help, -h                  Display this message.
    --separate-definitions, -s  Separate definitions with blank lines.
    --version, -v               Display the application version.
    --write, -w                 Write to the changelog file instead of stdout.

  Commands
    create [CHANGELOG]   Create a new changelog.
    draft [CHANGELOG]    Add an unreleased section to the changelog.
    major [CHANGELOG]    Create a new major release or promote an unreleased
                         section to one.
    minor [CHANGELOG]    Create a new minor release or promote an unreleased
                         section to one.
    patch [CHANGELOG]    Create a new patch release or promote an unreleased
                         section to one.
    release [CHANGELOG]  Create a new release or promote an unreleased version.
```

License
-------

The BSD 3-Clause License. See the [license file](LICENSE) for details.
