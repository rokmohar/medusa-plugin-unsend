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
        url: process.env.UNSEND_URL ?? '',
        api_key: process.env.UNSEND_API_KEY ?? '',
        from: process.env.UNSEND_FROM ?? '',
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

## Subscribers

You must add the following subscribers to the `src/subscribers`:

### product-upsert.ts

```js
import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { IProductModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import { ProductEvents, SearchUtils } from '@medusajs/utils'
import { UnsendService } from '@rokmohar/medusa-plugin-unsend/core'

export default async function productUpsertHandler({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const productId = data.id

  // Make sure template is registered, before creating email notifications
  const unsendService: UnsendService = container.resolve('unsend')
    unsendService.setTemplates({
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
