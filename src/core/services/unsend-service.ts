import { Unsend } from 'unsend'
import { Logger, ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from '@medusajs/types'
import { AbstractNotificationProviderService, MedusaError } from '@medusajs/utils'
import { UnsendEmailOptions, UnsendEmailTemplate } from '../types'

type SendEmailPayload = Parameters<Unsend['emails']['send']>[0]

interface InjectedDependencies {
  logger: Logger
}

export class UnsendService extends AbstractNotificationProviderService {
  private logger: Logger
  private client: Unsend
  private options: UnsendEmailOptions
  private templates: Record<string, UnsendEmailTemplate> = {}

  constructor({ logger }: InjectedDependencies, options: Record<any, any>) {
    super()
    this.logger = logger
    const validOptions = this.toPluginOptions(options)
    this.client = new Unsend(validOptions.api_key, validOptions?.url)
    this.options = validOptions
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    const template = this.getTemplate(notification.template)

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

    const { data, error } = await this.client.emails.send(emailOptions)

    if (error) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Failed to send email: ${error?.message}`)
    } else if (!data) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'No data returned')
    }

    return { id: data.emailId }
  }

  hasTemplate(key: string) {
    return this.templates[key]
  }

  getTemplate(key: string) {
    return this.templates[key]
  }

  addTemplate(key: string, template: UnsendEmailTemplate) {
    if (this.hasTemplate(key)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Template with key "${key}" already exists`)
    }
    this.templates[key] = template
  }

  removeTemplate(key: string) {
    delete this.templates[key]
  }

  setTemplates(templates: Record<string, UnsendEmailTemplate>) {
    this.templates = templates
  }

  addTemplates(templates: Record<string, UnsendEmailTemplate>) {
    Object.entries(templates).forEach(([key, template]) => {
      this.addTemplate(key, template)
    })
  }

  mergeTemplates(templates: Record<string, UnsendEmailTemplate>) {
    Object.entries(templates).forEach(([key, template]) => {
      this.templates[key] = template
    })
  }

  removeTemplates(key: string[]) {
    key.forEach((k) => {
      this.removeTemplate(k)
    })
  }

  static validateOptions(options: Record<any, any>) {
    if (!options.api_key) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Option `api_key` is required in the Unsend options')
    }
    if (!options.from) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Option `from` is required in the Unsend options')
    }
  }

  private toPluginOptions(options: Record<any, any>): UnsendEmailOptions {
    const isValid = (o: Record<any, any>): o is UnsendEmailOptions => {
      UnsendService.validateOptions(o)
      return true
    }
    if (isValid(options)) {
      return options
    }
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Invalid options for Unsend plugin')
  }
}
