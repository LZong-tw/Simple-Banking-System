// pnpm compatibility configuration
module.exports = {
  hooks: {
    readPackage(pkg, context) {
      // Show warning if package-lock.json is detected
      if (require('fs').existsSync('package-lock.json')) {
        context.log('⚠️  Detected package-lock.json, recommend using npm install')
      }
      return pkg
    }
  }
}
