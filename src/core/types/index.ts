import { ReactElement } from 'react'

export interface UnsendEmailOptions {
  /**
   * Unsend URL
   */
  url?: string

  /**
   * Unsend API Key
   */
  api_key: string

  /**
   * From email address
   */
  from: string
}

export type UnsendEmailTemplate = { subject: string } & (
  | {
      react: (...props: any[]) => ReactElement
      html?: never
    }
  | {
      html: string
      react?: never
    }
)
