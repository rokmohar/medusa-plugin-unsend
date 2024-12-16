import { MedusaModule } from "@medusajs/modules-sdk"
import {
  ExternalModuleDeclaration,
  ISearchService,
  InternalModuleDeclaration,
} from "@medusajs/types"
import { UnsendPluginOptions } from "../types";

export const initialize = async (
  options?: UnsendPluginOptions | ExternalModuleDeclaration
): Promise<ISearchService> => {
  const serviceKey = 'medusa-plugin-unsend'
  const loaded = await MedusaModule.bootstrap<ISearchService>({
    moduleKey: serviceKey,
    defaultPath: '@rokmohar/medusa-plugin-unsend',
    declaration: options as
      | InternalModuleDeclaration
      | ExternalModuleDeclaration,
  })

  return loaded[serviceKey]
}