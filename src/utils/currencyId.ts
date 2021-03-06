import { Currency, ETHER, Token } from '@feswap/sdk'

export function currencyId(currency?: Currency): string {
  if(!currency) return ''
  if (currency === ETHER) return 'ETH'
  if (currency instanceof Token) return currency.address
  throw new Error('invalid currency')
}
