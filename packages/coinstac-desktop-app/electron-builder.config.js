const packageJson = require('./package.json');
debugger
module.exports = {
  appId: 'com.github.trendscenter.coinstac',
  productName: 'COINSTAC',
  afterSign: './scripts/utils/notarize.js',
  files: [
    '**/*',
    'build/render',
    '!config/local-development.json',
    '!config/local-local.json',
    '!config/local-production.json',
    '!CONTRIBUTING.md',
    '!coverage',
    '!scripts',
    '!test',
    '!webpack.config.js',
  ],
  extraResources: [
    'resources/**',
  ],
  mac: {
    icon: 'img/icons/coinstac.icns',
    target: 'dmg',
    category: 'public.app-category.education',
    hardenedRuntime: true,
    notarize: {
      teamId: `${process.env.APPLE_TEAM_ID}`,
    },
  },
  dmg: {
    sign: false,
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    icon: 'img/icons/coinstac.ico',
  },
  nsis: {
    oneClick: true,
    runAfterFinish: true,
    installerIcon: 'img/icons/coinstac.ico',
    uninstallerIcon: 'img/icons/coinstac.ico',
    deleteAppDataOnUninstall: true,
    license: 'LICENSE',
  },
  linux: {
        target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
    ],
    category: 'Science',
    artifactName: `COINSTAC-${packageJson.version}-linux.AppImage`,
    icon: 'img/icons/coinstac.png',
  },
};
