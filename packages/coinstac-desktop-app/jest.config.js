module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/app/render/**/*.{js,jsx}'],
  coverageDirectory: 'coverage',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jestConfig/setup-test.js'],
  testMatch: ['<rootDir>/app/render/**/*.test.{js,jsx}'],
  moduleNameMapper: {
    '\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/jestConfig/file-stub-mock.js',
  },
};
