// Filesystem locations shared by the main-process modules.
const { app, nativeImage } = require('electron')
const path = require('path')

// Packaged builds copy assets/ and build/ into resources/ (see extraResources in package.json).
const projectRoot = () => (app.isPackaged ? process.resourcesPath : path.join(__dirname, '..', '..'))

module.exports = {
  projectRoot,
  appIcon: () => nativeImage.createFromPath(path.join(projectRoot(), 'build', 'icons', 'gugugaga.ico')),
  PRELOAD: path.join(__dirname, 'preload.js'),
  PAGES: path.join(__dirname, '..', 'renderer', 'pages'),
}
