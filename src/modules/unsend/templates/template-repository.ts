import { MedusaError } from '@medusajs/utils'
import { UnsendEmailTemplate } from '../types'
import {
  TemplateValidator,
  RequiredFieldsRule,
  ReactPropsRule,
  HtmlValidationRule,
  MetadataValidationRule,
} from './template-validator'

export class TemplateRepository {
  private static instance: TemplateRepository
  private templates: Record<string, UnsendEmailTemplate> = {}
  private validator: TemplateValidator

  private constructor() {
    // Initialize validator with built-in rules
    this.validator = new TemplateValidator([
      new RequiredFieldsRule(),
      new ReactPropsRule(),
      new HtmlValidationRule(),
      new MetadataValidationRule(),
    ])
  }

  public static getInstance(): TemplateRepository {
    if (!TemplateRepository.instance) {
      TemplateRepository.instance = new TemplateRepository()
    }
    return TemplateRepository.instance
  }

  public hasTemplate(key: string): boolean {
    return !!this.templates[key]
  }

  public getTemplate(key: string): UnsendEmailTemplate | undefined {
    return this.templates[key]
  }

  public addTemplate(key: string, template: UnsendEmailTemplate): void {
    if (this.hasTemplate(key)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Template with key "${key}" already exists`)
    }

    // Validate template before adding
    const validationResult = this.validator.validate(template)
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors
        .map((error) => `${error.path.join('.')}: ${error.message}`)
        .join(', ')
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid template: ${errorMessages}`)
    }

    // Log warnings if any
    if (validationResult.warnings.length > 0) {
      const warningMessages = validationResult.warnings
        .map((warning) => `${warning.path.join('.')}: ${warning.message}`)
        .join(', ')
      console.warn(`Template warnings for "${key}": ${warningMessages}`)
    }

    this.templates[key] = template
  }

  public removeTemplate(key: string): void {
    delete this.templates[key]
  }

  public setTemplates(templates: Record<string, UnsendEmailTemplate>): void {
    this.templates = templates
  }

  public addTemplates(templates: Record<string, UnsendEmailTemplate>): void {
    Object.entries(templates).forEach(([key, template]) => {
      this.addTemplate(key, template)
    })
  }

  public mergeTemplates(templates: Record<string, UnsendEmailTemplate>): void {
    Object.entries(templates).forEach(([key, template]) => {
      this.templates[key] = template
    })
  }

  public removeTemplates(keys: string[]): void {
    keys.forEach((key) => {
      this.removeTemplate(key)
    })
  }

  public getAllTemplates(): Record<string, UnsendEmailTemplate> {
    return { ...this.templates }
  }
}
