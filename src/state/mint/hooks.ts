import { Currency, CurrencyAmount, ETHER, JSBI, Pair, Percent, Price, TokenAmount, Fraction } from '@feswap/sdk'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PairState, usePair } from '../../data/Reserves'
import { useTotalSupply } from '../../data/TotalSupply'

import { useActiveWeb3React } from '../../hooks'
import { wrappedCurrency, wrappedCurrencyAmount } from '../../utils/wrappedCurrency'
import { AppDispatch, AppState } from '../index'
import { tryParseAmount } from '../swap/hooks'
import { useCurrencyBalances } from '../wallet/hooks'
import { Field, typeInput, setRateSplit } from './actions'
import { ZERO, HUNDREAD, TWO, HUNDREAD_FRACTION } from '../../utils'
import { ZERO_PERCENT } from '../../constants'

export function useMintState(): AppState['mint'] {
  return useSelector<AppState, AppState['mint']>(state => state.mint)
}

export function useDerivedMintInfo(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined
): {
  dependentField: Field
  currencies: { [field in Field]?: Currency }
  pair?: Pair | null
  pairState: PairState
  currencyBalances: { [field in Field]?: CurrencyAmount }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  price?: { [field in Field]?: Price }
  meanPrice?: Price
  noLiquidity?: boolean
  liquidityMinted?:  { [field in Field]?: TokenAmount }
  poolTokenPercentage?: { [field in Field]?: Percent }
  percentProposal: number 
  error?: string
} {
  const { account, chainId } = useActiveWeb3React()

  const { independentField, typedValue, otherTypedValue, rateSplit } = useMintState()

  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A

  // tokens
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA ?? undefined,
      [Field.CURRENCY_B]: currencyB ?? undefined
    }),
    [currencyA, currencyB]
  )

  // pair
  const [pairState, pair] = usePair(currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B])
  const [tokenA, tokenB] = [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]

  const [liquidity0, liquidity1] = [useTotalSupply(pair?.liquidityToken0), useTotalSupply(pair?.liquidityToken1)]
  
  const [totalSupplyAB, totalSupplyBA] =  tokenA && tokenB && tokenA.sortsBefore(tokenB) 
                                          ? [liquidity0, liquidity1]
                                          : [liquidity1, liquidity0]

  const noLiquidity: boolean =
          !(pairState === PairState.EXISTS && totalSupplyAB && totalSupplyBA &&
            !(JSBI.equal(totalSupplyAB.raw, ZERO)) && !(JSBI.equal(totalSupplyBA.raw, ZERO)))

  // balances
  const balances = useCurrencyBalances(account ?? undefined, [
    currencies[Field.CURRENCY_A],
    currencies[Field.CURRENCY_B]
  ])
  const currencyBalances: { [field in Field]?: CurrencyAmount } = {
    [Field.CURRENCY_A]: balances[0],
    [Field.CURRENCY_B]: balances[1]
  }

  // amounts
  const independentAmount: CurrencyAmount | undefined = tryParseAmount(typedValue, currencies[independentField])
  const wrappedIndependentAmount = wrappedCurrencyAmount(independentAmount, chainId)
  const meanPrice = useMemo(() => {
          if ( !tokenA || !pair) return undefined
          return pair.priceOfMean(tokenA)
        }, [ tokenA, pair])
  
  const dependentAmount: CurrencyAmount | undefined = useMemo(() => {
    if (noLiquidity) {
      if (otherTypedValue && currencies[dependentField]) {
        return tryParseAmount(otherTypedValue, currencies[dependentField])
      }
      return undefined
    } else if (independentAmount) {
      // we wrap the currencies just to get the price in terms of the other token
      if (tokenA && tokenB && wrappedIndependentAmount && pair) {
        const dependentCurrency = dependentField === Field.CURRENCY_B ? currencyB : currencyA
        const dependentTokenAmount =
          dependentField === Field.CURRENCY_B
            ? pair.priceOfMean(tokenA).quote(wrappedIndependentAmount)
            : pair.priceOfMean(tokenB).quote(wrappedIndependentAmount)
        return dependentCurrency === ETHER ? CurrencyAmount.ether(dependentTokenAmount.raw) : dependentTokenAmount
      }
      return undefined
    } else {
      return undefined
    }
  }, [noLiquidity, otherTypedValue, tokenA, tokenB, currencies, dependentField, independentAmount, wrappedIndependentAmount, currencyA, currencyB, pair])
  
  const parsedAmounts: { [field in Field]: CurrencyAmount | undefined } = {
    [Field.CURRENCY_A]: independentField === Field.CURRENCY_A ? independentAmount : dependentAmount,
    [Field.CURRENCY_B]: independentField === Field.CURRENCY_A ? dependentAmount : independentAmount
  }

  const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts
  const tokenAAmount = wrappedCurrencyAmount(currencyAAmount, chainId)
  const tokenBAmount = wrappedCurrencyAmount(currencyBAmount, chainId)

  const price = useMemo(() => {
    if (noLiquidity) {
      if (currencyAAmount && currencyBAmount) {
        return {
          [Field.CURRENCY_A]: new Price(currencyAAmount.currency, currencyBAmount.currency, currencyAAmount.raw, currencyBAmount.raw),
          [Field.CURRENCY_B]: new Price(currencyBAmount.currency, currencyAAmount.currency, currencyBAmount.raw, currencyAAmount.raw)
        }
      }
      return undefined
    } else {
      return {
        [Field.CURRENCY_A]: pair && tokenA ? pair.priceOf(tokenA) : undefined,
        [Field.CURRENCY_B]: pair && tokenB ? pair.priceOf(tokenB) : undefined
      }
    }
  }, [noLiquidity, pair, tokenA, tokenB, currencyAAmount, currencyBAmount])

  // liquidity minted
  const liquidityMinted = useMemo(() => {
    const rateSplitPercent = new Fraction(JSBI.BigInt(rateSplit), HUNDREAD)
    const [tokenAmountAA, tokenAmountAB, tokenAmountBA, tokenAmountBB] = [
      tokenAAmount?.partial(rateSplitPercent),
      tokenBAmount?.partial(rateSplitPercent),
      tokenAAmount?.subtract(tokenAAmount?.partial(rateSplitPercent)),
      tokenBAmount?.subtract(tokenBAmount?.partial(rateSplitPercent))
    ]

    if (pair && totalSupplyAB && totalSupplyBA && tokenAmountAA && tokenAmountAB && tokenAmountBA && tokenAmountBB) {
      return { [Field.CURRENCY_A]: pair.getLiquidityMinted(totalSupplyAB, tokenAmountAA, tokenAmountAB),
               [Field.CURRENCY_B]: pair.getLiquidityMinted(totalSupplyBA, tokenAmountBB, tokenAmountBA) }
    } else {
      return undefined
    }
  }, [tokenAAmount, tokenBAmount, pair, totalSupplyAB, totalSupplyBA, rateSplit])

  const poolTokenPercentage = useMemo(() => {
    if (liquidityMinted && totalSupplyAB && totalSupplyBA) {
      return {  [Field.CURRENCY_A]: new Percent(liquidityMinted[Field.CURRENCY_A].raw, 
                                                totalSupplyAB.add(liquidityMinted[Field.CURRENCY_A]).raw),
                [Field.CURRENCY_B]: new Percent(liquidityMinted[Field.CURRENCY_B].raw, 
                                                totalSupplyBA.add(liquidityMinted[Field.CURRENCY_B]).raw),
              }
    } else {
      return undefined
    }
  }, [liquidityMinted, totalSupplyAB, totalSupplyBA ])

  const percentProposal = useMemo(() => {
    if(!totalSupplyAB || !totalSupplyBA || !tokenAAmount || !tokenBAmount || !pair) return 50
    const bigPoolAB = totalSupplyAB.greaterThan(totalSupplyBA) 
    const diffSupply =  bigPoolAB 
                        ? JSBI.subtract(totalSupplyAB.raw, totalSupplyBA.raw)
                        : JSBI.subtract(totalSupplyBA.raw, totalSupplyAB.raw)

    const vitualLiquidity = bigPoolAB
                            ? pair.getLiquidityMinted(totalSupplyBA, tokenBAmount, tokenAAmount)
                            : pair.getLiquidityMinted(totalSupplyAB, tokenAAmount, tokenBAmount)              

    const percentage =  JSBI.greaterThan(diffSupply,vitualLiquidity.raw)
                        ? ZERO_PERCENT 
                        : new Percent( JSBI.subtract(vitualLiquidity.raw, diffSupply), JSBI.multiply(vitualLiquidity.raw, TWO))

    const percentNumber =  parseInt(percentage.multiply(HUNDREAD_FRACTION).toFixed(0))
   
    return  (percentNumber < 10)
            ? (bigPoolAB ? 0 : 100)
            : (bigPoolAB ? percentNumber : (100-percentNumber))

  }, [tokenAAmount, tokenBAmount, pair, totalSupplyAB, totalSupplyBA ])


  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  if (pairState === PairState.INVALID) {
    error = error ?? 'Select Token Pair'
  }

  if (pairState === PairState.NOT_EXISTS) {
    error = error ?? 'Pair Not Created'
  }

  if (!parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
    error = error ?? 'Enter an amount'
  }

  if (currencyAAmount && currencyBalances?.[Field.CURRENCY_A]?.lessThan(currencyAAmount)) {
    error = 'Insufficient ' + currencies[Field.CURRENCY_A]?.symbol + ' balance'
  }

  if (currencyBAmount && currencyBalances?.[Field.CURRENCY_B]?.lessThan(currencyBAmount)) {
    error = 'Insufficient ' + currencies[Field.CURRENCY_B]?.symbol + ' balance'
  }

  return {
    dependentField,
    currencies,
    pair,
    pairState,
    currencyBalances,
    parsedAmounts,
    price,
    meanPrice,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    percentProposal,
    error
  }
}

export function useMintActionHandlers(
  noLiquidity: boolean | undefined
): {
  onFieldAInput: (typedValue: string) => void
  onFieldBInput: (typedValue: string) => void
  onSetSplitRate: (rateSplit: number) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onFieldAInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.CURRENCY_A, typedValue, noLiquidity: noLiquidity === true }))
    },
    [dispatch, noLiquidity]
  )
  const onFieldBInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.CURRENCY_B, typedValue, noLiquidity: noLiquidity === true }))
    },
    [dispatch, noLiquidity]
  )
  const onSetSplitRate = useCallback(
    (rateSplit: number) => {
      dispatch(setRateSplit({rateSplit}))
    },
    [dispatch]
  )

  return {
    onFieldAInput,
    onFieldBInput,
    onSetSplitRate
  }
}
