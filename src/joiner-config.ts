import { defineJoinerConfig } from "@medusajs/utils"

export const joinerConfig = defineJoinerConfig('@rokmohar/medusa-plugin-unsend', {
  models: [{ name: "Unsend" }],
})