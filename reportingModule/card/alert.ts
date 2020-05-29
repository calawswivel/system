import { JqlDefinition } from 'modules/report/interface'
import { IQueryParams } from 'classes/query'
import { AxiosRequestConfig } from 'axios'

const shipmentBottomSheetId = 'cb22011b-728d-489b-a64b-b881914be600'
const bookingBottomSheetId = 'bde2d806-d2bb-490c-b3e3-9e4792f353dd'

export default {
  jqls: [
    {
      type: 'prepareParams',
      async prepareParams(params, prevResult, user): Promise<IQueryParams> {
        const { moment } = await this.preparePackages(user)

        const subqueries = (params.subqueries = params.subqueries || {})
        if (!subqueries.entityType || !(subqueries.entityType !== true && 'value' in subqueries.entityType)) throw new Error('MISSING_ENTITY_TYPE')
        if (['shipment', 'booking', 'purchase-order'].indexOf(subqueries.entityType.value) === -1) {
          throw new Error(`INVALID_ENTITY_TYPE_${String(subqueries.entityType.value).toLocaleUpperCase()}`)
        }

        let alertCreatedAtJson: { from: any, to: any }
        if (subqueries.withinHours && subqueries.withinHours !== true && 'value' in subqueries.withinHours) {
          alertCreatedAtJson = {
            from: moment().subtract(subqueries.withinHours.value, 'hours'),
            to: moment()
          }
        }
        else {
          const date = subqueries.data as { from: any, to: any }
          const selectedDate = (subqueries.date ? moment(date.from, 'YYYY-MM-DD') : moment())
          const currentMonth = selectedDate.month()
          alertCreatedAtJson = {
            from: selectedDate.month(currentMonth).startOf('month').format('YYYY-MM-DD'),
            to: selectedDate.month(currentMonth).endOf('month').format('YYYY-MM-DD'),
          }
        }

        delete subqueries.date
        subqueries.alertCreatedAt = alertCreatedAtJson
        subqueries.alertStatus = { value: ['open'] }
        subqueries.alertCategory = { value: ['Exception', 'Notification'] }
        subqueries.alertJoin = true

        params.fields = ['alertType', 'alertCategory', 'tableName', 'primaryKeyListString', 'count']
        params.groupBy = ['alertType', 'alertCategory', 'tableName']

        return params
      },
    },
    {
      injectParams: true,
      getAxiosConfig(req, params): AxiosRequestConfig {
        let entityType = 'shipment'
        const subqueries = (params.subqueries = params.subqueries || {})
        if (subqueries.entityType && subqueries.entityType !== true && 'value' in subqueries.entityType) {
          entityType = subqueries.entityType.value
        }
        return {
          method: 'POST',
          url: `api/${entityType}/query/${entityType}`,
        }
      },
      onAxiosResponse(res, params): any[] {
        let bottomSheetId = shipmentBottomSheetId
        const subqueries = (params.subqueries = params.subqueries || {})
        if (subqueries.entityType && subqueries.entityType !== true && 'value' in subqueries.entityType) {
          if (subqueries.entityType.value === 'booking') bottomSheetId = bookingBottomSheetId
        }
        return res.data.map(r => ({ ...r, bottomSheetId }))
      }
    }
  ],
  filters: [
    {
      name: 'entityType',
      props: {
        items: [
          {
            label: 'booking',
            value: 'booking',
          },
          {
            label: 'shipment',
            value: 'shipment',
          },
          {
            label: 'purchase-order',
            value: 'purchase-order',
          }
        ],
        required: true,
      },
      type: 'list',
    },
    {
      name: 'withinHours',
      props: {
        items: [
          {
            label: '12hrs',
            value: 12
          },
          {
            label: '24hrs',
            value: 24
          },
          {
            label: '36hrs',
            value: 36
          }
        ]
      },
      type: 'list'
    }
  ]
} as JqlDefinition

