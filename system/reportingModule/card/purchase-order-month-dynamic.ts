import { JqlDefinition } from 'modules/report/interface'
import { IQueryParams } from 'classes/query'
import { OrderBy } from 'node-jql'
import Moment = require('moment')

import { expandBottomSheetGroupByEntity,expandSummaryVariable, extendDate, handleBottomSheetGroupByEntityValue  } from 'utils/card'
import { ERROR } from 'utils/error'

var summaryVariableList=[
  "totalpo",
  "quantity"

];
var groupByEntityList=[
  'poNo',
  'moduleType',
  'incoTerms',
  'freightTerms',
  'portOfLoading',
  'portOfDischarge'

];

interface Result {
  moment: typeof Moment
  groupByEntity: string
  codeColumnName: string
  nameColumnName: string
  summaryVariables: string[]
}
export default {
  jqls: [
    {
      type: 'prepareParams',
      defaultResult: {},
      async prepareParams(params, prevResult: Result, user): Promise<IQueryParams> {

        const moment = prevResult.moment = (await this.preparePackages(user)).moment as typeof Moment
        const subqueries = (params.subqueries = params.subqueries || {})

        // idea: userGroupByVariable and userSummaryVariable is selected within filter by user
        if (!subqueries.groupByEntity || !(subqueries.groupByEntity !== true && 'value' in subqueries.groupByEntity)) throw ERROR.MISSING_GROUP_BY()
        if (!subqueries.topX || !(subqueries.topX !== true && 'value' in subqueries.topX)) throw ERROR.MISSING_TOP_X()

        // warning
        handleBottomSheetGroupByEntityValue(subqueries)
        let { groupByEntity, codeColumnName,nameColumnName } = expandBottomSheetGroupByEntity(subqueries)
          
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

        subqueries[`${codeColumnName}IsNotNull`]  = { // shoulebe carrierCodeIsNotNull/shipperIsNotNull/controllingCustomerIsNotNull
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

        // new way of handling sorting
        const sorting = params.sorting = []
        if (subqueries.sorting && subqueries.sorting !== true && 'value' in subqueries.sorting) {
          const sortingValueList = subqueries.sorting.value as { value: string; ascOrDesc: 'ASC' | 'DESC' }[]
          sortingValueList.forEach(({ value, ascOrDesc }) => {
            const orderByExpression = new OrderBy(value,ascOrDesc)
            sorting.push(orderByExpression)
          })
        }
        else {
          params.sorting = new OrderBy(`total_${summaryVariables[0]}`, 'DESC')
        }

        params.limit = topX
  
        return params
      }
    },
    {
      type: 'callDataService',
      dataServiceQuery: ['purchase_order', 'purchase_order'],
      onResult(res, params, { moment, groupByEntity, codeColumnName, nameColumnName, summaryVariables }: Result): any[] {

        // if(groupByEntity=='coloader'){
        //   codeColumnName="linerAgentPartyCode";
        //   nameColumnName="linerAgentPartyName";
        // }
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
        multi: false,
        required: true,
      },
      type: 'list',
    },

    {
      display: 'summaryVariables',
      name: 'summaryVariables',
      props: {
        items: [
            ...summaryVariableList.reduce((acc,summaryVariable) => {

                acc = acc.concat(
                    [
                        {
                            label: `${summaryVariable}`,
                            value: `${summaryVariable}`,
                        }
                    ]
                )

                return acc

            },[])
        ],
        multi : true,
        required: true,
      },
      type: 'list',
    },
    {
      display: 'groupByEntity',
      name: 'groupByEntity',
      props: {
        items: [
            ...groupByEntityList.reduce((acc,groupByEntity) => {

                acc = acc.concat(
                    [
                        {
                            label: `${groupByEntity}`,
                            value: `${groupByEntity}`,
                        }
                    ]
                )

                return acc

            },[])
        ],
        required: true,
      },
      type: 'list',
    },

    {
      display: 'bottomSheetGroupByEntity',
      name: 'bottomSheetGroupByEntity',
      props: {
        items: [
            ...groupByEntityList.reduce((acc,groupByEntity) => {

                acc = acc.concat(
                    [
                        {
                            label: `${groupByEntity}`,
                            value: `${groupByEntity=='coloader'?'linerAgent':groupByEntity}`,
                        }
                    ]
                )

                return acc

            },[])
        ],
        required: true,
      },
      type: 'list',
    },

    {
      display: 'sorting',
      name: 'sorting',
      type: 'sorting',
      props: {
        multi: true,
        items: [
              ...summaryVariableList.reduce((acc,summaryVariable) => {

                acc = acc.concat(
                    [
                        {
                            label: `total_${summaryVariable}`,
                            value: `total_${summaryVariable}`,
                        }
                    ]
                )

                return acc

            },[])
          ],
      }
    }
  ]
} as JqlDefinition

