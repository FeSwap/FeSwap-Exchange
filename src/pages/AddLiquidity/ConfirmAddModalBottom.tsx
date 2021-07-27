import { Currency, CurrencyAmount, Fraction, Percent } from '@feswap/sdk'
import React from 'react'
import { Text } from 'rebass'
import { ButtonPrimary } from '../../components/Button'
import { RowBetween, RowFixed } from '../../components/Row'
import CurrencyLogo from '../../components/CurrencyLogo'
import { Field } from '../../state/mint/actions'
import { TYPE } from '../../theme'
import { ZERO_FRACTION } from '../../utils'

export function ConfirmAddModalBottom({
  noLiquidity,
  price,
  currencies,
  parsedAmounts,
  poolTokenPercentage,
  onAdd
}: {
  noLiquidity?: boolean
  price?: Fraction
  currencies: { [field in Field]?: Currency }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  poolTokenPercentage?: { [field in Field]?: Percent }
  onAdd: () => void
}) {
  return (
    <>
      <RowBetween>
        <TYPE.body>{currencies[Field.CURRENCY_A]?.symbol} Deposited:</TYPE.body>
        <RowFixed>
          <CurrencyLogo currency={currencies[Field.CURRENCY_A]} style={{ marginRight: '8px' }} />
          <TYPE.body>{parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}</TYPE.body>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <TYPE.body>{currencies[Field.CURRENCY_B]?.symbol} Deposited:</TYPE.body>
        <RowFixed>
          <CurrencyLogo currency={currencies[Field.CURRENCY_B]} style={{ marginRight: '8px' }} />
          <TYPE.body>{parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}</TYPE.body>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <TYPE.body>Mean Token Rates: </TYPE.body>
        <TYPE.body>
          {`1 ${currencies[Field.CURRENCY_A]?.symbol} = ${price?.toSignificant(5)} ${
            currencies[Field.CURRENCY_B]?.symbol
          }`}
        </TYPE.body>
      </RowBetween>
      <RowBetween style={{ justifyContent: 'flex-end' }}>
        <TYPE.body>
          {`1 ${currencies[Field.CURRENCY_B]?.symbol} = ${price?.invert().toSignificant(5)} ${
            currencies[Field.CURRENCY_A]?.symbol
          }`}
        </TYPE.body>
      </RowBetween>

      { poolTokenPercentage?.[Field.CURRENCY_A]?.greaterThan(ZERO_FRACTION) &&
        <RowBetween>
          <TYPE.body>Share of Pool {currencies[Field.CURRENCY_A]?.symbol}🔗{currencies[Field.CURRENCY_B]?.symbol}:</TYPE.body>
          <TYPE.body>{poolTokenPercentage?.[Field.CURRENCY_A]?.toSignificant(4)}%</TYPE.body>
        </RowBetween>}

      { poolTokenPercentage?.[Field.CURRENCY_B]?.greaterThan(ZERO_FRACTION) &&
        <RowBetween>
          <TYPE.body>Share of Pool {currencies[Field.CURRENCY_B]?.symbol}🔗{currencies[Field.CURRENCY_A]?.symbol}:</TYPE.body>
          <TYPE.body>{poolTokenPercentage?.[Field.CURRENCY_B]?.toSignificant(4)}%</TYPE.body>
        </RowBetween>}

      <ButtonPrimary style={{ margin: '20px 0 0 0' }} onClick={onAdd}>
        <Text fontWeight={500} fontSize={20}>
          Confirm Supply
        </Text>
      </ButtonPrimary>
    </>
  )
}
