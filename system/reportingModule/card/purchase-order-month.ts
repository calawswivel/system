import { JqlDefinition } from 'modules/report/interface'
import { IQueryParams } from 'classes/query'
import { OrderBy } from 'node-jql'
import Moment = require('moment')
import { expandGroupEntity, expandSummaryVariable, extendDate } from 'utils/card'
import { ERROR } from 'utils/error'

interface Result {
  moment: typeof Moment
  groupByEntity: string
  codeColumnName: string
  nameColumnName: string
  summaryVariables: string[]
}

const groupbyList=["poNo",
"productCategoryId",
"moduleType",
"incoTerms",
"freightTerms",
"portOfLoading",
"portOfDischarge"
];

const summaryList=[
  "totalpo",
  "poNo",
  "moduleTypeCode"

];


export default {
  jqls: [
    {
      type: 'prepareParams',
      defaultResult: {},
      async prepareParams(params, prevResult: Result, user): Promise<IQueryParams> {
        function guessSortingExpression(sortingValue: string, subqueries) {
          const variablePart = sortingValue.substr(0, sortingValue.lastIndexOf('_'))
          let sortingDirection = sortingValue.substr(sortingValue.lastIndexOf('_') + 1)

          if (!['ASC', 'DESC'].includes(sortingDirection)) {
            sortingDirection = 'ASC'
          }

          // here will handle 2 special cases : metric , summaryVariable
          const metricRegex = new RegExp('metric[0-9]+')
          const summaryVariableRegex = new RegExp('summaryVariable')

          let finalColumnName: string

          // summaryVariable case
          if (summaryVariableRegex.test(variablePart)) {
            finalColumnName = variablePart.replace('summaryVariable', subqueries.summaryVariable.value)
          }
          else if (metricRegex.test(variablePart)) {
            const metricPart = variablePart.match(metricRegex)[0]
            const metricValue = subqueries[metricPart].value
            finalColumnName = variablePart.replace(metricPart, metricValue)
          }
          else {
            finalColumnName = variablePart
          }
          return new OrderBy(finalColumnName, sortingDirection as 'ASC'|'DESC')
        }

        const moment = prevResult.moment = (await this.preparePackages(user)).moment as typeof Moment
        const subqueries = (params.subqueries = params.subqueries || {})

        // idea: userGroupByVariable and userSummaryVariable is selected within filter by user
        if (!subqueries.groupByEntity || !(subqueries.groupByEntity !== true && 'value' in subqueries.groupByEntity)) throw ERROR.MISSING_GROUP_BY()
        if (!subqueries.topX || !(subqueries.topX !== true && 'value' in subqueries.topX)) throw ERROR.MISSING_TOP_X()


        var { groupByEntity, codeColumnName,nameColumnName } = expandGroupEntity(subqueries,'groupByEntity',true)
  // -----------------------------groupBy variable
  groupByEntity = prevResult.groupByEntity = subqueries.groupByEntity.value // should be shipper/consignee/agent/controllingCustomer/carrier

  if(groupByEntity=='poNo'){
    codeColumnName="poNo";
    nameColumnName="poNo";
  }else if(groupByEntity=='moduleType'){
    codeColumnName=groupByEntity+"Code";
    nameColumnName=groupByEntity+"Code";
  }else if(groupByEntity=='portOfLoading'){
    codeColumnName=groupByEntity+"Code";
    nameColumnName=groupByEntity+"Name";
  }else if(groupByEntity=='portOfDischarge'){
    codeColumnName=groupByEntity+"Code";
    nameColumnName=groupByEntity+"Name";
  }else if(groupByEntity=='incoTerms'){
    codeColumnName=groupByEntity+"Code";
    nameColumnName=groupByEntity+"Code";
  }else if(groupByEntity=='freightTerms'){
    codeColumnName=groupByEntity+"Code";
    nameColumnName=groupByEntity+"Code";



  }else{
    codeColumnName=groupByEntity+"PartyCode";
    nameColumnName=groupByEntity+"ShortNameInReportAny";

  }
        prevResult.groupByEntity = groupByEntity
        prevResult.codeColumnName = codeColumnName
        prevResult.nameColumnName = nameColumnName

        const topX = subqueries.topX.value



        const summaryVariables = expandSummaryVariable(subqueries)
        prevResult.summaryVariables = summaryVariables



        // extend date into whole year
        extendDate(subqueries,moment,'year')

        subqueries[`${codeColumnName}IsNotNull`]  = { // shoulebe carrierIsNotNull/shipperIsNotNull/controllingCustomerIsNotNull
          value: true
        }

        params.fields = [
          // select Month statistics
          ...summaryVariables.map(variable => `${variable}Month`),
          codeColumnName,
          nameColumnName,
        ]

        // group by
        params.groupBy = [codeColumnName]

        // // warning, will orderBy cbmMonth, if choose cbm as summaryVariables
        // params.sorting = new OrderBy(`total_${summaryVariables[0]}`, 'DESC')

        const sorting = params.sorting = []
        if (subqueries.sorting && subqueries.sorting !== true && 'value' in subqueries.sorting) {
          const sortingValueList = subqueries.sorting.value as string[]
          sortingValueList.forEach(sortingValue => {
            // will try to find in sortingExpressionMap first, if not found , just use the normal value
            const orderByExpression = guessSortingExpression(sortingValue, subqueries)
            sorting.push(orderByExpression)
          })
        }
        else {
          params.sorting = new OrderBy(`total_${summaryVariables[0]}`, 'DESC')
        }

        params.limit = topX

console.debug({params})
        return params
      }
    },
    {
      type: 'callDataService',
      dataServiceQuery: ['purchase_order', 'purchase_order'],
      onResult(res, params, { moment, groupByEntity, codeColumnName, nameColumnName, summaryVariables }: Result): any[] {
        return res.map(row => {
          const row_: any = { code: row[codeColumnName], name: row[nameColumnName], groupByEntity }

          for (const variable of summaryVariables) {
            let total = 0
            for (const m of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
              const month = moment().month(m).format('MMMM')
              const key = `${month}_${variable}`
              let value = +row[key]
              if (isNaN(value)) value = 0
              row_[key] = value
              total += value
            }
            row_[`total_${variable}`] = total
          }

          return row_
        })
      }
    }
  ],
  filters: [
    // for this filter, user can only select single,
    // but when config in card definition, use summaryVariables. Then we can set as multi
    {
      display: 'topX',
      name: 'topX',
      props: {
        items: [
          {
            label: '10',
            value: 10,
          },
          {
            label: '20',
            value: 20,
          },
          {
            label: '50',
            value: 50,
          },
          {
            label: '100',
            value: 100,
          },
          {
            label: '1000',
            value: 1000,
          }
        ],
        multi : false,
        required: true,
      },
      type: 'list',
    },
    {
      display: 'summaryVariable',
      name: 'summaryVariable',
      props: {
        items: [

          ...summaryList.reduce((acc, summary) => {

            acc = acc.concat(
              [
                {
                  label: `${summary}`,
                  value: `${summary}`,
                }
              ]
            )
            return acc

          }, [])
        ],
        multi : false,
        required: true,
      },
      type: 'list',
    },
    {
      display: 'groupByEntity',
      name: 'groupByEntity',
      props: {
        items: [
          ...groupbyList.reduce((acc, grouBy) => {

            acc = acc.concat(
              [
                {
                  label: `${grouBy}`,
                  value: `${grouBy}`,
                }
              ]
            )
            return acc

          }, [])

        ],
        required: true,
      },
      type: 'list',
    },
  ]
} as JqlDefinition
