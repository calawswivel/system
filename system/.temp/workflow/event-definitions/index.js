module.exports = {
  definitions: [
    {
      name: 'update_tracking',
      persistent: true,
      sampleData: {
        modelName: '',
        oldData: {},
        data: {},
      },
      context: {
        entity: 'customer',
        entityId: 'data.customerId',
      },
      handlers: [],
    },
    {
      name: 'update_billTracking',
      persistent: true,
      sampleData: {
        modelName: '',
        oldData: {},
        data: {},
      },
      context: {
        entity: 'customer',
        entityId: 'data.customerId',
      },
      handlers: [
        {
          name: 'checkETAChange',
          on: {
            DELAY: {
              name: 'sendNotification',
              parameters: {
                roles: ['Admin', 'User', 'ClientAdmin', 'ClientUser', 'OFE'],
                subject:
                  "Master BL# {{bill.masterNo}} ETA changed from {% if oldData.estimatedArrivalDate %}{{oldData.estimatedArrivalDate | date('d M Y H:i:s')}}{% else %}{% if bill.estimatedArrivalDate %}{{bill.estimatedArrivalDate | date('d M Y')}}{% else %}[Date not set]{% endif %}{% endif %} to {{data.estimatedArrivalDate | date('d M Y H:i:s')}}.",
                severity: 'Medium',
                tableName: 'bill',
                primaryKey: 'id',
                customerId: 'customerId',
                type: 'Shipment ETA Changed',
                getRecords: true,
                referenceObject: 'data',
                alertCategory: 'Exception',
                whereQuery: '{ "masterNo":"{{masterNo}}","customerId":{{customerId}} }',
                echoOnly: true,
                email: {
                  echoOnly: true,
                  template: 'bill-tracking-update',
                  subject:
                    "Master BL# {{bill.masterNo}} ETA changed from {% if oldData.estimatedArrivalDate %}{{oldData.estimatedArrivalDate | date('d M Y H:i:s')}}{% else %}{% if bill.estimatedArrivalDate %}{{bill.estimatedArrivalDate | date('d M Y')}}{% else %}[Date not set]{% endif %}{% endif %} to {{data.estimatedArrivalDate | date('d M Y H:i:s')}}.",
                },
                wechat: {
                  publicTemplateId: 'OPENTM402244876',
                  privateTemplateId: 'sX4vIVmYVap4hJ9GO8Ze6ReWp1hhqzQq7_QysyA3lSw',
                  dataBinding: [],
                },
                sms: {},
              },
            },
          },
        },
        {
          name: 'checkETDChange',
          on: {
            DELAY: {
              name: 'sendNotification',
              parameters: {
                roles: ['Admin', 'User', 'ClientAdmin', 'ClientUser', 'OFE'],
                subject:
                  "Master BL# {{bill.masterNo}} ETD changed from {% if oldData.estimatedDepartureDate %}{{oldData.estimatedDepartureDate | date('d M Y H:i:s')}}{% else %}{% if bill.estimatedArrivalDate %}{{bill.estimatedDepartureDate | date('d M Y')}}{% else %}[Date not set]{% endif %}{% endif %} to {{data.estimatedDepartureDate | date('d M Y H:i:s')}}.",
                severity: 'Medium',
                tableName: 'bill',
                primaryKey: 'id',
                customerId: 'customerId',
                type: 'Shipment ETD Changed',
                getRecords: true,
                referenceObject: 'data',
                alertCategory: 'Exception',
                whereQuery: '{ "masterNo":"{{masterNo}}","customerId":{{customerId}} }',
                email: {
                  echoOnly: true,
                  template: 'bill-tracking-update',
                  subject:
                    "Master BL# {{bill.masterNo}} ETD changed from {% if oldData.estimatedDepartureDate %}{{oldData.estimatedDepartureDate | date('d M Y H:i:s')}}{% else %}{% if bill.estimatedArrivalDate %}{{bill.estimatedDepartureDate | date('d M Y')}}{% else %}[Date not set]{% endif %}{% endif %} to {{data.estimatedDepartureDate | date('d M Y H:i:s')}}.",
                },
                wechat: {
                  echoOnly: true,
                  publicTemplateId: 'OPENTM402244876',
                  privateTemplateId: 'sX4vIVmYVap4hJ9GO8Ze6ReWp1hhqzQq7_QysyA3lSw',
                  dataBinding: [],
                },
                sms: {},
              },
            },
          },
        },
      ],
    },
    {
      name: 'update_booking',
      persistent: true,
      sampleData: {
        modelName: '',
        oldData: {},
        data: {},
      },
      context: {
        entity: 'customer',
        entityId: 'data.customerId',
      },
      handlers: [
        {
          name: 'sendDataToThirdParty',
          parameters: {
            appId: 'fm3k-app',
            update: true,
          },
        },
        {
          name: 'checkETAChange',
        },
        {
          on: {
            DELAY: {
              name: 'sendNotification',
              parameters: {
                subject:
                  "{{modelName}}# {{data.id}} ETA has been changed from {{oldData.estimatedArrivalDate | date('d M Y')}} to {{data.estimatedArrivalDate | date('d M Y')}} ",
                primaryKey: 'id',
                customerId: 'customerId',
                tableName: 'booking',
                alertCategory: 'Exception',
                referenceObject: 'data',
                type: 'ETA update',
              },
            },
          },
        },
        {
          name: 'checkETDChange',
        },
        {
          _on: {
            DELAY: {
              name: 'sendNotification',
              parameters: {
                subject:
                  "{{modelName}}# {{data.id}} ETD has been changed from {{oldData.estimatedDepartureDate | date('d M Y')}} to {{data.estimatedDepartureDate | date('d M Y')}} ",
                primaryKey: 'id',
                customerId: 'customerId',
                tableName: 'booking',
                alertCategory: 'Exception',
                referenceObject: 'data',
                type: 'ETD update',
              },
            },
          },
        },
      ],
    },
    {
      name: 'post_message',
      persistent: true,
      sampleData: {
        modelName: '',
        data: {},
      },
      handlers: [
        {
          name: 'sendEmail',
          parameters: {
            to: '{{to}}',
            from: '{{from}}',
            subject: '{{subject}}',
            text: `{{text}}`,
          },
        },
      ],
    },
    {
      name: 'create_authentication',
      persistent: true,
      sampleData: {
        modelName: '',
        data: {},
      },
      handlers: [
        {
          name: 'echoData',
        },
      ],
    },
    {
      name: 'new_booking',
      persistent: true,
      sampleData: {
        booking: {},
      },
      context: {
        entity: 'customer',
        entityId: 'data.customerId',
      },
      handlers: [
        {
          name: 'bookingEmail',
          parameters: {
            roles: ['ConsigneeUser', 'ForwarderUser'],
            subject: 'New booking alert {{portOfLoading}} -> {{portOfDischarge}} [{{bookingNo}}]',
            template: 'new-booking-preview-email',
            severity: 'Medium',
            tableName: 'booking',
            primaryKey: 'id',
            customerId: 'customerId',
            alertCategory: 'Message',
            type: 'New Booking',
            email: {
              template: 'new-booking-preview-email',
              subject: 'New booking alert {{portOfLoading}} -> {{portOfDischarge}} [{{bookingNo}}]',
            },
            wechat: {
              publicTemplateId: 'OPENTM402244876',
              privateTemplateId: 'sX4vIVmYVap4hJ9GO8Ze6ReWp1hhqzQq7_QysyA3lSw',
              dataBinding: [],
            },
            sms: {},
          },
        },
        {
          name: 'sendDataToThirdParty',
          parameters: {
            appId: 'fm3k-app',
            update: false,
          },
        },
        {
          name: 'partiesMissing',
          parameters: {
            alertType: 'Shipment missing valid customer details',
            severity: 'Medium',
            tableName: 'booking',
            alertCategory: 'Exception',
            roles: ['Consignee', 'Shipper'],
            whereQuery: '{"id":"{{id}}"}',
            alert: '"Shipper" or "Consignee" was not assigned.',
          },
        },
      ],
    },
    {
      name: 'echo',
      persistent: true,
      sampleData: {
        modelName: '',
        data: {},
      },
      handlers: [
        {
          name: 'echoData',
          parameters: {
            remarks: 'echoData from system event',
          },
        },
      ],
    },
  ],
}
