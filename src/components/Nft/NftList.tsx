// import { Currency, CurrencyAmount, currencyEquals, ETHER, Token } from '@uniswap/sdk'
import { Token } from '@uniswap/sdk'
import React, { CSSProperties, MutableRefObject, useCallback, useContext } from 'react'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { useActiveWeb3React } from '../../hooks'
//import { useSelectedTokenList, WrappedTokenInfo } from '../../state/lists/hooks'
//import { useAddUserToken, useRemoveUserAddedToken } from '../../state/user/hooks'
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
import { Lock, User, Coffee } from 'react-feather'
// import { Container } from '../CurrencyInputPanel'

//function nftTokenKey(nftTokenPair: [Currency, Currency]): string {
//  const tokenA = nftTokenPair[0] instanceof Token ? nftTokenPair[0].address : nftTokenPair[0] === ETHER ? 'ETHER' : ''
//  const tokenB = nftTokenPair[0] instanceof Token ? nftTokenPair[0].address : nftTokenPair[0] === ETHER ? 'ETHER' : ''
//  return `${tokenA}:${tokenB}`
//}

function nftTokenKey([tokenA, tokenB]: [Token, Token]): string {
//  const tokenA = nftTokenPair[0] instanceof Token ? nftTokenPair[0].address : nftTokenPair[0] === ETHER ? 'ETHER' : ''
//  const tokenB = nftTokenPair[0] instanceof Token ? nftTokenPair[1].address : nftTokenPair[1] === ETHER ? 'ETHER' : ''
  return `${tokenA.address}:${tokenB.address}`
}


const StyledBalanceText = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  max-width: 5rem;
  text-overflow: ellipsis;
`

/*
const Tag = styled.div`
  background-color: ${({ theme }) => theme.bg3};
  color: ${({ theme }) => theme.text2};
  font-size: 14px;
  border-radius: 4px;
  padding: 0.25rem 0.3rem 0.25rem 0.3rem;
  max-width: 6rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  justify-self: flex-end;
  margin-right: 4px;
`

function Balance({ balance }: { balance: CurrencyAmount }) {
  return <StyledBalanceText title={balance.toExact()}>{balance.toSignificant(4)}</StyledBalanceText>
}
*/

function NftStatus({ nftInfo, account, ownerPairNft }: { nftInfo: PairBidInfo; account: string; ownerPairNft: string }) {
  const nftPrice = bigNumberToFractionInETH(nftInfo.currentPrice)
  return  (ownerPairNft === ZERO_ADDRESS) 
          ? (
              <>
                <StyledBalanceText >
                  ≥0.2ETH
                </StyledBalanceText>
              </>
            )
          : (
            <>
              <Lock size={14} />
              <StyledBalanceText>
                {nftPrice.toSignificant(6)}ETH
              </StyledBalanceText>
              {(account === ownerPairNft) && <User size={14} />}
            </>
           )

}

/*
const TagContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`

function TokenTags({ currency }: { currency: Currency }) {
  if (!(currency instanceof WrappedTokenInfo)) {
    return <span />
  }

  const tags = currency.tags
  if (!tags || tags.length === 0) return <span />

  const tag = tags[0]

  return (
    <TagContainer>
      <MouseoverTooltip text={tag.description}>
        <Tag key={tag.id}>{tag.name}</Tag>
      </MouseoverTooltip>
      {tags.length > 1 ? (
        <MouseoverTooltip
          text={tags
            .slice(1)
            .map(({ name, description }) => `${name}: ${description}`)
            .join('; \n')}
        >
          <Tag>...</Tag>
        </MouseoverTooltip>
      ) : null}
    </TagContainer>
  )
}

