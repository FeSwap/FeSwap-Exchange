import { Currency, CurrencyAmount, JSBI, Pair, Percent, TokenAmount, Token } from '@feswap/sdk'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PairState, usePair } from '../../data/Reserves'
import { useTotalSupply } from '../../data/TotalSupply'

import { useActiveWeb3React } from '../../hooks'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import { ZERO } from '../../utils'
import { AppDispatch, AppState } from '../index'
//import { tryParseAmount } from '../swap/hooks'
import { useTokenBalances } from '../wallet/hooks'
import { Field, Amount, typeInput } from './actions'

export interface ParsedPairAmounts {
  readonly [Amount.PERCENTAGE]: Percent
  readonly [Amount.LIQUIDITY]?: TokenAmount
  readonly [Amount.CURRENCY_A]?: CurrencyAmount
  readonly [Amount.CURRENCY_B]?: CurrencyAmount
}

export function useBurnState(): AppState['burn'] {
  return useSelector<AppState, AppState['burn']>(state => state.burn)
}

export function useDerivedBurnInfo(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined
): {
  pair?: Pair | null
  tokenA: Token | undefined 
  tokenB: Token | undefined 
  noUserLiquidity: { [field in Field]?: boolean }
  noRemoveLiquidity: { [field in Field]: boolean }
  parsedAmounts: { [field in Field]?: ParsedPairAmounts }
  error?: string
} {
  const { account, chainId } = useActiveWeb3React()
  const { Percentage_AB, Percentage_BA } = useBurnState()

  // pair + totalsupply
  const [pairState, pair] = usePair(currencyA, currencyB)
  const [tokenA, tokenB] = useMemo( () => [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)],
                                    [ currencyA,  currencyB,  chainId ] )

  const liquidity0 = useTotalSupply(pair?.liquidityToken0)
  const liquidity1 = useTotalSupply(pair?.liquidityToken1)

  const [totalSupplyAB, totalSupplyBA] =  tokenA && tokenB && tokenA.sortsBefore(tokenB) 
                                          ? [liquidity0, liquidity1]
                                          : [liquidity1, liquidity0]

  // balances
  const relevantTokenBalances = useTokenBalances(account ?? undefined, [totalSupplyAB?.token, totalSupplyBA?.token])
  const userLiquidity: { [field in Field]: TokenAmount | undefined } = {
                      [Field.PAIR_AB]:  relevantTokenBalances?.[totalSupplyAB?.token.address??''],
                      [Field.PAIR_BA]:  relevantTokenBalances?.[totalSupplyBA?.token.address??'']
                    }

  const liquidityPairAB: {[Amount.CURRENCY_A]?: TokenAmount; [Amount.CURRENCY_B]?: TokenAmount} = useMemo(() => {
    const userLiquidityAmount = userLiquidity[Field.PAIR_AB]
    if( !pair || !totalSupplyAB || !userLiquidityAmount || !tokenA || !tokenB ) return { undefined }
    return JSBI.greaterThanOrEqual(totalSupplyAB.raw, userLiquidityAmount.raw)
            ? { 
                [Amount.CURRENCY_A]: new TokenAmount(tokenA, pair.getLiquidityValue(tokenA, totalSupplyAB, userLiquidityAmount, false).raw),
                [Amount.CURRENCY_B]: new TokenAmount(tokenB, pair.getLiquidityValue(tokenB, totalSupplyAB, userLiquidityAmount, false).raw)
              }
            : { undefined }
  }, [pair, totalSupplyAB, userLiquidity, tokenA, tokenB] )

  const liquidityPairBA: {[Amount.CURRENCY_A]?: TokenAmount; [Amount.CURRENCY_B]?: TokenAmount} = useMemo(() => {
    const userLiquidityAmount = userLiquidity[Field.PAIR_BA]
    if( !pair || !totalSupplyBA || !userLiquidityAmount || !tokenA || !tokenB ) return { undefined }

    return JSBI.greaterThanOrEqual(totalSupplyBA.raw, userLiquidityAmount.raw)
            ? { 
                [Amount.CURRENCY_A]: new TokenAmount(tokenA, pair.getLiquidityValue(tokenA, totalSupplyBA, userLiquidityAmount, false).raw),
                [Amount.CURRENCY_B]: new TokenAmount(tokenB, pair.getLiquidityValue(tokenB, totalSupplyBA, userLiquidityAmount, false).raw)
              }
            : { undefined }
  }, [pair, totalSupplyBA, userLiquidity, tokenA, tokenB] )

  const percentToRemove: { [field in Field]: Percent } = useMemo(() => {
    return  {
              [Field.PAIR_AB]:  new Percent(Percentage_AB.toString(), '100'),
              [Field.PAIR_BA]:  new Percent(Percentage_BA.toString(), '100'),
            }
    }, [Percentage_AB, Percentage_BA])
  
  const parsedAmounts:  { [field in Field]?: ParsedPairAmounts } = useMemo(() => {
      function derivedBurnInfo( removePercentage: Percent, 
                                userSubPooLiquidity?: TokenAmount, 
                                userTokenALiquidity?: TokenAmount,
                                userTokenBLiquidity?: TokenAmount
                              ): ParsedPairAmounts {
        const liquidity = removePercentage && userSubPooLiquidity && removePercentage.greaterThan('0')
                          ? new TokenAmount(userSubPooLiquidity.token, removePercentage.multiply(userSubPooLiquidity.raw).quotient)
                          : undefined
        const AmountToRemoveA = tokenA && removePercentage && removePercentage.greaterThan('0') && userTokenALiquidity
                                ? new TokenAmount(tokenA, removePercentage.multiply(userTokenALiquidity.raw).quotient)
                                : undefined
        const AmountToRemoveB = tokenB && removePercentage && removePercentage.greaterThan('0') && userTokenBLiquidity
                                ? new TokenAmount(tokenB, removePercentage.multiply(userTokenBLiquidity.raw).quotient)
                                : undefined
        return {
          [Amount.PERCENTAGE]: removePercentage,
          [Amount.LIQUIDITY]: liquidity,
          [Amount.CURRENCY_A]: AmountToRemoveA,
          [Amount.CURRENCY_B]: AmountToRemoveB
        } 
      }
      return {
        [Field.PAIR_AB]:  derivedBurnInfo(  percentToRemove[Field.PAIR_AB], userLiquidity[Field.PAIR_AB],
                                            liquidityPairAB[Amount.CURRENCY_A], liquidityPairAB[Amount.CURRENCY_B] ),
        [Field.PAIR_BA]:  derivedBurnInfo(  percentToRemove[Field.PAIR_BA], userLiquidity[Field.PAIR_BA],
                                            liquidityPairBA[Amount.CURRENCY_A], liquidityPairBA[Amount.CURRENCY_B] ),
      }
    }, [tokenA, tokenB, percentToRemove, userLiquidity, liquidityPairAB, liquidityPairBA] )

    const noRemoveLiquidity: { [field in Field]: boolean } =  useMemo(() => {
      const userRemoveLiquidityAB = parsedAmounts[Field.PAIR_AB]?.[Amount.LIQUIDITY]
      const userRemoveLiquidityBA = parsedAmounts[Field.PAIR_BA]?.[Amount.LIQUIDITY]
      return  {
                [Field.PAIR_AB]: !(pairState === PairState.EXISTS && userRemoveLiquidityAB && !(JSBI.equal(userRemoveLiquidityAB.raw, ZERO))),
                [Field.PAIR_BA]: !(pairState === PairState.EXISTS && userRemoveLiquidityBA && !(JSBI.equal(userRemoveLiquidityBA.raw, ZERO)))
              }
    }, [pairState, parsedAmounts] )

    const noUserLiquidity: { [field in Field]: boolean } =  useMemo(() => {
      const userLiquidityAB = userLiquidity[Field.PAIR_AB]
      const userLiquidityBA = userLiquidity[Field.PAIR_BA]
      return  {
                [Field.PAIR_AB]: !(pairState === PairState.EXISTS && userLiquidityAB && !(JSBI.equal(userLiquidityAB.raw, ZERO))),
                [Field.PAIR_BA]: !(pairState === PairState.EXISTS && userLiquidityBA && !(JSBI.equal(userLiquidityBA.raw, ZERO)))
              }
    }, [pairState, userLiquidity] )

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  if (  noUserLiquidity[Field.PAIR_AB] && noUserLiquidity[Field.PAIR_BA] ) {
    error = error ?? 'No Liquidity to Remove'
  }

  if (  !parsedAmounts[Field.PAIR_AB]?.[Amount.LIQUIDITY] && !parsedAmounts[Field.PAIR_BA]?.[Amount.LIQUIDITY] ) {
    error = error ?? 'Enter an amount'
  }

  return { pair, tokenA, tokenB, noUserLiquidity, noRemoveLiquidity, parsedAmounts, error }
}

export function useBurnActionHandlers(): {
  onUserInput: (field: Field, percentage: number) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onUserInput = useCallback(
    (field: Field, percentage: number) => {
      dispatch(typeInput({ field, percentage }))
    },
    [dispatch]
  )

  return {
    onUserInput
  }
}
