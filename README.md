![Hero](https://raw.githubusercontent.com/mattpilott/kitto/main/.github/hero.svg)

<p align="center">
  🎒 Kitto, a collection of utilities, helpers and tools for your projects.
  (Japanese キット for Kit)
</p>

## Hello 👋,

<a href="https://github.com/mattpilott/kitto/releases">
<img src="https://img.shields.io/github/v/release/mattpilott/kitto?include_prereleases
" alt="Releases" />
</a>

<a href="https://github.com/mattpilott/kitto/actions">
<img src="https://github.com/mattpilott/kitto/actions/workflows/main.yml/badge.svg" alt="CI" />
</a>

The purpose of this repo is to create a single point of access for all those little helpers, tools and utilities that you have on all your projects.

### Structure

The structure is super simple, there is a main import at the root of lib that pulls in the namespaces, those in turn have their own indice which import the modules themselves.

Each module is a single exported function or micro api, please continue this way as it makes things easy to reason about and keeps individual modules small.

The aim with this approach is to have small files that do one thing well.

#### Open to contributions, ideas and feedback, oh plus bugs of course 🤓

[Documentation available here](https://mattpilott.github.io/kitto/)
