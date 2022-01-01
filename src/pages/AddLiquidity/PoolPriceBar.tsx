import { Currency, Percent, Price } from '@feswap/sdk'
import React, { useContext, useMemo } from 'react'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { AutoColumn } from '../../components/Column'
import { AutoRow } from '../../components/Row'
import { ONE_BIPS, ZERO_PERCENT } from '../../constants'
import { Field } from '../../state/mint/actions'
import { TYPE } from '../../theme'
import { SeparatorDark } from '../../components/SearchModal/styleds'
import { useActiveWeb3React } from '../../hooks'

export function PoolPriceBar({
  currencies,
  noLiquidity,
  poolTokenPercentage,
  price
}: {
  currencies: { [field in Field]?: Currency }
  noLiquidity?: boolean
  poolTokenPercentage?: { [field in Field]?: Percent } 
  price?: { [field in Field]?: Price }
}) {
  const { chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const pricePromptAB = useMemo(() => {
          if(!price || !price[Field.CURRENCY_A]) return '-'
          return price[Field.CURRENCY_A]?.lessThan('1') 
                    ? `${price[Field.CURRENCY_A]?.invert()?.toSignificant(6)} : 1`
                    : `1 : ${price[Field.CURRENCY_A]?.toSignificant(6)}`
        }, [price])

  const pricePromptBA = useMemo(() => {
          if(!price || !price[Field.CURRENCY_B]) return '-'
          return price[Field.CURRENCY_B]?.greaterThan('1') 
                    ? `${price[Field.CURRENCY_B]?.invert()?.toSignificant(6)} : 1`
                    : `1 : ${price[Field.CURRENCY_B]?.toSignificant(6)}`
        }, [price])

  return (
    <AutoColumn gap="md" >
      <AutoRow justify="space-around" gap="4px">
        <AutoColumn justify="center">
          <TYPE.black>{pricePromptAB}</TYPE.black>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            Price of {currencies[Field.CURRENCY_A]?.getSymbol(chainId)} 🔗 {currencies[Field.CURRENCY_B]?.getSymbol(chainId)}
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <TYPE.black>
            {noLiquidity && price
              ? '100'
              : ( poolTokenPercentage?.[Field.CURRENCY_A]?.equalTo(ZERO_PERCENT)
                  ? '0'
                  : poolTokenPercentage?.[Field.CURRENCY_A]?.lessThan(ONE_BIPS)
                    ? '<0.01' 
                    : poolTokenPercentage?.[Field.CURRENCY_A]?.toFixed(2)) ?? '0'}
            %
          </TYPE.black>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            Liquidity Share of the Pool 
          </Text>
        </AutoColumn>
      </AutoRow>
      <SeparatorDark />
      <AutoRow justify="space-around" gap="4px">
        <AutoColumn justify="center">
          <TYPE.black>{pricePromptBA}</TYPE.black>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            Price of {currencies[Field.CURRENCY_B]?.getSymbol(chainId)} 🔗 {currencies[Field.CURRENCY_A]?.getSymbol(chainId)}
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <TYPE.black>
            {noLiquidity && price
              ? '100'
              : ( poolTokenPercentage?.[Field.CURRENCY_B]?.equalTo(ZERO_PERCENT)
                  ? '0'
                  : poolTokenPercentage?.[Field.CURRENCY_B]?.lessThan(ONE_BIPS)
                    ? '<0.01' 
                    : poolTokenPercentage?.[Field.CURRENCY_B]?.toFixed(2)) ?? '0'}
            %
          </TYPE.black>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            Liquidity Share of the Pool
          </Text>
        </AutoColumn>
      </AutoRow>
    </AutoColumn>
  )
}
