import remarkGfm from 'remark-gfm';

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
  addons: [
    '@storybook/addon-essentials',
    // addon-docs is listed explicitly ONLY to pass it options: MDX has no table
    // support on its own and remark-gfm adds it, and the docs pages use tables
    // wherever the Figma doc does (ItemValue's ItemValue-vs-tag rule, ItemText's
    // "who uses it"). Options given to addon-essentials under `docs` do NOT
    // reach here — essentials reads that key only as an on/off flag. It detects
    // this entry and skips composing its own copy, so docs is not loaded twice.
    {
      name: '@storybook/addon-docs',
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    'storybook-addon-pseudo-states',
  ],
  // NO `staticDirs` — on purpose. Vite already serves and copies `public/`
  // (its own `publicDir`), and Storybook ALSO copies every staticDirs entry.
  // Listing '../public' therefore pointed two concurrent copies at the same
  // output folder, and they raced: `EEXIST: file already exists, mkdir
  // './storybook-static/fonts'`, which failed a Pages deploy on 2026-10-14 and
  // one local build before that. Vite's copy alone puts avatars, fonts, forms
  // and the manifest where they belong, in dev and in a static build.
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
