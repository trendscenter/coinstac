---
sidebar_position: 1
---

# Coinstac - Introduction
# Decentralized Analysis Made Easy

The Collaborative Informatics and Neuroimaging Suite Toolkit for Anonymous Computation (COINSTAC) is a tool developed to overcome barriers to collaboration through the use of federated analysis and standardization of collaboration methods. COINSTAC enables users to create collaborative consortia which and run decentralized computations against the data of consortia members in-place. The data is never moved or shared, and only group-level derivatives are passed back. This allows for large scale collaborative analysis between multiple sites without the technological, policy, and administrative challenges that come with centralized analysis.

Let's do research!

## Getting Started

Depending on how you plan to use Coinstac you'll be looking for documentation in a few places:

- [End User/Researcher docs](./tutorial-basics)
  Documentation for users of the Coinstac application. Contains useful tutorials on how to create consortia, create pipelines, run analyses, etc.
- [Computation Author docs](./tutorial-basics)
  Tutorials for creating computations and the api documentation for the computation spec for designing a UI interface for your computation.
- [Developer/Contributor docs](./tutorial-basics)
  Getting started documentation for developers and contributors to Coinstac.

Get started by **creating a new site**.

Or **try Docusaurus immediately** with **[docusaurus.new](https://docusaurus.new)**.

### What you'll need

- [Node.js](https://nodejs.org/en/download/) version 16.14 or above:
  - When installing Node.js, you are recommended to check all checkboxes related to dependencies.

## Generate a new site

Generate a new Docusaurus site using the **classic template**.

The classic template will automatically be added to your project after you run the command:

```bash
npm init docusaurus@latest my-website classic
```

You can type this command into Command Prompt, Powershell, Terminal, or any other integrated terminal of your code editor.

The command also installs all necessary dependencies you need to run Docusaurus.

## Start your site

Run the development server:

```bash
cd my-website
npm run start
```

The `cd` command changes the directory you're working with. In order to work with your newly created Docusaurus site, you'll need to navigate the terminal there.

The `npm run start` command builds your website locally and serves it through a development server, ready for you to view at http://localhost:3000/.

Open `docs/intro.md` (this page) and edit some lines: the site **reloads automatically** and displays your changes.
