import { Currency, Token } from '@feswap/sdk'
import React, { CSSProperties, MutableRefObject, useCallback, useContext } from 'react'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { useActiveWeb3React } from '../../hooks'
import { useNFTPairRemover } from '../../state/user/hooks'
import { useToken, useCurrencyFromToken } from '../../hooks/Tokens'
import { bigNumberToFractionInETH } from '../../state/nft/hooks'
import { RowFixed, RowBetween } from '../Row'
import DoubleCurrencyLogo from '../DoubleLogo'
import { Separator } from '../SearchModal/styleds'
import Loader from '../Loader'
import { useNftBidContract, useFeswFactoryContract } from '../../hooks/useContract'
import { useSingleCallResult } from '../../state/multicall/hooks'
import { PairBidInfo } from '../../state/nft/reducer'
import { ZERO_ADDRESS } from '../../constants'
import { Lock, User, Coffee, Flag, MinusCircle, Activity, Clock, Volume2, Eye } from 'react-feather'
import { DateTime } from 'luxon'
import { NFT_BID_PHASE, Field } from '../../state/nft/actions'
import { wrappedCurrency, unwrappedToken } from '../../utils/wrappedCurrency'

enum NFT_BID_GOING {
  ONGING,
  VERYSOON,
  ENDED
}

const StyledNFTPrice = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  max-width: 16rem;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 600;
  padding-left: 3px;
`

const Container = styled.div`
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
  margin: 0 16px 0 16px;
`

const NftItem = styled(RowBetween)<{ ifBid: boolean }>`
  padding: 4px 10px 4px 20px;
  height: 56px;
  display: grid;
  grid-template-columns:  ${({ ifBid }) => (ifBid ? '150px 15px 12px minmax(0, 150px)' : '150px minmax(0, 150px)')};
   grid-gap: 20px;
  cursor: ${({ disabled }) => !disabled && 'pointer'};
  pointer-events: ${({ disabled }) => disabled && 'none'};
  :hover {
    background-color: ${({ theme, disabled }) => !disabled && theme.bg2};
  }
  opacity: ${({ disabled, selected }) => (disabled || selected ? 0.5 : 1)};
`

const NFTWatchListFooter = styled.div<{ show: boolean }>`
  padding-top: calc(16px + 2rem);
  padding-bottom: 16px;
  margin-top: -2rem;
  width: 100%;
  max-width: 420px;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  color: ${({ theme }) => theme.text2};
  background-color: ${({ theme }) => theme.advancedBG};
  z-index: -1;

  transform: ${({ show }) => (show ? 'translateY(0%)' : 'translateY(-100%)')};
  transition: transform 300ms ease-in-out;
`

export const StyledNFTButton = styled.button`
  height: 20px;
  width: 28px;
  background-color: ${({ theme }) => theme.bg2};
  border: 1px solid ${({ theme }) => theme.bg2};
  border: none;
  border-radius: 4px;
  margin-left: 4px;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  :hover {
    border: 1px solid ${({ theme }) => theme.primary1};
    color: ${({ theme }) => theme.primaryText1};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.primary1};
    color: ${({ theme }) => theme.primaryText1};
  }
