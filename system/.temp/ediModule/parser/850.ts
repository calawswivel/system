import { BaseEdiParser } from 'modules/edi/baseEdiParser'
import { CodeMasterService } from 'modules/sequelize/codeMaster/service'
import { ProductDbService } from 'modules/sequelize/product/service'
import { OutboundService } from 'modules/integration-hub/services/outbound'
import { SwivelConfigService } from 'modules/swivel-config/service'
import { PurchaseOrder } from 'models/main/purchaseOrder'
import { PurchaseOrderItem } from 'models/main/purchaseOrderItem'
import { LocationService } from 'modules/sequelize/location/service'
import { ProductDefinitionField, Product } from 'models/main/product'
import { JwtPayload } from 'modules/auth/interfaces/jwt-payload'
import { EdiSchedulerConfig, EdiFormatJson } from 'modules/edi/interface'
import { SubQueryDef } from 'classes/query/SubQueryDef'

const moment = require('moment')
const _ = require('lodash')

export const formatJson = {
  removeCharacter: ['\r', '\n', '\r\n', '=', 'o'],
  segmentSeperator: ['?'],
  elementSeperator: [''],

  // segmentSeperator : ['?'],
  // elementSeperator : '',

  rootSegmentFormat: {
    type: 'object',
    segmentFormatList: [
      {
        key: 'ISA',
        code: 'ISA',
        name: 'interchange Control Header',
        type: 'object',
        mandatory: false,
        elementFormatList: [
          {
            index: 1,
            name: 'Authorization Info Qualifier',
            key: 'authorizationInfoQualifier',
            type: 'string',
          },
          {
            index: 2,
            name: 'Authorization Information',
            key: 'authorizationInformation',
            type: 'string',
          },
          {
            index: 3,
            name: 'Security Info Qualifier ',
            key: 'securityInfoQualifier ',
            type: 'string',
          },
          {
            index: 4,
            name: 'Security Information',
            key: 'securityInformation',
            type: 'string',
          },
          {
            index: 5,
            name: 'Interchange Sender ID QL',
            key: 'interchangeSenderIdQl',
            type: 'string',
          },
          {
            index: 6,
            name: 'Interchange Sender ID',
            key: 'interchangeSenderId',
            type: 'string',
          },
          {
            index: 7,
            name: 'Interchange Receiver QL',
            key: 'interchangeReceiverQl',
            type: 'string',
          },
          {
            index: 8,
            name: 'Interchange Receiver ID',
            key: 'interchangeReceiverId',
            type: 'string',
            allowableValues: {
              valueOptions: [
                {
                  value: '6112390050',
                  name: 'GXS',
                  overrideValue: 'GXS',
                },
                {
                  value: '6112391050',
                  name: 'Inovis',
                  overrideValue: 'Inovis',
                },
                {
                  value: '6112392050',
                  name: 'InterTrade',
                  overrideValue: 'InterTrade',
                },
              ],
              allowAny: true,
            },
          },
          {
            index: 9,
            name: 'Created Date',
            key: 'createdDate',
            type: 'date',
            format: 'yyMMdd',
          },
          {
            index: 10,
            name: 'Created Time',
            key: 'createdTime',
            type: 'time',
          },
          {
            index: 11,
            name: 'Interchange Standards ID',
            key: 'interchangeStandardsId',
            type: 'string',
          },
          {
            index: 12,
            name: 'Interchange Version ID',
            key: 'interchangeVersionId',
            type: 'string',
          },
          {
            index: 13,
            name: 'Interchange Control Number',
            key: 'interchangeControlNumber',
            type: 'string',
          },
          {
            index: 14,
            name: 'Acknowledgement Requested',
            key: 'acknowledgementRequested ',
            type: 'string',
          },
          {
            index: 15,
            name: 'Test Indicator',
            key: 'testIndicator',
            type: 'string',
            allowableValues: {
              valueOptions: [
                {
                  value: 'T',
                  name: 'Test',
                  overrideValue: 'Test',
                },
                {
                  value: 'P',
                  name: 'Prod',
                  overrideValue: 'Prod',
                },
              ],
              allowAny: true,
            },
          },
          {
            index: 16,
            name: 'Sub Element Separator',
            key: 'subElementSeparator',
            type: 'string',
          },
        ],
      },
      {
        key: 'GS',
        code: 'GS',
        name: 'Funtional Group Header',
        type: 'object',
        mandatory: false,
        elementFormatList: [
          {
            index: 1,
            name: 'Functional ID',
            key: 'functionalId',
            type: 'string',
          },
          {
            index: 2,
            name: 'Application Sender ID',
            key: 'applicationSenderId',
            allowableValues: {
              valueOptions: [
                {
                  value: '6112390050',
                  name: 'GXS',
                  overrideValue: 'GXS',
                },
                {
                  value: '6112391050',
                  name: 'Inovis',
                  overrideValue: 'Inovis',
                },
                {
                  value: '6112392050',
                  name: 'InterTrade',
                  overrideValue: 'InterTrade',
                },
              ],
              allowAny: true,
            },
            type: 'string',
          },
          {
            index: 3,
            name: 'Application Receiver ID',
            key: 'applicationReceiverId',
            type: 'string',
          },
          {
            index: 4,
            name: 'Data Interchange Date',
            key: 'dataInterchangeDate',
            type: 'date',
            Format: 'yyyyMMdd',
          },
          {
            index: 5,
            name: 'Data Interchange Time',
            key: 'dataInterchangeTime',
            type: 'time',
          },
          {
            index: 6,
            name: 'Data Interchange Control Number',
            key: 'dataInterchangeControlNumber',
            type: 'string',
          },
          {
            index: 7,
            name: 'Responsible Agency Code',
            key: 'responsibleAgencyCode',
            type: 'string',
          },
          {
            index: 8,
            name: 'Version ID',
            key: 'versionId',
            type: 'string',
          },
        ],
      },
      {
        key: 'ST',
        code: 'ST',
        name: 'Transaction Set Header',
        type: 'list',
        mandatory: false,
        elementFormatList: [
          {
            index: 1,
            name: 'Transaction Set Identifier Code',
            key: 'transactionSetIdentifierCode',
            type: 'string',
          },

          {
            index: 2,
            name: 'Transaction Set Control Number',
            key: 'transactionSetControlNumber',
            type: 'string',
          },
        ],
        segmentFormatList: [
          {
            key: 'BEG',
            code: 'BEG',
            name: 'Beginning Segement',
            type: 'object',
            mandatory: false,
            elementFormatList: [
              {
                index: 1,
                name: 'Transaction Set Purpose',
                key: 'transactionSetPurpose',
                allowableValues: {
                  valueOptions: [
                    {
                      value: '00',
                      name: 'Original',
                      overrideValue: 'Original',
                    },
                    {
                      value: '07',
                      name: 'Duplicate',
                      overrideValue: 'Duplicate',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },

              {
                index: 2,
                name: 'Purchase Order Type',
                key: 'purchaseOrderType',
                allowableValues: {
                  valueOptions: [
                    {
                      value: 'SA',
                      name: 'Stand-alone',
                      overrideValue: 'Stand-alone',
                    },
                    {
                      value: 'DS',
                      name: 'Drop Ship',
                      overrideValue: 'Drop Ship',
                    },
                    {
                      value: 'DR',
                      name: 'Direct Ship',
                      overrideValue: 'Direct Ship',
                    },
                    {
                      value: 'PE',
                      name: 'Port of Entry',
                      overrideValue: 'Port of Entry',
                    },
                    {
                      value: 'RE',
                      name: 'Replenishment',
                      overrideValue: 'Replenishment',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },

              {
                index: 3,
                name: 'Purchase Order Number',
                key: 'purchaseOrderNumber',
                type: 'string',
              },
              {
                index: 4,

                name: 'Release Number',
                key: 'releaseNumber',
                mandatory: false,
                type: 'string',
              },
              {
                index: 5,

                name: 'Purchase Order Date',
                key: 'purchaseOrderDate',
                type: 'date',
                format: 'yyyyMMdd',
              },
            ],
          },
          {
            key: 'REF',
            code: 'REF',
            name: 'Reference Number',
            type: 'repeatObject',
            mandatory: false,

            elementFormatList: [
              {
                index: 1,
                name: 'Reference Number Qualifier',
                key: 'referenceNumberQualifier',
                overrideValueIndex: 2,
                allowableValues: {
                  valueOptions: [
                    {
                      value: 'DP',
                      name: 'Dept Number',
                      overrideKey: 'Dept Number',
                    },
                    {
                      value: 'IA',
                      name: 'Vendor',
                      overrideKey: 'Vendor',
                    },
                    {
                      value: '19',
                      name: 'Division ID',
                      overrideKey: 'DivisionID',
                    },
                    {
                      value: 'CO',
                      name: 'Customer Order',
                      overrideKey: 'Customer Order',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
              {
                index: 2,
                name: 'Reference Number',
                key: 'referenceNumber',
                type: 'string',
              },
            ],
          },
          {
            code: 'PER',
            key: 'PER',
            name: 'Admin Contact',
            type: 'object',
            mandatory: false,
            elementFormatList: [
              {
                index: 1,
                name: 'Contact function code',
                key: 'contactFunctionCode',
                type: 'string',
              },

              {
                index: 2,
                name: 'Name',
                key: 'name',
                mandatory: false,
                type: 'string',
              },
            ],
          },
          {
            code: 'FOB',
            key: 'FOB',
            name: 'F.O.B. Instructions',
            type: 'object',
            mandatory: false,

            elementFormatList: [
              {
                index: 1,
                name: 'Shipment Method of Payment',
                key: 'shipmentMethodOfPayment',
                allowableValues: {
                  valueOptions: [
                    {
                      value: 'CA',
                      name: 'Advance Collect',
                      overrideValue: 'Advance Collect',
                    },
                    {
                      value: 'PA',
                      name: 'Advance Prepay',
                      overrideValue: 'Advance Prepay',
                    },
                    {
                      value: 'CC',
                      name: 'Collect',
                      overrideValue: 'Collect',
                    },
                    {
                      value: 'PP',
                      name: 'Prepaid',
                      overrideValue: 'Prepaid',
                    },
                    {
                      value: 'MX',
                      name: 'Mixed',
                      overrideValue: 'Mixed',
                    },
                    {
                      value: 'BP',
                      name: 'Paid by Buyer',
                      overrideValue: 'Paid by Buyer',
                    },
                    {
                      value: 'AC',
                      name: 'Air Collect',
                      overrideValue: 'Air Collect',
                    },
                    {
                      value: 'AP',
                      name: 'Air Prepaid',
                      overrideValue: 'Air Prepaid',
                    },
                  ],

                  allowAny: true,
                },
                type: 'string',
              },

              {
                index: 2,

                name: 'Location Qualifier1',
                key: 'locationQualifier1',
                mandatory: false,

                allowableValues: {
                  valueOptions: [
                    {
                      value: 'DE',
                      name: 'Destination (Shipping)',
                      overrideValue: 'Destination (Shipping)',
                    },
                    {
                      value: 'OR',
                      name: 'Origin (Shipping Point)',
                      overrideValue: 'Origin (Shipping Point)',
                    },
                    {
                      value: 'OV',
                      name: 'On vessel',
                      overrideValue: 'On vessel',
                    },
                    {
                      value: 'OF',
                      name: 'Other FOB Point',
                      overrideValue: 'Other FOB Point',
                    },
                  ],
                  allowAny: true,
                },

                type: 'string',
              },
              {
                index: 3,
                name: 'description1',
                key: 'description1',
                type: 'string',
              },
              {
                index: 6,
                name: 'Location Qualifier2',
                key: 'locationQualifier2',
                allowableValues: {
                  valueOptions: [
                    {
                      value: 'CA',
                      name: 'Country of Origin',
                      overrideValue: 'Country of Origin',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
              {
                index: 7,
                name: 'Description2',
                key: 'description2',
                type: 'string',
              },
            ],
          },
          {
            key: 'SAC',
            code: 'SAC',
            name: 'Service, Promotion, Allowance or Charge',
            type: 'list',
            mandatory: false,
            elementFormatList: [
              {
                index: 1,
                name: 'Allowance or Charge Ind.',
                key: 'allowanceOrChargeInd.',
                allowableValues: {
                  valueOptions: [
                    {
                      value: 'N',
                      name: 'No Allowance/Chrg',
                      overrideValue: 'No Allowance/Chrg',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
              {
                index: 3,
                name: 'Agency Qualifier Code',
                key: 'agencyQualifiercode',
                type: 'string',
              },
              {
                index: 4,
                name: 'Agency Services,Promotion Allowance/Charge Code',
                key: 'agencyServices,PromotionAllowance/ChargeCode',
                allowableValues: {
                  valueOptions: [
                    {
                      value: 'OHRO',
                      name: 'Rush Order',
                      overrideValue: 'Rush Order',
                    },
                    {
                      value: 'OHPR',
                      name: 'Promo Order',
                      overrideValue: 'Promo Order',
                    },
                    {
                      value: 'OHSO',
                      name: 'Custom Express',
                      overrideValue: 'Custom Express',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
            ],
          },
          {
            code: 'TD5',
            key: 'TD5',
            name: 'Carrier Details',
            mandatory: false,
            elementFormatList: [
              {
                index: 4,
                name: 'Transportation Method/Type',
                key: 'transportationMethod/Type',
                allowableValues: {
                  valueOptions: [
                    {
                      value: 'A',
                      name: 'Air',
                      overrideValue: 'Air',
                    },
                    {
                      value: 'S',
                      name: 'Ocean',
                      overrideValue: 'Ocean',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
              {
                index: 5,
                name: 'Routing',
                key: 'routing',
                type: 'string',
              },
            ],
          },
          {
            key: 'N9',
            code: 'N9',
            name: 'Reference Number',
            type: 'specialObject',
            mandatory: false,
            elementFormatList: [
              {
                index: 1,
                name: 'Reference Number Qual',
                key: 'referenceNumberQual',
                allowableValues: {
                  valueOptions: [
                    {
                      value: 'AH',
                      name: 'Agreement',
                      overrideValue: 'Agreement',
                    },
                    {
                      value: 'KD',
                      name: 'Special Services',
                      overrideValue: 'Special Services',
                    },
                    {
                      value: 'SH',
                      name: 'Gift Message',
                      overrideValue: 'Gift Message',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
              {
                index: 2,
                name: 'Reference Number',
                key: 'referenceNumber',
                type: 'string',
              },
              {
                index: 3,
                name: 'Free-form Description',
                key: 'free-formDescription',
                type: 'string',
              },
            ],
            segmentFormatList: [
              {
                code: 'MTX',
                key: 'MTX',
                type: 'list',
                name: 'Message Text',
                mandatory: false,
                elementFormatList: [
                  {
                    index: 2,
                    name: 'Message Text',
                    key: 'messageText',
                    type: 'string',
                  },
                ],
              },
              {
                code: 'MSG',
                key: 'MSG',
                type: 'list',
                name: 'Message Text',
                mandatory: false,
                elementFormatList: [
                  {
                    index: 1,
                    name: 'Message Text',
                    key: 'messageText',
                    type: 'string',
                  },
                ],
              },
            ],
          },

          {
            code: 'DTM',
            key: 'DTM',
            type: 'repeatObject',
            name: ' Data Element Separator (DES)',
            mandatory: false,
            elementFormatList: [
              {
                index: 1,
                name: 'Date/Time Qualifier',
                key: 'date/TimeQualifier',
                overrideValueIndex: 2,
                allowableValues: {
                  valueOptions: [
                    {
                      value: '037',
                      name: 'Ship Not Before',
                      overrideKey: 'shipNotBefore',
                    },
                    {
                      value: '038',
                      name: 'Do Not Ship After',
                      overrideKey: 'doNotShipAfter',
                    },
                    {
                      value: '015',
                      name: 'Promo start',
                      overrideKey: 'promoStart',
                    },
                    {
                      value: '071',
                      name: 'First Arrive',
                      overrideKey: 'firstArrive',
                    },
                    {
                      value: '074',
                      name: 'Last Arrive',
                      overrideKey: 'lastArrive',
                    },
                    {
                      value: '063',
                      name: 'Do Not Deliver After',
                      overrideKey: 'doNotDeliverAfter',
                    },
                    {
                      value: '064',
                      name: 'Do Not Ship Before',
                      overrideKey: 'doNotShipBefore',
                    },
                    {
                      value: '010',
                      name: 'Requested Ship Date From Supplier Warehouse',
                      overrideKey: 'requestedShipDateFromSupplierWarehouse',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
              {
                index: 2,
                name: 'Date',
                key: 'Date',
                type: 'date',
                format: 'yyyyMMdd',
              },
            ],
          },
          {
            key: 'ITD',
            code: 'ITD',
            name: 'Term of Sales/Deferred Term of Sales',
            type: 'object',
            mandatory: false,
            elementFormatList: [
              {
                index: 1,
                name: 'Terms Type Code',
                key: 'termsTypeCode',
                allowableValues: {
                  valueOptions: [
                    {
                      value: '08',
                      name: 'Basic Discount',
                      overrideValue: 'Basic Discount',
                    },
                    {
                      value: '05',
                      name: 'No Discount',
                      overrideValue: 'No Discount',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
              {
                index: 2,
                name: 'Terms Basis Date Code',
                key: 'termsBasisDateCode',
                allowableValues: {
                  valueOptions: [
                    {
                      value: '2',
                      name: 'Delivery date',
                      overrideValue: 'Delivery date',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
              {
                index: 3,
                name: 'Terms Discount Percent',
                key: 'termsDiscountPercent',
                type: 'integer',
              },
              {
                index: 5,
                name: 'Terms Discount Days Due ',
                key: 'termsDiscountDaysDue',
                type: 'integer',
              },
              {
                index: 7,
                name: 'Terms Net Days',
                key: 'termsNetDays',
                type: 'integer',
              },
            ],
          },
          {
            code: 'N1',
            key: 'N1',
            name: 'Name',
            mandatory: false,
            type: 'list',

            elementFormatList: [
              {
                index: 1,
                name: 'Organization Identifier ',
                key: 'organizationIdentifier',
                allowableValues: {
                  valueOptions: [
                    {
                      value: 'BY',
                      name: 'Buying party',
                      overrideValue: 'Buying party',
                    },
                    {
                      value: 'BT',
                      name: 'Bill to party',
                      overrideValue: 'Bill to party',
                    },
                    {
                      value: 'SE',
                      name: 'Selling party',
                      overrideValue: 'Selling Party',
                    },
                    {
                      value: 'RI',
                      name: 'Remit-to',
                      overrideValue: 'Remit-to',
                    },
                    {
                      value: 'ST',
                      name: 'Ship to',
                      overrideValue: 'Ship To',
                    },
                    {
                      value: 'VN',
                      name: 'vendor',
                      overrideValue: 'Vendor',
                    },
                    {
                      value: 'MA',
                      name: 'Party to Ship To',
                      overrideValue: 'Party To Ship To',
                    },
                    {
                      value: 'AG',
                      name: 'Agent',
                      overrideValue: 'Agent',
                    },
                    {
                      value: 'SU',
                      name: 'Factory (Supplier)',
                      overrideValue: 'Factory (Supplier)',
                    },
                    {
                      value: 'MP',
                      name: 'Ship from',
                      overrideValue: 'Ship From',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
              {
                index: 2,
                name: 'name',
                key: 'name',
                type: 'string',
              },
              {
                index: 3,
                name: 'Identification Code Qualifier',
                key: 'IdCodeQualifier',
                mandatory: false,
                allowableValues: {
                  valueOptions: [
                    {
                      value: '92',
                      name: 'Assigned by buyer',
                      overrideValue: 'Assigned By Buyer',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
              {
                index: 4,
                name: 'Identification Code',
                key: 'identificationCode',
                type: 'string',
              },
            ],

            segmentFormatList: [
              {
                code: 'N2',
                key: 'N2',
                name: 'Additional Name Information ',
                type: 'object',
                mandatory: false,
                elementFormatList: [
                  {
                    index: 1,
                    name: 'Additional Name Information1',
                    key: 'additionalNameInformation1',
                    type: 'string',
                  },
                  {
                    index: 2,
                    name: 'Additional Name Information2',
                    key: 'additionalNameInformation2',
                    type: 'string',
                  },
                ],
              },
              {
                code: 'N3',
                key: 'N3',
                name: 'Address Information',
                type: 'object',
                mandatory: false,
                elementFormatList: [
                  {
                    index: 1,
                    name: 'Address Information',
                    key: 'addressInformation',
                    type: 'string',
                  },
                  {
                    index: 2,
                    name: 'Additional Address Information',
                    key: 'additionalAddressInformation',
                    type: 'string',
                  },
                ],
              },
              {
                code: 'N4',
                key: 'N4',
                type: 'object',
                mandatory: false,
                elementFormatList: [
                  {
                    index: 1,
                    name: 'City Name',
                    key: 'cityName',
                    type: 'string',
                  },
                  {
                    index: 2,
                    name: 'State Or Province Code',
                    key: 'stateOrProvinceCode',
                    type: 'string',
                  },
                  {
                    index: 3,
                    name: 'Postal Code',
                    key: 'postalCode',
                    type: 'string',
                  },
                  {
                    index: 4,
                    name: 'Country Code',
                    key: 'countryCode',
                    type: 'string',
                  },
                ],
              },
            ],
          },
          {
            key: 'CTP',
            code: 'CTP',
            name: 'Pricing Information',
            type: 'object',
            mandatory: false,
            elementFormatList: [
              {
                index: 1,
                name: 'Class of Trade',
                key: 'classOfTrade',
                allowableValues: {
                  valueOptions: [
                    {
                      value: 'RS',
                      name: 'Resale',
                      overrideValue: 'Resale',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
              {
                index: 2,
                name: 'Price Code Qualifier',
                key: 'priceCodeQualifier',
                allowableValues: {
                  valueOptions: [
                    {
                      value: 'RTL',
                      name: 'Resale Price',
                      overrideValue: 'Resale Price',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
              {
                index: 3,
                name: 'Unit Price',
                key: 'UnitPrice',
                type: 'decimal',
              },
            ],
            segmentFormatList: [],
          },
          {
            code: 'PO1',
            key: 'PO1',
            name: 'Purchase Order Baseline Item Data',
            type: 'list',
            mandatory: false,
            elementFormatList: [
              {
                index: 1,
                name: 'PO Line Number',
                key: 'poLineNumber',
                type: 'string',
              },
              {
                index: 2,
                name: 'Quantity Ordered',
                key: 'quantityOrdered',
                type: 'integer',
              },
              {
                index: 3,
                name: 'Unit Of Measure Code',
                key: 'unitOfMeasureCode',
                allowableValues: {
                  valueOptions: [
                    {
                      value: 'EA',
                      name: 'Each(Unit)',
                      overrideValue: 'Each(Unit)',
                    },
                    {
                      value: 'CA',
                      name: 'Case(Prepack)',
                      overrideValue: 'Case(Prepack)',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
              {
                index: 4,
                name: 'Unit Price',
                key: 'unitPrice',
                type: 'decimal',
              },
              {
                index: 5,
                name: 'Basis of Unit Price',
                key: 'basisOfUnitPrice',
                allowableValues: {
                  valueOptions: [
                    {
                      value: 'LE',
                      name: 'Catalog Price Each',
                      overrideValue: 'Catalog Price Each',
                    },
                    {
                      value: 'NC',
                      name: 'No Charge',
                      overrideValue: 'No Charge',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
              {
                index: 6,
                name: 'Product ID Qualifier1',
                key: 'productIdQualifier1',
                type: 'string',
              },
              {
                index: 7,
                name: 'Product ID1',
                key: 'productId1',
                type: 'string',
              },
              {
                index: 8,
                name: 'Product/Service ID Qualifier2',
                key: 'productIdQualifier2',
                type: 'string',
              },
              {
                index: 9,
                name: 'Product/Service ID2',
                key: 'productId2',
                type: 'string',
              },
              {
                index: 10,
                name: 'Product/Service ID Qualifier3',
                key: 'Product/ServiceIdQualifier3',
                type: 'string',
              },
              {
                index: 11,
                name: 'Product/Service ID3',
                key: 'Product/ServiceId3',
                type: 'string',
              },
              {
                index: 12,
                name: 'Product/Service ID Qualifier4',
                key: 'Product/ServiceIdQualifier4',
                allowableValues: {
                  valueOptions: [
                    {
                      value: 'BO',
                      name: 'OR',
                      overrideValue: 'OR',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
              {
                index: 13,
                name: 'Product/Service ID4',
                key: 'Product/ServiceId4',
                type: 'string',
              },
              {
                index: 14,
                name: 'Product/Service ID Qualifier5',
                key: 'Product/ServiceIDQualifier5',
                allowableValues: {
                  valueOptions: [
                    {
                      value: 'VA',
                      name: 'VA',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
              {
                index: 15,
                name: 'Product/Service ID5',
                key: 'Product/ServiceId5',
                type: 'string',
              },
              {
                index: 16,
                name: 'Product/Service ID Qualifier6',
                key: 'Product/ServiceIdQualifier6',
                allowableValues: {
                  valueOptions: [
                    {
                      value: 'JP',
                      name: 'Pre-pack',
                      overrideValue: 'Pre-pack',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
              {
                index: 17,
                name: 'Product/Service ID6',
                key: 'Product/ServiceID6',
                type: 'string',
              },
              {
                index: 18,
                name: 'Product/Service ID Qualifier7',
                key: 'Product/ServiceIDQualifier7',
                allowableValues: {
                  valueOptions: [
                    {
                      value: 'CG',
                      name: 'Coordinate Group',
                      overrideValue: 'Coordinate Group',
                    },
                  ],
                  allowAny: true,
                },
                type: 'string',
              },
              {
                index: 19,
                name: 'Product/Service ID8',
                key: 'Product/ServiceID8',
                type: 'string',
              },
            ],
            segmentFormatList: [
              {
                key: 'CUR',
                code: 'CUR',
                name: 'Currency',
                type: 'object',
                mandatory: false,
                elementFormatList: [
                  {
                    index: 1,
                    name: 'Entity Identifier Code',
                    key: 'entityIdentifierCode',
                    type: 'string',
                  },
                  {
                    index: 2,
                    name: 'Currency Code',
                    key: 'currencyCode',
                    type: 'string',
                  },
                ],
              },
              {
                key: 'MEA',
                code: 'MEA',
                name: 'Measurements',
                type: 'Object',
                mandatory: false,
                elementFormatList: [
                  {
                    index: 1,
                    name: 'Class of Trade',
                    key: 'classOfTrade',
                    allowableValues: {
                      valueOptions: [
                        {
                          value: 'SH',
                          name: 'Shipping Tolerance',
                          overrideValue: 'Shipping Tolerance',
                        },
                      ],
                      allowAny: true,
                    },
                    type: 'string',
                  },
                  {
                    index: 2,
                    name: 'Price Code Qualifier',
                    key: 'priceCodeQualifier',
                    allowableValues: {
                      valueOptions: [
                        {
                          value: 'PO',
                          name: 'Percent of Order',
                          overrideValue: 'Percent of Order',
                        },
                      ],
                      allowAny: true,
                    },
                    type: 'string',
                  },
                  {
                    index: 3,
                    name: 'Unit Price',
                    key: 'UnitPrice',
                    type: 'decimal',
                  },
                ],
              },
              {
                code: 'PID',
                key: 'PID',
                name: 'product/Item Description',
                mandatory: false,
                type: 'list',

                elementFormatList: [
                  {
                    index: 1,
                    name: 'Item Description Type',
                    key: 'itemDescriptionType',
                    allowableValues: {
                      valueOptions: [
                        {
                          value: 'F',
                          name: 'Free Form',
                          overrideValue: 'Free Form',
                        },
                      ],
                      allowAny: true,
                    },
                    type: 'string',
                  },
                  {
                    index: 2,
                    name: 'Product Characteristic Code',
                    key: 'productCharacteristicCode',
                    allowableValues: {
                      valueOptions: [
                        {
                          value: '08',
                          name: 'Product Description',
                          overrideValue: 'Product Description',
                        },
                        {
                          value: '75',
                          name: 'Buyers Color Desc',
                          overrideValue: 'Buyers Color Desc',
                        },
                      ],
                      allowAny: true,
                    },
                    type: 'string',
                  },

                  {
                    index: 5,
                    name: 'Description',
                    key: 'description',
                    type: 'string',
                  },
                ],
              },

              {
                code: 'PO4',
                key: 'PO4',
                name: 'ItemPhysicalDetails',
                type: 'object',
                mandatory: false,
                elementFormatList: [
                  {
                    index: 1,
                    name: 'Pack',
                    key: 'pack',
                    type: 'integer',
                  },
                  {
                    index: 2,
                    name: 'Size',
                    key: 'size',
                    type: 'integer',
                  },
                  {
                    index: 3,
                    name: 'Unit of Measure Code1',
                    key: 'unitOfMeasureCode1',
                    allowableValues: {
                      valueOptions: [
                        {
                          value: 'EA',
                          name: 'Each (Unit)',
                          overrideValue: 'Each (Unit)',
                        },
                      ],
                      allowAny: true,
                    },
                    type: 'string',
                  },
                  {
                    index: 4,
                    name: 'Packing Code',
                    key: 'PackingCode',
                    type: 'string',
                  },
                  {
                    index: 8,
                    name: 'Gross Volume per Pack',
                    key: 'grossVolumePerPack',
                    type: 'integer',
                  },
                  {
                    index: 9,
                    name: 'Unit of Measure Code2',
                    key: 'unitOfMeasureCode2',
                    type: 'string',
                  },
                  {
                    index: 14,
                    name: 'Inner Pack',
                    key: 'innerPack',
                    type: 'string',
                  },
                  {
                    index: 15,
                    name: 'Surface/Layer/Position Code',
                    key: 'surface/Layer/PositionCode',
                    allowableValues: {
                      valueOptions: [
                        {
                          value: 'AL',
                          name: 'All',
                          overrideValue: 'All',
                        },
                      ],
                      allowAny: true,
                    },
                    type: 'string',
                  },
                  {
                    index: 18,
                    name: 'Number',
                    key: 'number',
                    type: 'integer',
                  },
                ],
              },
              {
                code: 'SDQ',
                key: 'SDQ',
                name: 'Destination/Quantity Data',
                mandatory: false,
                elementFormatList: [
                  {
                    index: 1,
                    name: 'Unit of Measurement Code',
                    key: 'unitOfMeasurementCode',
                    allowableValues: {
                      valueOptions: [
                        {
                          value: 'EA',
                          name: 'Each',
                          overrideValue: 'Each',
                        },
                        {
                          value: 'CA',
                          name: 'Prepack',
                          overrideValue: 'Prepack',
                        },
                      ],
                      allowAny: true,
                    },
                    type: 'string',
                  },
                  {
                    index: 2,
                    name: 'Location Qualifier',
                    key: 'locationQualifier',
                    allowableValues: {
                      valueOptions: [
                        {
                          value: '92',
                          name: 'Pack by Store',
                          overrideValue: 'Pack by Store',
                        },
                      ],
                      allowAny: true,
                    },
                    type: 'string',
                  },
                  {
                    index: 3,
                    name: 'Location Identifier',
                    key: 'locationIdentifier',
                    type: 'string',
                  },
                  {
                    index: 4,
                    name: 'Quantity',
                    key: 'quantity',
                    type: 'integer',
                  },
                ],
              },
              {
                key: 'N9',
                code: 'N9',
                name: 'Reference Number',
                type: 'list',
                mandatory: false,
                elementFormatList: [
                  {
                    index: 1,
                    name: 'Reference Number Qual',
                    key: 'referenceNumberQual',
                    allowableValues: {
                      valueOptions: [
                        {
                          value: 'DP',
                          name: 'Department',
                          overrideValue: 'Department',
                        },
                        {
                          value: 'MR',
                          name: 'MIC',
                          overrideValue: 'MIC',
                        },
                        {
                          value: 'BT',
                          name: 'Group Code',
                          overrideValue: 'Group Code',
                        },
                        {
                          value: 'JH',
                          name: 'Label Code',
                          overrideValue: 'Label Code',
                        },
                        {
                          value: 'OIC',
                          name: 'Label Type',
                          overrideValue: 'Label Type',
                        },
                        {
                          value: 'E9',
                          name: 'Hangtag Type',
                          overrideValue: 'Hangtag Type',
                        },
                        {
                          value: '2I',
                          name: 'Tracking',
                          overrideValue: 'Tracking',
                        },
                        {
                          value: 'PM',
                          name: 'Concatenated Style',
                          overrideValue: 'Concatenated Style',
                        },
                        {
                          value: 'TS',
                          name: 'HTS',
                          overrideValue: 'HTS',
                        },
                        {
                          value: 'W9',
                          name: 'Special Packageing',
                          overrideValue: 'Special Packageing',
                        },
                      ],
                      allowAny: true,
                    },
                    type: 'string',
                  },
                  {
                    index: 2,
                    name: 'Reference Number',
                    key: 'referenceNumber',
                    type: 'string',
                  },
                  {
                    index: 3,
                    name: 'Free-form Description',
                    key: 'free-formDescription',
                    type: 'string',
                  },
                ],
              },
              {
                code: 'SLN',
                key: 'SLN',
                name: 'Subline Item Detail',
                mandatory: false,
                type: 'list',
                elementFormatList: [
                  {
                    index: 1,
                    name: 'Assigned Identification',
                    key: 'assignedIdentification',
                    type: 'string',
                  },
                  {
                    index: 3,
                    name: 'Relationship Code',
                    key: 'relationshipCode',
                    allowableValues: {
                      valueOptions: [
                        {
                          value: 'I',
                          name: 'Included',
                          overrideValue: 'Included',
                        },
                      ],
                      allowAny: true,
                    },
                    type: 'string',
                  },
                  {
                    index: 4,
                    name: 'Quantity',
                    key: 'quantity',
                    type: 'integer',
                  },
                  {
                    index: 5,
                    name: 'Unit of Measure Code',
                    key: 'unitOfMeasureCode',
                    allowableValues: {
                      valueOptions: [
                        {
                          value: 'EA',
                          name: 'Each',
                          overrideValue: 'Each',
                        },
                      ],
                      allowAny: true,
                    },
                    type: 'string',
                  },
                  {
                    index: 6,
                    name: 'Unit Price',
                    key: 'unitPrice',
                    type: 'decimal',
                  },
                  {
                    index: 7,
                    name: 'Basis of Unit Price',
                    key: 'basisOfUnitPrice',
                    allowableValues: {
                      valueOptions: [
                        {
                          value: 'LE',
                          name: 'Catalog Price Each',
                          overrideValue: 'Catalog Price Each',
                        },
                      ],
                      allowAny: true,
                    },
                    type: 'string',
                  },
                  {
                    index: 9,
                    name: 'Product ID Qualifier',
                    key: 'productIdQualifier1',
                    type: 'string',
                  },
                  {
                    index: 10,
                    name: 'Product ID',
                    key: 'ProductId1',
                    type: 'string',
                  },
                  {
                    index: 11,
                    name: 'Product/Service ID Qualifier',
                    key: 'productIdQualifier2',
                    type: 'string',
                  },
                  {
                    index: 12,
                    name: 'Product ID',
                    key: 'productId2',
                    type: 'string',
                  },
                  {
                    index: 13,
                    name: 'Product ID Qualifier',
                    key: 'productIdQualifier3',
                    allowableValues: {
                      valueOptions: [
                        {
                          value: 'JP',
                          name: 'PrepackNameSize',
                          overrideValue: 'Prepack Name Size',
                        },
                      ],
                      allowAny: true,
                    },
                    type: 'string',
                  },
                  {
                    index: 14,
                    name: 'Product/Service ID',
                    key: 'productId3',
                    type: 'string',
                  },
                  {
                    index: 17,
                    name: 'Product/Service ID Qualifier',
                    key: 'productIdQualifier4',
                    type: 'string',
                  },
                  {
                    index: 18,
                    name: 'Product/Service ID',
                    key: 'productId4',
                    type: 'string',
                  },
                ],
              },
            ],
          },
          {
            code: 'SE',
            key: 'SE',
            name: 'Transaction Set Trailer',
            type: 'object',
            mandatory: false,
            elementFormatList: [
              {
                index: 1,
                name: 'Number of Included Segments',
                key: 'numberofIncludedSegments',
                type: 'integer',
              },
              {
                index: 2,
                name: 'Transaction Set Control Num',
                key: 'transactionSetControlNum',
                type: 'string',
              },
            ],
          },
          {
            code: 'CTT',
            key: 'CTT',
            name: 'Transaction Total',
            type: 'object',
            mandatory: false,
            elementFormatList: [
              {
                index: 1,
                name: 'Number of Line Items',
                key: 'numberofLineItems',
                type: 'integer',
              },
            ],
          },
        ],
      },
      {
        code: 'GE',
        key: 'GE',
        name: 'Group Control Trailer',
        type: 'object',
        mandatory: false,
        elementFormatList: [
          {
            index: 1,
            name: 'Number of Included Transaction Sets ',
            key: 'numberOfIncludedTransactionSets ',
            type: 'integer',
          },
          {
            index: 2,
            name: 'Data Interchange Control Num',
            key: 'dataInterchangeControlNum',
            type: 'integer',
          },
        ],
      },
      {
        key: 'IEA',
        code: 'IEA',
        name: 'Interchange Control Trailer',
        type: 'object',
        mandatory: false,
        elementFormatList: [
          {
            index: 1,
            name: 'Number of Included Groups',
            key: 'numberofIncludedGroups',
            type: 'integer',
          },
          {
            index: 2,
            name: 'Interchange Control Number',
            key: 'interchangeControlNumber',
            type: 'string',
          },
        ],
      },
    ],
  },
} as EdiFormatJson

export const schedulerConfig = {
  active: true,
  schedule: '0 * * ? * *',
  ediFile: {
    path: '/home/ec2-user/ftptest/',
    extensions: ['edi', 'txt'],
    storageConfig: {
      handlerName: 'sftp',
      config: {
        os: 'linux',

        host: '13.229.70.248',
        port: '22',
        username: 'ec2-user',

        privateKey: `privateKey`,
      },
    },
  },
  // the oubound name after parsing the edi
  outbound: 'someOutbound',
} as EdiSchedulerConfig

export default class EdiParser850 extends BaseEdiParser {
  constructor(
    protected readonly partyGroupCode: string,
    protected readonly type: string,
    protected readonly formatJson: any,
    protected readonly allService: any
  ) {
    super(partyGroupCode, type, formatJson, allService)
  }
  async import(base64EdiString: string): Promise<any> {
    // console.log(`import type  : ${this.type}`)
    const response = await super.import(base64EdiString)

    const ediJson = response['jsonData']
    // hardcode
    const user = {
      username: 'ediImport',
      selectedPartyGroup: { code: this.partyGroupCode },
    } as JwtPayload

    const poList = [] as PurchaseOrder[]
    if (!ediJson) {
      return ediJson
    }
    if (Array.isArray(ediJson['ST'])) {
      for (const ST of ediJson['ST']) {
        const po: PurchaseOrder = {
          flexData: {
            data: {},
          },
        } as PurchaseOrder

        const poItemList = [] as PurchaseOrderItem[]
        po.edi = true
        po.flexData.data['moreParty'] = []
        po.flexData.data['moreDate'] = []

        const missingDateName1 = 'ediCreated'
        const missingDateName2 = 'dataInterchange'
        po.flexData.data[`${missingDateName1}DateEstimated`] = null
        if (_.get(ediJson, 'ISA.createdDate') && _.get(ediJson, 'ISA.createdTime')) {
          po.flexData.data[`${missingDateName1}DateEstimated`] = null
          po.flexData.data[`${missingDateName1}DateActual`] = moment.utc(
            `${_.get(ediJson, 'ISA.createdDate')} ${_.get(ediJson, 'ISA.createdTime')}`
          )

          po.flexData.data[`${missingDateName2}DateEstimated`] = null
          po.flexData.data[`${missingDateName2}DateActual`] = moment.utc(
            `${_.get(ediJson, 'GS.dataInterchangeDate')} ${_.get(
              ediJson,
              'GS.dataInterchangeTime'
            )}`
          )
        }
        po.flexData.data['moreDate'].push(missingDateName1)
        po.flexData.data['moreDate'].push(missingDateName2)
        po.poNo = _.get(ST, 'BEG.purchaseOrderNumber')
        if (_.get(ST, 'BEG.purchaseOrderDate')) {
          po.poDate = moment.utc(_.get(ST, 'BEG.purchaseOrderDate')).toDate()
        }
        po['Department'] = _.get(ST, 'REF.referenceNumber')
        if (_.get(ST, 'DTM.doNotShipBefore')) {
          po.dontShipBeforeDate = moment.utc(_.get(ST, 'DTM.doNotShipBefore')).toDate()
        }
        if (_.get(ST, 'DTM.doNotDeliverAfter')) {
          po.dontShipAfterDate = moment.utc(_.get(ST, 'DTM.doNotDeliverAfter')).toDate()
        }
        if (_.get(ST, 'DTM.requestedShipDateFromSupplierWarehouse')) {
          po.exitFactoryDateActual = moment
            .utc(_.get(ST, 'DTM.requestedShipDateFromSupplierWarehouse'))
            .toDate()
        }

        if (Array.isArray(ST['N1'])) {
          for (const N1 of _.get(ST, 'N1')) {
            let name
            if (_.get(N1, 'organizationIdentifier') === 'Ship From') {
              name = 'shipper'
              po[`${name}PartyCode`] = _.get(N1, 'identificationCode')
              po[`${name}PartyName`] = _.get(N1, 'name')
            } else if (_.get(N1, 'organizationIdentifier') === 'Ship To') {
              name = 'shipTo'
              const index = (_.get(N1, 'name') || '').indexOf('#')
              if (index > 0) {
                po[`${name}PartyCode`] = `${_.get(N1, 'name').substr(index + 1)} ${_.get(
                  N1,
                  'identificationCode'
                ).substr(0, 9)}`
                po[`${name}PartyName`] = _.get(N1, 'name').substr(0, index)
              } else {
                po[`${name}PartyCode`] = _.get(N1, 'identificationCode').substr(0, 9)
                po[`${name}PartyName`] = _.get(N1, 'name')
              }
            } else {
              name = _.get(N1, 'organizationIdentifier')
              po.flexData.data[`${name.replace(/\s/g, '')}PartyCode`] = _.get(
                N1,
                'identificationCode'
              )
              po.flexData.data[`${name.replace(/\s/g, '')}PartyName`] = _.get(N1, 'name')
              po.flexData.data[`${name.replace(/\s/g, '')}PartyAddress1`] = _.get(
                N1,
                'N3.addressInformation'
              )
              po.flexData.data[`${name.replace(/\s/g, '')}PartyAddress2`] = _.get(
                N1,
                'N3.additionalAddressInformation'
              )
              po.flexData.data[`${name.replace(/\s/g, '')}PartyCityCode`] = _.get(N1, 'N4.cityName')
              po.flexData.data[`${name.replace(/\s/g, '')}PartyStateCode`] = _.get(
                N1,
                'N4.stateOrProvinceCode'
              )
              po.flexData.data[`${name.replace(/\s/g, '')}PartyZip`] = _.get(N1, 'N4.postalCode')
              po.flexData.data[`${name.replace(/\s/g, '')}PartyCountryCode`] = _.get(
                N1,
                'N4.countryCode'
              )
              po.flexData.data['moreParty'].push(name)
              continue
            }
            po[`${name}PartyAddress1`] = _.get(N1, 'N3.addressInformation')
            po[`${name}PartyAddress2`] = _.get(N1, 'N3.additionalAddressInformation')
            po[`${name}PartyCityCode`] = _.get(N1, 'N4.cityName')
            po[`${name}PartyStateCode`] = _.get(N1, 'N4.stateOrProvinceCode')
            po[`${name}PartyZip`] = _.get(N1, 'N4.postalCode')
            po[`${name}PartyCountryCode`] = _.get(N1, 'N4.countryCode')
          }
        }
        // return response
        if (Array.isArray(ST['PO1'])) {
          for (const PO1 of ST['PO1']) {
            // k<ST['PO1'].length
            const poItem = {} as PurchaseOrderItem
            // console.log(`check product code ${PO1['productId'].substr(3, 11)}`)
            const product = {} as Product

            // console.log(`producttype: ${typeof product}`)
            // console.log(`check product interface {typeof product}`)
            product['subLine'] = _.get(PO1, 'SLN.assignedIdentification')
            product['poLineNo'] = _.get(PO1, 'productId1', '').substr(24, 3)
            product['price'] = _.get(PO1, 'unitPrice')
            product['priceUnit'] = _.get(PO1, 'basisOfUnitPrice')
            product['sea'] = _.get(PO1, 'productId1', '').substr(0, 3)
            product['style'] = _.get(PO1, 'productId1', '')
              .substr(3, 12)
              .trim()
            product['styleDesc'] = _.get(PO1, 'PID.description', '')
              .substr(0, 20)
              .replace(/^[ ]+|[ ]+$/g, '')
            product['piece'] = _.get(PO1, 'productId1', '').substr(18, 6)
            product['pieceDesc'] = _.get(PO1, 'PID.description', '')
              .substr(40, 20)
              .replace(/^[ ]+|[ ]+$/g, '')
            product['color'] = _.get(PO1, 'productId1', '').substr(15, 3)
            product['colorDesc'] = _.get(PO1, 'Product/ServiceId4')
            product['pack'] = _.get(PO1, 'productId1', '').substr(24, 3)
            product['packing'] = ''
            product['size'] = _.get(PO1, 'SLN.productId3')
            product['upcen'] = _.get(PO1, 'SLN.productId2')
            poItem.itemKey = _.get(PO1, 'poLineNumber')
            poItem['perPackageQuantity'] = _.get(PO1, 'PO4.pack')
            poItem.quantity = _.get(PO1, 'quantityOrdered')
            poItem.quantityUnit = _.get(PO1, 'unitOfMeasureCode')
            poItem.volume = _.get(PO1, 'PO4.grossVolumePerPack')
            poItem.product = product
            poItemList.push(poItem)
          }
        }

        po.purchaseOrderItems = poItemList

        po.errors = response['errorList']

        poList.push(po)
      }
    }
    return poList
  }
  async export(entityJSON: any): Promise<any> {
    // console.log(`export type: ${this.type}`)
    const result = await super.export(entityJSON)
    return result
  }
}
