import { createContext } from 'react'

export const NumericValidityContext = createContext<
  (id: string, invalid: boolean) => void
>(() => undefined)
