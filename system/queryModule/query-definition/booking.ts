import { QueryDef } from 'classes/query/QueryDef'
import {
  Query,
  FromTable,
  ResultColumn,
  GroupBy,
  BinaryExpression,
  BetweenExpression,
  RegexpExpression,
  ColumnExpression,
  FunctionExpression,
  ParameterExpression,
  InExpression,
  IsNullExpression,
  OrExpressions,
  AndExpressions,
  Value,
  IExpression,
  CaseExpression,
  Unknown,
  IConditionalExpression,
  ICase,
  MathExpression,
  QueryExpression,
  ExistsExpression,
} from 'node-jql'
import { IQueryParams } from 'classes/query'
import {
  convertToEndOfDate,
  convertToStartOfDate,
  addDateExpression,
  ExpressionHelperInterface,
  registerAll,
  registerSummaryField,
  NestedSummaryCondition,
  registerNestedSummaryFilter,
  SummaryField,
  registerAllDateField,
  registerCheckboxField,
  IfExpression,
  IfNullExpression,
  RegisterInterface,
} from 'utils/jql-subqueries'
import { supportSopTask } from 'utils/sop-task'

const dateNameList = [
  'departure',
  'arrival',
  //'oceanBill',
  'cargoReady',
  'scheduleAssigned',
  'scheduleApproaved',
  'spaceConfirmation',
  'bookingSubmit',
  'cyCutOff',
  'documentCutOff',
  'pickup',
  'shipperLoad',
  'returnLoad',
  'cargoReceipt',
  'shipperDocumentSubmit',
  'shipperInstructionSubmit',
  'houseBillDraftSubmit',
  'houseBillConfirmation',
  'masterBillReleased',
  'preAlertSend',
  'ediSend',
  'cargoRolloverStatus',
  'inboundTransfer',
  'onRail',
  'arrivalAtDepot',
  'availableForPickup',
  'pickupCargoBeforeDemurrage',
  'finalCargo',
  'cargoPickupWithDemurrage',
  'finalDoorDelivery',
  'returnEmptyContainer',
  'sentToShipper',
  'gateIn',
  'sentToConsignee',
  'loadOnboard'
]
//for Bookings

const partyList = [
  {
    name: 'shipper',
  },
  {
    name: 'consignee',
  },
  {
    name: 'agent'
  },
  {
    name: 'roAgent',
  },
  {
    name: 'linerAgent',
  },
  {
    name: 'office',
    override: 'forwarder'
  },
  {
    name: 'controllingCustomer',
  },
  {
    name: 'forwarder',
  },
  {
    name: 'controllingParty'
  }
] as {
  name: string,
  override: string,
  partyNameExpression?: {
    companion: string[],
    expression: IExpression
  },
  partyIdExpression?: {
    companion: string[],
    expression: IExpression
  },
  partyCodeExpression?: {
    companion: string[],
    expression: IExpression
  },
  partyNameInReportExpression?: {
    companion: string[],
    expression: IExpression
  }
  partyShortNameInReportExpression?: {
    companion: string[],
    expression: IExpression
  }
}[]

const locationList = ['portOfLoading', 'portOfDischarge', 'placeOfDelivery', 'placeOfReceipt', 'finalDestination']


const query = new QueryDef(
  new Query({
    // $distinct: true,
    $select: [
      new ResultColumn(new ColumnExpression('booking', '*')),
      new ResultColumn(new ColumnExpression('booking', 'id'), 'bookingId'),
    ],
    $from: new FromTable(
      'booking'
    ),
  })
)

query.table('booking_date', new Query({
  $from: new FromTable({
    table: 'booking',
    joinClauses: [
      {
        operator: 'LEFT',
        table: new FromTable({
          table: new Query({
            $select: [
              new ResultColumn(new ColumnExpression('booking_date', '*')),
            ],
            $from: new FromTable('booking_date', 'booking_date'),
            $where: new AndExpressions({
              expressions: [
                new IsNullExpression(new ColumnExpression('booking_date', 'deletedAt'), false),
                new IsNullExpression(new ColumnExpression('booking_date', 'deletedBy'), false),
              ]
            }),
          }),
          $as: 'booking_date'
        }),
        $on: new BinaryExpression(new ColumnExpression('booking', 'id'), '=', new ColumnExpression('booking_date', 'bookingId'))
      }
    ]
  })
}))

query.table('booking_party', new Query({
  $from: new FromTable({
    table: 'booking',
    joinClauses: [
      {
        operator: 'LEFT',
        table: new FromTable({
          table: new Query({
            $select: [
              new ResultColumn(new ColumnExpression('booking_party', '*')),
            ],
            $from: new FromTable('booking_party', 'booking_party'),
            $where: new AndExpressions({
              expressions: [
                new IsNullExpression(new ColumnExpression('booking_party', 'deletedAt'), false),
                new IsNullExpression(new ColumnExpression('booking_party', 'deletedBy'), false),
              ]
            }),
          }),
          $as: 'booking_party'
        }),
        $on: new BinaryExpression(new ColumnExpression('booking', 'id'), '=', new ColumnExpression('booking_party', 'bookingId'))
      },
    ]
  })
}))

query.table('booking_amount', new Query({
  $from: new FromTable({
    table: 'booking',
    joinClauses: [
      {
        operator: 'LEFT',
        table: new FromTable({
          table: new Query({
            $select: [
              new ResultColumn(new ColumnExpression('booking_amount', 'bookingId'), 'bookingId'),
            ],
            $from: new FromTable('booking_amount', 'booking_amount'),
            $group: new GroupBy([
              new ColumnExpression('bookingId')
            ])
          }),
          $as: 'booking_amount'
        }),
        $on: new BinaryExpression(new ColumnExpression('booking', 'id'), '=', new ColumnExpression('booking_amount', 'bookingId'))
      },
    ]
  })
}))

query.table('booking_container', new Query({

  $from: new FromTable({

    table: 'booking',
    joinClauses: [
      {
        operator: 'LEFT',
        table: new FromTable({
          table: new Query({
            $select: [
              new ResultColumn(
                new ColumnExpression('booking_container', 'bookingId'),
                'booking_container_bookingId'
              ),
              new ResultColumn(
                new FunctionExpression(
                  'group_concat',
                  new ParameterExpression({
                    expression: new ColumnExpression('booking_container', 'containerTypeCode'),
                    suffix: 'SEPARATOR \', \'',
                  })
                ),
                'containerTypeCode'
              ),
              new ResultColumn(
                new FunctionExpression(
                  'group_concat',
                  new ParameterExpression({
                    expression: new ColumnExpression('booking_container', 'containerNo'),
                    suffix: 'SEPARATOR \', \'',
                  })
                ),
                'containerNo'
              ),
              new ResultColumn(
                new FunctionExpression(
                  'group_concat',
                  new ParameterExpression({
                    expression: new ColumnExpression('booking_container', 'soNo'),
                    suffix: 'SEPARATOR \', \'',
                  })
                ),
                'soNo'
              ),
              new ResultColumn(
                new FunctionExpression(
                  'group_concat',
                  new ParameterExpression({
                    expression: new ColumnExpression('booking_container', 'sealNo'),
                    suffix: 'SEPARATOR \', \'',
                  })
                ),
                'sealNo'
              ),
              new ResultColumn(
                new FunctionExpression(
                  'SUM',
                  new ColumnExpression('booking_container', 'quantity')
                ),
                'quantity'
              ),
            ],
            $from: new FromTable('booking_container', 'booking_container'),
            $where: new AndExpressions({
              expressions: [
                new IsNullExpression(new ColumnExpression('booking_container', 'deletedAt'), false),
                new IsNullExpression(new ColumnExpression('booking_container', 'deletedBy'), false),
              ],
            }),
            $group: new GroupBy([new ColumnExpression('booking_container', 'bookingId')]),
          }),
          $as: 'booking_container',
        }),
        $on: new BinaryExpression(
          new ColumnExpression('booking', 'id'),
          '=',
          new ColumnExpression('booking_container', 'booking_container_bookingId')
        ),
      },
    ]

  })

}))

query.table('booking_popacking', new Query({

  $from: new FromTable({

    table: 'booking',
    joinClauses: [
      {
        operator: 'LEFT',
        table: new FromTable({
          table: new Query({
            $select: [
              new ResultColumn(
                new ColumnExpression('booking_popacking', 'bookingId'),
                'booking_popacking_bookingId'
              ),
              new ResultColumn(
                new FunctionExpression('SUM', new ColumnExpression('booking_popacking', 'volume')),
                'volume'
              ),
              new ResultColumn(
                new FunctionExpression('SUM', new ColumnExpression('booking_popacking', 'weight')),
                'weight'
              ),
              new ResultColumn(
                new FunctionExpression('SUM', new ColumnExpression('booking_popacking', 'ctns')),
                'ctns'
              ),
              new ResultColumn(
                new FunctionExpression(
                  'SUM',
                  new ColumnExpression('booking_popacking', 'quantity')
                ),
                'quantity'
              ),
            ],
            $from: new FromTable('booking_popacking', 'booking_popacking'),
            $where: new AndExpressions({
              expressions: [
                new IsNullExpression(new ColumnExpression('booking_popacking', 'deletedAt'), false),
                new IsNullExpression(new ColumnExpression('booking_popacking', 'deletedBy'), false),
              ],
            }),
            $group: new GroupBy([new ColumnExpression('booking_popacking', 'bookingId')]),
          }),
          $as: 'booking_popacking',
        }),
        $on: new BinaryExpression(
          new ColumnExpression('booking', 'id'),
          '=',
          new ColumnExpression('booking_popacking', 'booking_popacking_bookingId')
        ),
      },
    ]
  })

}))

