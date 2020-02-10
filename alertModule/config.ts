
import { AlertConfig, AlertFlexDataConfig } from 'models/main/alert'
import { AlertPreference, AlertPreferenceDetail } from 'models/main/alertPreference'
import { IQueryParams } from 'classes/query'
import { BinaryExpression, ColumnExpression, IConditionalExpression, AndExpressions, MathExpression, ParameterExpression, FunctionExpression, BetweenExpression, Value } from 'node-jql'

export const schedulerActive = false

export const alertConfigList = [

  {
    alertCategory: 'Notification',
    alertType: 'newBooking',
    tableName: 'booking',
    templatePath: 'message/new-booking-preview',
    severity: 'medium',
    contactRoleList: 'all',

    active: true

  } as AlertConfig,

  {
    alertCategory: 'Message',
    alertType: 'bookingMessage',
    tableName: 'booking',
    templatePath: 'message/booking-message',
    severity: 'medium',
    contactRoleList: 'all',

    active: true

  } as AlertConfig,

  {
    alertCategory: 'Message',
    alertType: 'shipmentMessage',
    tableName: 'shipment',
    templatePath: 'message/shipment-message',
    severity: 'medium',
    contactRoleList: 'all',

    active: true

  } as AlertConfig,

  {

    tableName: 'shipment',
    alertCategory: 'Exception',
    severity: 'medium',
    alertType: 'sayHello',

    templatePath: 'message/shipment-message',

    schedule: '0 * * ? * *',
    queryName: 'shipment',
    query: {
      subqueries: {
        moduleTypeCode: { value: ['AIR'] },
        boundTypeCode: { value: ['O'] },
      },
      limit: 1

    } as IQueryParams,

    extraPersonIdQuery: {
      subqueries: {
      },
      limit: 1
    } as IQueryParams,

    contactRoleList: ['shipper', 'consignee'],

    // saveAsNewAlertTimeDiff : 0,

    resend: true, // resend to everyone or just send to those not yet receive

    active: false

  } as AlertConfig,

  {
    tableName: 'booking',
    alertCategory: 'Exception',
    severity: 'medium',
    alertType: 'missingCarrierBooking',

    templatePath: 'alert/booking-alert',
    schedule: '0 * * ? * *',
    queryName: 'booking',
    query: {

      conditions: new AndExpressions([
        new BinaryExpression(
          new FunctionExpression('NOW'),
          '>=',
          new FunctionExpression(
            'DATE_ADD',
            new ColumnExpression('booking_date', 'departureDateEstimated'),
            new ParameterExpression({
              prefix: 'INTERVAL',
              expression: new Value(7),
              suffix: 'DAY',
            })
          ),
        ),
      ]),

      limit: 1

    } as IQueryParams,

    contactRoleList: ['shipper', 'consignee'],

    resend: false,
    active: false

  } as AlertConfig,

  {
    tableName: 'booking',
    alertCategory: 'Exception',
    severity: 'medium',
    alertType: 'missingCarrierBooking',

    templatePath: 'alert/booking-alert',
    schedule: '0 * * ? * *',
    queryName: 'booking',
    query: {

      conditions: new AndExpressions([
        new BinaryExpression(
          new FunctionExpression('NOW'),
          '>=',
          new FunctionExpression(
            'DATE_ADD',
            new ColumnExpression('booking_date', 'departureDateEstimated'),
            new ParameterExpression({
              prefix: 'INTERVAL',
              expression: new Value(7),
              suffix: 'DAY',
            })
          ),
        ),
      ]),

      limit: 1

    } as IQueryParams,

    contactRoleList: ['shipper', 'consignee'],

    resend: false,
    active: false

  } as AlertConfig

] as AlertConfig[]

export const alertPreferenceDetailList = [

  {
    alertType: 'bookingMessage',
    notifyBy: 'email',
    active: true
  },

  {
    alertType: 'shipmentMessage',
    notifyBy: 'email',
    active: true
  },

  {
    alertType: 'shipmentEtaChanged',
    notifyBy: 'email',
    active: true
  },

  {
    alertType: 'shipmentEtdChanged',
    notifyBy: 'email',
    active: true
  }

] as AlertPreferenceDetail[]

export const alertFlexDataConfigList = [
  {
    tableName: 'booking',
    variableList: [
      'partyGroupCode',
      'bookingNo',
      'moduleTypeCode',
      'boundTypeCode',
      'agentPartyId',
      'forwarderPartyId',
      'notifyPartyPartyId',
      'shipperPartyId',
      'consigneePartyId'
    ],
    primaryKeyName: 'id'
  },

  {
    tableName: 'shipment',
    primaryKeyName: 'id',
    variableList: 'all'
  }

] as AlertFlexDataConfig[]
