export default {
  // Required for ES Module support with --experimental-vm-modules
  transform: {},

  // Explicitly point Jest at the tests folder so it doesn't accidentally
  // pick up seed scripts or integration helpers in the project root.
  testMatch: ["**/tests/**/*.test.js"],

  // Give each integration test suite enough time to boot the Express server
  // and settle DB queries against the in-memory mock store.
  testTimeout: 30000,

  // Emit a clear summary and surface the first failure immediately.
  // Note: --runInBand is passed via CLI in package.json "test" script.
  verbose: true,
};