query.table('booking_reference', new Query({

  $from: new FromTable({

    table: 'booking',
    joinClauses: [
      {
        operator: 'LEFT',
        table: new FromTable({
          table: new Query({
            $select: [
              new ResultColumn(
                new ColumnExpression('booking_reference', 'bookingId'),
                'booking_reference_bookingId'
              ),
              new ResultColumn(
                new FunctionExpression(
                  'group_concat',
                  new ParameterExpression({
                    expression: new ColumnExpression('booking_reference', 'refName'),
                    suffix: 'SEPARATOR \', \'',
                  })
                ),
                'refName'
              ),
              new ResultColumn(
                new FunctionExpression(
                  'group_concat',
                  new ParameterExpression({
                    expression: new ColumnExpression('booking_reference', 'refDescription'),
                    suffix: 'SEPARATOR \', \'',
                  })
                ),
                'refDescription'
              ),
            ],
            $from: new FromTable('booking_reference', 'booking_reference'),
            $where: new AndExpressions({
              expressions: [
                new IsNullExpression(new ColumnExpression('booking_reference', 'deletedAt'), false),
                new IsNullExpression(new ColumnExpression('booking_reference', 'deletedBy'), false),
              ],
            }),
            $group: new GroupBy([new ColumnExpression('booking_reference', 'bookingId')]),
          }),
          $as: 'booking_reference',
        }),
        $on: new BinaryExpression(
          new ColumnExpression('booking', 'id'),
          '=',
          new ColumnExpression('booking_reference', 'booking_reference_bookingId')
        ),
      },
    ]
  })
}))

query.table('carrier', new Query({
  $from: new FromTable({
    table: 'booking',
    joinClauses: [
      {
        operator: 'LEFT',
        table: new FromTable('code_master', 'carrier'),
        $on: [
          new BinaryExpression(
            new ColumnExpression('carrier', 'codeType'),
            '=',
            new Value('CARRIER')
          ),
          new BinaryExpression(
            new ColumnExpression('booking', 'carrierCode'),
            '=',
            new ColumnExpression('carrier', 'code')
          ),
          new OrExpressions({
            expressions: [
              new BinaryExpression(new ColumnExpression('booking', 'partyGroupCode'), '=', new ColumnExpression('carrier', 'partyGroupCode')),
              new IsNullExpression(new ColumnExpression('carrier', 'partyGroupCode'), false),
            ]
          }),
        ],
      },
    ]
  })
}))

query.table('moduleType', new Query({

  $from: new FromTable({
    table: 'booking',

    joinClauses: [
      {
        operator: 'LEFT',
        table: new FromTable('code_master', 'moduleType'),
        $on: [
          new BinaryExpression(
            new ColumnExpression('moduleType', 'codeType'),
            '=',
            new Value('MODULE')
          ),

          new BinaryExpression(
            new ColumnExpression('booking', 'moduleTypeCode'),
            '=',
            new ColumnExpression('moduleType', 'code')
          ),
          new OrExpressions({
            expressions: [
              new BinaryExpression(new ColumnExpression('booking', 'partyGroupCode'), '=', new ColumnExpression('moduleType', 'partyGroupCode')),
              new IsNullExpression(new ColumnExpression('moduleType', 'partyGroupCode'), false),
            ]
          }),
        ],
      },

    ]
  })
}))

query.table('boundType', new Query({

  $from: new FromTable({
    table: 'booking',
    joinClauses: [
      {
        operator: 'LEFT',
        table: new FromTable('code_master', 'boundType'),
        $on: [
          new BinaryExpression(
            new ColumnExpression('boundType', 'codeType'),
            '=',
            new Value('BOUND')
          ),
          new BinaryExpression(
            new ColumnExpression('booking', 'boundTypeCode'),
            '=',
            new ColumnExpression('boundType', 'code')
          ),
          new OrExpressions({
            expressions: [
              new BinaryExpression(new ColumnExpression('booking', 'partyGroupCode'), '=', new ColumnExpression('boundType', 'partyGroupCode')),
              new IsNullExpression(new ColumnExpression('boundType', 'partyGroupCode'), false),
            ]
          }),
        ],
      },
    ]
  })
}))

query.table('service', new Query({
  $from: new FromTable({
    table: 'booking',
    joinClauses: [
      {
        operator: 'LEFT',
        table: new FromTable('code_master', 'service'),
        $on: [
          new BinaryExpression(new ColumnExpression('service', 'codeType'), '=', new Value('SERVTYPE')),
          new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new ColumnExpression('service', 'code')),
          new OrExpressions({
            expressions: [
              new BinaryExpression(new ColumnExpression('booking', 'partyGroupCode'), '=', new ColumnExpression('service', 'partyGroupCode')),
              new IsNullExpression(new ColumnExpression('service', 'partyGroupCode'), false),
            ]
          }),
        ],
      },
    ]
  })
}))

query.table('shipmentType', new Query({
  $from: new FromTable({
    table: 'booking',
    joinClauses: [
      {
        operator: 'LEFT',
        table: new FromTable('code_master', 'shipmentType'),
        $on: [
          new BinaryExpression(new ColumnExpression('shipmentType', 'codeType'), '=', new Value('SHIPTYPE')),
          new BinaryExpression(new ColumnExpression('booking', 'shipmentTypeCode'), '=', new ColumnExpression('shipmentType', 'code')),
          new OrExpressions({
            expressions: [
              new BinaryExpression(new ColumnExpression('booking', 'partyGroupCode'), '=', new ColumnExpression('shipmentType', 'partyGroupCode')),
              new IsNullExpression(new ColumnExpression('shipmentType', 'partyGroupCode'), false),
            ]
          }),
        ],
      },
    ]
  })
}))

query.table('incoTerms', new Query({

  $from: new FromTable({
    table: 'booking',

    joinClauses: [
      {
        operator: 'LEFT',
        table: new FromTable('code_master', 'incoTerms'),
        $on: [
          new BinaryExpression(new ColumnExpression('incoTerms', 'codeType'), '=', new Value('INCOTERMS')),
          new BinaryExpression(new ColumnExpression('booking', 'incoTermsCode'), '=', new ColumnExpression('incoTerms', 'code')),
          new OrExpressions({
            expressions: [
              new BinaryExpression(new ColumnExpression('booking', 'partyGroupCode'), '=', new ColumnExpression('incoTerms', 'partyGroupCode')),
              new IsNullExpression(new ColumnExpression('incoTerms', 'partyGroupCode'), false),
            ]
          }),
        ],
      },
    ]
  })
}))

query.table('freightTerms', new Query({

  $from: new FromTable({
    table: 'booking',

    joinClauses: [
      {
        operator: 'LEFT',
        table: new FromTable('code_master', 'freightTerms'),
        $on: [
          new BinaryExpression(
            new ColumnExpression('freightTerms', 'codeType'),
            '=',
            new Value('PAYTERMS')
          ),

          new BinaryExpression(
            new ColumnExpression('booking', 'freightTermsCode'),
            '=',
            new ColumnExpression('freightTerms', 'code')
          ),
          new OrExpressions({
            expressions: [
              new BinaryExpression(new ColumnExpression('booking', 'partyGroupCode'), '=', new ColumnExpression('freightTerms', 'partyGroupCode')),
              new IsNullExpression(new ColumnExpression('freightTerms', 'partyGroupCode'), false),
            ]
          }),
        ],
      },
    ]
  })
}))

query.table('otherTerms', new Query({

  $from: new FromTable({
    table: 'booking',

    joinClauses: [
      {
        operator: 'LEFT',
        table: new FromTable('code_master', 'otherTerms'),
        $on: [
          new BinaryExpression(
            new ColumnExpression('otherTerms', 'codeType'),
            '=',
            new Value('PAYTERMS')
          ),

          new BinaryExpression(
            new ColumnExpression('booking', 'otherTermsCode'),
            '=',
            new ColumnExpression('otherTerms', 'code')
          ),
          new OrExpressions({
            expressions: [
              new BinaryExpression(new ColumnExpression('booking', 'partyGroupCode'), '=', new ColumnExpression('otherTerms', 'partyGroupCode')),
              new IsNullExpression(new ColumnExpression('otherTerms', 'partyGroupCode'), false),
            ]
          }),
        ],
      }
    ]
  })
}))



// party join : table:office, table:shipper etc
partyList.map(party => {

  const override = party.override || party.name

  const partyTableName = party.name

  const companion = (party.partyIdExpression && party.partyIdExpression.companion) ? party.partyIdExpression.companion : [`table:booking_party`]
  const partyIdExpression = (party.partyIdExpression && party.partyIdExpression.expression) ? party.partyIdExpression.expression : new ColumnExpression('booking_party', `${override}PartyId`)

  query.table(partyTableName, new Query({

    $from: new FromTable({

      table: 'booking',
      joinClauses: [
        {
          operator: 'LEFT',
          table: new FromTable('party', override),
          $on: [
            new BinaryExpression(
              partyIdExpression,
              '=',
              new ColumnExpression(override, 'id')
            ),
          ],
        }
      ]
    })

  }), ...companion)

})
const ErpSiteExpression = new MathExpression(
  new ColumnExpression('forwarder', 'thirdPartyCode'),
  '->>',
  '$.\"erp-site\"'
)




