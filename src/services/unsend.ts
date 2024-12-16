import { ReactElement } from "react";
import { Unsend } from "unsend";
import { Logger, ModuleJoinerConfig, ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from '@medusajs/types'
import { AbstractNotificationProviderService, MedusaError } from '@medusajs/utils'
import { joinerConfig } from "../joiner-config";
import { UnsendPluginOptions } from "../types";

type SendEmailPayload = Parameters<Unsend['emails']['send']>[0];

type EmailTemplate = { subject: string } & ({
  react: (...props: any[]) => ReactElement;
  html?: never;
} | {
  html: string;
  react?: never;
})

interface InjectedDependencies {
  logger: Logger
}

export class UnsendNotificationService extends AbstractNotificationProviderService {
  static identifier = "notification-unsend"

  private unsend: Unsend
  private options: UnsendPluginOptions
  private logger: Logger

  private templates: Record<string, EmailTemplate> = {};

  constructor(
    { logger }: InjectedDependencies,
    options: Record<any, any>
  ) {
    super()

    const validOptions = this.toPluginOptions(options);

    this.unsend = new Unsend(validOptions.apiKey, validOptions?.url)
    this.options = validOptions;
  }

  __joinerConfig(): ModuleJoinerConfig {
    return joinerConfig
  }

  hasTemplate(key: string) {
    return this.templates[key];
  }

  addTemplate(key: string, template: EmailTemplate) {
    if (this.hasTemplate(key)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Template with key "${key}" already exists`
      )
    }
    this.templates[key] = template
  }

  removeTemplate(key: string) {
    delete this.templates[key];
  }

  setTemplates(templates: Record<string, EmailTemplate>) {
    this.templates = templates;
  }

  addTemplates(templates: Record<string, EmailTemplate>) {
    Object.entries(templates).forEach(([key, template]) => {
      this.addTemplate(key, template)
    })
  }

  mergeTemplates(templates: Record<string, EmailTemplate>) {
    Object.entries(templates).forEach(([key, template]) => {
      this.templates[key] = template;
    });
  }

  removeTemplates(key: string[]) {
    key.forEach((k) => {
      this.removeTemplate(k);
    });
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const template = this.templates[notification.template]

    if (!template) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Couldn't find an email template for ${notification.template}`
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
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to send email: ${error?.message}`,
      )
    } else if (!data) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No data returned"
      )
    }

    return { id: data.emailId }
  }

  static validateOptions(options: Record<any, any>) {
    if (!options.apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `api_key` is required in the provider's options."
      )
    }
    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `from` is required in the provider's options."
      )
    }
  }

  private toPluginOptions(options: Record<any, any>): UnsendPluginOptions {
      const isValid = (o: Record<any, any>): o is UnsendPluginOptions => {
        UnsendNotificationService.validateOptions(o);
        return true;
      }
      if (isValid(options)) {
        return options;
      }
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid options for Unsend plugin"
      );
    }
}
