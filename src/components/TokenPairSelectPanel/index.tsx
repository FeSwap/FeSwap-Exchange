import { Currency, Pair } from '@feswap/sdk'
import React, { useState, useContext, useCallback } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { darken } from 'polished'
import CurrencySearchModal from '../SearchModal/CurrencySearchModal'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween } from '../Row'
import { TYPE } from '../../theme'
import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import { Link2 } from 'react-feather'
import { InputPanel, Container } from '../CurrencyInputPanel'
import { useActiveWeb3React } from '../../hooks'

const CurrencySelect = styled.button<{ selected: boolean }>`
  align-items: center;
  height: 2.2rem;
  font-size: 20px;
  font-weight: 500;
  background-color: ${({ selected, theme }) => (selected ? theme.bg3 : theme.primary1)};
  color: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
  border-radius: 8px;
  box-shadow: ${({ selected }) => (selected ? 'none' : '0px 6px 10px rgba(0, 0, 0, 0.075)')};
  outline: none;
  cursor: pointer;
  user-select: none;
  border: none;
  padding: 0 0rem;
  margin: 0 0.3rem;

  :hover {
    background-color: ${({ selected, theme }) => (selected ? darken(0.05, theme.bg4) : darken(0.05, theme.primary1))};
  }
`

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.text1};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem 0 1rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.text2)};
  }
`

const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const StyledDropDown = styled(DropDown)<{ selected: boolean }>`
  margin: 0 0.5rem 0 0.5rem;
  height: 35%;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
    stroke-width: 1.5px;
  }
`

const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) => (active ? '  margin: 0 0.6rem 0 0.6rem;' : '  margin: 0 0.6rem 0 0.6rem;')}
  font-size:  ${({ active }) => (active ? '20px' : '16px')};

`

interface TokenPairSelectPanelProps {
  onMax?: () => void
  label?: string
  onCurrencySelectA: (currency: Currency) => void
  onCurrencySelectB: (currency: Currency) => void
  currencyA?: Currency | null
  currencyB?: Currency | null 
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  id: string
  showCommonBases?: boolean
  customBalanceText?: string
}

export default function TokenPairSelectPanel({
  onCurrencySelectA,
  onCurrencySelectB,
  currencyA,
  currencyB,
  pair = null, // used for double token logo
  hideInput = false,
  otherCurrency,
  id,
  showCommonBases
}: TokenPairSelectPanelProps) {

  const { chainId } = useActiveWeb3React()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectToken, setSelectToken] = useState('A')

  const theme = useContext(ThemeContext)

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const onCurrencySelect =  (selectToken === 'A') ? onCurrencySelectA : onCurrencySelectB
  const currency =  (selectToken === 'A') ? currencyA : currencyB

  return (
    <InputPanel id={id}>
      <Container hideInput={hideInput}>
        {!hideInput && (
          <LabelRow>
            <RowBetween>
              <TYPE.body color={theme.text2} fontWeight={500} fontSize={15}>
                <strong>Token A</strong>
              </TYPE.body>
              <TYPE.body color={theme.text2} fontWeight={500} fontSize={15}>
                Swap Pair
              </TYPE.body>
              <TYPE.body color={theme.text2} fontWeight={500} fontSize={15}>
                <strong>Token B</strong>
              </TYPE.body>
            </RowBetween>
          </LabelRow>
        )}
        <RowBetween style={{padding: '0.75rem 0.2rem 0.75rem 0.2rem', alignItems: 'center'}}>
          <CurrencySelect
            selected={!!currencyA}
            className="open-currency-select-button"
            onClick={() => {
                setSelectToken('A')
                setModalOpen(true)
            }}
          >
            <Aligner>
              {pair ? (
                <StyledTokenName className="pair-name-container">
                  {pair?.token0.getSymbol(chainId)}:{pair?.token1.getSymbol(chainId)}
                </StyledTokenName>
              ) : (
                <StyledTokenName className="token-symbol-container" active={Boolean(currencyA && currencyA.symbol)}>
                  {(currencyA && currencyA.symbol && currencyA.symbol.length > 20
                    ? currencyA.symbol.slice(0, 4) +
                      '...' +
                      currencyA.symbol.slice(currencyA.symbol.length - 5, currencyA.symbol.length)
                    : currencyA?.getSymbol(chainId)) || 'Select Token'}
                </StyledTokenName>
              )}
              {pair ? (
                <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={24} margin={true} />
              ) : currencyA ? (
                <CurrencyLogo currency={currencyA} size={'24px'} />
              ) : null}
              {<StyledDropDown selected={!!currencyA} />}
            </Aligner>
          </CurrencySelect>
          <Link2 fontSize={'20px'} color={theme.primary1}/>
          <CurrencySelect
            selected={!!currencyB}
            className="open-currency-select-button"
            onClick={() => {
                setSelectToken('B')
                setModalOpen(true)
            }}
          >
            <Aligner>
              {<StyledDropDown selected={!!currencyB} />}
              {pair ? (
                <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={24} margin={true} />
              ) : currencyB ? (
                <CurrencyLogo currency={currencyB} size={'24px'} />
              ) : null}
              {pair ? (
                <StyledTokenName className="pair-name-container">
                  {pair?.token0.getSymbol(chainId)}:{pair?.token1.getSymbol(chainId)}
                </StyledTokenName>
              ) : (
                <StyledTokenName className="token-symbol-container" active={Boolean(currencyB && currencyB.symbol)}>
                  {(currencyB && currencyB.symbol && currencyB.symbol.length > 20
                    ? currencyB.symbol.slice(0, 4) +
                      '...' +
                      currencyB.symbol.slice(currencyB.symbol.length - 5, currencyB.symbol.length)
                    : currencyB?.getSymbol(chainId)) || 'Select Token'}
                </StyledTokenName>
              )}
            </Aligner>
          </CurrencySelect>
        </RowBetween>
      </Container>
      <CurrencySearchModal
        isOpen={modalOpen}
        onDismiss={handleDismissSearch}
        onCurrencySelect={onCurrencySelect}
        selectedCurrency={currency}
        otherSelectedCurrency={otherCurrency}
        showCommonBases={showCommonBases}
      />
    </InputPanel>
  )
}
