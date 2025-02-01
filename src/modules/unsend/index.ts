import { Module } from '@medusajs/utils'
import { UnsendService } from './services'

export * from './services'
export * from './types'

export default Module('unsend', {
  service: UnsendService,
})
