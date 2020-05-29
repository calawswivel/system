import { JqlDefinition } from 'modules/report/interface'
import { IQueryParams } from 'classes/query'
import { AxiosRequestConfig } from 'axios'

export default {
  jqls: [
    {
      type: 'prepareParams',
      prepareParams(params) {
        const subqueries = (params.subqueries = params.subqueries || {})
        subqueries.alertJoin = true
        params.fields = [
          'alertTableName',
          'alertPrimaryKey',
          'alertCategory',
          'alertType',
          'alertTitle',
          'alertMessage',
          'alertContent',
          'alertSeverity',
          'alertStatus',
          'alertCreatedAt',
          'alertUpdatedAt'
        ]
        return params
      }
    },
    {
      type: 'callAxios',
      injectParams: true,
      getAxiosConfig(req, params): AxiosRequestConfig {
        let url = `api/shipment/query/shipment`
        const subqueries = (params.subqueries = params.subqueries || {})
        if (subqueries.entityType && subqueries.entityType !== true && 'value' in subqueries.entityType) {
          const entityType = subqueries.entityType.value
          url = `api/shipment/query/${entityType}`
        }
        return {
          method: 'POST',
          url,
        }
      },
      responseMapping: [
        { from: 'alertTableName', to: 'tableName' },
        { from: 'alertPrimaryKey', to: 'primaryKey' },
        { from: 'alertSeverity', to: 'severity'},
        { from: 'alertStatus', to: 'status'},
      ]
    }
  ],
  columns: [
    { key: 'tableName' },
    { key: 'primaryKey' },
    { key: 'alertCategory' },
    { key: 'alertType' },
    { key: 'alertTitle' },
    { key: 'alertMessage' },
    { key: 'alertContent' },
    { key: 'severity'},
    { key: 'status'},
    { key: 'alertUpdatedAt' },
    { key: 'alertCreatedAt' },
  ]
} as JqlDefinition

/* import { Query, FromTable } from 'node-jql'
import { parseCode } from 'utils/function'

function prepareParams(): Function {
  const fn = async function(require, session, params) {
    // import
    const { BadRequestException } = require('@nestjs/common')

    // script
    const subqueries = (params.subqueries = params.subqueries || {})

    subqueries.alertJoin = true

    params.fields = [
      'alertTableName',
      'alertPrimaryKey',
      'alertCategory',
      'alertType',
      'alertTitle',
      'alertMessage',
      'alertContent',
      'alertSeverity',
      'alertStatus',
      'alertCreatedAt',
      'alertUpdatedAt'
    ]

    return params
  }

  const code = fn.toString()
  return parseCode(code)
}

function finalQuery(){

  return function(require, session, params)
  {

    let url = `api/shipment/query/shipment`

    if (params)
    {
      const subqueries = (params.subqueries = params.subqueries || {})
      const entityType = subqueries.entityType.value

      switch (entityType) {
        case 'shipment':
          url = `api/shipment/query/shipment`
          break

        case 'booking':
          url = `api/booking/query/booking`
          break

        default:
          break
      }
    }

    return new Query({
      $from: new FromTable(
        {
          method: 'POST',
          url,
          columns: [
            { name: 'alertTableName', type: 'string', $as : 'tableName' },
            { name: 'alertPrimaryKey', type: 'string', $as : 'primaryKey' },
            { name: 'alertCategory', type: 'string' },
            { name: 'alertType', type: 'string' },
            { name: 'alertTitle', type: 'string' },
            { name: 'alertMessage', type: 'string' },
            { name: 'alertContent', type: 'object' },
            { name: 'alertSeverity', type: 'string' , $as: 'severity'},
            { name: 'alertStatus', type: 'string', $as: 'status'},
            { name : 'alertUpdatedAt' , type : 'string' },
            { name : 'alertCreatedAt' , type : 'string' }
          ],
        },
        'alert'
      ),
    })

  }

}

export default [

  [prepareParams(), finalQuery()]
] */
