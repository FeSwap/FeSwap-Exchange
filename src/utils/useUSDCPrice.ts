import { ChainId, Currency, currencyEquals, JSBI, Price, WETH } from '@feswap/sdk'
import { useMemo } from 'react'
import { USDC, USDT } from '../constants'
import { PairState, usePairs } from '../data/Reserves'
import { useActiveWeb3React } from '../hooks'
import { wrappedCurrency } from './wrappedCurrency'

/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export default function useUSDCPrice(currency?: Currency): Price | undefined {
  const { chainId } = useActiveWeb3React()
  const wrapped = wrappedCurrency(currency, chainId)
  const Usdc = USDC[chainId??ChainId.MAINNET]
  const tokenPairs: [Currency | undefined, Currency | undefined][] = useMemo(
    () => [
      [
        chainId && wrapped && currencyEquals(WETH[chainId], wrapped) ? undefined : currency,
        chainId ? WETH[chainId] : undefined
      ],
      [wrapped?.equals(Usdc) ? undefined : wrapped, chainId ? Usdc : undefined],
      [chainId ? WETH[chainId] : undefined, chainId ? Usdc : undefined]
    ],
    [chainId, currency, wrapped, Usdc]
  )
  const [[ethPairState, ethPair], [usdcPairState, usdcPair], [usdcEthPairState, usdcEthPair]] = usePairs(tokenPairs)

  return useMemo(() => {
    if (!currency || !wrapped || !chainId) {
      return undefined
    }
    // handle weth/eth
    if (wrapped.equals(WETH[chainId])) {
      if (usdcPair) {
        const price = usdcPair.priceOf(WETH[chainId])
        return new Price(currency, Usdc, price.denominator, price.numerator)
      } else {
        return undefined
      }
    }
    // handle usdc
    if (wrapped.equals(Usdc)) {
      return new Price(Usdc, Usdc, '1', '1')
    }

    const ethPairETHAmount = ethPair?.reserveOfOutput(WETH[chainId])
    const ethPairETHUSDCValue: JSBI =
      ethPairETHAmount && usdcEthPair ? usdcEthPair.priceOf(WETH[chainId]).quote(ethPairETHAmount).raw : JSBI.BigInt(0)

    // all other tokens
    // first try the usdc pair
    if (usdcPairState === PairState.EXISTS && usdcPair && usdcPair.reserveOfOutput(Usdc).greaterThan(ethPairETHUSDCValue)) {
      const price = usdcPair.priceOf(wrapped)
      return new Price(currency, Usdc, price.denominator, price.numerator)
    }
    if (ethPairState === PairState.EXISTS && ethPair && usdcEthPairState === PairState.EXISTS && usdcEthPair) {
      if (usdcEthPair.reserveOfOutput(Usdc).greaterThan('0') && ethPair.reserveOfOutput(WETH[chainId]).greaterThan('0')) {
        const ethUsdcPrice = usdcEthPair.priceOf(Usdc)
        const currencyEthPrice = ethPair.priceOf(WETH[chainId])
        const usdcPrice = ethUsdcPrice.multiply(currencyEthPrice).invert()
        return new Price(currency, Usdc, usdcPrice.denominator, usdcPrice.numerator)
      }
    }
    return undefined
  }, [chainId, currency, ethPair, ethPairState, usdcEthPair, usdcEthPairState, usdcPair, usdcPairState, wrapped, Usdc])
}

export function useUSDTPrice(currency?: Currency): Price | undefined {
  const { chainId } = useActiveWeb3React()
  const wrapped = wrappedCurrency(currency, chainId)
  const Usdt = chainId ? USDT[chainId] : USDT[ChainId.MAINNET]
  const tokenPairs: [Currency | undefined, Currency | undefined][] = useMemo(
    () => [
      [
        chainId && wrapped && currencyEquals(WETH[chainId], wrapped) ? undefined : currency,
        chainId ? WETH[chainId] : undefined
      ],
      [wrapped?.equals(Usdt) ? undefined : wrapped, chainId ? Usdt : undefined],
      [chainId ? WETH[chainId] : undefined, chainId ? Usdt : undefined]
    ],
    [chainId, currency, wrapped, Usdt]
  )
  const [[ethPairState, ethPair], [usdtPairState, usdtPair], [usdtEthPairState, usdtEthPair]] = usePairs(tokenPairs)

   return useMemo(() => {
    if (!currency || !wrapped || !chainId) {
      return undefined
    }
    // handle weth/eth
    if (wrapped.equals(WETH[chainId])) {
      if (usdtPair) {
        const price = usdtPair.priceOf(WETH[chainId])
        return new Price(currency, Usdt, price.denominator, price.numerator)
      } else {
        return undefined
      }
    }
    // handle usdt
    if (wrapped.equals(Usdt)) {
      return new Price(Usdt, Usdt, '1', '1')
    }

    const ethPairETHAmount = ethPair?.reserveOfOutput(WETH[chainId])
    const ethPairETHUSDTValue: JSBI =
      ethPairETHAmount && usdtEthPair ? usdtEthPair.priceOf(WETH[chainId]).quote(ethPairETHAmount).raw : JSBI.BigInt(0)

    // all other tokens
    // first try the usdt pair
    if (usdtPairState === PairState.EXISTS && usdtPair && usdtPair.reserveOfOutput(Usdt).greaterThan(ethPairETHUSDTValue)) {
      const price = usdtPair.priceOf(wrapped)
      return new Price(currency, Usdt, price.denominator, price.numerator)
    }
    if (ethPairState === PairState.EXISTS && ethPair && usdtEthPairState === PairState.EXISTS && usdtEthPair) {
      if (usdtEthPair.reserveOfOutput(Usdt).greaterThan('0') && ethPair.reserveOfOutput(WETH[chainId]).greaterThan('0')) {
        const ethUsdtPrice = usdtEthPair.priceOf(Usdt)
        const currencyEthPrice = ethPair.priceOf(WETH[chainId])
        const usdtPrice = ethUsdtPrice.multiply(currencyEthPrice).invert()
        return new Price(currency, Usdt, usdtPrice.denominator, usdtPrice.numerator)
      }
    }
    return undefined
  }, [chainId, currency, ethPair, ethPairState, usdtEthPair, usdtEthPairState, usdtPair, usdtPairState, wrapped, Usdt])
}

