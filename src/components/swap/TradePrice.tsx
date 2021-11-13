import React from 'react'
import { Price, Rounding } from '@feswap/sdk'
import { useContext } from 'react'
import { RefreshCcw } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { StyledBalanceMaxMini } from './styleds'
import { useActiveWeb3React } from '../../hooks'

interface TradePriceProps {
  price?: Price
  showInverted: boolean
  setShowInverted: (showInverted: boolean) => void
}

export default function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps) {
  const { chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const formattedPrice = showInverted 
                          ? price?.toSignificant(6, undefined, Rounding.ROUND_DOWN) 
                          : price?.invert()?.toSignificant(6, undefined, Rounding.ROUND_DOWN)

  const show = Boolean(price?.baseCurrency && price?.quoteCurrency)
  const label = showInverted
    ? `${price?.quoteCurrency?.getSymbol(chainId)} / ${price?.baseCurrency?.getSymbol(chainId)}`
    : `${price?.baseCurrency?.getSymbol(chainId)} / ${price?.quoteCurrency?.getSymbol(chainId)}`

  return (
    <Text
      fontWeight={500}
      fontSize={14}
      color={theme.text2}
      style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}
    >
      {show ? (
        <>
          {formattedPrice ?? '-'} {label}
          <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
            <RefreshCcw size={14} />
          </StyledBalanceMaxMini>
        </>
      ) : (
        '-'
      )}
    </Text>
  )
}
