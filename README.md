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
      resolve: '@rokmohar/medusa-plugin-unsend',
      options: {
        channels: ['email'],
        url: process.env.UNSEND_URL,
        apiKey: process.env.UNSEND_API_KEY,
        from: process.env.UNSEND_FROM,
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