const dateStatusExpression = (queryParam: IQueryParams) => {

  const subqueryParam = queryParam.subqueries.dateStatus as any as { today: any, currentTime: any }

  if (!subqueryParam) {
    throw new Error(`missing dateStatus in subqueries`)
  }

  const rawATAExpression = new ColumnExpression('booking_date', 'arrivalDateActual')
  const rawETAExpression = new ColumnExpression('booking_date', 'arrivalDateEstimated')

  const rawATDExpression = new ColumnExpression('booking_date', 'departureDateActual')
  const rawETDExpression = new ColumnExpression('booking_date', 'departureDateEstimated')

  const AIRDateStatusExpression = (subqueryParam) => {

    // const todayExpression = new FunctionExpression('NOW')
    const todayExpression = new Value(subqueryParam.today)
    const currentTimeExpression = new Value(subqueryParam.currentTime)

    const calculatedATAExpression = new CaseExpression({
      cases: [
        {
          $when: new IsNullExpression(rawETAExpression, true),
          $then: convertToEndOfDate(rawETAExpression)
        },
        {
          $when: new IsNullExpression(rawETDExpression, true),
          $then: convertToEndOfDate(addDateExpression(rawETDExpression, 2, 'DAY'))
        }

      ],

      $else: new Value(null)

    })

    const calculatedATDExpression = convertToStartOfDate(addDateExpression(rawETDExpression, 1, 'DAY'))
    const finalATAExpression = new FunctionExpression('IFNULL', rawATAExpression, calculatedATAExpression)
    const finalATDExpression = new FunctionExpression('IFNULL', rawATDExpression, calculatedATDExpression)

    const finalATAInPast = new BinaryExpression(finalATAExpression, '<=', currentTimeExpression)
    const finalATDInPast = new BinaryExpression(new FunctionExpression('DATE', finalATDExpression), '<=', todayExpression)

    return new CaseExpression({

      cases: [

        {
          $when: finalATAInPast,
          $then: new CaseExpression({

            cases: [
              {
                $when: new BinaryExpression(convertToEndOfDate(addDateExpression(finalATAExpression, 1, 'DAY')), '<=', currentTimeExpression),
                $then: new Value('inDelivery')
              },
            ],

            $else: new Value('arrival')
          })
        },

        {

          $when: finalATDInPast,
          $then: new CaseExpression({

            cases: [
              {
                $when: new BinaryExpression(new FunctionExpression('DATE', finalATDExpression), '=', todayExpression),
                $then: new Value('departure')
              },

            ],

            $else: new Value('inTransit')
          })
        }

      ],
      $else: new Value('upcoming')
    })

  }

  const SEADateStatusExpression = (subqueryParam) => {

    const todayExpression = new Value(subqueryParam.today)
    const currentTimeExpression = new Value(subqueryParam.currentTime)

    const calculatedATAExpression = addDateExpression(rawETAExpression, 2, 'DAY')
    const calculatedATDExpression = addDateExpression(rawETDExpression, 1, 'DAY')
    const finalATAExpression = new FunctionExpression('IFNULL', rawATAExpression, calculatedATAExpression)
    const finalATDExpression = new FunctionExpression('IFNULL', rawATDExpression, calculatedATDExpression)

    const finalATAInPast = new BinaryExpression(finalATAExpression, '<=', todayExpression)
    const finalATDInPast = new BinaryExpression(finalATDExpression, '<=', todayExpression)

    return new CaseExpression({

      cases: [

        {
          $when: finalATAInPast,
          $then: new CaseExpression({
            cases: [
              {
                $when: new BinaryExpression(addDateExpression(finalATAExpression, 3, 'DAY'), '<=', todayExpression),
                $then: new Value('inDelivery')
              } as ICase,
            ],

            $else: new Value('arrival')
          }
          )
        },

        {
          $when: finalATDInPast,
          $then: new CaseExpression({
            cases: [
              {
                $when: new AndExpressions([
                  new BinaryExpression(addDateExpression(finalATDExpression, 3, 'DAY'), '<=', todayExpression)
                ]),
                $then: new Value('inTransit')
              } as ICase,
            ],

            $else: new Value('departure')
          }
          )
        },

        // {
        //   $when : new AndExpressions([
        //     new IsNullExpression(finalATAExpression, false),
        //     new BinaryExpression(addDateExpression(finalATDExpression, 'add', 3, 'DAY'), '<=', todayExpression)
        //   ]),
        //   $then : new Value('inTransit')
        // } as ICase,
        // {
        //   $when : new AndExpressions([

        //     new IsNullExpression(finalATAExpression, false),
        //     new BetweenExpression(finalATDExpression, false, todayExpression, addDateExpression(todayExpression, 'add', 3, 'DAY'))

        //   ]),
        //   $then : new Value('departure')
        // } as ICase,

        // {
        //   $when : new AndExpressions([
        //     new IsNullExpression(finalATAExpression, false),
        //     new BinaryExpression(finalATDExpression, '<', todayExpression)
        //   ]),
        //   $then : new Value('upcoming')
        // } as ICase,

      ],

      $else: new Value('upcoming')
    })
  }

  const result = new CaseExpression({

    cases: [
      {
        $when: new BinaryExpression(new ColumnExpression('booking', 'moduleTypeCode'), '=', 'AIR'),
        $then: AIRDateStatusExpression(subqueryParam)
      },
      {
        $when: new BinaryExpression(new ColumnExpression('booking', 'moduleTypeCode'), '=', 'SEA'),
        $then: SEADateStatusExpression(subqueryParam)
      }

    ],
    $else: new Value(null)
  })

  return result

}

// location table :  table:portOfLoading, table:portOfDischarge
locationList.map(location => {
  const joinTableName = `${location}`
  const locationCode = `${location}Code`
  // location join (e.g. portOfLoadingJoin)
  query.table(joinTableName, new Query({
    $from: new FromTable({
      table: 'booking',
      joinClauses: [{
        operator: 'LEFT',
        table: new FromTable({
          table: 'location',
          $as: `${location}`
        }),
        $on: [
          new BinaryExpression(new ColumnExpression(`${location}`, 'portCode'), '=', new ColumnExpression('booking', locationCode)),
        ]
      }, {
        operator: 'LEFT',
        table: new FromTable({
          table: 'code_master',
          $as: `${location}Country`
        }),
        $on: [
          new BinaryExpression(new ColumnExpression(`${location}`, 'countryCode'), '=', new ColumnExpression(`${location}Country`, 'code')),
          new BinaryExpression(new ColumnExpression(`${location}Country`, 'codeType'), '=', 'COUNTRY'),
          new OrExpressions({
            expressions: [
              new BinaryExpression(new ColumnExpression('booking', 'partyGroupCode'), '=', new ColumnExpression(`${location}Country`, 'partyGroupCode')),
              new IsNullExpression(new ColumnExpression(`${location}Country`, 'partyGroupCode'), false),
            ]
          }),
        ]
      }]
    }),

    $where: new IsNullExpression(new ColumnExpression('booking', locationCode), true)

  })
  )

})

// used for statusJoin
const bookingTrackingLastStatusCodeTableExpression = new Query({

  $select: [
    new ResultColumn(new ColumnExpression('tracking', 'trackingNo')),
    new ResultColumn(new ColumnExpression('tracking', 'lastStatusCode')),
    new ResultColumn(new ColumnExpression('tracking', 'lastStatusDescription')),
    new ResultColumn(new ColumnExpression('tracking', 'lastStatusDate')),
    new ResultColumn(new ColumnExpression('tracking', 'lastEstimatedUpdateDate')),
    new ResultColumn(new ColumnExpression('tracking', 'lastActualUpdateDate'))
  ],

  $from: 'tracking'

})

const bookingTrackingStatusCodeTableExpression = new Query({

  $select: [
    new ResultColumn(new ColumnExpression('tracking', 'trackingNo')),
    new ResultColumn(new ColumnExpression('tracking', 'lastStatusCode')),
    new ResultColumn(new ColumnExpression('tracking', 'lastStatusDate')),
    new ResultColumn(new ColumnExpression('tracking', 'lastEstimatedUpdateDate')),
    new ResultColumn(new ColumnExpression('tracking', 'lastActualUpdateDate')),

    new ResultColumn(new ColumnExpression('tracking_status', 'trackingId')),
    new ResultColumn(new ColumnExpression('tracking_status', 'statusCode')),
    new ResultColumn(new ColumnExpression('tracking_status', 'statusDate')),
  ],

  $from: new FromTable({
    table: 'tracking',
    joinClauses: [

      {
        operator: 'LEFT',
        $on: new BinaryExpression(new ColumnExpression('tracking_status', 'trackingId'), '=', new ColumnExpression('tracking', 'id')),
        table: new FromTable('tracking_status')
      }
    ]
  })

})

// statusJoin : table:status
query.table('status', new Query(
  {
    $from: new FromTable('booking', {

      operator: 'LEFT',
      table: new FromTable({

        table: bookingTrackingStatusCodeTableExpression,
        $as: 'bookingTrackingStatusCodeTable',

      }),

      $on: new BinaryExpression(new ColumnExpression('bookingTrackingStatusCodeTable', 'trackingNo'), '=', new ColumnExpression('booking', 'currentTrackingNo'))

    })

  }))

// lastStatusJoin : table:lastStatus
query.table('lastStatus', new Query({

  $from: new FromTable('booking', {

    operator: 'LEFT',
    table: new FromTable({

      table: bookingTrackingLastStatusCodeTableExpression,
      $as: 'bookingTrackingLastStatusCodeTable',

    }),
    $on: new BinaryExpression(new ColumnExpression('bookingTrackingLastStatusCodeTable', 'trackingNo'), '=', new ColumnExpression('booking', 'currentTrackingNo'))

  })

}))

//  alert Join
// warning !!! this join will create duplicate record of booking
// plz use wisely, mainly use together with group by

// alertJoin : table:alert
query.table('alert', new Query({

  $from: new FromTable('booking', {

    operator: 'LEFT',
    table: 'alert',

    $on: [
      new BinaryExpression(new ColumnExpression('alert', 'tableName'), '=', 'booking'),
      new BinaryExpression(new ColumnExpression('alert', 'primaryKey'), '=', new ColumnExpression('booking', 'id'))
    ]

  }),

  $where: new IsNullExpression(new ColumnExpression('alert', 'id'), true)

})
)

//  register date field
// const createdAtExpression = new FunctionExpression(
//   'IFNULL',
//   new ColumnExpression('booking', 'bookingCreateTime'),
//   new ColumnExpression('booking', 'createdAt')
// )

var createdAtExpression = IfNullExpression(new ColumnExpression('booking', 'bookingCreateTime'), new ColumnExpression('booking', 'createdAt'));
var ETDExpression = new ColumnExpression('booking_date', 'departureDateEstimated');



