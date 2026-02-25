import Init from '../models/init.js'
import mcBridge from '../models/mc/index.js'

const Index = {
  async init () {
    Init.init()
    await mcBridge.boot()
  }
}

export default Index
