// import { Currency, CurrencyAmount, currencyEquals, ETHER, Token } from '@uniswap/sdk'
import { Currency, Token } from '@uniswap/sdk'
import React, { CSSProperties, MutableRefObject, useCallback, useContext } from 'react'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { useActiveWeb3React } from '../../hooks'
//import { useSelectedTokenList, WrappedTokenInfo } from '../../state/lists/hooks'
import { useNFTPairRemover } from '../../state/user/hooks'
//import { useCurrencyBalance } from '../../state/wallet/hooks'
//import { LinkStyledButton, TYPE } from '../../theme'
//import { useIsUserAddedToken } from '../../hooks/Tokens'
//import Column from '../Column'
import { bigNumberToFractionInETH } from '../../state/nft/hooks'
import { RowFixed, RowBetween } from '../Row'
import DoubleCurrencyLogo from '../DoubleLogo'
//import { MouseoverTooltip } from '../Tooltip'
//import { FadedSpan, MenuItem } from '../SearchModal/styleds'
import { Separator } from '../SearchModal/styleds'
import Loader from '../Loader'
import { unwrappedToken } from '../../utils/wrappedCurrency'
import { useNftBidContract } from '../../hooks/useContract'
import { useSingleCallResult } from '../../state/multicall/hooks'
import { PairBidInfo } from '../../state/nft/reducer'
import { ZERO_ADDRESS } from '../../constants'
//import { isTokenOnList } from '../../utils'
import { Lock, User, Coffee, MinusCircle } from 'react-feather'
// import { Container } from '../CurrencyInputPanel'

function nftTokenKey([tokenA, tokenB]: [Token, Token]): string {
  return `${tokenA.address}:${tokenB.address}`
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

function NftStatus({ nftInfo, account, ownerPairNft }: { nftInfo: PairBidInfo; account: string; ownerPairNft: string }) {
  const nftPrice = bigNumberToFractionInETH(nftInfo.currentPrice)
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
              <Lock size={14} />
              <StyledNFTPrice>
                {nftPrice.toSignificant(6)}{` ETH`}
              </StyledNFTPrice>
             </>
           )

}

const Container = styled.div`
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
  margin: 0 16px 0 16px;
`

const NftItem = styled(RowBetween)`
  padding: 4px 10px 4px 20px;
  height: 56px;
  display: grid;
  grid-template-columns: 150px 16px 12px minmax(0, 150px);
  grid-gap: 16px;
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
    outline: none;
  }
`

function NftTokenRow({
  nftTokenPair,
  onSelect,
  style
}: {
  nftTokenPair: [Token, Token]
  onSelect: (nftTokenPair: [Currency, Currency]) => void
  style: CSSProperties
}) {
  const { account, chainId } = useActiveWeb3React()
  const [tokenA, tokenB] = nftTokenPair
 
  const nftBidContract = useNftBidContract()
  const pairTokenAddress= [tokenA.address, tokenB.address]

  const currencyA = unwrappedToken(tokenA)
  const currencyB = unwrappedToken(tokenB)  

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
      onClick={() => onSelect([currencyA, currencyB])}
      height={"40px"}
    >
      <RowFixed>
        <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} size={20} margin={false} />
        <Text fontWeight={600} fontSize={14} style={{margin:'0px 3px 0px 6px'}}>
          {currencyA.symbol}/{currencyB.symbol}
        </Text>
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
              <NftStatus nftInfo={pairBidInfo} account={account??ZERO_ADDRESS} ownerPairNft={ownerPairNft}/> 
            </RowFixed>
          )
        : (account ? <Loader /> : null)
      }
      </RowFixed>
    </NftItem>
  )
}

export default function NftList({
  nftList,
  onNftTokenSelect,
  fixedListRef,
}: {
  nftList: [Token, Token, boolean][] 
  onNftTokenSelect: (nftTokenPair: [Currency, Currency]) => void
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
}) {
  const theme = useContext(ThemeContext)

  const Row = useCallback(
    ({ data, index, style }) => {
      const [tokenA, tokenB]: [Token, Token] = data[index]
       return (
        <NftTokenRow
          style={style}
          nftTokenPair={[tokenA, tokenB]}
          onSelect= {onNftTokenSelect}
        />
      )
    },
    [onNftTokenSelect]
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
            itemSize={32}
            itemKey={itemKey}
          >
            {Row}
          </FixedSizeList>
      </Container>
    </NFTWatchListFooter>
  )
}