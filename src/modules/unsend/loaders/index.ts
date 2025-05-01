import { LoaderOptions } from '@medusajs/types'
import { UnsendEmailOptions, UnsendEmailTemplate } from '../types'
import { UnsendService } from '../services'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { toKebabCase } from '../utils'
import { Logger } from '@medusajs/types'
import { asValue } from 'awilix'

interface TemplateMetadata {
  version?: string
  subject?: string
  description?: string
  tags?: string[]
  category?: string
}

export default async ({ container, options }: LoaderOptions<UnsendEmailOptions>): Promise<void> => {
  if (!options) {
    throw new Error('Missing unsend configuration')
  }

  const unsendService = new UnsendService(container, options)

  container.register({
    unsend: asValue(unsendService),
  })

  const logger = container.resolve<Logger>('logger')
  const templatesDir = options.templateDir || join(process.cwd(), 'src', 'templates', 'emails')

  try {
    const files = await readdir(templatesDir)
    const templateFiles = files.filter((file) => file.endsWith('.tsx'))

    for (const file of templateFiles) {
      const filePath = join(templatesDir, file)
      const metadataPath = join(templatesDir, file.replace('.tsx', '.json'))

      // Extract the template name from the file name and convert to kebab-case
      const templateName = toKebabCase(file.replace('.tsx', ''))

      // Load template metadata if it exists
      let metadata: TemplateMetadata = {}
      try {
        const metadataContent = await readFile(metadataPath, 'utf-8')
        metadata = JSON.parse(metadataContent)
      } catch (error) {
        // Metadata file doesn't exist or is invalid, use defaults
        if (!(error instanceof Error)) {
          logger.debug(`Unknown error loading metadata for template ${templateName}`)
          return
        }

        if ('code' in error && error.code === 'ENOENT') {
          logger.debug(`Metadata file not found for template ${templateName} at ${metadataPath}`)
        } else if (error.name === 'SyntaxError') {
          logger.debug(`Invalid JSON in metadata file for template ${templateName}: ${error.message}`)
        } else {
          logger.debug(`Error loading metadata for template ${templateName}: ${error.message}`)
        }
      }

      // Dynamically import the TSX file
      const Component = (await import(filePath)).default

      // Create a template object
      const template: UnsendEmailTemplate = {
        subject: metadata.subject || Component.Subject || templateName,
        version: metadata.version || '1.0.0',
        metadata: {
          description: metadata.description,
          tags: metadata.tags,
          category: metadata.category,
        },
        content: {
          react: Component,
        },
      }

      unsendService.addTemplate(templateName, template)
    }

    logger.info(`Successfully loaded ${templateFiles.length} email templates`)
  } catch (error) {
    logger.error('Failed to load email templates:', error)
  }
}
