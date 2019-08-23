import { BaseEvent } from 'modules/events/base-event'
import { EventService, EventConfig } from 'modules/events/service'
import { JwtPayload } from 'modules/auth/interfaces/jwt-payload'
import { Transaction } from 'sequelize'
import { AlertDbService } from '../../../../swivel-backend-new/src/modules/sequelize/alert/service'

class ExampleEvent extends BaseEvent {
  constructor(
    protected readonly parameters: any,
    protected readonly eventConfig: EventConfig,
    protected readonly repo: string,
    protected readonly eventService: EventService,
    protected readonly allService: any,

    protected readonly user?: JwtPayload,
    protected readonly transaction?: Transaction
  ) {
    super(parameters, eventConfig, repo, eventService, allService, user, transaction)
  }

  public async mainFunction(parameters: any) {
    console.log(JSON.stringify(parameters), 'parameters')
    console.log('in main Excecute of Example')

    const alertDbService = this.allService['AlertDbService'] as AlertDbService

    const option = {
      where: { tableName: 'shipment' },
      ...(this.transaction ? { transaction: this.transaction } : {}),
    }

    await alertDbService.find(option, this.user)

    console.log('in main Excecute of Example Finish')

    return {
      exampleResult: 'exampleValue',
    }
  }
}

export default {
  execute: async (
    parameters: any,
    eventConfig: EventConfig,
    repo: string,
    eventService: any,
    allService: any,
    user?: JwtPayload,
    transaction?: Transaction
  ) => {
    const event = new ExampleEvent(
      parameters,
      eventConfig,
      repo,
      eventService,
      allService,
      user,
      transaction
    )
    return await event.execute()
  },
}
