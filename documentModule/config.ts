import { DocumentStorageConfig, EntityConfig } from 'models/main/document'
import { Shipment } from 'models/main/shipment'
import { Booking } from 'models/main/booking'

export const documentStorageConfig = {

  maxFileSize: 1048576,
  recyclePrefix: 'recycle',
  defaultHandlerName: 'sftp',
  handlerList: [

    {
      handlerName: 'sftp',
      config: {

        baseDir : '',
        host: '47.90.28.106',
        os : 'window',
        port: 22,
        username: 'sftp-DEV',
        password : 'Swivel!'

      }
    }
  ]

} as DocumentStorageConfig

export const entityConfigList = [
  {
    tableName: 'booking',

    defaultDocumentConfig: {

      isActive : true,
      allowFileType: [
        'image/png',
        'image/gif',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/pdf',
        'url',
        'application/octet-stream'
      ],
      allowFillTemplate: false
    },

    documentList: [
      {
        fileName: 'Shipping Order',

        isActive : (entity: Booking) => {
          return entity.moduleTypeCode === 'AIR' || entity.moduleTypeCode === 'SEA'
        },

        // get the template by templateName and fill it
        allowFillTemplate: true,
        templateName: (entity: Booking) => {
          return 'shippingOrder'
        },
      },

      {
        isActive : true,
        fileName: 'Shipping Advice',
        allowFillTemplate: false
      },
      {
        isActive : true,
        fileName: 'Print Invoice',
        allowFillTemplate: false
      },
      {
        isActive : false,
        fileName: 'Pro Forma Invoice',
        allowFillTemplate: false
      },
      {

        isActive : true,
        fileName: 'Packing List',
        allowFillTemplate: false
      },
      {

        isActive : true,
        fileName: 'Load Plan',
        allowFillTemplate: false
      },
      {

        isActive : true,
        fileName: 'Shipping Instructions',

        allowFillTemplate: false
      },
      {
        isActive : true,
        fileName: 'House Bill',
        allowFillTemplate: false
      }
    ]
  } as EntityConfig,

  {
    tableName: 'shipment',

    defaultDocumentConfig: {

      isActive : true,
      allowFileType: [
        'image/png',
        'image/gif',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/pdf'
      ],
      allowFillTemplate: false
    },

    documentList: [
      {
        fileName: 'Invoice',
        allowFileType: [
          'image/png',
          'image/gif',
          'image/jpeg',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/pdf'
        ],

        isActive : (entity: Shipment) => {
          return entity.moduleTypeCode === 'SEA'
        },
        allowFillTemplate: false
      },
      {
        fileName: 'FCL Document',
        allowFileType: [
          'image/png',
          'image/gif',
          'image/jpeg',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/pdf'
        ],

        isActive : (entity: Shipment) => {
          return entity.serviceCode === 'FCL/FCL'
        },
        allowFillTemplate: false
      },
      {
        fileName: 'LCL Document',
        allowFileType: [
          'image/png',
          'image/gif',
          'image/jpeg',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/pdf'
        ],

        isActive : (entity: Shipment) => {
          return entity.serviceCode.startsWith('LCL/LC')
        },
        allowFillTemplate: false
      },
      {
        fileName: 'MBL',
        allowFileType: [
          'image/png',
          'image/gif',
          'image/jpeg',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/pdf'
        ],

        isActive : true,
        allowFillTemplate: false
      }
    ]
  } as EntityConfig

]