function CurrencyRow({
  currency,
  onSelect,
  isSelected,
  otherSelected,
  style
}: {
  currency: Currency
  onSelect: () => void
  isSelected: boolean
  otherSelected: boolean
  style: CSSProperties
}) {
  const { account, chainId } = useActiveWeb3React()
  const key = currencyKey(currency)
  const selectedTokenList = useSelectedTokenList()
  const isOnSelectedList = isTokenOnList(selectedTokenList, currency)
  const customAdded = useIsUserAddedToken(currency)
  const balance = useCurrencyBalance(account ?? undefined, currency)

  const removeToken = useRemoveUserAddedToken()
  const addToken = useAddUserToken()

  // only show add or remove buttons if not on selected list
  return (
    <MenuItem
      style={style}
      className={`token-item-${key}`}
      onClick={() => (isSelected ? null : onSelect())}
      disabled={isSelected}
      selected={otherSelected}
    >
      <CurrencyLogo currency={currency} size={'24px'} />
      <Column>
        <Text title={currency.name} fontWeight={500}>
          {currency.symbol}
        </Text>
        <FadedSpan>
          {!isOnSelectedList && customAdded ? (
            <TYPE.main fontWeight={500}>
              Added by user
              <LinkStyledButton
                onClick={event => {
                  event.stopPropagation()
                  if (chainId && currency instanceof Token) removeToken(chainId, currency.address)
                }}
              >
                (Remove)
              </LinkStyledButton>
            </TYPE.main>
          ) : null}
          {!isOnSelectedList && !customAdded ? (
            <TYPE.main fontWeight={500}>
              Found by address
              <LinkStyledButton
                onClick={event => {
                  event.stopPropagation()
                  if (currency instanceof Token) addToken(currency)
                }}
              >
                (Add)
              </LinkStyledButton>
            </TYPE.main>
          ) : null}
        </FadedSpan>
      </Column>
      <TokenTags currency={currency} />
      <RowFixed style={{ justifySelf: 'flex-end' }}>
        {balance ? <Balance balance={balance} /> : account ? <Loader /> : null}
      </RowFixed>
    </MenuItem>
  )
}
*/

const Container = styled.div`
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
  margin: 0 16px 0 16px;
`

const NftItem = styled(RowBetween)`
  padding: 4px 20px;
  height: 56px;
  display: grid;
  grid-template-columns: auto minmax(0, 72px);
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

function NftTokenRow({
  nftTokenPair,
  onSelect,
  style
}: {
  nftTokenPair: [Token, Token]
  onSelect: () => void
  style: CSSProperties
}) {
  const { account } = useActiveWeb3React()
  const [tokenA, tokenB] = nftTokenPair
 
  const nftBidContract = useNftBidContract()
  const pairTokenAddress= [tokenA.address, tokenB.address]

  const currencyA = unwrappedToken(tokenA)
  const currencyB = unwrappedToken(tokenB)  

  const feswaPairInfo =  useSingleCallResult(nftBidContract, 'getPoolInfoByTokens', pairTokenAddress)?.result??undefined
  const ownerPairNft = feswaPairInfo?.nftOwner?? ZERO_ADDRESS
  const pairBidInfo = feswaPairInfo?.pairInfo
  console.log('nftTokenPair, feswaPairInfo', nftTokenPair, feswaPairInfo)

  return (
    <NftItem
      style={style}
      onClick={() => onSelect()}
      height={"40px"}
    >
      <RowFixed>
        <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} size={20} margin={false} />
        <Text fontWeight={600} fontSize={14} style={{margin:'0px 3px 0px 6px'}}>
          {currencyA.symbol}/{currencyB.symbol}
        </Text>
        { (feswaPairInfo) && (feswaPairInfo?.nftOwner === ZERO_ADDRESS) &&
          <Coffee size={14} />
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
  nftList: [Token, Token][] 
  onNftTokenSelect: (nftTokenPair: [Token, Token]) => void
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
}) {
  const theme = useContext(ThemeContext)

  const Row = useCallback(
    ({ data, index, style }) => {
      const nftTokenPair: [Token, Token] = data[index]
      const handleSelect = () => onNftTokenSelect(nftTokenPair)
      return (
        <NftTokenRow
          style={style}
          nftTokenPair={nftTokenPair}
          onSelect={handleSelect}
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
            itemSize={28}
            itemKey={itemKey}
          >
            {Row}
          </FixedSizeList>
      </Container>
    </NFTWatchListFooter>
  )
}