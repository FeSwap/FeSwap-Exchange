import { Trade } from '@feswap/sdk'
//import { useCurrency } from 'hooks/Tokens'
import React, { Fragment, memo, useContext } from 'react'
import { ChevronRight } from 'react-feather'
import { Flex } from 'rebass'
import { ThemeContext } from 'styled-components'
import { TYPE } from '../../theme'
import CurrencyLogo from '../CurrencyLogo'
import { unwrappedToken } from '../../utils/wrappedCurrency'
import { useActiveWeb3React } from '../../hooks'

export default memo(function SwapRoute({ trade }: { trade: Trade }) {
  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()

  return (
    <Flex
      px="1rem"
      style={{ border: `1px solid ${theme.bg3}`, borderRadius: '8px' }}
      flexWrap="wrap"
      width="100%"
      justifyContent="space-evenly"
      alignItems="center"
    >
      {trade.route.path.map((token, i, path) => {
        const isLastItem: boolean = i === path.length - 1
        const currency = unwrappedToken(token)

        return (
          <Fragment key={i}>
            <Flex my="0.5rem" alignItems="center" style={{ flexShrink: 0 }}>
              <CurrencyLogo currency={currency} size="1.5rem" />
              <TYPE.black fontSize={14} color={theme.text1} ml="0.5rem">
                {currency.getSymbol(chainId)}
              </TYPE.black>
            </Flex>
            {isLastItem ? null : <ChevronRight color={theme.text2} />}
          </Fragment>
        )
      })}
    </Flex>
  )
})

