import React, { useContext } from 'react'
import { useActiveWeb3React } from '../../hooks'

import { AutoColumn, ColumnCenter } from '../Column'
import styled, { ThemeContext } from 'styled-components'
import { RowBetween } from '../Row'
import { TYPE, CloseIcon, CustomLightSpinner } from '../../theme'
import { ArrowUpCircle } from 'react-feather'

import Circle from '../../assets/images/blue-loader.svg'
import { getExplorerLink} from '../../utils/explorer'
import { ExternalLink } from '../../theme/components'
import { useAllTransactions } from '../../state/transactions/hooks'
import { useEffect } from 'react'

const ConfirmOrLoadingWrapper = styled.div`
  width: 100%;
  padding: 24px;
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding: 60px 0;
`

export function LoadingView({ children, title, onDismiss }: { children: any; title?: string; onDismiss: () => void }) {
  return (
    <ConfirmOrLoadingWrapper>
      <RowBetween>
        <TYPE.mediumHeader>{title??''}</TYPE.mediumHeader>
        <CloseIcon onClick={onDismiss} />
      </RowBetween>
      <ConfirmedIcon>
        <CustomLightSpinner src={Circle} alt="loader" size={'90px'} />
      </ConfirmedIcon>
      <AutoColumn gap="100px" justify={'center'}>
        {children}
        <TYPE.subHeader>Confirm this transaction in your wallet</TYPE.subHeader>
      </AutoColumn>
    </ConfirmOrLoadingWrapper>
  )
}

export function SubmittedView({
  children,
  title,
  onDismiss,
  hash
}: {
  children: any
  title?: string
  onDismiss: () => void
  hash: string | undefined
}) {
  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()

  const allTransactions = useAllTransactions()
  
  // once confirmed txn is found, close the confirm window
  useEffect(() => {
    if (hash && allTransactions[hash].receipt){
      onDismiss()
    }
  }, [hash, allTransactions, onDismiss])


  return (
    <ConfirmOrLoadingWrapper>
      <RowBetween>
        <TYPE.mediumHeader>{title??''}</TYPE.mediumHeader>
        <CloseIcon onClick={onDismiss} />
      </RowBetween>
      <ConfirmedIcon>
        <ArrowUpCircle strokeWidth={0.5} size={90} color={theme.primary1} />
      </ConfirmedIcon>
      <AutoColumn gap="100px" justify={'center'}>
        {children}
        {chainId && hash && (
          <ExternalLink href={getExplorerLink(chainId, hash, 'transaction')} style={{ marginLeft: '4px' }}>
            <TYPE.subHeader>View transaction on Explorer</TYPE.subHeader>
          </ExternalLink>
        )}
      </AutoColumn>
    </ConfirmOrLoadingWrapper>
  )
}
