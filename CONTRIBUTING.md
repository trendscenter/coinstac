# Coinstac Contribution Guidelines

We welcome community interaction and contribution to the Coinstac codebase, in order to make this as easy as possible for you, we've put together this guide to get you started. The following guidelines for contribution should be followed if you want to submit a pull request, open an issue, or ask for a feature.

#### Table of Contents

- [TLDR;](#tldr)
- [Contributing](#contributing)
  - [Bug Reports](#bugs)
  - [Feature Requests](#features)
  - [Pull Requests](#pull-requests)

<a name="tldr"></a>
## TLDR;
- [Development setup guide](./SETUP.md)
- Creating an Issue or Pull Request requires a [GitHub](http://github.com) account.
- Issue reports should be **clear**, **concise** and **reproducible**. Check to see if your issue has already been resolved in the [master]() branch or already reported in Coinstac's [GitHub Issue Tracker](https://github.com/trendcenter/coinstac/issues).
- App issues should use the bug issue template with corresponding information
- All other codebase issues should be prefaced with the [Package Name] (eg: coinstac-pipeline: issue title)
- Question or clarification issues are acceptable, use the `question` tag
- Pull Requests must adhere to the package eslint rules.
- **IMPORTANT**: By submitting a patch, you agree to allow the project owner to license your work under the same license as that used by the project.



<a name="contributing"></a>
## Contributing

The issue tracker is the preferred channel for [bug reports](#bugs),
[feature requests](#features) and [submitting pull
requests](#pull-requests).

<a name="bugs"></a>
### Bug Reports

Guidelines for bug reports:

1. **Use the GitHub issue search** &mdash; check if the issue has already been reported.
2. **Check if the issue has been fixed** &mdash; try to reproduce it using the latest build of coinstac
3. **Isolate the problem** &mdash; create a test case to demonstrate your issue. Screenshots, and video are best for in App problems, the App issue submit will also grab the necessary logs.

A good bug report shouldn't leave others needing to chase you up for more information. Please try to be as detailed as possible in your report. What is your environment? What steps will reproduce the issue? For simulator, what Node.js versions experience the problem? What would you expect to be the outcome? All these details will help people to fix any potential bugs.

Specific computation issues and features should be posted to the computation repository, the Coinstac team's computations can be found [here](https://github.com/trendscenter).

<a name="features"></a>
### Feature Requests

Feature requests are welcome. Please take a moment to find out whether your idea fits with the scope and aims of the project and provide as much detail and context as possible. Specific computation issues and features should be posted to the computation repository, the Coinstac team's computations can be found [here](https://github.com/trendscenter).

<a name="pull-requests"></a>
### Pull Requests

- PRs for bug fixes are always welcome.
- PRs for security fixes are always welcome.
- PRs that increase test coverage are always welcome.
- PRs are scrutinized for coding-style.

Good pull requests - patches, improvements, new features - are a fantastic help. They should remain focused in scope and avoid containing unrelated commits.

**Please ask first** before embarking on any significant pull request (e.g. implementing features, refactoring code), otherwise you risk spending a lot of time working on something that the project's developers might not want to merge into the project.

**At a mininum** pull requests should adhere to the lint standards in the projects eslint config, add any relevant unit testing, and pass end to end testing in the UI package.

Please adhere to the coding conventions used throughout a project (indentation, accurate comments, etc.)

Follow this process if you'd like your work considered for inclusion in the project:

1. [Fork](http://help.github.com/fork-a-repo/) the project, clone your fork, and configure the remotes:

```bash
# Clone your fork of the repo into the current directory
git clone https://github.com/<your-username>/<repo-name>
# Navigate to the newly cloned directory
cd <repo-name>
# Assign the original repo to a remote called "upstream"
git remote add upstream https://github.com/<upstream-owner>/<repo-name>
```

2. If you cloned a while ago, get the latest changes from upstream:

```bash
git checkout master
git pull upstream master
```

3. Create a new topic branch (off the main project master branch) to contain your feature, change, or fix:

```bash
git checkout -b <topic-branch-name>
```

4. Commit your changes in logical chunks. You can use Git's [interactive rebase](https://help.github.com/articles/interactive-rebase) feature to tidy up your commits before making them public.

5. Run you code to make sure it works. Please follow the [setup guide](./SETUP.md) to get your coinstac environment setup to run.

```bash
# Unit test in the specific package
npm test
# e2e in the ui repo
npm run test:e2e
```

6. Locally merge (or rebase) the upstream development branch into your topic branch:

```bash
git pull [--rebase] upstream master
```

7. Push your topic branch up to your fork:

```bash
git push origin <topic-branch-name>
```

8. [Open a Pull Request](https://help.github.com/articles/using-pull-requests/) with a clear title and description, following the PR template in the repo

**IMPORTANT**: By submitting a patch, you agree to allow the project owner to license your work under the same license as that used by the project.

<a name="resources"></a>
### Resources

- [Development setup guide](./SETUP.md)
- [Algorithm development guide](./algorithm-development/coinstac-development-guide.md)
