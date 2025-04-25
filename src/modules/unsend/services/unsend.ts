import { Unsend } from 'unsend'
import { MedusaError } from '@medusajs/utils'
import { INotificationProvider, ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from '@medusajs/types'
import { UnsendEmailOptions, UnsendEmailTemplate } from '../types'
import { TemplateRepository } from '../repositories/template-repository'

type SendEmailPayload = Parameters<Unsend['emails']['send']>[0]

export class UnsendService implements INotificationProvider {
  private client: Unsend
  private options: UnsendEmailOptions
  private templateRepository: TemplateRepository

  constructor(_: any, options: Record<any, any>) {
    const validOptions = this.toPluginOptions(options)
    this.client = new Unsend(validOptions.api_key, validOptions?.url)
    this.options = validOptions
    this.templateRepository = TemplateRepository.getInstance()
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    const template = this.templateRepository.getTemplate(notification.template)

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
    return this.templateRepository.hasTemplate(key)
  }

  getTemplate(key: string) {
    return this.templateRepository.getTemplate(key)
  }

  addTemplate(key: string, template: UnsendEmailTemplate) {
    this.templateRepository.addTemplate(key, template)
  }

  removeTemplate(key: string) {
    this.templateRepository.removeTemplate(key)
  }

  setTemplates(templates: Record<string, UnsendEmailTemplate>) {
    this.templateRepository.setTemplates(templates)
  }

  addTemplates(templates: Record<string, UnsendEmailTemplate>) {
    this.templateRepository.addTemplates(templates)
  }

  mergeTemplates(templates: Record<string, UnsendEmailTemplate>) {
    this.templateRepository.mergeTemplates(templates)
  }

  removeTemplates(key: string[]) {
    this.templateRepository.removeTemplates(key)
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
