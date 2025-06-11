module.exports = {
  // Add a TODO comment indicating the reason for each rejected dependency upgrade added to this list, and what should be done to resolve it (i.e. handle it through a story, etc).
  reject: [
    // TODO: 'serialize-error' version is fixed to v8.1.0, this is because v9+ only supports ESM loaders and not CJS. This will need to be addressed in a future story.
    "serialize-error",
    "jest" // jest 30 is released but libraries that work with jest have not been updated to support it yet.
  ]
}
