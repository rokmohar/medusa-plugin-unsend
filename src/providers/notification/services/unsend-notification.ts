import { ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from '@medusajs/types'
import { AbstractNotificationProviderService } from '@medusajs/utils'
import { UnsendService } from '../../../modules/unsend'

interface InjectedDependencies {
  unsend: UnsendService
}

export class UnsendNotificationService extends AbstractNotificationProviderService {
  static identifier = 'notification-unsend'

  private unsend: UnsendService

  constructor({ unsend }: InjectedDependencies) {
    super()
    this.unsend = unsend
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    return this.unsend.send(notification)
  }

  static validateOptions() {}
}
