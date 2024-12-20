import { ReactElement } from 'react'
import { MedusaError } from '@medusajs/utils'
import { ModuleJoinerConfig } from '@medusajs/types'
import { joinerConfig } from '../joiner-config'

export type EmailTemplate = { subject: string } & (
  | {
      react: (...props: any[]) => ReactElement
      html?: never
    }
  | {
      html: string
      react?: never
    }
)

export class UnsendTemplateService {
  private templates: Record<string, EmailTemplate> = {}

  __joinerConfig(): ModuleJoinerConfig {
    return joinerConfig
  }

  hasTemplate(key: string) {
    return this.templates[key]
  }

  getTemplate(key: string) {
    return this.templates[key]
  }

  addTemplate(key: string, template: EmailTemplate) {
    if (this.hasTemplate(key)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Template with key "${key}" already exists`)
    }
    this.templates[key] = template
  }

  removeTemplate(key: string) {
    delete this.templates[key]
  }

  setTemplates(templates: Record<string, EmailTemplate>) {
    this.templates = templates
  }

  addTemplates(templates: Record<string, EmailTemplate>) {
    Object.entries(templates).forEach(([key, template]) => {
      this.addTemplate(key, template)
    })
  }

  mergeTemplates(templates: Record<string, EmailTemplate>) {
    Object.entries(templates).forEach(([key, template]) => {
      this.templates[key] = template
    })
  }

  removeTemplates(key: string[]) {
    key.forEach((k) => {
      this.removeTemplate(k)
    })
  }
}
