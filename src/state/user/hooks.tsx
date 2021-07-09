import { ChainId, Pair, Token } from '@feswap/sdk'
import flatMap from 'lodash.flatmap'
import ReactGA from 'react-ga'
import { useCallback, useMemo } from 'react'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { BASES_TO_TRACK_LIQUIDITY_FOR, PINNED_PAIRS } from '../../constants'

import { useActiveWeb3React } from '../../hooks'
import { useAllTokens } from '../../hooks/Tokens'
import { AppDispatch, AppState } from '../index'
import { WETH_ONLY, SUGGESTED_BASES } from '../../constants'
import {
  addSerializedPair,
  addSerializedToken,
  removeSerializedToken,
  SerializedPair,
  SerializedNFTPair,
  SerializedToken,
  updateUserDarkMode,
  updateUserDeadline,
  updateUserExpertMode,
  updateUserSlippageTolerance,
  toggleURLWarning,
  updateUserSingleHopOnly,
  addSerializedNFTPair,
  removeSerializedNFTPair
} from './actions'

import { pairKey } from './reducer'

export function serializeToken(token: Token): SerializedToken {
  return {
    chainId: token.chainId,
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name
  }
}

function deserializeToken(serializedToken: SerializedToken): Token {
  return new Token(
    serializedToken.chainId,
    serializedToken.address,
    serializedToken.decimals,
    serializedToken.symbol,
    serializedToken.name
  )
}

export function useIsDarkMode(): boolean {
  const { userDarkMode, matchesDarkMode } = useSelector<
    AppState,
    { userDarkMode: boolean | null; matchesDarkMode: boolean }
  >(
    ({ user: { matchesDarkMode, userDarkMode } }) => ({
      userDarkMode,
      matchesDarkMode
    }),
    shallowEqual
  )

  return userDarkMode === null ? matchesDarkMode : userDarkMode
}

export function useDarkModeManager(): [boolean, () => void] {
  const dispatch = useDispatch<AppDispatch>()
  const darkMode = useIsDarkMode()

  const toggleSetDarkMode = useCallback(() => {
    dispatch(updateUserDarkMode({ userDarkMode: !darkMode }))
  }, [darkMode, dispatch])

  return [darkMode, toggleSetDarkMode]
}

export function useIsExpertMode(): boolean {
  return useSelector<AppState, AppState['user']['userExpertMode']>(state => state.user.userExpertMode)
}

export function useExpertModeManager(): [boolean, () => void] {
  const dispatch = useDispatch<AppDispatch>()
  const expertMode = useIsExpertMode()

  const toggleSetExpertMode = useCallback(() => {
    dispatch(updateUserExpertMode({ userExpertMode: !expertMode }))
  }, [expertMode, dispatch])

  return [expertMode, toggleSetExpertMode]
}

export function useUserSingleHopOnly(): [boolean, (newSingleHopOnly: boolean) => void] {
  const dispatch = useDispatch<AppDispatch>()

  const singleHopOnly = useSelector<AppState, AppState['user']['userSingleHopOnly']>(
    state => state.user.userSingleHopOnly
  )

  const setSingleHopOnly = useCallback(
    (newSingleHopOnly: boolean) => {
      ReactGA.event({
        category: 'Routing',
        action: newSingleHopOnly ? 'enable single hop' : 'disable single hop'
      })
      dispatch(updateUserSingleHopOnly({ userSingleHopOnly: newSingleHopOnly }))
    },
    [dispatch]
  )

  return [singleHopOnly, setSingleHopOnly]
}

export function useUserSlippageTolerance(): [number, (slippage: number) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const userSlippageTolerance = useSelector<AppState, AppState['user']['userSlippageTolerance']>(state => {
    return state.user.userSlippageTolerance
  })

  const setUserSlippageTolerance = useCallback(
    (userSlippageTolerance: number) => {
      dispatch(updateUserSlippageTolerance({ userSlippageTolerance }))
    },
    [dispatch]
  )

  return [userSlippageTolerance, setUserSlippageTolerance]
}

export function useUserTransactionTTL(): [number, (slippage: number) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const userDeadline = useSelector<AppState, AppState['user']['userDeadline']>(state => {
    return state.user.userDeadline
  })

  const setUserDeadline = useCallback(
    (userDeadline: number) => {
      dispatch(updateUserDeadline({ userDeadline }))
    },
    [dispatch]
  )

  return [userDeadline, setUserDeadline]
}

