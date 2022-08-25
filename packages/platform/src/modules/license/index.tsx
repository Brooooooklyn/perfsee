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

import { css } from '@emotion/react'

import { BodyContainer } from '@perfsee/components'

import LicenseContent from './license.txt'

export function License() {
  return (
    <BodyContainer>
      <pre css={css({ width: '100%', padding: '0 10px' })} dangerouslySetInnerHTML={{ __html: LicenseContent }} />
    </BodyContainer>
  )
}
