import { Currency, ETHER, JSBI, TokenAmount } from '@feswap/sdk'
import React, { useCallback, useEffect, useState, useContext } from 'react'
import { Link2 } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { ButtonDropdownLight } from '../../components/Button'
import { TransparentCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import CurrencyLogo from '../../components/CurrencyLogo'
import { FindPoolTabs } from '../../components/NavigationTabs'
import { Wrapper } from '../Pool/styleds'
import { MinimalPositionCard } from '../../components/PositionCard'
import Row from '../../components/Row'
import CurrencySearchModal from '../../components/SearchModal/CurrencySearchModal'
//import TokenPairSelectPanel from '../../components/TokenPairSelectPanel'
import { PairState, usePair } from '../../data/Reserves'
import { useActiveWeb3React } from '../../hooks'
import { usePairAdder } from '../../state/user/hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { StyledInternalLink } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import AppBody from '../AppBody'
import { Dots } from '../Pool/styleds'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import {StyledPageCard } from '../../components/earn/styled'

enum Fields {
  TOKEN0 = 0,
  TOKEN1 = 1
}

export default function PoolFinder() {
  const { account, chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [activeField, setActiveField] = useState<number>(Fields.TOKEN1)

  const [currency0, setCurrency0] = useState<Currency | null>(ETHER)
  const [currency1, setCurrency1] = useState<Currency | null>(null)
  const tokenA = wrappedCurrency(currency0?? undefined, chainId)

  const [pairState, pair] = usePair(currency0 ?? undefined, currency1 ?? undefined)
  const addPair = usePairAdder()
  useEffect(() => {
    if (pair) {
      addPair(pair)
    }
  }, [pair, addPair])

  const validPairNoLiquidity: boolean =
    pairState === PairState.NOT_EXISTS ||
    Boolean(
      pairState === PairState.EXISTS &&
        pair &&
        JSBI.equal(pair.reserve00.raw, JSBI.BigInt(0)) &&
        JSBI.equal(pair.reserve01.raw, JSBI.BigInt(0)) &&
        JSBI.equal(pair.reserve10.raw, JSBI.BigInt(0)) &&
        JSBI.equal(pair.reserve11.raw, JSBI.BigInt(0))
    )

  const position0: TokenAmount | undefined = useTokenBalance(account ?? undefined, pair?.liquidityToken0)
  const position1: TokenAmount | undefined = useTokenBalance(account ?? undefined, pair?.liquidityToken1)
  const hasPosition = Boolean(  (position0 && JSBI.greaterThan(position0.raw, JSBI.BigInt(0))) ||
                                (position1 && JSBI.greaterThan(position1.raw, JSBI.BigInt(0))) )

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      if (activeField === Fields.TOKEN0) {
        setCurrency0(currency)
      } else {
        setCurrency1(currency)
      }
    },
    [activeField]
  )

  const handleSearchDismiss = useCallback(() => {
    setShowSearch(false)
  }, [setShowSearch])

  const prerequisiteMessage = (
    <TransparentCard padding="45px 10px" style={{border: 'none'}}>
      <Text textAlign="center">
        {!account ? 'Connect to a wallet to find pools' : 'Select a token to find your liquidity.'}
      </Text>
    </TransparentCard>
  )

//  <CardNoise />
  return (
    <AppBody>
      <StyledPageCard bgColor={'red'}>
      <FindPoolTabs />
      <Wrapper>
        <AutoColumn gap="md">
          <ButtonDropdownLight
            onClick={() => {
              setShowSearch(true)
              setActiveField(Fields.TOKEN0)
            }}
          >
            {currency0 ? (
              <Row>
                <CurrencyLogo currency={currency0} />
                <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
                  {currency0.symbol}
                </Text>
              </Row>
            ) : (
              <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
                Select a Token
              </Text>
            )}
          </ButtonDropdownLight>

          <ColumnCenter>
            <Link2 fontSize={'20px'} color={theme.primary1}/>
          </ColumnCenter>

          <ButtonDropdownLight
            onClick={() => {
              setShowSearch(true)
              setActiveField(Fields.TOKEN1)
            }}
          >
            {currency1 ? (
              <Row>
                <CurrencyLogo currency={currency1} />
                <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
                  {currency1.symbol}
                </Text>
              </Row>
            ) : (
              <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
                Select a Token
              </Text>
            )}
          </ButtonDropdownLight>

          {hasPosition && (
            <ColumnCenter
              style={{ justifyItems: 'center', backgroundColor: '', padding: '12px 0px', borderRadius: '12px' }}
            >
              <Text textAlign="center" fontWeight={500}>
                Pool Found and Recorded!
              </Text>
              <StyledInternalLink to={`/pool`}>
                <Text textAlign="center">{`Manage this pool 👈`}</Text>
              </StyledInternalLink>
            </ColumnCenter>
          )}
          {currency0 && currency1 ? (
            pairState === PairState.EXISTS ? (
              hasPosition && pair ? (
                <MinimalPositionCard pair={pair} tokenA= {tokenA} border="1px solid #CED0D9" />
              ) : (
                <TransparentCard padding="45px 10px" style={{border: 'none'}}>
                  <AutoColumn gap="sm" justify="center">
                    <Text textAlign="center">You don’t have liquidity in this pool</Text>
                    <StyledInternalLink to={`/add/${currencyId(currency0)}/${currencyId(currency1)}`}>
                      <Text textAlign="center">{`Add liquidity 👈`}</Text>
                    </StyledInternalLink>
                  </AutoColumn>
                </TransparentCard>
              )
            ) : validPairNoLiquidity ? (
              <TransparentCard padding="45px 10px" style={{border: 'none'}}>
                <AutoColumn gap="sm" justify="center">
                  <Text textAlign="center">No pool found.</Text>
                  <StyledInternalLink to={`/nft/${currencyId(currency0)}/${currencyId(currency1)}`}>
                    {`Bid to create this pool 👈`}
                  </StyledInternalLink>
                </AutoColumn>
              </TransparentCard>
            ) : pairState === PairState.INVALID ? (
              <TransparentCard padding="45px 10px" style={{border: 'none'}}>
                <AutoColumn gap="sm" justify="center">
                  <Text textAlign="center" fontWeight={500}>
                    Invalid pair.
                  </Text>
                </AutoColumn>
              </TransparentCard>
            ) : pairState === PairState.LOADING ? (
              <TransparentCard padding="45px 10px" style={{border: 'none'}}>
                <AutoColumn gap="sm" justify="center">
                  <Text textAlign="center">
                    Loading
                    <Dots />
                  </Text>
                </AutoColumn>
              </TransparentCard>
            ) : null
          ) : (
            prerequisiteMessage
          )}
        </AutoColumn>
      </Wrapper>
      </StyledPageCard>
      <CurrencySearchModal
        isOpen={showSearch}
        onCurrencySelect={handleCurrencySelect}
        onDismiss={handleSearchDismiss}
        showCommonBases
        selectedCurrency={(activeField === Fields.TOKEN0 ? currency1 : currency0) ?? undefined}
      />
    </AppBody>
  )
}