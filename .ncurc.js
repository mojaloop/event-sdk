module.exports = {
  // Add a TODO comment indicating the reason for each rejected dependency upgrade added to this list, and what should be done to resolve it (i.e. handle it through a story, etc).
  reject: [
    // @types/node's major must match the Node runtime major in .nvmrc. A higher major makes tsc
    // accept APIs the runtime lacks, which then crash at runtime, and the tests cannot catch it
    // (it only weakens type checking). Bump together with the runtime.
    '@types/node'
  ]
}
