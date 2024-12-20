# medusa-plugin-unsend

## Installation

Run the following command to install the plugin with **npm**:

```bash
npm install --save @rokmohar/medusa-plugin-unsend
```

Or with **yarn**:

```bash
yarn add @rokmohar/medusa-plugin-unsend
```

## Configuration

Add the plugin to your `medusa-config.ts` file:

```js
import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  // ... other config
  modules: [
    // ... other modules
    {
      resolve: './src/modules/dev/unsend/template',
    },
    {
      resolve: '@medusajs/medusa/notification', 
      dependencies: ['unsendTemplate'],
      options: {
        providers: [
          // ... other providers
          {
            resolve: './src/modules/dev/unsend/email',
            id: 'unsend',
            options: {
              channels: ['email'],
              url: process.env.UNSEND_URL ?? '',
              api_key: process.env.UNSEND_API_KEY ?? '',
              from: process.env.UNSEND_FROM ?? '',
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

## Subscribers

You must add the following subscribers to the `src/subscribers`:

### product-upsert.ts

```js
import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { IProductModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import { ProductEvents, SearchUtils } from '@medusajs/utils'
import { UnsendTemplateService } from '@rokmohar/medusa-plugin-unsend/template'

export default async function productUpsertHandler({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const productId = data.id

  // Make sure template is registered, before creating email notifications
  const unsendTemplateService: UnsendTemplateService = container.resolve('unsendTemplate')
  unsendTemplateService.setTemplates({
    'product-upsert': {
      subject: 'Product upsert-ed',
      html: '<b>Product upsert-ed</b>',
      // You can use React component from `@react-email` package
      // react: ProductUpsertEmail,
    },
  })

  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  await notificationModuleService.createNotifications({
    to: 'first.last@example.org',
    channel: 'email',
    // Use name of the registered template
    template: 'product-upsert',
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
