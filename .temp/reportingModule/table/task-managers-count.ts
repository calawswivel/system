import { JqlDefinition } from 'modules/report/interface'

export default {
  jqls: [
    {
      type: 'callDataService',
      dataServiceType: 'count',
      dataServiceQuery: ['taskManager', 'task_manager']
    }
  ],
  columns: [
    { key: 'count' }
  ]
} as JqlDefinition

/* import { Query, FromTable } from 'node-jql'

const query = new Query({
  $distinct: true,
  $from: new FromTable(
    {
      method: 'POST',
      url: 'api/taskManager/query/task_manager/count',
      columns: [{ name: 'count', type: 'number' }],
    },
    'user'
  ),
})

export default query.toJson() */
