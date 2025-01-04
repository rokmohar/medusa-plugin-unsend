import { Logger, ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from '@medusajs/types'
import { AbstractNotificationProviderService, MedusaError } from '@medusajs/utils'
import { UnsendService } from '../../core'

interface InjectedDependencies {
  logger: Logger
  unsend: UnsendService
}

export class UnsendNotificationService extends AbstractNotificationProviderService {
  static identifier = 'notification-unsend'

  private logger: Logger
  private unsend: UnsendService

  constructor({ logger, unsend }: InjectedDependencies) {
    super()
    this.logger = logger
    this.unsend = unsend
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    return this.unsend.send(notification)
  }

  static validateOptions(options: Record<any, any>) {}
}
