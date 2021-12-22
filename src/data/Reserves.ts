import { TokenAmount, Pair, Currency } from '@feswap/sdk'
import { useMemo } from 'react'
import { abi as IFeSwapPair } from '@feswap/core/build/IFeSwapPairMerge.json'
import { Interface } from '@ethersproject/abi'
import { useActiveWeb3React } from '../hooks'
import { feswType } from '../hooks/useContract'

import { useMultipleContractSingleData } from '../state/multicall/hooks'
import { wrappedCurrency } from '../utils/wrappedCurrency'
import { BigNumber } from 'ethers'

const PAIR_INTERFACE = new Interface(IFeSwapPair)

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export function usePairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][] {
  const { chainId } = useActiveWeb3React()

  const tokens = useMemo(
    () =>
      currencies.map(([currencyA, currencyB]) => [
        wrappedCurrency(currencyA, chainId),
        wrappedCurrency(currencyB, chainId)
      ]),
    [chainId, currencies]
  )

  const pairAddressesAB = useMemo(
    () => 
      tokens.map(([tokenA, tokenB]) => {
        return tokenA && tokenB && !tokenA.equals(tokenB) ? Pair.getAddress(tokenA, tokenB) : undefined
      }),
    [tokens]
  )

  const pairAddressesBA = useMemo(
    () => 
      tokens.map(([tokenA, tokenB]) => {
        return tokenA && tokenB && !tokenA.equals(tokenB) ? Pair.getAddress(tokenB, tokenA) : undefined
      }),
    [tokens]
  )

  const getReservesABI = (feswType(chainId) === "FESW") ? 'getReserves' : 'getReservesWithRate' 
  const resultsAAB = useMultipleContractSingleData(pairAddressesAB, PAIR_INTERFACE, getReservesABI)
  const resultsABB = useMultipleContractSingleData(pairAddressesBA, PAIR_INTERFACE, getReservesABI)  

  return useMemo(() => {
    return resultsAAB.map((result, i) => {
      const { result: reserves, loading} = result
      const { result: reservesTwin, loading: loadingTwin} = resultsABB[i]

      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]

      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
      if (loading || loadingTwin) return [PairState.LOADING, null]
      if (!reserves || !reservesTwin) return [PairState.NOT_EXISTS, null]

      const { _reserveIn, _reserveOut } = reserves
      const { _reserveIn: _reserveInTwin, _reserveOut: _reserveOuTwin } = reservesTwin 

      const {_rateArbitrage: _triggeRateV2,  _rateTriggerArbitrage: _triggeRateV1} = reserves
      const _triggeRate: BigNumber = _triggeRateV2 ?? _triggeRateV1

      return [
        PairState.EXISTS,
        new Pair( new TokenAmount(tokenA, _reserveIn.toString()), new TokenAmount(tokenB, _reserveOut.toString()),
                  new TokenAmount(tokenB, _reserveInTwin.toString()), new TokenAmount(tokenA, _reserveOuTwin.toString()), 
                  _triggeRate.toNumber())
      ]
    })
  }, [resultsAAB, resultsABB, tokens])
}

export function usePair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
  return usePairs([[tokenA, tokenB]])[0]
}
