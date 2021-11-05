import { ChainId, Token } from '@feswap/sdk'
import { Tags, TokenInfo, TokenList } from '@uniswap/token-lists'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { AppState } from '../index'
import FESWAP_DEFAULT_LIST from '../../constants/abis/feswap_default_token_list.json'

type TagDetails = Tags[keyof Tags]
export interface TagInfo extends TagDetails {
  id: string
}

/**
 * Token instances created from token info.
 */
export class WrappedTokenInfo extends Token {
  public readonly tokenInfo: TokenInfo
  public readonly tags: TagInfo[]
  constructor(tokenInfo: TokenInfo, tags: TagInfo[]) {
    super(tokenInfo.chainId, tokenInfo.address, tokenInfo.decimals, tokenInfo.symbol, tokenInfo.name)
    this.tokenInfo = tokenInfo
    this.tags = tags
  }
  public get logoURI(): string | undefined {
    return this.tokenInfo.logoURI
  }
  public getSymbol(chainId?: ChainId) {
//    if (this?.symbol === `W${Currency.getNativeCurrencySymbol(chainId)}`) {
//       return Currency.getNativeCurrencySymbol(chainId)
//    }
    return this?.symbol
  }
}

export type TokenAddressMap = Readonly<{ [chainId in ChainId]: Readonly<{ [tokenAddress: string]: WrappedTokenInfo }> }>

/**
 * An empty result, useful as a default.
 */
const EMPTY_LIST: TokenAddressMap = {
  [ChainId.KOVAN]: {},
  [ChainId.RINKEBY]: {},
  [ChainId.ROPSTEN]: {},
  [ChainId.GÖRLI]: {},
  [ChainId.MAINNET]: {},
  [ChainId.BSC]: {},
  [ChainId.BSC_TESTNET]: {},
  [ChainId.MATIC]: {},
  [ChainId.MATIC_TESTNET]: {},
  [ChainId.HARMONY]: {},
  [ChainId.HARMONY_TESTNET]: {},
  [ChainId.FANTOM]: {},
  [ChainId.FANTOM_TESTNET]: {},
  [ChainId.HECO]: {},
  [ChainId.HECO_TESTNET]: {},
  [ChainId.ARBITRUM]: {},
  [ChainId.ARBITRUM_TESTNET]: {},
  [ChainId.AVALANCHE]: {},
  [ChainId.AVALANCHE_TESTNET]: {},
  [ChainId.OKEX]: {},
  [ChainId.OKEX_TESTNET]: {},
  [ChainId.PALM]: {},
  [ChainId.PALM_TESTNET]: {},
  [ChainId.MOONBEAM]: {},
  [ChainId.MOONRIVER]: {},
  [ChainId.XDAI]: {},
  [ChainId.CELO]: {}
}

const listCache: WeakMap<TokenList, TokenAddressMap> | null =
  typeof WeakMap !== 'undefined' ? new WeakMap<TokenList, TokenAddressMap>() : null

export function listToTokenMap(list: TokenList): TokenAddressMap {
  const result = listCache?.get(list)
  if (result) return result

  const map = list.tokens.reduce<TokenAddressMap>(
    (tokenMap, tokenInfo) => {
      const tags: TagInfo[] =
        tokenInfo.tags
          ?.map(tagId => {
            if (!list.tags?.[tagId]) return undefined
            return { ...list.tags[tagId], id: tagId }
          })
          ?.filter((x): x is TagInfo => Boolean(x)) ?? []
      const token = new WrappedTokenInfo(tokenInfo, tags)
      if (tokenMap[token.chainId][token.address] !== undefined) {
        console.log('token.chainId, token.address',token.chainId, token.address)
        throw Error('Duplicate tokens.')
      }  
      return {
        ...tokenMap,
        [token.chainId]: {
          ...tokenMap[token.chainId],
          [token.address]: token
        }
      }
    },
    { ...EMPTY_LIST }
  )
  listCache?.set(list, map)
  return map
}

export function useTokenList(url: string | undefined): TokenAddressMap {
  const lists = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)
  return useMemo(() => {
    if (!url) return EMPTY_LIST
    const current = lists[url]?.current
    if (!current) return EMPTY_LIST
    try {
      return listToTokenMap(current)
    } catch (error) {
      console.error('Could not show token list due to error', error)
      return EMPTY_LIST
    }
  }, [lists, url])
}

function combineMaps(map1: TokenAddressMap, map2: TokenAddressMap): TokenAddressMap {
  return {
    1: { ...map1[1], ...map2[1] }, // mainnet
    3: { ...map1[3], ...map2[3] }, // ropsten
    4: { ...map1[4], ...map2[4] }, // rinkeby
    5: { ...map1[5], ...map2[5] }, // goerli
    42: { ...map1[42], ...map2[42] }, // kovan
    56: { ...map1[56], ...map2[56] }, // bsc
    97: { ...map1[97], ...map2[97] }, // bsc testnet
    137: { ...map1[137], ...map2[137] }, // matic
    80001: { ...map1[80001], ...map2[80001] }, // matic testnet
    1666600000: { ...map1[1666600000], ...map2[1666600000] }, // harmony
    1666700000: { ...map1[1666700000], ...map2[1666700000] }, // harmony testnet
    250: { ...map1[250], ...map2[250] }, // fantom
    4002: { ...map1[4002], ...map2[4002] }, // fantom testnet
    128: { ...map1[128], ...map2[128] }, // heco
    256: { ...map1[256], ...map2[256] }, // heco testnet
    42161: { ...map1[42161], ...map2[42161] }, // arbitrum
    421611: { ...map1[421611], ...map2[421611] }, // arbitrum testnet
    43114: { ...map1[43114], ...map2[43114] }, // avax mainnet
    43113: { ...map1[43113], ...map2[43113] }, // avax testnet fuji
    66: { ...map1[66], ...map2[66] }, // okex
    65: { ...map1[65], ...map2[65] }, // okex testnet
    11297108109: { ...map1[11297108109], ...map2[11297108109] }, // palm
    11297108099: { ...map1[11297108099], ...map2[11297108099] }, // palm testnet
    1287: { ...map1[1287], ...map2[1287] },       // moonbase
    1285: { ...map1[1285], ...map2[1285] },       // moonriver
    100: { ...map1[100], ...map2[100] },          // xdai
    42220: { ...map1[42220], ...map2[42220] }     // celo
  }
}

export function useSelectedListUrl(): string | undefined {
  return useSelector<AppState, AppState['lists']['selectedListUrl']>(state => state.lists.selectedListUrl)
}

export function useSelectedTokenList(): TokenAddressMap {
  const selectedTokens =  useTokenList(useSelectedListUrl())
  return combineMaps(selectedTokens, listToTokenMap(FESWAP_DEFAULT_LIST))
}

export function useSelectedListInfo(): { current: TokenList | null; pending: TokenList | null; loading: boolean } {
  const selectedUrl = useSelectedListUrl()
  const listsByUrl = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)
  const list = selectedUrl ? listsByUrl[selectedUrl] : undefined
  return {
    current: list?.current ?? null,
    pending: list?.pendingUpdate ?? null,
    loading: list?.loadingRequestId !== null
  }
}

// returns all downloaded current lists
export function useAllLists(): TokenList[] {
  const lists = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)

  return useMemo(
    () =>
      Object.keys(lists)
        .map(url => lists[url].current)
        .filter((l): l is TokenList => Boolean(l)),
    [lists]
  )
}