const updatedAtExpression = new FunctionExpression(
  'IFNULL',
  new ColumnExpression('booking', 'bookingLastUpdateTime'),
  new ColumnExpression('booking', 'updatedAt')
)
query.table('createdPerson', new Query({
  $from: new FromTable({
    table: 'booking',
    joinClauses: [
      {
        operator: 'LEFT',
        table: new FromTable('person', 'createdPerson'),
        $on: [
          new BinaryExpression(
            new ColumnExpression('booking', 'createdBy'),
            '=',
            new ColumnExpression('createdPerson', 'userName')
          )
        ],
      }
    ]
  })
}))
query.table('updatedPerson', new Query({
  $from: new FromTable({
    table: 'booking',
    joinClauses: [
      {
        operator: 'LEFT',
        table: new FromTable('person', 'updatedPerson'),
        $on: [
          new BinaryExpression(
            new ColumnExpression('booking', 'updatedBy'),
            '=',
            new ColumnExpression('updatedPerson', 'userName')
          )
        ],
      }
    ]
  })
}))
const createdByExpression = IfNullExpression(
  new ColumnExpression('booking', 'createdUserId'),
  new FunctionExpression(
    'if',
    new OrExpressions({
      expressions: [
        new IsNullExpression(new ColumnExpression('createdPerson', 'displayName'), true),
        new IsNullExpression(new ColumnExpression('createdPerson', 'firstName'), true),
        new IsNullExpression(new ColumnExpression('createdPerson', 'lastName'), true),
      ]
    }),
    IfNullExpression(
      new ColumnExpression('createdPerson', 'displayName'),
      new FunctionExpression('CONCAT', new ColumnExpression('createdPerson', 'firstName'), ' ', new ColumnExpression('createdPerson', 'lastName'))
    ),
    new ColumnExpression('booking', 'createdBy')
  ),
)
const updatedByExpression = IfNullExpression(
  new ColumnExpression('booking', 'updatedUserId'),
  new FunctionExpression(
    'if',
    new OrExpressions({
      expressions: [
        new IsNullExpression(new ColumnExpression('updatedPerson', 'displayName'), true),
        new IsNullExpression(new ColumnExpression('updatedPerson', 'firstName'), true),
        new IsNullExpression(new ColumnExpression('updatedPerson', 'lastName'), true),
      ]
    }),
    IfNullExpression(
      new ColumnExpression('updatedPerson', 'displayName'),
      new FunctionExpression('CONCAT', new ColumnExpression('updatedPerson', 'firstName'), ' ', new ColumnExpression('updatedPerson', 'lastName'))
    ),
    new ColumnExpression('booking', 'updatedBy')
  ),
  // IfNullExpression(
  //   new ColumnExpression('updatedPerson', 'displayName'),
  //   new FunctionExpression('CONCAT', new ColumnExpression('updatedPerson', 'firstName'), ' ', new ColumnExpression('updatedPerson', 'lastName'))
  // )
)

var jobDateExpression = createdAtExpression

const jobYearExpression = new FunctionExpression('LPAD', new FunctionExpression('YEAR', jobDateExpression), 4, '0')

const jobMonthExpression = new FunctionExpression('CONCAT', new FunctionExpression('YEAR', jobDateExpression),
  '-',
  new FunctionExpression('LPAD', new FunctionExpression('MONTH', jobDateExpression), 2, '0'))

const jobWeekExpression = new FunctionExpression('LPAD', new FunctionExpression('WEEK', jobDateExpression), 2, '0')

// ============

const isActiveConditionExpression = new AndExpressions([
  new IsNullExpression(new ColumnExpression('booking', 'deletedAt'), false),
  new IsNullExpression(new ColumnExpression('booking', 'deletedBy'), false)
])

const activeStatusExpression = new CaseExpression({
  cases: [
    {
      $when: new BinaryExpression(isActiveConditionExpression, '=', false),
      $then: new Value('deleted')
    }
  ],
  $else: new Value('active')
})

const lastStatusCodeExpression = new ColumnExpression('bookingTrackingLastStatusCodeTable', 'lastStatusCode')  // booking_tracking
const lastStatusDateExpression = new ColumnExpression('bookingTrackingLastStatusCodeTable', 'lastStatusDate')
const lastStatusCodeOrDescriptionExpression = new FunctionExpression('IFNULL', new ColumnExpression('bookingTrackingLastStatusCodeTable', 'lastStatusCode'),
  new ColumnExpression('bookingTrackingLastStatusCodeTable', 'lastStatusDescription'))


function lastStatusExpressionFunction() {

  const lastStatusCodeMap = {

    // left side is called laststatus
    // right side is called lastStatusCode

    notInTrack: [null, 'NEW', 'CANF', 'ERR'],
    processing: ['BKCF', 'EPRL', 'STSP', 'BKD'],
    cargoReady: ['GITM', 'LOBD', 'RCS', 'MNF', 'MAN'],
    departure: ['DLPT', 'DEP'],
    inTransit: ['TSLB', 'TSDC', 'TAP', 'TDE'],
    arrival: ['BDAR', 'DSCH', 'DECL', 'PASS', 'TMPS', 'ARR', 'RWB', 'RCF', 'CUS', 'NFD'],
    delivered: ['STCS', 'RCVE', 'END', 'DLV']

  }

  const cases = []

  for (const lastStatus in lastStatusCodeMap) {
    if (lastStatusCodeMap.hasOwnProperty(lastStatus)) {

      const lastStatusCodeList = lastStatusCodeMap[lastStatus] as any[]

      let condition = new InExpression(lastStatusCodeExpression, false, lastStatusCodeList) as IConditionalExpression

      if (lastStatusCodeList.includes(null)) {

        condition = new OrExpressions([
          new IsNullExpression(lastStatusCodeExpression, false),
          condition
        ])

      }

      cases.push({
        $when: condition,
        $then: new Value(lastStatus)
      } as ICase)

    }
  }

  return new CaseExpression({
    cases,
    $else: lastStatusCodeExpression
  })

}

const lastStatusExpression = lastStatusExpressionFunction()

const carrierCodeExpression = new ColumnExpression('booking', 'carrierCode')

const carrierNameExpression = new FunctionExpression(
  'IFNULL',
  new ColumnExpression('carrier', 'name'),
  new FunctionExpression(
    'IFNULL',
    new ColumnExpression('booking', 'carrierName'),
    carrierCodeExpression
  )
)

const alertTypeExpression = new ColumnExpression('alert', 'alertType')
const alertTableNameExpression = new ColumnExpression('alert', 'tableName')
const alertPrimaryKeyExpression = new ColumnExpression('alert', 'primaryKey')

const alertSeverityExpression = new ColumnExpression('alert', 'severity')
const alertTitleExpression = new FunctionExpression('CONCAT', new ColumnExpression('alert', 'alertType'), new Value('Title'))

const alertMessageExpression = new CaseExpression({
  cases: [
    {
      // retrieve custom message from flexData
      $when: new BinaryExpression(new ColumnExpression('alert', 'alertCategory'), '=', 'Message'),
      $then: new MathExpression(
        new ColumnExpression('alert', 'flexData'),
        '->>',
        '$.customMessage'
      )
    }

  ],

  // shipmentEtaChanged => shipmentEtaChangedTitle, later will put in i18n
  $else: new FunctionExpression('CONCAT', new ColumnExpression('alert', 'alertType'), new Value('Message'))
})

const alertCategoryExpression = new ColumnExpression('alert', 'alertCategory')

const alertStatusExpression = new ColumnExpression('alert', 'status')

const alertCreatedAtExpression = new ColumnExpression('alert', 'createdAt')
const alertUpdatedAtExpression = new ColumnExpression('alert', 'updatedAt')

const alertContentExpression = new ColumnExpression('alert', 'flexData')

const poNoExpression = new MathExpression(
  new ColumnExpression('booking', 'flexData'),
  '->>',
  '$.poNo'
)

const serviceExpression = new FunctionExpression(
  'IFNULL',
  new ColumnExpression('service', 'name'),
  new ColumnExpression('booking', 'serviceCode')
)

const shipmentTypeExpression = new FunctionExpression(
  'IFNULL',
  new ColumnExpression('shipmentType', 'name'),
  new ColumnExpression('booking', 'shipmentTypeCode')
)

const moduleTypeExpression = new FunctionExpression(
  'IFNULL',
  new ColumnExpression('moduleType', 'name'),
  new ColumnExpression('booking', 'moduleTypeCode')
)

const boundTypeExpression = new FunctionExpression(
  'IFNULL',
  new ColumnExpression('boundType', 'name'),
  new ColumnExpression('booking', 'boundTypeCode')
)

const incoTermsExpression = new FunctionExpression(
  'IFNULL',
  new ColumnExpression('incoTerms', 'name'),
  new ColumnExpression('booking', 'incoTermsCode')
)

const otherTermsExpression = new FunctionExpression(
  'IFNULL',
  new ColumnExpression('otherTerms', 'name'),
  new ColumnExpression('booking', 'incoTermsCode')
)

const freightTermsExpression = new FunctionExpression(
  'IFNULL',
  new ColumnExpression('freightTerms', 'name'),
  new ColumnExpression('booking', 'freightTermsCode')
)

const shipmentIdExpression = new QueryExpression(new Query({
  $select: [
    new ResultColumn(new ColumnExpression('shipment_booking', 'shipmentId'))
  ],
  $from: new FromTable({
    table: 'shipment_booking',
    joinClauses: [{
      operator: 'LEFT',
      table: 'shipment',
      $on: [new BinaryExpression(new ColumnExpression('shipment_booking', 'shipmentId'), '=', new ColumnExpression('shipment', 'id'))]
    }]
  }),
  $where: [
    new IsNullExpression(new ColumnExpression('shipment', 'deletedAt'), false),
    new IsNullExpression(new ColumnExpression('shipment', 'deletedBy'), false),
    new BinaryExpression(new ColumnExpression('shipment', 'boundTypeCode'), '=', 'O'),
    new BinaryExpression(new ColumnExpression('shipment_booking', 'bookingNo'), '=', new ColumnExpression('booking', 'bookingNo'))
  ],
  $order: [
    {
      expression: new ColumnExpression('shipment', 'id')
    }
  ],
  $limit: 1
}))

// SELECT `booking_reference`.`refDescription`
//       FROM  `booking_reference`
//       WHERE `booking`.`id` = `booking_reference`.`bookingId` and (`booking_reference`.`refName` = "HBL" or `booking_reference`.`refName` = "HAWB")

