import { QueryDef } from 'classes/query/QueryDef'
import {
  Query,
  FromTable,
  BinaryExpression,
  ColumnExpression,
  BetweenExpression,
  InExpression,
  FunctionExpression,
  Unknown,
  IsNullExpression,
  ResultColumn,
  ParameterExpression,
  MathExpression,
} from 'node-jql'
const query = new QueryDef(
  new Query({
    $select: [
      new ResultColumn(new ColumnExpression('alert', '*')),
    ],

    $from: new FromTable('alert'),
  })
)

// ===== register field

query
  .registerResultColumn(
    'count',

    new ResultColumn(new FunctionExpression('COUNT', new ParameterExpression('DISTINCT', new ColumnExpression('alert', 'id'))), 'count')
  )

// ======== register filter ====
query
  .register(
    'primaryKey',
    new Query({
      $where: new InExpression(new ColumnExpression('alert', 'primarykey'), false),
    })
  )
  .register('value', 0)

query
  .register(
    'alertType',
    new Query({
      $where: new BinaryExpression(new ColumnExpression('alert', 'alertType'), '='),
    })
  )
  .register('value', 0)

query
  .register(
    'createdAt',
    new Query({
      $where: new BetweenExpression(new ColumnExpression('alert', 'createdAt'), false),
    })
  )
  .register('from', 0)
  .register('to', 1)

query
  .register(
    'entityType',
    new Query({
      $where: new BinaryExpression(new ColumnExpression('alert', 'tableName'), '='),
    })
  )
  .register('value', 0)

query
  .register(
    'alertCategory',
    new Query({
      $where: new InExpression(new ColumnExpression('alert', 'alertCategory'), false),
    })
  )
  .register('value', 0)
query
  .register(
    'severity',
    new Query({
      $where: new InExpression(new ColumnExpression('alert', 'severity'), false),
    })
  )
  .register('value', 0)
query
  .register(
    'moduleTypeCode',
    new Query({
      $where: new BinaryExpression(
        new MathExpression(
          new ColumnExpression('alert', 'flexData'),
          '->>',
          '$.entity.moduleTypeCode'
        ),
        '='
      ),
    })
  )
  .register('value', 1)

query.register(
  'isActive',
  new Query({
    $where: [
      new IsNullExpression(new ColumnExpression('alert', 'deletedAt'), false),
      new IsNullExpression(new ColumnExpression('alert', 'deletedBy'), false),
    ],
  })
)
export default query
