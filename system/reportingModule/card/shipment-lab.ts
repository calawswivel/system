import { JqlDefinition } from 'modules/report/interface'
import { IQueryParams } from 'classes/query'
import { OrderBy } from 'node-jql'
import Moment = require('moment')

import { expandGroupEntity,expandSummaryVariable, extendDate, handleBottomSheetGroupByEntityValue, expandBottomSheetGroupByEntity, handleGroupByEntityValue, summaryVariableList } from 'utils/card'



interface Result {
  moment: typeof Moment
  groupByEntity: string
  codeColumnName: string
  nameColumnName: string
  summaryVariables: string[]
}

var summaryVariableListlab:any=[];
var final;

export default {


    jqls: [
     
      
      {
        type: 'prepareParams',
        defaultResult: {},
        async prepareParams(params, prevResult: Result, user): Promise<IQueryParams> {
          const subqueries = params.subqueries || {}
      
          params.fields = [
              'id',
              'masterNo',
              'houseNo',
          ],
      
          params.limit = 10
          console.debug("PARAMS")
          console.debug(params)
          console.debug("PREVRESULTS")
          console.debug(prevResult)
          return params
          
        }
      },
      {
        type: 'callDataService',
        dataServiceQuery: ['shipment', 'lab'],
        onResult(res, params, { moment, groupByEntity, codeColumnName, nameColumnName, summaryVariables }: Result): any[] {
     console.debug("First callDataService")
          console.debug(res)
          const codeValue = params.subqueries.code.value as string
          const finalResult = res.map(row => {
      
              const newRow = { ...row, code : row[codeValue] }
              return newRow
          })
          final=finalResult;
          return finalResult
        }
      },
      {
        //for getting the Fields
        type: 'prepareParams',
        defaultResult: {},
        async prepareParams(params, {}: Result, user): Promise<IQueryParams> {
      
          return {}
          
        }
      },
      {
        type: 'callDataService',
        dataServiceQuery: ['fields', 'fields'],
        onResult(res, {},{}: Result): void {
          console.debug("2nd call data SVC")
          console.debug(res)
          //remove unwanted Fields
          const unwanted=['id','partyGroupCode'];
          for (let i of unwanted){
              res=res.filter(o=>o.COLUMN_NAME!=i);

          }
          console.debug("after FIlter")
          console.debug(res);

          for(let i of res){
            summaryVariableListlab.push({
              label:i.COLUMN_NAME,
              value:i.COLUMN_NAME
            })
          }
          console.debug("summaryVariableListlab")
          console.debug(summaryVariableListlab);
          return final;
        }
      },
  
   
    ],
    filters: [
    {
        display: 'code',
        name: 'code',
        props: {
          items: [
            {
              label: 'houseNo',
              value: 'houseNo',
            },
            {
              label: 'masterNo',
              value: 'masterNo',
            },
            {
              label: 'jobNo',
              value: 'jobNo',
            },
    
          ],
          required: true,
        },
        type: 'list',
      },
      {
        display: 'summaryVariable',
        name: 'summaryVariable',
        props: {
          items: summaryVariableListlab,
          multi: false,
          required: true,
        },
        type: 'list',
      },
   
    
  ]
} as JqlDefinition

