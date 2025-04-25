import { MedusaError } from '@medusajs/utils'
import { UnsendEmailTemplate } from '../types'

export class TemplateRepository {
  private static instance: TemplateRepository
  private templates: Record<string, UnsendEmailTemplate> = {}

  private constructor() {}

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
