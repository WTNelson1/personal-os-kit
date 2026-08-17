// Framework-free entry point. The React component lives behind its own
// subpath (`@personal-os/kit/AppSwitcher`) so an app that only wants the
// background never pulls React in.

export { startMatrix, initBackground } from './background'
export type { MatrixOptions } from './background'
