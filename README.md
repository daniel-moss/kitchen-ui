# Kitchen UI — Storybook

Your design system playground. It is separate from the production codebase
(`roopairs_api`) and cannot affect it.

## First time only

Install the tools (downloads into a `node_modules` folder you can ignore):

```
npm install
```

## Start Storybook

```
npm run storybook
```

It opens in your browser at http://localhost:6006. Edit a component and it
refreshes automatically. Press Ctrl + C in Terminal to stop it.

## Make a shareable version

```
npm run build-storybook
```

This creates a `storybook-static` folder you can host as a link or send to
your team.
