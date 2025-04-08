export default async function globalTeardown() {
  if (global.__MONGOINSTANCE) {
    // Stop the in-memory MongoDB instance
    await global.__MONGOINSTANCE.stop();
  }
}
