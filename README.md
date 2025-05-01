# Unsend plugin for MedusaJS v2

## Installation

Run the following command to install the plugin with **npm**:

```bash
npm install --save @rokmohar/medusa-plugin-unsend
```

Or with **yarn**:

```bash
yarn add @rokmohar/medusa-plugin-unsend
```

## ⚠️ MedusaJS v2.4.0 or newer

This plugin is only for MedusaJS v2.4.0 or newer.

If you are using MedusaJS v2.3.1 or older, please use the [older version of this plugin](https://github.com/rokmohar/medusa-plugin-unsend/tree/v0.2.4).

## Configuration

Add the plugin to your `medusa-config.ts` file:

```js
import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { UNSEND_PROVIDER_PATH } from '@rokmohar/medusa-plugin-unsend'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  // ... other config
  plugins: [
    // ... other plugins
    {
      resolve: '@rokmohar/medusa-plugin-unsend',
      options: {
        // Required options
        url: process.env.UNSEND_URL ?? '',
        api_key: process.env.UNSEND_API_KEY ?? '',
        from: process.env.UNSEND_FROM ?? '',

        // Optional configuration
        templateDir: 'custom/templates/path', // Custom template directory
        retry: {
          maxAttempts: 5, // Number of retry attempts for failed sends
          delay: 2000, // Delay between retries in milliseconds
        },
        rateLimit: {
          maxPerMinute: 30, // Maximum emails per minute
        },
        // Environment configurations based on NODE_ENV
        environment: {
          development: {
            // Development-specific overrides
            from: 'dev@example.com',
            rateLimit: {
              maxPerMinute: 25,
            },
          },
          staging: {
            // Staging-specific overrides
            from: 'stage@example.com',
            rateLimit: {
              maxPerMinute: 50,
            },
          },
          production: {
            // Production-specific overrides
            from: 'prod@example.com',
            rateLimit: {
              maxPerMinute: 100,
            },
          },
        },
      },
    },
  ],
  modules: [
    // ... other modules
    {
      resolve: '@medusajs/medusa/notification',
      dependencies: ['unsend'],
      options: {
        providers: [
          // ... other providers
          {
            resolve: UNSEND_PROVIDER_PATH,
            id: 'unsend',
            options: {
              channels: ['email'],
            },
          },
        ],
      },
    },
  ],
})
```

## ENV variables

Add the environment variables to your `.env` and `.env.template` file:

```env
# ... others vars
UNSEND_URL=
UNSEND_API_KEY=
UNSEND_FROM=
```

If you want to use with the `docker-compose` from this README, use the following values:

```env
# ... others vars
UNSEND_URL=http://localhost:3000
UNSEND_API_KEY=test_123456789
UNSEND_FROM=no-reply@example.org
```

## Email Templates

The plugin automatically loads email templates from the `src/templates/emails` directory in your project root (or a custom directory specified in the configuration). Each template consists of two files:

1. A TSX file containing the React component
2. An optional JSON file for template metadata

### Template Structure

```tsx
// src/templates/emails/ProductUpsert.tsx
import React from 'react'

const ProductUpsertEmail = (props: any) => {
  return (
    <div>
      <h1>Product Updated</h1>
      <p>Product ID: {props.productId}</p>
    </div>
  )
}

// Set email subject
ProductUpsertEmail.Subject = 'Products upserted'

export default ProductUpsertEmail
```

The email subject is determined in the following order of precedence:

1. `content.subject` provided in the `createNotifications` call
2. `subject` field in the template's metadata JSON file
3. `ComponentName.Subject` static property in the TSX file
4. Kebab-case template name (derived from the filename)

For example, if you have a template named `ProductUpsert.tsx`, the subject will fall back to `product-upsert` if no other subject is specified.

```json
// src/templates/emails/ProductUpsert.json
{
  "version": "1.0.0",
  "subject": "Product upsert",
  "description": "Email template for product updates",
  "tags": ["product", "update"],
  "category": "product-notifications"
}
```

The template name will be derived from the filename (without the .tsx extension). For example, `ProductUpsert.tsx` will be available as the template named `product-upsert`.

### Template Metadata

The JSON file is optional and can contain the following fields:

- `version`: Template version (defaults to "1.0.0")
- `subject`: Template subject
- `description`: Template description
- `tags`: Array of tags for categorizing templates
- `category`: Template category

### Email Subject Precedence

The email subject is determined in the following order of precedence:

1. `content.subject` provided in the `createNotifications` call
2. `subject` field in the template's metadata JSON file
3. `ComponentName.Subject` static property in the TSX file
4. Kebab-case template name (derived from the filename)

For example, if you have a template named `ProductUpsert.tsx`, the subject will fall back to `product-upsert` if no other subject is specified.

## Features

- **Environment-specific Configuration**: Override settings for different environments (development, staging, production)
- **Rate Limiting**: Prevent overwhelming the email service with configurable limits
- **Retry Mechanism**: Automatic retries for failed email sends with exponential backoff
- **Template Versioning**: Track template versions and changes
- **Template Metadata**: Add descriptions, tags, and categories to templates
- **Custom Template Directory**: Configure the location of your email templates

## Subscribers

You must add the following subscribers to the `src/subscribers`:

### product-upsert.ts

```js
import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { IProductModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import { ProductEvents, SearchUtils } from '@medusajs/utils'
import { UnsendService } from '@rokmohar/medusa-plugin-unsend/core'

export default async function productCreatedHandler({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const productId = data.id

  // Make sure template is registered, before creating email notifications
  const unsendService: UnsendService = container.resolve('unsend')

  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  await notificationModuleService.createNotifications({
    to: 'first.last@example.org',
    channel: 'email',
    // Use name of the registered template
    template: 'product-upsert',
    // Set email subject
    content: {
      subject: 'Product upserted',
    },
  })
}

export const config: SubscriberConfig = {
  event: [ProductEvents.PRODUCT_CREATED, ProductEvents.PRODUCT_UPDATED],
}
```

## docker-compose

You can add the following configuration for Unsend to your `docker-compose.yml`:

```yml
services:
  # ... other services

  unsend:
    image: 'unsend/unsend:latest'
    port:
      - '3000:3000'
```
