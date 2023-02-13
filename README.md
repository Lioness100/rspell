<div align="center">

# rspell

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/Lioness100/rspell/ci.yml?branch=main)
![License](https://img.shields.io/github/license/Lioness100/sapphire-template)

</div>

> 📝 Find and fix all your project's typos with a single command!

https://user-images.githubusercontent.com/65814829/216869223-62ef0f71-c59a-4f6f-8096-2353d6173124.mp4

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
  -e, --exclude <globs...>    Exclude files matching the glob pattern.
  -g, --use-gitignore         Use the .gitignore file to exclude files.
  -C, --cache                 Store the info about processed files in order to only operate on the changed ones.
  -d, --dot                   Include files/directories starting with "." in the glob search.
  -l, --locale <locale>       Explicitly set the locale to use for spell checking.
  -h, --help                  display help for command
```

Since `rspell` is built on top of `cspell`, you can customize the behavior of the tool by creating a [`cspell.json`
file](https://cspell.org/configuration/). If you don't have one, `rspell` will automatically create a config file for
you and update the list of ignored words appropriately as you use the CLI. 

## 💡 Featured PRs using `rspell`

- https://github.com/botlabs-gg/yagpdb/pull/1438 (910 typos)
- https://github.com/Byron/gitoxide/pull/724 (408 typos)
- https://github.com/nextauthjs/next-auth/pull/6701 (63 typos)
- https://github.com/nestjs/nest/pull/11096 (56 typos)
- https://github.com/vitest-dev/vitest/pull/2815 (48 typos)
- https://github.com/TheAlgorithms/JavaScript/pull/1283 (47 typos)
- https://github.com/prisma/prisma/pull/17874 (43 typos)
- https://github.com/trpc/trpc/pull/3735 (40 typos)
- https://github.com/reactjs/reactjs.org/pull/5586 (35 typos)
- https://github.com/nuxt/nuxt/pull/18976 (26 typos)
- https://github.com/chakra-ui/chakra-ui/pull/7340 (16 typos)
- https://github.com/nestjs/docs.nestjs.com/pull/2622 (14 typos)
- https://github.com/eslint/eslint/pull/16884 (13 typos)
- https://github.com/discordjs/discord.js/pull/9127 (12 typos)
- https://github.com/vuejs/core/pull/7693 (9 typos)
- https://github.com/sveltejs/svelte/pull/8257 (9 typos)
- https://github.com/crxjs/chrome-extension-tools/pull/646 (8 typos)
- https://github.com/vitejs/vite/pull/12032 (8 typos)
- https://github.com/rust-lang-nursery/rust-cookbook/pull/684 (7 typos)
- https://github.com/arc53/DocsGPT/pull/36 (5 typos)
- https://github.com/graphile/worker/pull/316 (2 typos)
