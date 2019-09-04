
import { BaseEdiParser } from 'modules/edi/baseEdiParser'
import { CodeMasterService } from 'modules/sequelize/codeMaster/service'
import { ProductDbService } from 'modules/sequelize/product/service'
import { OutboundService } from 'modules/integration-hub/services/outbound'
import { SwivelConfigService } from 'modules/swivel-config/service'
import { PurchaseOrder } from 'models/main/purchaseOrder'
import { PurchaseOrderItem } from 'models/main/purchaseOrderItem'

const moment = require('moment')

export default class EdiParser850 extends BaseEdiParser {

    constructor(
        protected readonly type: string,
        protected readonly formatJson: any,
        protected readonly allService: any

    ) {
        super(type, formatJson, allService)
    }

    async import(base64EdiContent: string): Promise<any> {

        console.log(`import type  : ${this.type}`)

        const result = await this.callImportOutbound(base64EdiContent)

        const products = []

        // const response = await this.outboundService.send(
        //   `system`,
        //   'edi-import',
        //   {},
        //   {
        //     // hardcode
        //     ediType: '850',
        //   }
        // )

        // // const response = await this.outboundService.send(`customer-${user.selectedPartyGroup.code}`, 'edi-import', {}, edi)

        // // console.log(response)

        // const ediJson = response['jsonData']

        // const poList = [] as PurchaseOrder[]
        // for (const ST of ediJson['ST']) {
        //   const po: PurchaseOrder = {
        //     flexData: {
        //       data: {},
        //     },
        //   } as PurchaseOrder

        //   const poItemList = [] as PurchaseOrderItem[]

        //   const missingDateName1 = 'ediCreated'
        //   po.flexData.data[missingDateName1 + 'DateEstimated'] = null
        //   console.log(
        //     `Time: ${moment(ediJson['ISA']['createdDate'] + ' ' + ediJson['ISA']['createdTime'])}`
        //   )
        //   po.flexData.data[missingDateName1 + 'DateActual'] = moment(
        //     ediJson['ISA']['createdDate'] + ' ' + ediJson['ISA']['createdTime']
        //   )

        //   const missingDateName2 = 'dataInterchange'
        //   po.flexData.data[missingDateName2 + 'DateEstimated'] = null
        //   po.flexData.data[missingDateName2 + 'DateActual'] = moment(
        //     ediJson['ISA']['createdDate'] + ' ' + ediJson['ISA']['createdTime']
        //   )

        //   po.poNo = ST['BEG']['purchaseOrderNumber']
        //   po.poDate = moment(ST['BEG']['purchaseOrderDate']).toDate()
        //   po.dontShipBeforeDate = moment(ST['DTM']['doNotShipBefore']).toDate()
        //   po.dontShipAfterDate = moment(ST['DTM']['doNotDeliverAfter']).toDate()
        //   po.exitFactoryDateActual = moment(
        //     ST['DTM']['requestedShipDateFromSupplierWarehouse']
        //   ).toDate()

        //   // console.log("Value:"+ST['N1'][i]['organizationIdentifier'])
        //   // console.log(`True or False: ${ST['N1'][i]['organizationIdentifier']==='Ship from'}`)
        //   // console.log(`Length ${ST['N1'].length}`)

        //   for (const N1 of ST['N1']) {
        //     // console.log("Value:"+N1['organizationIdentifier'])

        //     let name
        //     const city = await this.LocationService.findOne(
        //       {
        //         where: {
        //           name: N1['N4']['cityName'],
        //         },
        //       },
        //       user
        //     )

        //     if (N1['organizationIdentifier'] === 'Ship From') {
        //       name = 'shipper'
        //     } else if (N1['organizationIdentifier'] === 'Ship To') {
        //       name = 'shipTo'
        //     } else {
        //       name = N1['organizationIdentifier']
        //       po.flexData.data[name + 'PartyCode'] = N1['identificationCode']
        //       po.flexData.data[name + 'PartyName'] = N1['name']
        //       po.flexData.data[name + 'PartyAddress'] =
        //         N1['N3']['addressInformation'] + ' ' + N1['N3']['additionalAddressInformation']
        //       if (typeof city !== 'undefined') {
        //         po.flexData.data[name + 'PartyCityCode'] = city.locationCode
        //       }
        //       po.flexData.data[name + 'PartyStateCode'] = N1['N4']['stateOrProvinceCode']
        //       po.flexData.data[name + 'PartyZip'] = N1['N4']['postalCode']
        //       po.flexData.data[name + 'PartyCountryCode'] = N1['N4']['countryCode']
        //       po.flexData.data['moreParty'] = []
        //       po.flexData.data['moreParty'].push(name)
        //       continue
        //     }

        //     po[name + 'PartyCode'] = N1['identificationCode']
        //     po[name + 'PartyName'] = N1['name']
        //     po[name + 'PartyAddress'] =
        //       N1['N3']['addressInformation'] + ' ' + N1['N3']['additionalAddressInformation']
        //     if (typeof city !== 'undefined') {
        //       po[name + 'PartyCityCode'] = city.locationCode
        //     }
        //     po[name + 'PartyStateCode'] = N1['N4']['stateOrProvinceCode']
        //     po[name + 'PartyZip'] = N1['N4']['postalCode']
        //     po[name + 'PartyCountryCode'] = N1['N4']['countryCode']
        //   }
        //   po.flexData.data['moreDate'] = []
        //   po.flexData.data['moreDate'].push(missingDateName1)
        //   po.flexData.data['moreDate'].push(missingDateName2)

        //   for (const PO1 of ST['PO1']) // k<ST['PO1'].length
        //   {
        //     const poItem = {} as PurchaseOrderItem
        //     const ProductDefinitionField1 = {} as ProductDefinitionField
        //     const ProductDefinitionField2 = {} as ProductDefinitionField
        //     // console.log(`check product code ${PO1['productId'].substr(3,11)}`)
        //     let product = products.find(
        //       product => product.productCode === PO1['productId'].substr(3, 12).trim()
        //     )

        //     // console.log(`producttype: ${typeof product}`)

        //     if (!product) {
        //       product = await this.productService.findOne(
        //         {
        //           where: {
        //             productCode: PO1['productId'].substr(3, 12).trim(),
        //           },
        //         },
        //         user
        //       )
        //       // console.log(`check product type ${typeof product}`)
        //       if (!product) {
        //         product = {} as Product
        //         product.productCode = PO1['productId'].substr(3, 11)
        //         const descriptionName = PO1['PID'][0]['description']
        //         // console.log(`Description: ${descriptionName}`)
        //         const nameIndex = descriptionName.indexOf(' ')
        //         product.name = descriptionName.substr(0, nameIndex)
        //         ProductDefinitionField1.fieldName = 'colour'
        //         ProductDefinitionField1.type = 'string'
        //         ProductDefinitionField1.values = PO1['productId'].substr(15, 3)
        //         // console.log(`ProductDefinitionField: ${ProductDefinitionField1.values}`)
        //         // console.log(`Type: ${typeof product.definition}`)

        //         product.definition = []
        //         product.definition.push(ProductDefinitionField1)

        //         ProductDefinitionField2.fieldName = 'material'
        //         ProductDefinitionField2.type = 'string'
        //         ProductDefinitionField2.values = PO1['productId'].substr(18, 6)
        //         // console.log(`ProductDefinitionField: ${ProductDefinitionField2.values}`)
        //         product.definition.push(ProductDefinitionField2)
        //       } else {
        //         products.push(product)
        //       }
        //     }

        //     poItem.quantity = PO1['quantityOrdered']
        //     poItem.quantityUnit = PO1['unitOfMeasureCode']
        //     poItem.htsCode = PO1['SLN']['productId2']

        //     poItem.product = product
        //     poItemList.push(poItem)
        //   }

        //   po.purchaseOrderItems = poItemList

        //   poList.push(po)
        // }

        // TODO save PO and PO Item

        // po.shipToPartyName

        // po.flexData.data = { aaa : '12354567'  }
        // console.log(poList)

        return result

    }

    async export(): Promise<any> {

        console.log(`export type  : ${this.type}`)

        const result = await this.callExportOutbound()

        return result

    }

}
