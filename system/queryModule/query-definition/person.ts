import { QueryDef } from 'classes/query/QueryDef'
import {
  Query,
  FromTable,
  BinaryExpression,
  ColumnExpression,
  RegexpExpression,
  IsNullExpression,
  InExpression,
  ResultColumn,
  Unknown,
  Value,
  OrExpressions,
  AndExpressions,
  JoinClause,
  GroupBy
} from 'node-jql'

const query = new QueryDef(
  new Query({
    $from: new FromTable(
      'person',
      {
        operator: 'LEFT',
        table: 'invitation',
        $on: [
          new BinaryExpression(
            new ColumnExpression('person', 'id'),
            '=',
            new ColumnExpression('invitation', 'personId')
          ),
        ],
      },
      {
        operator: 'LEFT',
        table: 'parties_person',
        $on: [
          new BinaryExpression(
            new ColumnExpression('person', 'id'),
            '=',
            new ColumnExpression('parties_person', 'personId')
          ),
        ],
      },
      {
        operator: 'LEFT',
        table: 'party',
        $on: [
          new BinaryExpression(
            new ColumnExpression('party', 'id'),
            '=',
            new ColumnExpression('parties_person', 'partyId')
          ),
        ],
      },
      {
        operator: 'LEFT',
        table: 'person_contact',
        $on: [
          new BinaryExpression(
            new ColumnExpression('person', 'id'),
            '=',
            new ColumnExpression('person_contact', 'personId')
          ),
        ],
      }
    ),
  })
)

query.register(
  'search',
  new Query({

    $select: new ResultColumn(new ColumnExpression('person','userName'),'userphotoURL'),
    $where:  new InExpression(new ColumnExpression('person','userName'),false,new Unknown()),
    $group:  new GroupBy(new ColumnExpression('person','userName'))
  })
).register('value',0)

query.register(
  'primaryKey',
  new Query({
    $select: [
      new ResultColumn(new ColumnExpression('person', 'id'), 'primaryKey'),
    ]
  })
)

query
  .register(
    'primaryKeyList',
    new Query({
      $where: new InExpression(new ColumnExpression('person', 'id'), false),
    })
  )
  .register('value', 0)

query
  .register(
    'invitationStatus',
    new Query({
      $where: new BinaryExpression(
        `(CASE WHEN invitation.deletedAt is not null AND invitation.deletedBy is not null THEN 'disabled' else invitation.status END)`,
        '='
      ),
    })
  )
  .register('value', 0)

query
  .register(
    'invitationStatuses',
    new Query({
      $where: new InExpression(
        new ColumnExpression(
          `(CASE WHEN invitation.deletedAt is not null AND invitation.deletedBy is not null THEN 'disabled' else invitation.status END)`,
          'status'
        ),
        false
      ),
    })
  )
  .register('value', 0)

query
  .register(
    'userName',
    new Query({
      $where: new RegexpExpression(new ColumnExpression('person', 'userName'), false),
    })
  )
  .register('value', 0)

query
  .register(
    'firstName',
    new Query({
      $where: new RegexpExpression(new ColumnExpression('person', 'firstName'), false),
    })
  )
  .register('value', 0)

query
  .register(
    'lastName',
    new Query({
      $where: new RegexpExpression(new ColumnExpression('person', 'lastName'), false),
    })
  )
  .register('value', 0)

query
  .register(
    'displayName',
    new Query({
      $where: new RegexpExpression(new ColumnExpression('person', 'displayName'), false),
    })
  )
  .register('value', 0)

query
  .register(
    'role',
    new Query({
      $where: new InExpression(
        new ColumnExpression('person', 'id'),
        false,
        new Query({
          $select: 'personId',
          $from: 'person_role',
          $where: [
            new BinaryExpression(
              new ColumnExpression('person', 'id'),
              '=',
              new ColumnExpression('person_role', 'personId')
            ),
            new InExpression(new ColumnExpression('roleId'), false),
          ],
        })
      ),
    })
  )
  .register('value', 0)

      // will have 2 options, active and deleted
  // isActive
  const isActiveConditionExpression = new AndExpressions([
    new IsNullExpression(new ColumnExpression('person', 'deletedAt'), false),
    new IsNullExpression(new ColumnExpression('person', 'deletedBy'), false),
    new IsNullExpression(new ColumnExpression('parties_person', 'deletedAt'), false),
    new IsNullExpression(new ColumnExpression('parties_person', 'deletedBy'), false),
    new IsNullExpression(new ColumnExpression('party', 'deletedAt'), false),
    new IsNullExpression(new ColumnExpression('party', 'deletedBy'), false),
    new IsNullExpression(new ColumnExpression('person_contact', 'deletedAt'), false),
    new IsNullExpression(new ColumnExpression('person_contact', 'deletedBy'), false),
  ])

  query.registerBoth('isActive', isActiveConditionExpression)

  query.registerQuery('isActive', new Query({

    $where : new OrExpressions([

      new AndExpressions([

        new BinaryExpression(new Value('active'), '=', new Unknown('string')),
        // active case
        isActiveConditionExpression
      ]),

      new AndExpressions([
        new BinaryExpression(new Value('deleted'), '=', new Unknown('string')),
        // deleted case
        new BinaryExpression(isActiveConditionExpression, '=', false)
      ])

    ])

  }))
  .register('value', 0)
  .register('value', 1)

query.table('person_team', {
  $from: new FromTable('person', new JoinClause('LEFT', 'person_team', new BinaryExpression(new ColumnExpression('person', 'id'), '=', new ColumnExpression('person_team', 'personId'))))
})

query.field('distinct-team', {
  $distinct: true,
  $select: new ResultColumn(new ColumnExpression('person_team', 'team'), 'team')
}, 'table:person_team')

query.subquery('teamNotNull', {
  $where: new IsNullExpression(new ColumnExpression('person_team', 'team'), true)
})

export default query