export function useAddUserToken(): (token: Token) => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(
    (token: Token) => {
      dispatch(addSerializedToken({ serializedToken: serializeToken(token) }))
    },
    [dispatch]
  )
}

export function useRemoveUserAddedToken(): (chainId: number, address: string) => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(
    (chainId: number, address: string) => {
      dispatch(removeSerializedToken({ chainId, address }))
    },
    [dispatch]
  )
}

export function useUserAddedTokens(): Token[] {
  const { chainId } = useActiveWeb3React()
  const serializedTokensMap = useSelector<AppState, AppState['user']['tokens']>(({ user: { tokens } }) => tokens)

  return useMemo(() => {
    if (!chainId) return []
    return Object.values(serializedTokensMap[chainId as ChainId] ?? {}).map(deserializeToken)
  }, [serializedTokensMap, chainId])
}

function serializePair(pair: Pair): SerializedPair {
  return {
    token0: serializeToken(pair.token0),
    token1: serializeToken(pair.token1)
  }
}

function serializNFTPar(tokenA: Token, tokenB: Token, bidStatus: boolean): SerializedNFTPair {
  return {
    token0: serializeToken(tokenA),
    token1: serializeToken(tokenB),
    bidStatus: bidStatus
  }
}

export function usePairAdder(): (pair: Pair) => void {
  const dispatch = useDispatch<AppDispatch>()

  return useCallback(
    (pair: Pair) => {
      dispatch(addSerializedPair({ serializedPair: serializePair(pair) }))
    },
    [dispatch]
  )
}

export function useNFTPairAdder(): (tokenA: Token , tokenB: Token, bidStatus: boolean) => void {
  const dispatch = useDispatch<AppDispatch>()

  return useCallback(
    (tokenA: Token , tokenB: Token, bidStatus: boolean) => {
       dispatch(addSerializedNFTPair({ serializedNFTPair: serializNFTPar(tokenA, tokenB, bidStatus) }))
    },
    [dispatch]
  )
}

export function useNFTPairRemover(): ( tokenA: Token , tokenB: Token, chainId: number) => void {
  const dispatch = useDispatch<AppDispatch>()

  return useCallback(
    (tokenA: Token, tokenB: Token, chainId: number) => {
       dispatch(removeSerializedNFTPair({
         chainId, 
         tokenAAddress: tokenA.address, 
         tokenBAddress: tokenB.address}))
    },
    [dispatch]
  )
}

export function useNFTPairAdded(tokenA?: Token, tokenB?: Token): boolean | undefined {
  const { chainId } = useActiveWeb3React()

  // NFT pairs saved by users
  const serializedNFTPair = useSelector<AppState, AppState['user']['nftPairs']>(({ user: { nftPairs } }) => nftPairs)
 
  return useMemo(() => {
    if ( !tokenA || !tokenB || !chainId) return undefined
    if (!serializedNFTPair) return false
    const forChain = serializedNFTPair[chainId]
    if (!forChain) return false

    let keyNFTPair 
    if(tokenA.address.toLowerCase() < tokenB.address.toLowerCase()){
      keyNFTPair = pairKey(tokenA.address, tokenB.address) 
    } else {
      keyNFTPair = pairKey(tokenB.address, tokenA.address) 
    }
    return serializedNFTPair[chainId][keyNFTPair] ? true :false
  }, [serializedNFTPair, chainId, tokenA, tokenB])
}  

export function useURLWarningVisible(): boolean {
  return useSelector((state: AppState) => state.user.URLWarningVisible)
}

export function useURLWarningToggle(): () => void {
  const dispatch = useDispatch()
  return useCallback(() => dispatch(toggleURLWarning()), [dispatch])
}

/**
 * Given two tokens return the liquidity token that represents its liquidity shares
 * @param tokenA one of the two tokens
 * @param tokenB the other token
 */
export function toFeswLiquidityToken([tokenA, tokenB]: [Token, Token]): [Token, Token] {
  return  [ new Token(tokenA.chainId, Pair.getAddress(tokenA, tokenB), 18, 'FESW', 'FeSwap DAO'),
            new Token(tokenB.chainId, Pair.getAddress(tokenB, tokenA), 18, 'FESW', 'FeSwap DAO') ]
}