/* import {
  ColumnExpression,
  CreateTableJQL,
  FromTable,
  FunctionExpression,
  GroupBy,
  Query,
  ResultColumn,
  Value,
} from 'node-jql'

const shipmentBottomSheetId = 'cb22011b-728d-489b-a64b-b881914be600'
const bookingBottomSheetId = 'bde2d806-d2bb-490c-b3e3-9e4792f353dd'

function prepareParams(): Function {
  return function(require, session, params) {

    const { moment } = params.packages
    // import
    const { BadRequestException } = require('@nestjs/common')

    // script
    const subqueries = (params.subqueries = params.subqueries || {})

    if (!subqueries.entityType) throw new Error('MISSING_ENTITY_TYPE')

    if (['shipment', 'booking', 'purchase-order'].indexOf(subqueries.entityType.value) === -1)
      throw new Error(
        `INVALID_ENTITY_TYPE_${String(subqueries.type.value).toLocaleUpperCase()}`
      )

    let alertCreatedAtJson: { from: any, to: any }

    if (!subqueries.withinHours) {

      const selectedDate = (subqueries.date ? moment(subqueries.date.from, 'YYYY-MM-DD') : moment())
      const currentMonth = selectedDate.month()
      alertCreatedAtJson = {
        from: selectedDate.month(currentMonth).startOf('month').format('YYYY-MM-DD'),
        to: selectedDate.month(currentMonth).endOf('month').format('YYYY-MM-DD'),
      }
    }

    else {

      const withinHours = params.subqueries.withinHours
      alertCreatedAtJson = {
        from: moment().subtract(withinHours.value, 'hours'),
        to: moment()
      }

    }

    subqueries.date = undefined
    subqueries.alertCreatedAt = alertCreatedAtJson

    subqueries.alertStatus = {
      value: ['open']
    }

    subqueries.alertCategory = {
      value: ['Exception', 'Notification']
    }

    subqueries.date = undefined

    subqueries.alertJoin = true

    params.fields = ['alertType', 'alertCategory', 'tableName', 'primaryKeyListString', 'count']
    params.groupBy = ['alertType', 'alertCategory', 'tableName']

    return params
  }
}

function finalQuery(): Function {

  return function(require, session, params) {
    // import
    const { moment } = params.packages
    const { BadRequestException } = require('@nestjs/common')

    // script
    const subqueries = (params.subqueries = params.subqueries || {})

    const entityType = subqueries.entityType.value

    let alertCreatedAtJson: { from: any, to: any }
    if (!subqueries.withinHours) {

      const selectedDate = (subqueries.date ? moment(subqueries.date.from, 'YYYY-MM-DD') : moment())
      const currentMonth = selectedDate.month()
      alertCreatedAtJson = {
        from: selectedDate.month(currentMonth).startOf('month').format('YYYY-MM-DD'),
        to: selectedDate.month(currentMonth).endOf('month').format('YYYY-MM-DD'),
      }

    }

    else {
      const withinHours = params.subqueries.withinHours

      alertCreatedAtJson = {
        from: moment().subtract(withinHours.value, 'hours'),
        to: moment()
      }

    }

    let bottomSheetId

    if (entityType === 'shipment') {
      bottomSheetId = shipmentBottomSheetId
    }

    else if (entityType === 'booking') {
      bottomSheetId = bookingBottomSheetId
    }

    return new Query({

      $select: [
        new ResultColumn('alertCategory'),
        new ResultColumn('alertType'),
        new ResultColumn('tableName'),
        new ResultColumn('primaryKeyListString'),
        new ResultColumn('count'),
        new ResultColumn(new Value(bottomSheetId), `bottomSheetId`)
      ],

      $from: new FromTable(
        {
          method: 'POST',
          url: `api/${entityType}/query/${entityType}`,
          columns: [
            {
              name: 'alertCategory',
              type: 'string',
            },
            {
              name: 'alertType',
              type: 'string',
            },
            {
              name: 'tableName',
              type: 'string',
            },
            {
              name : 'primaryKeyListString',
              type : 'string'
            },
            { name: 'count', type: 'number' },
          ],
        },
        'alert'
      )
    })

  }

}

export default [
  [
    prepareParams(), finalQuery()
  ],
]

export const filters = [

  // currently comment out
  {
    display: 'entityType',
    name: 'entityType',
    props: {
      items: [
        {
          label: 'booking',
          value: 'booking',
        },
        {
          label: 'shipment',
          value: 'shipment',
        },
        {
          label: 'purchase-order',
          value: 'purchase-order',
        }
      ],
      required: true,
    },
    type: 'list',
  },
  {
    name: 'withinHours',
    props: {
      items: [
        {
          label: '12hrs',
          value: 12
        },
        {
          label: '24hrs',
          value: 24
        },
        {
          label: '36hrs',
          value: 36
        }
      ]
    },
    type: 'list'
  }
] */
