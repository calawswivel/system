import { JwtMicroPayload } from 'modules/auth/interfaces/jwt-payload'
import { CtaActionInt, IBody, Result } from 'modules/cta/interface'
import { BadRequestException, InternalServerErrorException } from '@nestjs/common'
import _ = require('lodash')
import { call360Axios } from 'modules/cta/utils'

export interface IField {
  key: string
  path?: string|string[]
}

export interface Props {
  fields: IField[]
}

// Update booking in 360
export default class UpdateBookingAction extends CtaActionInt<Props> {
  needLocals = true

  async run(system: string, tableName: string, primaryKey: string, body: IBody, user: JwtMicroPayload): Promise<Result> {
    if (!this.props) throw new InternalServerErrorException('MISSING_PROPS')
    let entity = body.entity
    const { accessToken } = body.locals

    // get booking
    if (tableName !== 'booking') {
      if (body.locals.booking) {
        entity = body.locals.booking
      }
      else {
        throw new InternalServerErrorException('UNSUPPORTED_ENTITY_TYPE')
      }
    }

    if (!body.inputResult) throw new BadRequestException('MISSING_INPUT_RESULT')
    for (const { key, path = key } of this.props.fields) {
      _.set(entity, path, body.inputResult[key])
    }

    // save booking
    const response = await call360Axios({
      method: 'POST',
      url: `${user.api['360']}/api/booking`,
      data: entity
    }, user, this.logger, accessToken)
    if (response.data && response.data.id === entity.id) {
      const result = response.data
      body.locals.booking = result
      if (tableName === 'booking') body.entity = result
      return Result.SUCCESS
    }
    throw new Error('ERROR_UPDATE_BOOKING')
  }
}
