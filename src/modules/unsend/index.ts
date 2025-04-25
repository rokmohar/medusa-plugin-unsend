import { Module } from '@medusajs/utils'
import Loader from './loaders'
import { UnsendService } from './services'

export * from './services'
export * from './types'

export default Module('unsend', {
  service: UnsendService,
  loaders: [Loader],
})