/**
 * Returns all the token pairs of NFTs that are tracked by the user for the current chain ID.
 */
 export function useTrackedNFTTokenPairs(): [Token, Token, boolean][] {
  const { chainId } = useActiveWeb3React()

  // NFT pairs saved by users
  const savedSerializedNFTPairs = useSelector<AppState, AppState['user']['nftPairs']>(({ user: { nftPairs } }) => nftPairs)
  
  return useMemo(() => {
    if (!chainId || !savedSerializedNFTPairs) return []
    const forChain = savedSerializedNFTPairs[chainId]
    if (!forChain) return []

    return Object.keys(forChain).map(nftPairId => {
      // select the pair with BASE as the second token
      if( SUGGESTED_BASES[chainId].some((baseToken) => (baseToken.address === forChain[nftPairId].token1.address)) &&
          (forChain[nftPairId].token0.address !== WETH_ONLY[chainId][0].address)) {
        return  [ deserializeToken(forChain[nftPairId].token0), 
                  deserializeToken(forChain[nftPairId].token1),
                  forChain[nftPairId].bidStatus]
      }    
      // swap token address while token0 is BASE token
      if( SUGGESTED_BASES[chainId].some((baseToken) => (baseToken.address === forChain[nftPairId].token0.address))) {
        return  [ deserializeToken(forChain[nftPairId].token1),
                  deserializeToken(forChain[nftPairId].token0),
                  forChain[nftPairId].bidStatus]
      }    
      return  [ deserializeToken(forChain[nftPairId].token0), 
                deserializeToken(forChain[nftPairId].token1),
                forChain[nftPairId].bidStatus]
    })
  }, [savedSerializedNFTPairs, chainId])
}

/**
 * Returns all the pairs of tokens that are tracked by the user for the current chain ID.
 */
export function useTrackedTokenPairs(): [Token, Token][] {
  const { chainId } = useActiveWeb3React()
  const tokens = useAllTokens()

  // pinned pairs
  const pinnedPairs = useMemo(() => (chainId ? PINNED_PAIRS[chainId] ?? [] : []), [chainId])

  // pairs for every token against every base
  const generatedPairs: [Token, Token][] = useMemo(
    () =>
      chainId
        ? flatMap(Object.keys(tokens), tokenAddress => {
            const token = tokens[tokenAddress]
            // for each token on the current chain,
            return (
              // loop though all bases on the current chain
              (BASES_TO_TRACK_LIQUIDITY_FOR[chainId] ?? [])
                // to construct pairs of the given token with each base
                .map(base => {
                  if (base.address === token.address) {
                    return null
                  } else {
                    return [base, token]
                  }
                })
                .filter((p): p is [Token, Token] => p !== null)
            )
          })
        : [],
    [tokens, chainId]
  )

  // pairs saved by users
  const savedSerializedPairs = useSelector<AppState, AppState['user']['pairs']>(({ user: { pairs } }) => pairs)

  const userPairs: [Token, Token][] = useMemo(() => {
    if (!chainId || !savedSerializedPairs) return []
    const forChain = savedSerializedPairs[chainId]
    if (!forChain) return []

    return Object.keys(forChain).map(pairId => {
      return [deserializeToken(forChain[pairId].token0), deserializeToken(forChain[pairId].token1)]
    })
  }, [savedSerializedPairs, chainId])

  const combinedList = useMemo(() => userPairs.concat(generatedPairs).concat(pinnedPairs), [
    generatedPairs,
    pinnedPairs,
    userPairs
  ])

  return useMemo(() => {
    // dedupes pairs of tokens in the combined list
    const keyed = combinedList.reduce<{ [key: string]: [Token, Token] }>((memo, [tokenA, tokenB]) => {
//      const sorted = tokenA.sortsBefore(tokenB)
    const sorted = true
    const key = sorted ? `${tokenA.address}:${tokenB.address}` : `${tokenB.address}:${tokenA.address}`
      if (memo[key]) return memo
      memo[key] = sorted ? [tokenA, tokenB] : [tokenB, tokenA]
      return memo
    }, {})

    return Object.keys(keyed).map(key => keyed[key])
  }, [combinedList])
}
