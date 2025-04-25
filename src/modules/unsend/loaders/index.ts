import { LoaderOptions } from '@medusajs/types'
import { UnsendEmailOptions, UnsendEmailTemplate } from '../types'
import { UnsendService } from '../services'
import { readdir } from 'fs/promises'
import { join } from 'path'
import { toKebabCase } from '../utils'
import { Logger } from '@medusajs/types'
import { asValue } from 'awilix'

export default async ({ container, options }: LoaderOptions<UnsendEmailOptions>): Promise<void> => {
  if (!options) {
    throw new Error('Missing unsend configuration')
  }

  const unsendService = new UnsendService(container, options)

  container.register({
    unsend: asValue(unsendService),
  })

  const logger = container.resolve<Logger>('logger')
  const templatesDir = join(process.cwd(), 'src', 'templates', 'emails')

  try {
    const files = await readdir(templatesDir)
    const templateFiles = files.filter((file) => file.endsWith('.tsx'))

    for (const file of templateFiles) {
      const filePath = join(templatesDir, file)

      // Dynamically import the TSX file
      const component = await import(filePath)

      // Extract the template name from the file name and convert to kebab-case
      const templateName = toKebabCase(file.replace('.tsx', ''))

      // Create a template object
      const template: UnsendEmailTemplate = {
        subject: templateName,
        react: component.default,
      }

      unsendService.addTemplate(templateName, template)
    }

    logger.info(`Successfully loaded ${templateFiles.length} email templates`)
  } catch (error) {
    logger.error('Failed to load email templates:', error)
  }
}