const bookingHouseNoExpression = new QueryExpression(new Query({
  $select: [
    new ResultColumn(new ColumnExpression('booking_reference', 'refDescription'))
  ],
  $from: new FromTable({
    table: 'booking_reference'
  }),
  $where: new AndExpressions([
    new BinaryExpression(new ColumnExpression('booking', 'id'), '=', new ColumnExpression('booking_reference', 'bookingId')),
    new OrExpressions([
      new BinaryExpression(new ColumnExpression('booking_reference', 'refName'), '=', 'HBL'),
      new BinaryExpression(new ColumnExpression('booking_reference', 'refName'), '=', 'HAWB'),
    ])
  ]),
  $limit: 1
}))

const bookingMasterNoExpression = new QueryExpression(new Query({
  $select: [
    new ResultColumn(new ColumnExpression('booking_reference', 'refDescription'))
  ],
  $from: new FromTable({
    table: 'booking_reference'
  }),
  $where: new AndExpressions([
    new BinaryExpression(new ColumnExpression('booking', 'id'), '=', new ColumnExpression('booking_reference', 'bookingId')),
    new OrExpressions([
      new BinaryExpression(new ColumnExpression('booking_reference', 'refName'), '=', 'MBL'),
      new BinaryExpression(new ColumnExpression('booking_reference', 'refName'), '=', 'MAWB'),
    ])
  ]),
  $limit: 1
}))


const shipmentMasterNoExpression = new QueryExpression(new Query({
  $select: [
    new ResultColumn(new ColumnExpression('shipment', 'masterNo'))
  ],
  $from: new FromTable({
    table: 'shipment_booking',
    joinClauses: [{
      operator: 'LEFT',
      table: 'shipment',
      $on: [new BinaryExpression(new ColumnExpression('shipment_booking', 'shipmentId'), '=', new ColumnExpression('shipment', 'id'))]
    }]
  }),
  $where: [
    new IsNullExpression(new ColumnExpression('shipment', 'deletedAt'), false),
    new IsNullExpression(new ColumnExpression('shipment', 'deletedBy'), false),
    new BinaryExpression(new ColumnExpression('shipment', 'boundTypeCode'), '=', 'O'),
    new BinaryExpression(new ColumnExpression('shipment_booking', 'bookingNo'), '=', new ColumnExpression('booking', 'bookingNo'))
  ],
  $order: [
    {
      expression: new ColumnExpression('shipment', 'id')
    }
  ],
  $limit: 1
}))

const shipmentHouseNoExpression = new QueryExpression(new Query({
  $select: [
    new ResultColumn(new ColumnExpression('shipment', 'houseNo'))
  ],
  $from: new FromTable({
    table: 'shipment_booking',
    joinClauses: [{
      operator: 'LEFT',
      table: 'shipment',
      $on: [new BinaryExpression(new ColumnExpression('shipment_booking', 'shipmentId'), '=', new ColumnExpression('shipment', 'id'))]
    }]
  }),
  $where: [
    new IsNullExpression(new ColumnExpression('shipment', 'deletedAt'), false),
    new IsNullExpression(new ColumnExpression('shipment', 'deletedBy'), false),
    new BinaryExpression(new ColumnExpression('shipment', 'boundTypeCode'), '=', 'O'),
    new BinaryExpression(new ColumnExpression('shipment_booking', 'bookingNo'), '=', new ColumnExpression('booking', 'bookingNo'))
  ],
  $order: [
    {
      expression: new ColumnExpression('shipment', 'id')
    }
  ],
  $limit: 1
}))

const houseNoExpression = new FunctionExpression(
  'IF',
  new IsNullExpression(shipmentIdExpression, true),
  shipmentHouseNoExpression,
  bookingHouseNoExpression,
)

const masterNoExpression = new FunctionExpression(
  'IF',
  new IsNullExpression(shipmentIdExpression, true),
  shipmentMasterNoExpression,
  bookingMasterNoExpression,
)


// all field related to party
const partyExpressionList = partyList.reduce((accumulator: ExpressionHelperInterface[], party) => {

  const partyFieldList = [

    //  very special case , get back the value from the party join
    'PartyNameInReport',
    'PartyShortNameInReport',

    'PartyId',
    'PartyName',
    'PartyCode',
    'PartyContactPersonId',
    'PartyContactName',
    'PartyContactEmail',
    'PartyContactPhone',
    'PartyContactIdentity',
    'PartyContacts',
    'PartyIdentity',
    'PartyAddress'
  ]

  const override = party.override || party.name

  const partyTableName = party.name

  const partyIdExpression = party.partyIdExpression || { expression: new ColumnExpression('booking_party', `${override}PartyId`), companion: ['table:booking_party'] }
  const partyNameExpression = party.partyNameExpression || { expression: new ColumnExpression('booking_party', `${override}PartyName`), companion: ['table:booking_party'] }
  const partyCodeExpression = party.partyCodeExpression || {
    expression: new FunctionExpression(
      'IFNULL',
      new ColumnExpression('booking_party', `${partyTableName}PartyCode`),
      new ColumnExpression('booking_party', `${partyTableName}PartyId`)
    ),
    companion: ['table:booking_party']
  }
  const partyNameInReportExpression = party.partyNameInReportExpression || { expression: new ColumnExpression(party.name, `name`), companion: [`table:${override}`] }
  const partyShortNameInReportExpression = party.partyShortNameInReportExpression || { expression: new FunctionExpression('IFNULL', new ColumnExpression(override, `shortName`), partyNameInReportExpression.expression), companion: [`table:${override}`] }

  const resultExpressionList = partyFieldList.map(partyField => {

    let finalExpressionInfo: { expression: IExpression, companion: string[] }

    switch (partyField) {

      case 'PartyCode':
        finalExpressionInfo = partyCodeExpression
        break

      case 'PartyName':
        finalExpressionInfo = partyNameExpression
        break

      case 'PartyId':
        finalExpressionInfo = partyIdExpression
        break

      // PartyReportName will get from party join instead of booking_party direct;y
      case 'PartyNameInReport':
        finalExpressionInfo = partyNameInReportExpression
        break

      case 'PartyShortNameInReport':
        finalExpressionInfo = partyShortNameInReportExpression
        break

      default:
        finalExpressionInfo = { expression: new ColumnExpression('booking_party', `${override}${partyField}`) as IExpression, companion: ['table:booking_party'] }
        break
    }

    return {
      name: `${partyTableName}${partyField}`,
      ...finalExpressionInfo
    } as ExpressionHelperInterface
  })

  return accumulator.concat(resultExpressionList)
}, [])

const locationExpressionList = locationList.reduce((accumulator: ExpressionHelperInterface[], location) => {

  const locationCodeExpressionInfo = {
    name: `${location}Code`,
    expression: new ColumnExpression('booking', `${location}Code`),
  } as ExpressionHelperInterface

  const locationCountryCodeExpressionInfo = {
    name: `${location}CountryCode`,
    expression: new ColumnExpression(`${location}`, `countryCode`),
    companion: [`table:${location}`]
  } as ExpressionHelperInterface
  const locationCountryNameExpressionInfo = {
    name: `${location}CountryName`,
    expression: new ColumnExpression(`${location}Country`, `name`),
    companion: [`table:${location}`]
  } as ExpressionHelperInterface

  const locationLatitudeExpressionInfo = {
    name: `${location}Latitude`,
    expression: new ColumnExpression(`${location}`, `latitude`),
    companion: [`table:${location}`]
  } as ExpressionHelperInterface

  const locationLongitudeExpressionInfo = {
    name: `${location}Longitude`,
    expression: new ColumnExpression(`${location}`, `longitude`),
    companion: [`table:${location}`]
  } as ExpressionHelperInterface

  accumulator.push(locationCodeExpressionInfo)
  accumulator.push(locationCountryCodeExpressionInfo)

  accumulator.push(locationCountryNameExpressionInfo)
  accumulator.push(locationLatitudeExpressionInfo)
  accumulator.push(locationLongitudeExpressionInfo)

  return accumulator

}, [])

const containerTypeCodeExpression = new ColumnExpression('booking_container', 'containerTypeCode')
const soNoExpression = new ColumnExpression('booking_container', 'soNo')
const containerNoExpression = new ColumnExpression('booking_container', 'containerNo')

const vesselNameExpression = new FunctionExpression(
  'IFNULL',
  new ColumnExpression('booking', 'vesselName'),
  new ColumnExpression('booking', 'proposedVesselName')
)

const voyageFlightNumberNameExpression = new FunctionExpression(
  'IFNULL',
  new ColumnExpression('booking', 'voyageFlightNumber'),
  new ColumnExpression('booking', 'proposedVoyageFlightNumber')
)

const baseTableName = 'booking'


const idExpression = new ColumnExpression('booking', 'id')
const documentFileNameList = [
  'Freight Invoice',
  'MBL',
  'HBL Original',
  'HBL Telex released',
  'Commercial Invoice',
  'Packing List',
  'Quotation',
]

const haveDocumentExpressionList = documentFileNameList.map(documentFileName => {

  const haveDocumentExpression = new InExpression(idExpression, false,
    new QueryExpression(
      new Query({

        $select: [
          new ResultColumn(new ColumnExpression('document', 'primaryKey'))
        ],
        $from: 'document',
        $where: [
          new BinaryExpression(new ColumnExpression('document', 'fileName'), '=', documentFileName),
          new BinaryExpression(new ColumnExpression('document', 'tableName'), '=', 'booking'),

          new IsNullExpression(new ColumnExpression('document', 'deletedAt'), false),
          new IsNullExpression(new ColumnExpression('document', 'deletedBy'), false)

        ]

      })
    )
  )

  return {
    name: `haveDocument_${documentFileName}`,
    expression: haveDocumentExpression

  } as RegisterInterface


})

const otherDocumentExpression = {
  name: 'haveDocument_OTHER',
  expression: new InExpression(idExpression, false,
    new QueryExpression(
      new Query({
        $select: [new ResultColumn(new ColumnExpression('document', 'primaryKey'))],
        $from: 'document',
        $where: [
          new InExpression(new ColumnExpression('document', 'fileName'), true, documentFileNameList),
          new BinaryExpression(new ColumnExpression('document', 'tableName'), '=', 'booking'),
          new IsNullExpression(new ColumnExpression('document', 'deletedAt'), false),
          new IsNullExpression(new ColumnExpression('document', 'deletedBy'), false)
        ]
      })
    )
  )
}

