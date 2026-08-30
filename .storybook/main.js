// SHARE=1 builds a "share-only" Storybook that contains ONLY the prototypes —
// no component library, no docs, no other stories. Use it for links given to
// colleagues/customers (`npm run build-storybook:share`). ALL prototypes are
// included (Daniel, 2026-07-30) — every folder under src/prototypes/, so every
// previously-shared link keeps resolving (story ids come from the title/export,
// which are unchanged). Unset = the full Storybook.
const shareOnly = process.env.SHARE === '1';
// SHARE_PROTOTYPE=<folder>[,<folder>…] narrows the share build to those
// prototype folders (e.g. SHARE_PROTOTYPE=JobDetailsForms, or the four
// TimeTracker* folders that make up "Time Tracker"). Used to publish one
// prototype per sub-folder of the share repo, so what is already published
// there — the builds people are testing — is not rebuilt at all
// (Daniel, 2026-08-25).
const shareFolders = (process.env.SHARE_PROTOTYPE ?? '**').split(',').map((f) => f.trim()).filter(Boolean);

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: shareOnly
    ? shareFolders.map((folder) => `../src/prototypes/${folder}/**/*.stories.@(ts|tsx)`)
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
