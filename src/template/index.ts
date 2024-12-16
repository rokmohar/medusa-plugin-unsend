import { UnsendTemplateService } from './services'
import { ModuleExports } from '@medusajs/types'

export * from './services'

const moduleDefinition: ModuleExports = {
  service: UnsendTemplateService,
}

export default moduleDefinition