const rSalesmanCodeExpression = new ColumnExpression('booking', 'rSalesmanPersonCode')
const cSalesmanCodeExpression = new ColumnExpression('booking', 'cSalesmanPersonCode')
const sSalesmanCodeExpression = new ColumnExpression('booking', 'sSalesmanPersonCode')

const salesmanCodeExpression = new CaseExpression({
  cases: [
    {
      $when: new IsNullExpression(
        rSalesmanCodeExpression, true
      ),
      $then: rSalesmanCodeExpression
    },
    {
      $when: new BinaryExpression(
        new ColumnExpression('booking', 'boundTypeCode'),
        '=',
        'O'
      ),
      $then: sSalesmanCodeExpression
    },
    {
      $when: new BinaryExpression(
        new ColumnExpression('booking', 'boundTypeCode'),
        '=',
        'I'
      ),
      $then: cSalesmanCodeExpression
    }
  ],
  $else: null
})

const fieldList = [
  'id',
  'partyGroupCode',
  'bookingNo',
  'moduleTypeCode',
  'boundTypeCode',
  'nominatedTypeCode',
  //'shipmentTypeCode',
  'divisionCode',
  'isDirect',
  // 'isCoload',

  {
    name: 'finalVesselName',
    expression: vesselNameExpression
  },
  {
    name: 'ErpSite',
    expression: ErpSiteExpression,
    companion: ['table:forwarder']
  },
  {
    name: 'finalVoyageFlightNumber',
    expression: voyageFlightNumberNameExpression
  },
  {
    name: 'totalQuantity',
    expression: new ColumnExpression('booking', 'quantity')
  },
  {
    name: 'totalQuantityUnit',
    expression: new ColumnExpression('booking', 'quantityUnit')
  },
  {
    name: 'bookingGrossWeight',
    expression: new FunctionExpression('ROUND', new ColumnExpression('booking', 'grossWeight'), 3)
  },
  {
    name: 'bookingChargeableWeight',
    expression: new FunctionExpression('ROUND', new ColumnExpression('booking', 'chargeableWeight'), 3)
  },
  {
    name: 'bookingVolumeWeight',
    expression: new FunctionExpression('ROUND', new ColumnExpression('booking', 'volumeWeight'), 3)
  },
  {
    name: 'bookingWeightUnit',
    expression: new ColumnExpression('booking', 'weightUnit')
  },
  {
    name: 'bookingCbm',
    expression: new FunctionExpression('ROUND', new ColumnExpression('booking', 'cbm'), 3)
  },
  {
    name: 'specialInstruction',
    expression: new MathExpression(
      new ColumnExpression('booking', 'flexData'),
      '->>',
      '$.specialInstruction'
    )
  },
  {
    name: 'haveCurrentTrackingNo',
    expression: new FunctionExpression('IF', new IsNullExpression(new ColumnExpression('booking', 'currentTrackingNo'), false), '', '_')
  },
  {
    name: 'dateStatus',
    expression: dateStatusExpression,
    companion: ['table:booking_date']
  },
  ...partyExpressionList,
  ...locationExpressionList,

  {
    name: 'shipmentId',
    expression: shipmentIdExpression,
    companion: ['table:booking_party']
  },
  {

    name: 'houseNo',
    expression: houseNoExpression,
    companion: ['table:booking_reference']
  },
  {

    name: 'masterNo',
    expression: masterNoExpression
  },

  {

    name: 'poNo',
    expression: poNoExpression
  },

  {
    name: 'containerTypeCode',
    expression: containerTypeCodeExpression,
    companion: ['table:booking_container']
  },
  {
    name: 'allSoNo',
    expression: soNoExpression,
    companion: ['table:booking_container']
  },
  {
    name: 'allContainerNo',
    expression: containerNoExpression,
    companion: ['table:booking_container']
  },


  {
    name: 'service',
    expression: serviceExpression,
    companion: ['table:service']
  },

  {
    name: 'shipmentType',
    expression: shipmentTypeExpression,
    companion: ['table:shipmentType']
  },

  {
    name: 'moduleType',
    expression: moduleTypeExpression,
    companion: ['table:moduleType']
  },

  {
    name: 'boundType',
    expression: boundTypeExpression,
    companion: ['table:boundType']
  },

  {
    name: 'incoTerms',
    expression: incoTermsExpression,
    companion: ['table:incoTerms']
  },
  {
    name: 'otherTerms',
    expression: otherTermsExpression,
    companion: ['table:otherTerms']
  },
  {
    name: 'freightTerms',
    expression: freightTermsExpression,
    companion: ['table:freightTerms']
  },

  {
    name: 'jobDate',
    expression: jobDateExpression
  },

  {
    name: 'createdAt',
    expression: createdAtExpression
  },
  {
    name: 'updatedAt',
    expression: updatedAtExpression
  },
  {
    name: 'createdBy',
    expression: createdByExpression,
    companion: ['table:createdPerson']
  },
  {
    name: 'updatedBy',
    expression: updatedByExpression,
    companion: ['table:updatedPerson']
  },
  {
    name: 'bookingVolume',
    expression: new Value(0)
  },

  {
    name: 'jobMonth',
    expression: jobMonthExpression
  },

  {
    name: 'jobWeek',
    expression: jobWeekExpression
  },

  {
    name: 'jobYear',
    expression: jobYearExpression
  },

  {
    name: 'carrierName',
    expression: carrierNameExpression,
    companion: ['table:carrier']
  },
  {
    name: 'carrierCode',
    expression: carrierCodeExpression
  },
  {
    name: 'alertTableName',
    expression: alertTableNameExpression,
    companion: ['table:alert']
  },
  {
    name: 'alertPrimaryKey',
    expression: alertPrimaryKeyExpression,
    companion: ['table:alert']
  },
  {
    name: 'alertSeverity',
    expression: alertSeverityExpression,
    companion: ['table:alert']
  },
  {
    name: 'alertType',
    expression: alertTypeExpression,
    companion: ['table:alert']
  },
  {
    name: 'alertTitle',
    expression: alertTitleExpression,
    companion: ['table:alert']
  },
  {
    name: 'alertMessage',
    expression: alertMessageExpression,
    companion: ['table:alert']
  },
  {
    name: 'alertCategory',
    expression: alertCategoryExpression,
    companion: ['table:alert']
  },
  {
    name: 'alertContent',
    expression: alertContentExpression,
    companion: ['table:alert']
  },
  {
    name: 'alertStatus',
    expression: alertStatusExpression,
    companion: ['table:alert']
  },
  {
    name: 'activeStatus',
    expression: activeStatusExpression
  },
  {
    name: 'activeStatusHidden',
    expression: activeStatusExpression
  },
  {
    name: 'lastStatusCode',
    expression: lastStatusCodeExpression,
    companion: ['table:lastStatus']
  },
  {
    name: 'lastStatus',
    expression: lastStatusExpression,
    companion: ['table:lastStatus']
  },
  {
    name: 'lastStatusDate',
    expression: lastStatusDateExpression,
    companion: ['table:lastStatus']
  },
  {
    name: 'lastStatusCodeOrDescription',
    expression: lastStatusCodeOrDescriptionExpression,
    companion: ['table:lastStatus']
  },
  {
    name: 'salesmanCode',
    expression: salesmanCodeExpression
  },

  {
    name: 'rSalesmanCode',
    expression: rSalesmanCodeExpression,
  },
  ...haveDocumentExpressionList,
  otherDocumentExpression,
] as ExpressionHelperInterface[]

registerAll(query, baseTableName, fieldList)

// ===================================

// summary fields  =================


// warning !!! will not contain all if the list is too large
query.registerResultColumn('primaryKeyListString',
  new ResultColumn(new FunctionExpression('GROUP_CONCAT', new ParameterExpression('DISTINCT', new ColumnExpression('booking', 'id'))), 'primaryKeyListString')
)

query.register(
  'count',
  new ResultColumn(new FunctionExpression('COUNT', new ParameterExpression('DISTINCT', new ColumnExpression('booking', 'id'))), 'count')
)

query
  .register(
    'alertCount',
    new ResultColumn(new FunctionExpression('COUNT', new ParameterExpression('DISTINCT', new ColumnExpression('alert', 'id'))), 'alertCount')
  )


//general Card any Party Role
// search all party in partyList
query.subquery(false, 'anyPartyId', ((value: any, params?: IQueryParams) => {

  const partyIdList = value.value
  const inExpressionList = partyList.reduce((acc, party) => {
    if (party.name == 'office') party.name = 'forwarder' //override

    const defaultPartyIdExpression = new ColumnExpression('booking_party', `${party.name}PartyId`)
    const partyIdExpression = party.partyIdExpression ? party.partyIdExpression.expression : defaultPartyIdExpression

    const inPartyInExpression = new InExpression(partyIdExpression, false, partyIdList)

    acc.push(inPartyInExpression)
    return acc

  }, [])

  return new Query({
    $where: new OrExpressions(inExpressionList)
  })
}), 'table:booking_party')

//  register summary field
// summary fields  =================

