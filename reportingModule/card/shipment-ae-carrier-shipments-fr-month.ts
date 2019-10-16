import {
  AndExpressions,
  BinaryExpression,
  Column,
  ColumnExpression,
  CreateTableJQL,
  FromTable,
  FunctionExpression,
  IsNullExpression,
  InsertJQL,
  Query,
  ResultColumn,
  Value,
  MathExpression,
  OrderBy,
  GroupBy,
} from 'node-jql'
import { parseCode } from 'utils/function'

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const types = ['F', 'R']

// const types = ['F_GW', 'F_CW', 'R_GW', 'R_CW']

const variables = ['shipments']

function prepareParams(type_: 'F' | 'R' | 'T'): Function {
  const fn = function(require, session, params) {
    // import
    const moment = require('moment')

    // limit/extend to 1 year
    const subqueries = (params.subqueries = params.subqueries || {})
    const year = (subqueries.date ? moment(subqueries.date.from, 'YYYY-MM-DD') : moment()).year()
    const date = (subqueries.date = subqueries.date || {})
    date.from = moment()
      .year(year)
      .startOf('year')
      .format('YYYY-MM-DD')
    date.to = moment()
      .year(year)
      .endOf('year')
      .format('YYYY-MM-DD')

    // AE
    subqueries.moduleTypeCode = { value: ['AIR'] }
    subqueries.boundTypeCode = { value: ['O'] }
    // subqueries.billTypeCode = { value : ['M'] }

    // select
    params.fields = ['carrierCode', 'carrierName', 'jobMonth', 'shipments']

    // group by
    params.groupBy = ['carrierCode', 'jobMonth']

    subqueries.billTypeCode = { value : ['M'] }

    switch (type_) {
      case 'F':
        subqueries.nominatedTypeCode = { value: ['F'] }
        break
      case 'R':
        subqueries.nominatedTypeCode = { value: ['R'] }
        break
    }

    return params
  }
  let code = fn.toString()
  code = code.replace(new RegExp('type_', 'g'), `'${type_}'`)
  return parseCode(code)
}

// call API
function prepareData(type: 'F' | 'R'): InsertJQL {
  return new InsertJQL({
    name: 'shipment',
    columns: ['type', 'carrierCode', 'carrierName', 'month', 'shipments'],
    query: new Query({
      $select: [
        new ResultColumn(new Value(type), 'type'),
        new ResultColumn(new ColumnExpression('carrierCode')),
        new ResultColumn(new ColumnExpression('carrierName')),
        new ResultColumn(
          new FunctionExpression('MONTHNAME', new ColumnExpression('jobMonth'), 'YYYY-MM'),
          'month'
        ),
        new ResultColumn(
          new FunctionExpression('IFNULL', new ColumnExpression('shipments'), 0),
          'shipments'
        ),
      ],
      $from: new FromTable(
        {
          method: 'POST',
          url: 'api/shipment/query/shipment',
          columns: [
            { name: 'carrierCode', type: 'string' },
            { name: 'carrierName', type: 'string' },
            { name: 'jobMonth', type: 'string' },
            { name: 'shipments', type: 'number' },
          ],

          data: {
            filter: { carrierCodeIsNotNull: {} },
          },
        },
        'shipment'
      ),
    }),
  })
}

function prepareTempTable(): CreateTableJQL {
  return new CreateTableJQL({
    $temporary: true,
    name: 'temp',

    $as: new Query({
      $select: [
        new ResultColumn('carrierCode'),
        new ResultColumn('carrierName'),
        ...months.reduce<ResultColumn[]>((result, month) => {
          const tempList1 = types.reduce<ResultColumn[]>((result2, type) => {
            const tempList = variables.reduce<ResultColumn[]>((result3, variable) => {
              const columnName = `${month}-${type}_${variable}`

              const expression = new ResultColumn(
                new FunctionExpression(
                  'IFNULL',
                  new FunctionExpression(
                    'FIND',
                    new AndExpressions([
                      new BinaryExpression(new ColumnExpression('month'), '=', month),
                      new BinaryExpression(new ColumnExpression('type'), '=', type),
                    ]),
                    new ColumnExpression(variable)
                  ),
                  0
                ),
                columnName
              )

              result3.push(expression)
              return result3
            }, [])

            result2 = result2.concat(tempList)

            return result2
          }, [])

          result = result.concat(tempList1)

          return result
        }, []),
      ],
      $from: 'shipment',
      $group: new GroupBy(['carrierCode', 'carrierName']),
    }),
  })
}

function finalQuery(): Query
{

  function composeSumExpression(dumbList: any[]): MathExpression {

    if (dumbList.length === 2) {
      return new MathExpression(dumbList[0], '+', dumbList[1])
    }

    const popResult = dumbList.pop()

    return new MathExpression(popResult, '+', composeSumExpression(dumbList))
  }

  const $select = [
    new ResultColumn(new ColumnExpression('carrierCode')),
    new ResultColumn(new ColumnExpression('carrierName'))
  ]

  variables.map(variable => {
    const finalSumList = []

    months.map(month => {
      const monthSumList = []
      types.map((type: string) => {
        const columnName = `${month}-${type}_${variable}`
        const expression = new ColumnExpression('temp', columnName)
        $select.push(new ResultColumn(expression))
        monthSumList.push(expression)
        finalSumList.push(expression)
      })
      // add the month sum expression

      const monthSumExpression = composeSumExpression(monthSumList)
      $select.push(new ResultColumn(monthSumExpression, `${month}-T_${variable}`))
    })

    // --------------------------------------------------------

    types.map((type: string) => {
      const typeSumList = []

      months.map(month => {
        const columnName = `${month}-${type}_${variable}`
        const expression = new ColumnExpression('temp', columnName)
        typeSumList.push(expression)
      })

      const typeSumExpression = composeSumExpression(typeSumList)
      $select.push(new ResultColumn(typeSumExpression, `total-${type}_${variable}`))
    })

    const finalSumExpression = composeSumExpression(finalSumList)
    $select.push(new ResultColumn(finalSumExpression, `total-T_${variable}`))
  })

  return new Query({
    $select,
    $from: 'temp',
    $order : new OrderBy('total-T_shipments', 'DESC')
  })

}

// function prepareFinalTable() {

//   return new CreateTableJQL({
//     $temporary: true,
//     name: 'final',

//     $as: new Query({
//       $select,
//       $from: 'temp',
//       $order : new OrderBy('total-T_shipments', 'DESC')
//     }),
//   })
// }

export default [
  // prepare temp table
  new CreateTableJQL(true, 'shipment', [
    new Column('type', 'string'),
    new Column('carrierCode', 'string'),
    new Column('carrierName', 'string'),
    new Column('month', 'string'),
    new Column('shipments', 'number'),
  ]),

  // prepare data
  [prepareParams('F'), prepareData('F')],
  [prepareParams('R'), prepareData('R')],

  prepareTempTable(),
  // prepareFinalTable(),

  finalQuery()

  // new Query({
  //   $from: 'final',
  //   // $order: new OrderBy(new ColumnExpression('final', 'total-T_shipments'), 'DESC'),
  // }),
]
