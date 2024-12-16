import { Unsend } from 'unsend'
import { Logger, ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from '@medusajs/types'
import { AbstractNotificationProviderService, MedusaError } from '@medusajs/utils'
import { UnsendEmailOptions } from '../types'
import { UnsendTemplateService } from '../../template'

type SendEmailPayload = Parameters<Unsend['emails']['send']>[0]

interface InjectedDependencies {
  logger: Logger
  unsendTemplate: UnsendTemplateService
}

export class UnsendEmailService extends AbstractNotificationProviderService {
  static identifier = 'notification-unsend'

  private unsend: Unsend
  private options: UnsendEmailOptions
  private unsendTemplate: UnsendTemplateService
  private logger: Logger

  constructor({ logger, unsendTemplate }: InjectedDependencies, options: Record<any, any>) {
    super()

    const validOptions = this.toPluginOptions(options)

    this.unsend = new Unsend(validOptions.api_key, validOptions?.url)
    this.options = validOptions
    this.unsendTemplate = unsendTemplate
    this.logger = logger
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    const template = this.unsendTemplate.getTemplate(notification.template)

    if (!template) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Couldn't find an email template for ${notification.template}`,
      )
    }

    const emailOptions: SendEmailPayload = {
      from: notification.from ?? this.options.from,
      to: [notification.to],
      subject: template.subject,
    }

    if (typeof template.react !== 'undefined') {
      emailOptions.react = template.react(notification.data)
    } else {
      emailOptions.html = template.html
    }

    const { data, error } = await this.unsend.emails.send(emailOptions)

    if (error) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Failed to send email: ${error?.message}`)
    } else if (!data) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'No data returned')
    }

    return { id: data.emailId }
  }

  static validateOptions(options: Record<any, any>) {
    if (!options.api_key) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Option `api_key` is required in the Unsend options.')
    }
    if (!options.from) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Option `from` is required in the Unsend options.')
    }
  }

  private toPluginOptions(options: Record<any, any>): UnsendEmailOptions {
    const isValid = (o: Record<any, any>): o is UnsendEmailOptions => {
      UnsendEmailService.validateOptions(o)
      return true
    }
    if (isValid(options)) {
      return options
    }
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Invalid options for Unsend plugin')
  }
}
