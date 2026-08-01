// SHARE=1 builds a "share-only" Storybook that contains ONLY the prototypes —
// no component library, no docs, no other stories. Use it for links given to
// colleagues/customers (`npm run build-storybook:share`). ALL prototypes are
// included (Daniel, 2026-07-30) — every folder under src/prototypes/, so every
// previously-shared link keeps resolving (story ids come from the title/export,
// which are unchanged). Unset = the full Storybook.
const shareOnly = process.env.SHARE === '1';

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: shareOnly
    ? ['../src/prototypes/**/*.stories.@(ts|tsx)']
    : ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', 'storybook-addon-pseudo-states'],
  // Serve public/ so avatar images resolve at /avatars/… in dev and static builds.
  staticDirs: ['../public'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
