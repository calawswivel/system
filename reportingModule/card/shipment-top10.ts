import { CreateFunctionJQL } from 'node-jql'

import { parseCode } from 'utils/function'

function prepareParams(): Function {
  const fn = function(require, session, params) {
    const moment = require('moment')

    const { OrderBy } = require('node-jql')
    const { BadRequestException } = require('@nestjs/common')

    const subqueries = (params.subqueries = params.subqueries || {})

    // warning cannot display from frontend
    if (!subqueries.xAxis) throw new BadRequestException('MISSING_xAxis')
    if (!subqueries.yAxis) throw new BadRequestException('MISSING_yAxis')

    // most important part of this card
    // dynamically choose the fields and summary value

    const xAxis = subqueries.xAxis.value // should be shipper/consignee/agent/controllingCustomer/carrier
    const partyColumnName = xAxis === 'carrier' ? `${xAxis}` : `${xAxis}Party`

    const summaryColumnName = subqueries.yAxis.value // should be chargeableWeight/cbm/grossWeight/totalShipment

    const codeColumnName = `${partyColumnName}Code`
    const nameColumnName = `${partyColumnName}Name`
      // ------------------------------
    ; (params.sorting = new OrderBy(summaryColumnName, 'DESC')),
      // select
      (params.fields = [codeColumnName, summaryColumnName])
    params.groupBy = [codeColumnName]

    return params
  }

  const code = fn.toString()
  return parseCode(code)
}

function createTop10Table() {
  const fn = function(require, session, params) {
    const { CreateTableJQL } = require('node-jql')

    const subqueries = (params.subqueries = params.subqueries || {})

    const xAxis = subqueries.xAxis.value // should be shipper/consignee/agent/controllingCustomer/carrier
    const partyColumnName = xAxis === 'carrier' ? `${xAxis}` : `${xAxis}Party`

    const summaryColumnName = subqueries.yAxis.value // should be chargeableWeight/cbm/grossWeight/totalShipment

    const codeColumnName = `${partyColumnName}Code`
    const nameColumnName = `${partyColumnName}Name`
    // ------------------------------

    return new CreateTableJQL({
      $temporary: true,
      name: 'top10',
      columns: [
        {
          name: codeColumnName,
          type: 'string',
        },
        // {
        //   name : nameColumnName,
        //   type : 'string'
        // },
        {
          name: summaryColumnName,
          type: 'number',
        },
      ],
    })
  }

  const code = fn.toString()
  return parseCode(code)
}

function insertTop10Data() {
  const fn = async function(require, session, params) {
    const { Resultset } = require('node-jql-core')
    const {
      InsertJQL,
      ColumnExpression,
      CreateTableJQL,
      FromTable,
      InExpression,
      BetweenExpression,
      FunctionExpression,
      BinaryExpression,
      GroupBy,
      Query,
      ResultColumn,
    } = require('node-jql')

    const subqueries = (params.subqueries = params.subqueries || {})
    const xAxis = subqueries.xAxis.value // should be shipper/consignee/agent/controllingCustomer/carrier
    const partyColumnName = xAxis === 'carrier' ? `${xAxis}` : `${xAxis}Party`

    const summaryColumnName = subqueries.yAxis.value // should be chargeableWeight/cbm/grossWeight/totalShipment

    const codeColumnName = `${partyColumnName}Code`
    const nameColumnName = `${partyColumnName}Name`
    // ------------------------------

    const shipments = new Resultset(await session.query(new Query('raw'))).toArray() as any[]

    const top10ShipmentList = shipments.filter(x => x[codeColumnName]).slice(0, 10)

    // use the code of the top10 to find the rest
    const top10ShipmentCodeList = top10ShipmentList.map(x => x[codeColumnName])
    const otherShipmentList = shipments.filter(
      x => !top10ShipmentCodeList.includes(x[codeColumnName])
    )

    // sum up all the other
    const otherSum = otherShipmentList.reduce((accumulator, currentValue, currentIndex, array) => {
      return accumulator + currentValue[summaryColumnName]
    }, 0)

    // compose the record for other
    const otherResult = {}
    otherResult[codeColumnName] = 'other'
    // otherResult[nameColumnName] = 'other',
    otherResult[summaryColumnName] = otherSum

    return new InsertJQL('top10', ...top10ShipmentList, otherResult)
  }

  const code = fn.toString()
  return parseCode(code)
}