const nestedSummaryList = [

  {
    name: 'frc',
    companion: ['table:booking_party', 'table:booking_date'],
    cases: [
      {
        typeCode: 'F',
        condition: new AndExpressions([
          new BinaryExpression(new ColumnExpression('booking', 'nominatedTypeCode'), '=', 'F'),
          new ExistsExpression(new Query({

            $from: 'party_type',
            $where: [
              new BinaryExpression(new ColumnExpression('party_type', 'partyId'), '=', new ColumnExpression('booking_party', 'controllingCustomerPartyId')),
              new BinaryExpression(new ColumnExpression('party_type', 'type'), '=', 'forwarder')
            ]

          }), true)
        ])

      },
      {
        typeCode: 'R',
        condition: new AndExpressions([
          new BinaryExpression(new ColumnExpression('booking', 'nominatedTypeCode'), '=', 'R'),
          new ExistsExpression(new Query({

            $from: 'party_type',
            $where: [
              new BinaryExpression(new ColumnExpression('party_type', 'partyId'), '=', new ColumnExpression('booking_party', 'controllingCustomerPartyId')),
              new BinaryExpression(new ColumnExpression('party_type', 'type'), '=', 'forwarder')
            ]

          }), true)
        ])
      },
      {
        typeCode: 'C',
        condition: new AndExpressions([
          new ExistsExpression(new Query({

            $from: 'party_type',
            $where: [
              new BinaryExpression(new ColumnExpression('party_type', 'partyId'), '=', new ColumnExpression('booking_party', 'controllingCustomerPartyId')),
              new BinaryExpression(new ColumnExpression('party_type', 'type'), '=', 'forwarder')
            ]

          }), false)
        ])
      }
    ]
  },

  {

    name: 'fr',
    companion: ['table:booking_date'],
    cases: [
      {
        typeCode: 'F',
        condition: new BinaryExpression(new ColumnExpression('booking', 'nominatedTypeCode'), '=', 'F')
      },
      {
        typeCode: 'R',
        condition: new BinaryExpression(new ColumnExpression('booking', 'nominatedTypeCode'), '=', 'R')
      },
    ]
  }

] as NestedSummaryCondition[]


registerNestedSummaryFilter(query, nestedSummaryList)

const fclExpression = new OrExpressions([
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('FCL/FCL')),
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('CY /CY')),
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('CY /DOOR')),
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('CY /DR')),
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('CY/FO')),
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('DOOR/CY')),
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('DOOR/DOOR')),
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('DR /CY')),
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('DR /DR')),
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('RAIL/RAIL'))
])

const lclExpression = new OrExpressions([
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('LCL/LCL')),
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('CFS/CFS')),
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('CFS/CY')),
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('CFS/DOOR')),
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('CFS/DR')),
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('CFS/FO')),
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('CY /CFS')),
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('FAS/FAS')),
  // new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('DOOR/CFS'))
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('CY /CFS')),
  new BinaryExpression(new ColumnExpression('booking', 'serviceCode'), '=', new Value('DOOR/CFS'))
])

const summaryFieldList: SummaryField[] = [
  {
    name: 'totalBooking',
    summaryType: 'count',
    expression: new ColumnExpression('booking', 'id')
  },
  {
    name: 'quantity',
    summaryType: 'sum',
    expression: new ColumnExpression('booking', 'quantity'),
  },

  {
    name: 'cbm',
    summaryType: 'sum',
    expression: new ColumnExpression('booking', 'cbm')
  },
  {
    name: 'teu',
    summaryType: 'sum',
    expression: new ColumnExpression('booking', 'teu'),

    inReportExpression: new FunctionExpression('IF',
      fclExpression,
      new ColumnExpression('booking', 'teu'),
      new FunctionExpression('ROUND', new MathExpression(new ColumnExpression('booking', 'cbm'), '/', new Value(25)), new Value(2)),
    )
  },
  {
    name: 'volumeWeight',
    summaryType: 'sum',
    expression: new ColumnExpression('booking', 'volumeWeight')
  },

  {
    name: 'grossWeight',
    summaryType: 'sum',
    expression: new ColumnExpression('booking', 'grossWeight')
  },

  {
    name: 'chargeableWeight',
    summaryType: 'sum',
    expression: new ColumnExpression('booking', 'chargeableWeight')
  },
  {
    name: 'container20',
    summaryType: 'sum',
    expression: new ColumnExpression('booking', 'container20')
  },
  {
    name: 'container40',
    summaryType: 'sum',
    expression: new ColumnExpression('booking', 'container40')
  },
  {
    name: 'containerHQ',
    summaryType: 'sum',
    expression: new ColumnExpression('booking', 'containerHQ')
  },
  {
    name: 'FCL',
    summaryType: 'sum',
    expression: IfExpression(fclExpression, new Value(1), new Value(0))
  },
  {
    name: 'LCL',
    summaryType: 'sum',
    expression: IfExpression(lclExpression, new Value(1), new Value(0))
  },
  {
    name: 'RO',
    summaryType: 'sum',
    expression: IfExpression(new BinaryExpression(new ColumnExpression('booking', 'nominatedTypeCode'), '=', new Value('R')), new Value(1), new Value(0))
  },
  {
    name: 'Freehand',
    summaryType: 'sum',
    expression: IfExpression(new BinaryExpression(new ColumnExpression('booking', 'nominatedTypeCode'), '=', new Value('F')), new Value(1), new Value(0))
  }
]

registerSummaryField(query, baseTableName, summaryFieldList, nestedSummaryList, jobDateExpression)

registerCheckboxField(query)



query.subquery(false, 'haveDocument', ((value: any, params?: IQueryParams) => {


  const fileNameList = (value && value.value) ? (Array.isArray(value.value) ? value.value : [value.value]) : []

  if (!fileNameList.length) {
    throw new Error('fileNameList empty')
  }

  const existExpressionList = fileNameList.map(fileName => {

    if (fileName === 'OTHER') {
      return new ExistsExpression(new Query({
        $select: [
          new ResultColumn(new ColumnExpression('document', 'primaryKey'))
        ],
        $from: 'document',
        $where: [
          new BinaryExpression(new ColumnExpression('document', 'tableName'), '=', 'booking'),
          new BinaryExpression(new ColumnExpression('document', 'primaryKey'), '=', idExpression),
          new InExpression(new ColumnExpression('document', 'fileName'), true, documentFileNameList),

          new IsNullExpression(new ColumnExpression('document', 'deletedAt'), false),
          new IsNullExpression(new ColumnExpression('document', 'deletedBy'), false)
        ]
      }), false)
    }

    return new ExistsExpression(new Query({
      $select: [
        new ResultColumn(new ColumnExpression('document', 'primaryKey'))
      ],
      $from: 'document',
      $where: [
        new BinaryExpression(new ColumnExpression('document', 'tableName'), '=', 'booking'),
        new BinaryExpression(new ColumnExpression('document', 'primaryKey'), '=', idExpression),
        new BinaryExpression(new ColumnExpression('document', 'fileName'), '=', fileName),

        new IsNullExpression(new ColumnExpression('document', 'deletedAt'), false),
        new IsNullExpression(new ColumnExpression('document', 'deletedBy'), false)
      ]
    }), false)

  })


  return new Query({
    $where: new AndExpressions(existExpressionList)
  })
}))

query.subquery(false, 'missingDocument', ((value: any, params?: IQueryParams) => {


  const fileNameList = (value && value.value) ? (Array.isArray(value.value) ? value.value : [value.value]) : []

  if (!fileNameList.length) {
    throw new Error('fileNameList empty')
  }

  const existExpressionList = fileNameList.map(fileName => {

    if (fileName === 'OTHER') {
      return new ExistsExpression(new Query({
        $select: [
          new ResultColumn(new ColumnExpression('document', 'primaryKey'))
        ],
        $from: 'document',
        $where: [
          new BinaryExpression(new ColumnExpression('document', 'tableName'), '=', 'booking'),
          new BinaryExpression(new ColumnExpression('document', 'primaryKey'), '=', idExpression),
          new InExpression(new ColumnExpression('document', 'fileName'), true, documentFileNameList),

          new IsNullExpression(new ColumnExpression('document', 'deletedAt'), false),
          new IsNullExpression(new ColumnExpression('document', 'deletedBy'), false)
        ]
      }), true)
    }

    return new ExistsExpression(new Query({
      $select: [
        new ResultColumn(new ColumnExpression('document', 'primaryKey'))
      ],
      $from: 'document',
      $where: [
        new BinaryExpression(new ColumnExpression('document', 'tableName'), '=', 'booking'),
        new BinaryExpression(new ColumnExpression('document', 'primaryKey'), '=', idExpression),
        new BinaryExpression(new ColumnExpression('document', 'fileName'), '=', fileName),

        new IsNullExpression(new ColumnExpression('document', 'deletedAt'), false),
        new IsNullExpression(new ColumnExpression('document', 'deletedBy'), false)
      ]
    }), true)

  })


  return new Query({
    $where: new AndExpressions(existExpressionList)
  })
}))



// Date Filter=================








query
  .register(
    'date',
    new Query({

      $where: new AndExpressions([

        // normal date case

        new OrExpressions([
          new OrExpressions([
            new IsNullExpression(new Unknown(), false),
            new IsNullExpression(new Unknown(), false),
          ]),
          new BetweenExpression(createdAtExpression, false, new Unknown(), new Unknown()),
        ]),

        // last current date case
        new OrExpressions([

          // only if all 4 dates is Null, else still check lastFromTo and CurrentFromTo
          new OrExpressions([
            new IsNullExpression(new Unknown(), false),
            new IsNullExpression(new Unknown(), false),
            new IsNullExpression(new Unknown(), false),
            new IsNullExpression(new Unknown(), false),
          ]),

          new BetweenExpression(createdAtExpression, false, new Unknown(), new Unknown()),
          new BetweenExpression(createdAtExpression, false, new Unknown(), new Unknown())
        ]),

      ])

    })
  )
  .register('from', 0)
  .register('to', 1)

  .register('from', 2)
  .register('to', 3)

  .register('lastFrom', 4)
  .register('lastTo', 5)
  .register('currentFrom', 6)
  .register('currentTo', 7)

  .register('lastFrom', 8)
  .register('lastTo', 9)
  .register('currentFrom', 10)
  .register('currentTo', 11)

