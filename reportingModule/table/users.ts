import { Query, FromTable } from 'node-jql'

const query = new Query({
  $distinct: true,
  $from: new FromTable(
    {
      method: 'POST',
      url: 'api/person/query/person',
      columns: [
        {
          name: 'userName',
          type: 'string',
        },
        {
          name: 'firstName',
          type: 'string',
        },
        {
          name: 'lastName',
          type: 'string',
        },
        {
          name: 'displayName',
          type: 'string',
        },
      ],
    },
    'user'
  ),
})

export default query.toJson()