function prepareRawTable() {
  const fn = function(require, session, params) {
    const {
      CreateTableJQL,
      ResultColumn,
      FromTable,
      ColumnExpression,
      Query,
      FunctionExpression,
      OrderBy,
    } = require('node-jql')

    const subqueries = (params.subqueries = params.subqueries || {})

    const xAxis = subqueries.xAxis.value // should be shipper/consignee/agent/controllingCustomer/carrier
    const partyColumnName = xAxis === 'carrier' ? `${xAxis}` : `${xAxis}Party`

    const summaryColumnName = subqueries.yAxis.value // should be chargeableWeight/cbm/grossWeight/totalShipment

    const codeColumnName = `${partyColumnName}Code`
    const nameColumnName = `${partyColumnName}Name`
    // ------------------------------

    return new CreateTableJQL({
      $temporary: true,
      name: 'raw',

      $as: new Query({
        $select: [
          new ResultColumn(new ColumnExpression(codeColumnName)),
          // new ResultColumn(new ColumnExpression(nameColumnName)),
          new ResultColumn(
            new FunctionExpression('NUMBERIFY', new ColumnExpression(summaryColumnName)),
            summaryColumnName
          ),
        ],

        $from: new FromTable(
          {
            method: 'POST',
            url: 'api/shipment/query/shipment',
            columns: [
              {
                name: codeColumnName,
                type: 'string',
              },
              // {
              //   name: nameColumnName,
              //   type: 'string',
              // },
              {
                name: summaryColumnName,
                type: 'string',
              },
            ],
          },
          'shipment'
        ),
      }),
    })
  }

  const code = fn.toString()
  return parseCode(code)
}

function finalQuery() {
  const fn = function(require, session, params) {
    const {
      CreateTableJQL,
      ResultColumn,
      FromTable,
      ColumnExpression,
      Query,
      FunctionExpression,
      OrderBy,
    } = require('node-jql')

    const subqueries = (params.subqueries = params.subqueries || {})
    const xAxis = subqueries.xAxis.value // should be shipper/consignee/agent/controllingCustomer/carrier
    const partyColumnName = xAxis === 'carrier' ? `${xAxis}` : `${xAxis}Party`

    const summaryColumnName = subqueries.yAxis.value // should be chargeableWeight/cbm/grossWeight/totalShipment

    const codeColumnName = `${partyColumnName}Code`
    const nameColumnName = `${partyColumnName}Name`
    // ------------------------------

    return new Query({
      $select: [
        new ResultColumn(new ColumnExpression(codeColumnName), 'code'),
        // new ResultColumn(new ColumnExpression(nameColumnName), 'name'),
        new ResultColumn(new ColumnExpression(summaryColumnName), 'summary'),
      ],

      $from: 'top10',
    })
  }

  const code = fn.toString()
  return parseCode(code)
}

function createNumerifyFunction() {
  return new CreateFunctionJQL(
    'NUMBERIFY',
    function(parameter: any, value: string) {
      return +value
    },
    'number',
    'string'
  )
}

export default [
  createNumerifyFunction(),

  // get all data
  [prepareParams(), prepareRawTable()],

  // prepareTempTable(),

  createTop10Table(),
  insertTop10Data(),

  finalQuery(),
]

export const filters = [
  {
    display: 'yAxis',
    name: 'yAxis',
    props: {
      items: [
        {
          label: 'chargeableWeight',
          value: 'chargeableWeight',
        },
        {
          label: 'grossWeight',
          value: 'grossWeight',
        },
        {
          label: 'cbm',
          value: 'cbm',
        },
        {
          label: 'totalShipment',
          value: 'totalShipment',
        },
      ],
      required: true,
    },
    type: 'list',
  },
  {
    display: 'xAxis',
    name: 'xAxis',
    props: {
      items: [
        {
          label: 'carrier',
          value: 'carrier',
        },
        {
          label: 'shipper',
          value: 'shipper',
        },
        {
          label: 'consignee',
          value: 'consignee',
        },
        {
          label: 'agent',
          value: 'agent',
        },
        {
          label: 'controllingCustomer',
          value: 'controllingCustomer',
        },
      ],
      required: true,
    },
    type: 'list',
  },
]
