import { Unsend } from 'unsend'
import { MedusaError } from '@medusajs/utils'
import { INotificationProvider, ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from '@medusajs/types'
import { UnsendEmailOptions, UnsendEmailTemplate } from '../types'
import { TemplateRepository } from '../templates/template-repository'
import { RateLimiter } from '../utils/rate-limiter'
import { RetryStrategy } from '../utils/retry-strategy'

type SendEmailPayload = Parameters<Unsend['emails']['send']>[0]

export class UnsendService implements INotificationProvider {
  private client: Unsend
  private options: UnsendEmailOptions
  private templateRepository: TemplateRepository
  private rateLimiter: RateLimiter
  private retryStrategy: RetryStrategy
  private emailCount: number = 0
  private lastResetTime: number = Date.now()

  constructor(_: any, options: Record<any, any>) {
    const validOptions = this.toPluginOptions(options)
    this.client = new Unsend(validOptions.api_key, validOptions?.url)
    this.options = this.applyEnvironmentConfig(validOptions)
    this.templateRepository = TemplateRepository.getInstance()
    this.rateLimiter = new RateLimiter(this.options.rateLimit?.maxPerMinute)
    this.retryStrategy = new RetryStrategy({
      maxAttempts: this.options.retry?.maxAttempts ?? 3,
      delay: this.options.retry?.delay ?? 1000,
      backoff: 'exponential',
    })
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
      subject: notification.content?.subject ?? template.subject,
    }

    if (template.content.react) {
      emailOptions.react = template.content.react(notification.data)
    } else if (template.content.html) {
      emailOptions.html = template.content.html
    }

    return this.sendWithRetry(emailOptions)
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
    const errors: string[] = []

    // Required fields validation
    if (!options.api_key) {
      errors.push('Option `api_key` is required in the Unsend options')
    }
    if (!options.from) {
      errors.push('Option `from` is required in the Unsend options')
    }

    // URL validation if provided
    if (options.url && !options.url.startsWith('http')) {
      errors.push('Option `url` must be a valid HTTP(S) URL')
    }

    // Rate limit validation
    if (options.rateLimit) {
      if (options.rateLimit.maxPerMinute !== undefined) {
        if (options.rateLimit.maxPerMinute < 1) {
          errors.push('Rate limit maxPerMinute must be greater than 0')
        }
        if (!Number.isInteger(options.rateLimit.maxPerMinute)) {
          errors.push('Rate limit maxPerMinute must be an integer')
        }
      }
    }

    // Retry configuration validation
    if (options.retry) {
      if (options.retry.maxAttempts !== undefined) {
        if (options.retry.maxAttempts < 1) {
          errors.push('Retry maxAttempts must be greater than 0')
        }
        if (!Number.isInteger(options.retry.maxAttempts)) {
          errors.push('Retry maxAttempts must be an integer')
        }
      }
      if (options.retry.delay !== undefined) {
        if (options.retry.delay < 0) {
          errors.push('Retry delay must be non-negative')
        }
        if (!Number.isInteger(options.retry.delay)) {
          errors.push('Retry delay must be an integer')
        }
      }
    }

    // Environment configuration validation
    if (options.environment) {
      const validEnvs = ['development', 'staging', 'production']
      Object.keys(options.environment).forEach((env) => {
        if (!validEnvs.includes(env)) {
          errors.push(`Invalid environment "${env}". Must be one of: ${validEnvs.join(', ')}`)
        }
      })
    }

    if (errors.length > 0) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid Unsend configuration:\n${errors.join('\n')}`)
    }
  }

  private applyEnvironmentConfig(options: UnsendEmailOptions): UnsendEmailOptions {
    const env = process.env.NODE_ENV || 'development'
    const envConfig = options.environment?.[env as keyof typeof options.environment]

    if (envConfig) {
      return {
        ...options,
        ...envConfig,
      }
    }

    return options
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now()

    if (now - this.lastResetTime >= 60000) {
      this.emailCount = 0
      this.lastResetTime = now
    }

    const maxPerMinute = this.options.rateLimit?.maxPerMinute ?? 60

    if (this.emailCount >= maxPerMinute) {
      const waitTime = 60000 - (now - this.lastResetTime)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
      this.emailCount = 0
      this.lastResetTime = Date.now()
    }

    this.emailCount++
  }

  private async sendWithRetry(emailOptions: SendEmailPayload): Promise<ProviderSendNotificationResultsDTO> {
    return this.retryStrategy.execute(async () => {
      await this.rateLimiter.checkLimit()
      const { data, error } = await this.client.emails.send(emailOptions)

      if (error) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Failed to send email: ${error?.message}`)
      }
      if (!data) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, 'No data returned')
      }

      return { id: data.emailId }
    })
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
