/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import styled from '@emotion/styled'

import { SharedColors } from '@perfsee/dls'

export const StyledDesc = styled.span<{ size?: string }>(({ theme, size }) => ({
  fontSize: size ?? '14px',
  color: theme.text.colorSecondary,
  ':not(:last-of-type):after': {
    content: "'・'",
    margin: '0 8px',
  },
}))

export const EllipsisText = styled.div({
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
})

export const ButtonWrapper = styled.div({
  flex: '0 0 auto !important',
})

export const WarningText = styled.b(({ theme }) => {
  return {
    color: theme.colors.error,
    wordBreak: 'break-word',
  }
})

export const NormalToken = { padding: '8px 0 4px 0', childrenGap: 8 }
export const TextFieldStyles = { root: { flex: 1 } }

export const TipTextBold = styled.span<{ color?: string }>(({ color }) => ({
  marginLeft: '8px',
  fontWeight: 'bold',
  color: color ?? SharedColors.green10,
}))
