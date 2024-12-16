import { LoaderOptions, Logger } from '@medusajs/types'
import { ContainerRegistrationKeys } from "@medusajs/utils";
import { UnsendNotificationService } from '../services'
import { asValue } from 'awilix'

export default async ({ container, options }: LoaderOptions): Promise<void> => {
  if (!options) {
    throw new Error('Missing Unsend configuration')
  }

  const logger: Logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const unsendNotificationService = new UnsendNotificationService({ logger }, options)

  container.register({
    unsendNotificationService: asValue(unsendNotificationService),
  })
}