// regiter date filter
const dateList = [
  // 'departureDateEstimated',
  // 'departureDateAcutal',
  // 'arrivalDateEstimated',
  // 'arrivalDateActual',

  'oceanBillDateEstimated',
  'oceanBillDateAcutal',
  // 'cargoReadyDateEstimated',
  // 'cargoReadyDateActual',

  // 'cyCutOffDateEstimated',
  // 'cyCutOffDateAcutal',
  // 'pickupDateEstimated',
  // 'pickupDateActual',

  // 'cargoReceiptDateEstimated',
  // 'cargoReceiptDateAcutal',
  // 'finalDoorDeliveryDateEstimated',
  // 'finalDoorDeliveryDateActual',
  'customClearanceLoadingPortDateEstimated',
  'customClearanceLoadingPortDateActual',
  'customClearanceDestinationPortDateEstimated',
  'customClearanceDestinationPortDateActual',

  ...dateNameList.reduce((accumulator, currentValue) => {
    return accumulator.concat([
      {
        name: `${currentValue}DateActual`,
        expression: new ColumnExpression('booking_date', `${currentValue}DateActual`),
        companion: ['table:booking_date']
      },
      {
        name: `${currentValue}DateEstimated`,
        expression: new ColumnExpression('booking_date', `${currentValue}DateEstimated`),
        companion: ['table:booking_date']
      },

    ])
  }, []),
  {
    name: 'alertCreatedAt',
    expression: alertCreatedAtExpression,
    companion: ['table:alert']
  },
  {
    name: 'alertUpdatedAt',
    expression: alertUpdatedAtExpression,
    companion: ['table:alert']
  },

] as ExpressionHelperInterface[]


registerAllDateField(query, 'booking_date', dateList)



query.registerResultColumn(
  'lastStatusWidget',
  new ResultColumn(new Value(1)),
  'table:booking_date',
  'field:bookingNo',
  'field:id',


  ...(dateNameList.reduce((companion: string[], dateString: string) => {
    companion.push(`field:${dateString}DateEstimated`)
    companion.push(`field:${dateString}DateActual`)
    return companion
  }, []))
)

// ----------------- filter in main filter menu
query.register('containerNoLike', new Query({
  $where: new InExpression(
    new ColumnExpression('booking', 'id'),
    false,
    new Query({
      $select: [new ResultColumn('bookingId')],
      $from: new FromTable('booking_container'),
      $where: new RegexpExpression(new ColumnExpression('booking_container', 'containerNo'), false)
    })
  )
})).register('value', 0)
query.register('soNoLike', new Query({
  $where: new InExpression(
    new ColumnExpression('booking', 'id'),
    false,
    new Query({
      $select: [new ResultColumn('bookingId')],
      $from: new FromTable('booking_container'),
      $where: new RegexpExpression(new ColumnExpression('booking_container', 'soNo'), false)
    })
  )
})).register('value', 0)
query.register('sealNoLike', new Query({
  $where: new InExpression(
    new ColumnExpression('booking', 'id'),
    false,
    new Query({
      $select: [new ResultColumn('bookingId')],
      $from: new FromTable('booking_container'),
      $where: new RegexpExpression(new ColumnExpression('booking_container', 'sealNo'), false)
    })
  )
})).register('value', 0)
query
  .register(
    'q',
    new Query({
      $where: new OrExpressions({
        expressions: [
          new RegexpExpression(new ColumnExpression('booking', 'bookingNo'), false),
          new RegexpExpression(new ColumnExpression('booking', 'carrierCode'), false),
          new RegexpExpression(new ColumnExpression('booking', 'vesselName'), false),
          new RegexpExpression(new ColumnExpression('booking', 'voyageFlightNumber'), false),
          new RegexpExpression(new ColumnExpression('booking', 'commodity'), false),
          new RegexpExpression(new ColumnExpression('booking', 'polHSCode'), false),
          new RegexpExpression(new ColumnExpression('booking', 'podHSCode'), false),
          new RegexpExpression(new ColumnExpression('booking', 'placeOfReceiptCode'), false),
          new RegexpExpression(new ColumnExpression('booking', 'portOfLoadingCode'), false),
          new RegexpExpression(new ColumnExpression('booking', 'portOfDischargeCode'), false),
          new RegexpExpression(new ColumnExpression('booking', 'placeOfDeliveryCode'), false),
          new RegexpExpression(new ColumnExpression('booking', 'finalDestinationCode'), false),
          new InExpression(
            new ColumnExpression('booking', 'id'),
            false,
            new Query({
              $select: [new ResultColumn('bookingId')],
              $from: new FromTable('booking_party'),
              $where: new OrExpressions({
                expressions: [
                  new RegexpExpression(new ColumnExpression('booking_party', 'agentPartyCode'), false),
                  new RegexpExpression(new ColumnExpression('booking_party', 'agentPartyName'), false),
                  new RegexpExpression(new ColumnExpression('booking_party', 'consigneePartyCode'), false),
                  new RegexpExpression(new ColumnExpression('booking_party', 'consigneePartyName'), false),
                  new RegexpExpression(new ColumnExpression('booking_party', 'notifyPartyPartyCode'), false),
                  new RegexpExpression(new ColumnExpression('booking_party', 'notifyPartyPartyName'), false),
                  new RegexpExpression(new ColumnExpression('booking_party', 'controllingCustomerPartyCode'), false),
                  new RegexpExpression(new ColumnExpression('booking_party', 'controllingCustomerPartyName'), false),
                  new RegexpExpression(new ColumnExpression('booking_party', 'linerAgentPartyCode'), false),
                  new RegexpExpression(new ColumnExpression('booking_party', 'linerAgentPartyName'), false),
                  new RegexpExpression(new ColumnExpression('booking_party', 'forwarderPartyCode'), false),
                  new RegexpExpression(new ColumnExpression('booking_party', 'forwarderPartyName'), false),
                  new RegexpExpression(new ColumnExpression('booking_party', 'roAgentPartyName'), false),
                  new RegexpExpression(new ColumnExpression('booking_party', 'roAgentPartyCode'), false),
                  new RegexpExpression(new ColumnExpression('booking_party', 'shipperPartyCode'), false),
                  new RegexpExpression(new ColumnExpression('booking_party', 'shipperPartyName'), false),
                  new RegexpExpression(new ColumnExpression('booking_party', 'controllingPartyPartyCode'), false),
                  new RegexpExpression(new ColumnExpression('booking_party', 'controllingPartyPartyName'), false),
                ]
              })
            })
          ),
          new InExpression(
            new ColumnExpression('booking', 'id'),
            false,
            new Query({
              $select: [new ResultColumn('bookingId')],
              $from: new FromTable('booking_container'),
              $where: new OrExpressions({
                expressions: [
                  new RegexpExpression(new ColumnExpression('booking_container', 'containerNo'), false),
                  // new RegexpExpression(new ColumnExpression('booking_container', 'soNo'), false),
                  new RegexpExpression(new ColumnExpression('booking_container', 'sealNo'), false),
                ]
              })
            })
          ),
          new InExpression(
            new ColumnExpression('booking', 'id'),
            false,
            new Query({
              $select: [new ResultColumn('bookingId')],
              $from: new FromTable('booking_reference'),
              $where: new OrExpressions({
                expressions: [
                  new RegexpExpression(new ColumnExpression('booking_reference', 'refDescription'), false),
                ]
              })
            })
          ),

        ],
      }),
    })
  )
  .register('value', 0)
  .register('value', 1)
  .register('value', 2)
  .register('value', 3)
  .register('value', 4)
  .register('value', 5)
  .register('value', 6)
  .register('value', 7)
  .register('value', 8)
  .register('value', 9)
  .register('value', 10)
  .register('value', 11)
  .register('value', 12)
  .register('value', 13)
  .register('value', 14)
  .register('value', 15)
  .register('value', 16)
  .register('value', 17)
  .register('value', 18)
  .register('value', 19)
  .register('value', 20)
  .register('value', 21)
  .register('value', 22)
  .register('value', 23)
  .register('value', 24)
  .register('value', 25)
  .register('value', 26)
  .register('value', 27)
  .register('value', 28)
  .register('value', 29)
  .register('value', 30)
  .register('value', 31)

export default supportSopTask('booking', query, () => require('./sop_task').default,
  // field:shipId
  {
    type: 'field',
    name: 'shipId',
    expression: new QueryExpression(new Query({
      $select: new ResultColumn(new ColumnExpression('booking_reference', 'refDescription'), 'shipId'),
      $from: 'booking_reference',
      $where: [
        new BinaryExpression(new ColumnExpression('booking_reference', 'bookingId'), '=', new ColumnExpression('booking', 'id')),
        new BinaryExpression(new ColumnExpression('booking_reference', 'refName'), '=', new Value('Shipment Reference ID')),
        new IsNullExpression(new ColumnExpression('booking_reference', 'deletedAt'), false),
        new IsNullExpression(new ColumnExpression('booking_reference', 'deletedBy'), false)
      ],
      $limit: 1
    }))
  },

  // subquery:vesselName
  {
    type: 'subquery',
    name: 'vesselName',
    expression: new BinaryExpression(vesselNameExpression, '=', new Unknown()),
    unknowns: true
  },

  // subquery:voyageFlightNumber
  {
    type: 'subquery',
    name: 'voyageFlightNumber',
    expression: new BinaryExpression(voyageFlightNumberNameExpression, '=', new Unknown()),
    unknowns: true
  },

  // subquery:createdSince
  {
    type: 'subquery',
    name: 'createdSince',
    expression: new BinaryExpression(createdAtExpression, '>=', new Unknown()),
    unknowns: { fromTo: true }
  },

  // subquery:createdAtBeweenRange
  {
    type: 'subquery',
    name: 'createdAtBetweenRange',
    expression: new BetweenExpression(
      createdAtExpression,
      false,
      new FunctionExpression('DATE_SUB', new FunctionExpression('UTC_TIMESTAMP'), new ParameterExpression('INTERVAL', new Unknown(), 'DAY')),
      new FunctionExpression('DATE_ADD', new FunctionExpression('UTC_TIMESTAMP'), new ParameterExpression('INTERVAL', new Unknown(), 'DAY'))
    ),
    unknowns: [
      ['value', 0],
      ['value', 1]
    ]
  },

  // subquery:updatedAtBeweenRange
  {
    type: 'subquery',
    name: 'updatedAtBetweenRange',
    expression: new BetweenExpression(
      updatedAtExpression,
      false,
      new FunctionExpression('DATE_SUB', new FunctionExpression('UTC_TIMESTAMP'), new ParameterExpression('INTERVAL', new Unknown(), 'DAY')),
      new FunctionExpression('DATE_ADD', new FunctionExpression('UTC_TIMESTAMP'), new ParameterExpression('INTERVAL', new Unknown(), 'DAY'))
    ),
    unknowns: [
      ['value', 0],
      ['value', 1]
    ]
  }
)