`

function nftTokenKey([tokenA, tokenB]: [Token, Token]): string {
  return `${tokenA.address}:${tokenB.address}`
}

function nftTokenInfoKey([tokenA, tokenB]: [string, string]): string {
  return `${tokenA}:${tokenB}`
}

// check if the bidding time is ended 
function ifBidEnded( pairBidInfo: PairBidInfo ): NFT_BID_GOING {
  const timeNftCreation: number = pairBidInfo.timeCreated.toNumber()
  const timeNftLastBid: number = pairBidInfo.lastBidTime.toNumber()
  const now = DateTime.now().toSeconds()
  const timeNormalEnd = timeNftCreation + 3600 * 10                     // Normal: 3600 * 24 * 14

  if(pairBidInfo.poolState === NFT_BID_PHASE.BidToStart)  return NFT_BID_GOING.ONGING
  if(pairBidInfo.poolState === NFT_BID_PHASE.BidPhase){
      if(now >= timeNormalEnd) return NFT_BID_GOING.ENDED  
      if(now >= timeNftCreation + 3600 *8) return NFT_BID_GOING.VERYSOON  
      return NFT_BID_GOING.ONGING
  }      
  if(pairBidInfo.poolState === NFT_BID_PHASE.BidDelaying) return (now >= (timeNftLastBid + 3600 * 2)) 
                                                                  ? NFT_BID_GOING.ENDED 
                                                                  : NFT_BID_GOING.ONGING
  return NFT_BID_GOING.ENDED
}

function NftStatus({ pairBidInfo, account, ownerPairNft }: { pairBidInfo: PairBidInfo; account: string; ownerPairNft: string }) {
  const theme = useContext(ThemeContext)
  const nftPrice = bigNumberToFractionInETH(pairBidInfo.currentPrice)
  const ifPairBidEnded = ifBidEnded(pairBidInfo)

  return  (ownerPairNft === ZERO_ADDRESS) 
          ? (
              <>
                <StyledNFTPrice >
                  {`>= 0.2 ETH`}
                </StyledNFTPrice>
              </>
            )
          : (
            <>
              { (pairBidInfo.poolState === NFT_BID_PHASE.BidPhase) && (ifPairBidEnded === NFT_BID_GOING.ENDED) &&
                <Flag size={14} />
              }   
              { (pairBidInfo.poolState === NFT_BID_PHASE.BidPhase) && (ifPairBidEnded === NFT_BID_GOING.ONGING) &&
                <Activity size={14} />
              }  
              { (pairBidInfo.poolState === NFT_BID_PHASE.BidPhase) && (ifPairBidEnded === NFT_BID_GOING.VERYSOON) &&
                <Clock size={14} color={theme.primary1} />
              }  
              { (pairBidInfo.poolState === NFT_BID_PHASE.BidDelaying) && (ifPairBidEnded === NFT_BID_GOING.ENDED) &&
                <Flag size={14} />
              }   
              { (pairBidInfo.poolState === NFT_BID_PHASE.BidDelaying) && (ifPairBidEnded === NFT_BID_GOING.ONGING) &&
                <Clock size={14} color={theme.primary1} />
              } 
              { (pairBidInfo.poolState === NFT_BID_PHASE.BidSettled) &&
                <Lock size={14} />
              } 
              { (pairBidInfo.poolState === NFT_BID_PHASE.PoolHolding) &&
                <Lock size={14} />
              } 
              { (pairBidInfo.poolState === NFT_BID_PHASE.PoolForSale) &&
                <Volume2 size={14} />
              } 
              <StyledNFTPrice>
                {(pairBidInfo.poolState === NFT_BID_PHASE.PoolHolding) ? 'Holding' 
                  : `${nftPrice.toSignificant(6)} ETH` }
              </StyledNFTPrice>
             </>
           )
}

function NftTokenRow({
  nftTokenPair,
  onSelect,
  active,
  style
}: {
  nftTokenPair: [Token, Token]
  onSelect: (nftTokenPair: [Currency|undefined, Currency|undefined]) => void
  active: boolean
  style: CSSProperties
}) {
  const { account, chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const [tokenA, tokenB] = nftTokenPair
 
  const nftBidContract = useNftBidContract()
  const pairTokenAddress= [tokenA.address, tokenB.address]
  const currencyA = useCurrencyFromToken(tokenA)??undefined
  const currencyB = useCurrencyFromToken(tokenB)??undefined
  
  const feswaPairInfo =  useSingleCallResult(nftBidContract, 'getPoolInfoByTokens', pairTokenAddress)?.result??undefined
  const ownerPairNft = feswaPairInfo?.nftOwner?? ZERO_ADDRESS
  const pairBidInfo = feswaPairInfo?.pairInfo

  const handlerRemoveNFTPair = useNFTPairRemover()
  const handleRemoveNftFromTrackList = useCallback(() => {
      if(!chainId) return
      handlerRemoveNFTPair(tokenA, tokenB, chainId)
    }, [handlerRemoveNFTPair, tokenA, tokenB, chainId])

  return ( 
    <NftItem
      style={style}
      onClick={() =>  onSelect([currencyA, currencyB]) }
      height={"40px"}
      ifBid={true}
    >
      <RowFixed>
        <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} size={20} margin={false} />
        { (currencyA && currencyB) 
          ? (
            <Text fontWeight={600} fontSize={14} style={{margin:'0px 3px 0px 6px'}}>
              {currencyA?.symbol}/{currencyB?.symbol}
            </Text>)
          : null }
        { active && <Eye size={14} color={theme.primary1} /> }
      </RowFixed>
      <RowFixed> 
        <StyledNFTButton  onClick={ (event) => {
            event.stopPropagation()
            handleRemoveNftFromTrackList() }}>
          <RowFixed> 
            <MinusCircle size={14} />
          </RowFixed>        
       </StyledNFTButton>        
      </RowFixed>
      <RowFixed>
        { (feswaPairInfo) && (feswaPairInfo?.nftOwner === ZERO_ADDRESS) &&
          <Coffee size={14} />
        }   
        { (feswaPairInfo) && (feswaPairInfo?.nftOwner === account) &&
          <User size={14} />
        }   
      </RowFixed>
      <RowFixed style={{ justifySelf: 'flex-end' }}>
      { (feswaPairInfo)
        ? ( 
            <RowFixed style={{ justifySelf: 'flex-end' }}>
              <NftStatus pairBidInfo={pairBidInfo} account={account??ZERO_ADDRESS} ownerPairNft={ownerPairNft}/> 
            </RowFixed>
          )
        : (account ? <Loader /> : null)
      }
      </RowFixed>
    </NftItem>
  )
}

function NftTokenManageRow({
  nftTokenPair,
  onSelect,
  active,
  style
}: {
  nftTokenPair: PairBidInfo
  onSelect: (nftTokenPair: [Currency|undefined, Currency|undefined]) => void
  active: boolean
  style: CSSProperties
}) {
  const theme = useContext(ThemeContext)
  const feswFactoryContract = useFeswFactoryContract()

  const [tokenAAddress, tokenBAddress] = [nftTokenPair.tokenA, nftTokenPair.tokenB]
  const tokenA = useToken(tokenAAddress)??undefined
  const tokenB = useToken(tokenBAddress)??undefined

  const pairTokenAddress= [tokenAAddress, tokenBAddress]
  const currencyA = tokenA ? unwrappedToken(tokenA) : undefined
  const currencyB = tokenB ? unwrappedToken(tokenB) : undefined

  const feswaPairAddress =  useSingleCallResult(feswFactoryContract, 'getPair', pairTokenAddress)?.result??undefined

  return ( 
    <NftItem
      style={style}
      onClick={() =>  onSelect([currencyA, currencyB]) }
      height={"40px"}
      ifBid={false}
    >
      <RowFixed>
        <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} size={20} margin={false} />
        { (currencyA && currencyB) 
          ? (
            <Text fontWeight={600} fontSize={14} style={{margin:'0px 3px 0px 6px'}}>
              {currencyA?.symbol}/{currencyB?.symbol}
            </Text>)
          : null }
        { active && <Eye size={14} color={theme.primary1} /> }
      </RowFixed>
      <RowFixed style={{ justifySelf: 'flex-end' }}>
      { (feswaPairAddress)
        ? ( <RowFixed style={{ justifySelf: 'flex-end' }}>
              { (feswaPairAddress[0] === ZERO_ADDRESS) 
                ? (nftTokenPair.poolState < NFT_BID_PHASE.BidSettled) 
                  ? 'On Biding'
                  : 'Pool to be Created'
                : 'Pool Created' } 
            </RowFixed>
          )
        : null
      }
      </RowFixed>
    </NftItem>
  )
}

export default function NftList({
  nftList,
  pairCurrencies,
  onNftTokenSelect,
  fixedListRef,
}: {
  nftList: [Token, Token, boolean][] 
  pairCurrencies: { [field in Field]?: Currency }
  onNftTokenSelect: (nftTokenPair: [Currency|undefined, Currency|undefined]) => void
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
}) {
  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()
  
  const tokenUA = wrappedCurrency(pairCurrencies[Field.TOKEN_A], chainId)
  const tokenUB = wrappedCurrency(pairCurrencies[Field.TOKEN_B], chainId)

  const Row = useCallback(
    ({ data, index, style }) => {
      const [tokenA, tokenB]: [Token, Token] = data[index]
      const active =  ( ((tokenUA?.address === tokenA.address) && (tokenUB?.address === tokenB.address )) ||
                        ((tokenUA?.address === tokenB.address) && (tokenUB?.address === tokenA.address )) )
      return (
        <NftTokenRow
          style={style}
          nftTokenPair={[tokenA, tokenB]}
          onSelect= {onNftTokenSelect}
          active = {active}
        />
      )
    },
    [onNftTokenSelect, tokenUA, tokenUB]
  )

  const itemKey = useCallback((index: number, data: any) => nftTokenKey(data[index]), [])

  return (
    <NFTWatchListFooter show={true}>
      <Container>
        <Text fontWeight={500} fontSize={16} color={theme.primary1} style={{margin:'6px 20px 2px 20px'}} >
          Concerned NFT tokens:
        </Text>
        <Separator />
          <FixedSizeList
            height={112}
            ref={fixedListRef as any}
            width="100%"
            itemData={nftList}
            itemCount={nftList.length}
            itemSize={28}
            itemKey={itemKey}
          >
            {Row}
          </FixedSizeList>
      </Container>
    </NFTWatchListFooter>
  )
}

export function NftInfoList({
  nftPairList,
  pairCurrencies,
  onNftTokenSelect,
  fixedListRef,
}: {
  nftPairList: PairBidInfo[] 
  pairCurrencies: { [field in Field]?: Currency }
  onNftTokenSelect: (nftTokenPair: [Currency|undefined, Currency|undefined]) => void
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
}) {
  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()
  
  const tokenUA = wrappedCurrency(pairCurrencies[Field.TOKEN_A], chainId)
  const tokenUB = wrappedCurrency(pairCurrencies[Field.TOKEN_B], chainId)

  const Row = useCallback(
    ({ data, index, style }) => {
      const nftPairInfo: PairBidInfo = data[index]
      const active =  ( ((tokenUA?.address === nftPairInfo.tokenA) && (tokenUB?.address === nftPairInfo.tokenB )) ||
                        ((tokenUA?.address === nftPairInfo.tokenB) && (tokenUB?.address === nftPairInfo.tokenA )) )
      return (
        <NftTokenManageRow
          style={style}
          nftTokenPair={nftPairInfo}
          onSelect= {onNftTokenSelect}
          active = {active}
        />
      )
    },
    [onNftTokenSelect, tokenUA, tokenUB]
  )

  const itemKey = useCallback((index: number, data: any) => nftTokenInfoKey(data[index]), [])

  return (
    <NFTWatchListFooter show={true}>
      <Container>
        <Text fontWeight={500} fontSize={16} color={theme.primary1} style={{margin:'6px 20px 2px 20px'}} >
          Your NFT tokens:
        </Text>
        <Separator />
          <FixedSizeList
            height={112}
            ref={fixedListRef as any}
            width="100%"
            itemData={nftPairList}
            itemCount={nftPairList.length}
            itemSize={28}
            itemKey={itemKey}
          >
            {Row}
          </FixedSizeList>
      </Container>
    </NFTWatchListFooter>
  )
}






