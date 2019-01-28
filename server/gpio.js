module.exports = {
  ready: false,
  gpioLibrary: null,
  configure: () => {
    try {
      const GPIOPackage = 'rpi-gpio'
      require.resolve(GPIOPackage)
      this.gpioLibrary = require(GPIOPackage)
      this.ready = true
    } catch (error) {
      console.log('Impossible to use GPIO: please install package if you are on Raspberry system.')
    }
  },
  isReady: () => {
    return this.ready
  },
  gpio: () => this.gpioLibrary
}
