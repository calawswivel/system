import { EventService, EventConfig, EventHandlerConfig, EventData } from 'modules/events/service'
import { JwtPayload } from 'modules/auth/interfaces/jwt-payload'
import { Transaction } from 'sequelize'
import _ = require('lodash')

import { TrackService } from 'modules/tracking/services'

import { BookingReference } from 'models/main/bookingReference'
import { BookingContainer } from 'models/main/bookingContainer'
import { RegisterTrackingForm } from 'modules/tracking/interface'
import BaseEventHandler from 'modules/events/baseEventHandler'

// // debug
// import { TrackService } from '../../../../swivel-backend-new/src/modules/tracking/service';

// import { Booking } from '../../../../swivel-backend-new/src/models/main/booking';
// import { BookingReference } from '../../../../swivel-backend-new/src/models/main/bookingReference';
// import { BookingContainer } from '../../../../swivel-backend-new/src/models/main/bookingContainer';

class CreateTrackingEvent extends BaseEventHandler {
  constructor(
    protected  eventDataList: EventData<any>[],
    protected readonly eventHandlerConfig: EventHandlerConfig,
    protected readonly repo: string,
    protected readonly eventService: EventService,
    protected readonly allService: any,

    protected readonly user?: JwtPayload,
    protected readonly transaction?: Transaction
  ) {
    super(eventDataList, eventHandlerConfig, repo, eventService, allService, user, transaction)
  }
  private async getTrackingNo(
    data: any,
    {
      isTracking, moduleTypeCode, carrierCode, departureDateEstimated, masterNo, soNo, containerNo
    }: { [name: string]: string|((data: any) => any) }
  ): Promise<RegisterTrackingForm|null> {
    const tracking = this.getValueFromData(data, isTracking, null)
    const moduleTypeCodeData = this.getValueFromData(data, moduleTypeCode, null)
    const carrierCodeData = this.getValueFromData(data, carrierCode, null)
    const departureDateEstimatedData = this.getValueFromData(data, departureDateEstimated, null)
    if (tracking && moduleTypeCodeData && carrierCodeData && departureDateEstimatedData) {
      const masterNoData = this.getValueFromData(data, masterNo, null)
      const soNoData = moduleTypeCodeData === 'SEA' ? this.getValueFromData(data, soNo, []) : []
      const containerNoData = moduleTypeCodeData === 'SEA' ? this.getValueFromData(data, containerNo, []) : []
      return {
        moduleTypeCode: moduleTypeCodeData,
        carrierCode: carrierCodeData,
        departureDateEstimated: departureDateEstimatedData,
        masterNo: masterNoData,
        soNo: soNoData.reduce((s: string[], no: string) => {
          if (no) {
            s.push(no)
          }
          return s
        }, []),
        containerNo: containerNoData.reduce((s: string[], no: string) => {
          if (no) {
            s.push(no)
          }
          return s
        }, []),
        flexData: { entity: data }
      }
    }
    return null
  }

  public async mainFunction(eventDataList: EventData<any>[]) {
    console.debug('Start Create Tracking Event ....', this.constructor.name)

    const {
      TrackService: trackService
    } = this.allService as {
      TrackService: TrackService
    }

    const promiseList = eventDataList.map(async eventData => {

      const { latestEntity, loadashMapping, tableName } = eventData

      if (latestEntity.billStatus === null) {
        try {
          const registerForm = await this.getTrackingNo(latestEntity, loadashMapping)
          if (registerForm) {
            await trackService.register(registerForm, this.user)
          }
        } catch (e) {
          console.error(`
            We cannot create tracking on below ${tableName}:\n
            ID: ${latestEntity['id']}\n
            Register Form:\n
            ${JSON.stringify(latestEntity)}\n
          `, null, this.constructor.name)
          console.error(e, e.stack, this.constructor.name)
        }
      }

    })

    const resultList = await Promise.all(promiseList)
    console.debug('End Create Tracking Event ....', this.constructor.name)
    return[]

  }

  // // parameters should be booking
  // public async mainFunction(
  //   {
  //     data, tableName, loadashMapping
  //   }: {
  //     data: any
  //     tableName: string
  //     loadashMapping: { [name: string]: string|((data: any) => any) }
  //   }
  // ) {
  //   console.debug('Start Create Tracking Event ....', this.constructor.name)
  //   const {
  //     TrackService: trackService
  //   } = this.allService as {
  //     TrackService: TrackService
  //   }
  //   if (data.billStatus === null) {
  //     try {
  //       const registerForm = await this.getTrackingNo(data, loadashMapping)
  //       if (registerForm) {
  //         await trackService.register(registerForm, this.user)
  //       }
  //     } catch (e) {
  //       console.error(`
  //         We cannot create tracking on below ${tableName}:\n
  //         ID: ${data['id']}\n
  //         Register Form:\n
  //         ${JSON.stringify(data)}\n
  //       `, null, this.constructor.name)
  //       console.error(e, e.stack, this.constructor.name)
  //     }
  //   }
  //   console.debug('End Create Tracking Event ....', this.constructor.name)
  // }

}
