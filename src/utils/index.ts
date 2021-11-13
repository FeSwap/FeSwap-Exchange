import { Contract } from '@ethersproject/contracts'
import { getAddress } from '@ethersproject/address'
import { AddressZero } from '@ethersproject/constants'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'
import { abi as IFeSwapRouterABI } from '@feswap/core/build/IFeSwapRouter.json'
import { ChainId, JSBI, Percent, Token, CurrencyAmount, Currency, ETHER, Fraction, ROUTER_ADDRESS } from '@feswap/sdk'
import { TokenAddressMap } from '../state/lists/hooks'

export const WEI_DENOM = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
export const ZERO = JSBI.BigInt(0)
export const ONE = JSBI.BigInt(1)
export const TWO = JSBI.BigInt(2)
export const THREE = JSBI.BigInt(3)
export const FIVE = JSBI.BigInt(5)
export const TEN = JSBI.BigInt(10)
export const HUNDREAD = JSBI.BigInt(100)
export const HUNDREAD_TWO = JSBI.BigInt(102)
export const ELEVEN = JSBI.BigInt(11)
export const ZERO_FRACTION = new Fraction(ZERO, ONE)
export const ONE_FRACTION = new Fraction(ONE, ONE)
export const TWO_FRACTION = new Fraction(TWO, ONE)
export const THREE_FRACTION = new Fraction(THREE, ONE)
export const FIVE_FRACTION = new Fraction(FIVE, ONE)
export const TEN_FRACTION = new Fraction(TEN, ONE)
export const ONE_TENTH_FRACTION = new Fraction(ONE, TEN)
export const TWO_TENTH_FRACTION = new Fraction(TWO, TEN)
export const TEN_PERCENT_MORE = new Fraction(ELEVEN, TEN)
export const ONE_OVER_HUNDREAD = new Fraction(ONE, HUNDREAD)
export const THREE_OVER_HUNDREAD = new Fraction(THREE, HUNDREAD)
export const WEI_DENOM_FRACTION = new Fraction(WEI_DENOM, ONE)
export const HUNDREAD_FRACTION = new Fraction(HUNDREAD, ONE)
export const THOUSAND_FRACTION = HUNDREAD_FRACTION.multiply(TEN_FRACTION)
export const TEN_THOUSAND_FRACTION = HUNDREAD_FRACTION.multiply(HUNDREAD_FRACTION)
export const HUNDREAD_TWO_FRACTION = new Fraction(HUNDREAD_TWO, HUNDREAD)
export const ONE_OVER_10K_FRACTION = ONE_OVER_HUNDREAD.multiply(ONE_OVER_HUNDREAD)

export const MAXJSBI = JSBI.BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

export function expandTo18Decimals(n: number, e: number = 18): BigNumber {
  return BigNumber.from(n).mul(BigNumber.from(10).pow(e))
}

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
  try {
    return getAddress(value)
  } catch {
    return false
  }
}
/*
const ETHERSCAN_PREFIXES: { [chainId in ChainId]: string } = {
  1: '',
  3: 'ropsten.',
  4: 'rinkeby.',
  5: 'goerli.',
  42: 'kovan.',
  56: 'BSC.',
  97: 'BSC_Test.'  
}
*/

/*
export function getExplorerLink(
  chainId: ChainId,
  data: string,
  type: 'transaction' | 'token' | 'address' | 'block'
): string {
  const chain = chains[chainId]
  return chain.builder(chain.chainName, data, type)
}
*/

/*
export function getExplorerLink(
  chainId: ChainId,
  data: string,
  type: 'transaction' | 'token' | 'address' | 'block'
): string {
  const prefix = `https://${ETHERSCAN_PREFIXES[chainId] || ETHERSCAN_PREFIXES[1]}etherscan.io`

  switch (type) {
    case 'transaction': {
      return `${prefix}/tx/${data}`
    }
    case 'token': {
      return `${prefix}/token/${data}`
    }
    case 'block': {
      return `${prefix}/block/${data}`
    }
    case 'address':
    default: {
      return `${prefix}/address/${data}`
    }
  }
}
*/

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, chars = 4): string {
  const parsed = isAddress(address)
  if (!parsed) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${parsed.substring(0, chars + 2)}...${parsed.substring(42 - chars)}`
}

// add 10%
export function calculateGasMargin(value: BigNumber): BigNumber {
  return value.mul(BigNumber.from(10000).add(BigNumber.from(1000))).div(BigNumber.from(10000))
}

// converts a basis points value to a sdk percent
export function basisPointsToPercent(num: number): Percent {
  return new Percent(JSBI.BigInt(num), JSBI.BigInt(10000))
}

export function calculateSlippageAmount(value: CurrencyAmount, slippage: number): [JSBI, JSBI] {
  if (slippage < 0 || slippage > 10000) {
    throw Error(`Unexpected slippage value: ${slippage}`)
  }
  return [
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 - slippage)), JSBI.BigInt(10000)),
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 + slippage)), JSBI.BigInt(10000))
  ]
}

// account is not optional
export function getSigner(library: Web3Provider, account: string): JsonRpcSigner {
  return library.getSigner(account).connectUnchecked()
}

// account is optional
export function getProviderOrSigner(library: Web3Provider, account?: string): Web3Provider | JsonRpcSigner {
  return account ? getSigner(library, account) : library
}

// account is optional
export function getContract(address: string, ABI: any, library: Web3Provider, account?: string): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  return new Contract(address, ABI, getProviderOrSigner(library, account) as any)
}

// account is optional
export function getRouterContract(chainId: ChainId, library: Web3Provider, account?: string): Contract {
  return getContract(ROUTER_ADDRESS[chainId], IFeSwapRouterABI, library, account)
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function isTokenOnList(defaultTokens: TokenAddressMap, currency?: Currency): boolean {
  if (currency === ETHER) return true
  return Boolean(currency instanceof Token && defaultTokens[currency.chainId]?.[currency.address])
}
