<div align="center">

# rspell

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/Lioness100/rspell/ci.yml?branch=main)
![License](https://img.shields.io/github/license/Lioness100/sapphire-template)

</div>

> 📝 Find and fix all your project's typos with a single command!

## 📖 Table of Contents

- [📝 Description](#-description)
- [📦 Installation](#-installation)
- [🚀 Usage](#-usage)
- [👥 Contributors](#-contributors)

## 📝 Description

`rspell` is a CLI tool that leverages [`cspell`](https://cspell.org/) to find all the
typos in your project. It then uses an intuitive TUI so you can fix them without ever leaving your terminal. This is a
great way to tidy up your own code/documentation, or to contribute to your favorite open source projects!

## 📦 Installation

You can install `rspell` through npm (requires Node.js 16.6.0 or higher):
```sh
npm i -g rspell
```
Or, download a compiled binary from the [latest release](https://github.com/Lioness100/rspell/releases/latest).

## 🚀 Usage

```
Usage: rspell [options] [files...]

📝 Find and fix all your project's typos with a single command!

Examples:
  $ rspell                                            Check all files
  $ rspell "src/**/*.ts"                              Check all TypeScript files in the src directory
  $ rspell --config some-file.json                    Use a custom configuration file
  $ rspell "test" --exclude "**/__snapshots__/**"     Exclude files in the __snapshots__ directory

Arguments:
  files                       The glob patterns describing the files you want to spell check. (default: ["**"])

Options:
  -V, --version               output the version number
  -c, --config <cspell.json>  Configuration file to use. By default cspell looks for cspell.json in the current directory.
  -e, --exclude <globs...>    Exclude files matching the glob pattern. This option can be used multiple times to add multiple globs.        
  -h, --help                  display help for command
```

Since `rspell` is built on top of `cspell`, you can customize the behavior of the tool by creating a [`cspell.json` file](https://cspell.org/configuration/).

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/Lioness100"><img src="https://avatars.githubusercontent.com/u/65814829?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Lioness100</b></sub></a><br /><a href="https://github.com/Lioness100/sapphire-template/issues?q=author%3ALioness100" title="Bug reports">🐛</a> <a href="https://github.com/Lioness100/sapphire-template/commits?author=Lioness100" title="Code">💻</a> <a href="https://github.com/Lioness100/sapphire-template/commits?author=Lioness100" title="Documentation">📖</a> <a href="#ideas-Lioness100" title="Ideas, Planning, & Feedback">🤔</a> <a href="#maintenance-Lioness100" title="Maintenance">🚧</a> <a href="#projectManagement-Lioness100" title="Project Management">📆</a> <a href="https://github.com/Lioness100/sapphire-template/commits?author=Lioness100" title="Tests">⚠️</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
