import { QueryDef } from 'classes/query/QueryDef'
import { Query, FromTable, BinaryExpression, ColumnExpression, InExpression, LikeExpression, IsNullExpression } from 'node-jql'

const query = new QueryDef(new Query({
  $distinct: true,
  $from: new FromTable('invitation', 'invitation',
    {
      operator: 'LEFT',
      table: new FromTable('person', 'person'),
      $on: [
        new BinaryExpression(new ColumnExpression('person', 'id'), '=', new ColumnExpression('invitation', 'personId'))
      ]
    },
    {
      operator: 'LEFT',
      table: new FromTable('token', 'token'),
      $on: [
        new BinaryExpression(new ColumnExpression('token', 'id'), '=', new ColumnExpression('invitation', 'tokenId'))
      ]
    }
  ),
}))

query.register('status', new Query({
  $where: new BinaryExpression(new ColumnExpression('invitation', 'status'), '=')
})).register('value', 0)

query.register('statuses', new Query({
  $where: new InExpression(new ColumnExpression('invitation', 'status'), false)
})).register('value', 0)

query.register('userName', new Query({
  $where: new LikeExpression({ left: new ColumnExpression('person', 'userName'), operator: 'REGEXP' })
})).register('value', 0)

query.register('firstName', new Query({
  $where: new LikeExpression({ left: new ColumnExpression('person', 'firstName'), operator: 'REGEXP' })
})).register('value', 0)

query.register('lastName', new Query({
  $where: new LikeExpression({ left: new ColumnExpression('person', 'lastName'), operator: 'REGEXP' })
})).register('value', 0)

query.register('displayName', new Query({
  $where: new LikeExpression({ left: new ColumnExpression('person', 'displayName'), operator: 'REGEXP' })
})).register('value', 0)

query.register('isActive', new Query({
  $where: [
    new IsNullExpression(new ColumnExpression('invitation', 'deletedAt'), false),
    new IsNullExpression(new ColumnExpression('invitation', 'deletedBy'), false),
    new IsNullExpression(new ColumnExpression('person', 'deletedBy'), false),
    new IsNullExpression(new ColumnExpression('person', 'deletedBy'), false),
    new IsNullExpression(new ColumnExpression('token', 'deletedBy'), false),
    new IsNullExpression(new ColumnExpression('token', 'deletedBy'), false),
  ]
}))

export default query
