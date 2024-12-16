import { ModuleProvider, Modules } from '@medusajs/utils';
import Loader from './loaders'
import { UnsendNotificationService } from './services'

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [UnsendNotificationService],
  loaders: [Loader],
})

export * from "./initialize"
export * from "./services"
export * from "./types"
