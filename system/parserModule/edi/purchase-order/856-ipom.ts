// 2020-03-26
import { SwivelConfigService } from 'modules/swivel-config/service'
import { OutboundService } from 'modules/integration-hub/services/outbound'

import { BaseEdiParser } from 'modules/parser/parser/edi'
import { EdiFormatJson } from 'modules/edi/interface'

const moment = require('moment')
const _ = require('lodash')
const {from} = require('rxjs')
const {groupBy, mergeMap, toArray} = require('rxjs/operators')

export const formatJson = {
  removeCharacter: [],
  segmentSeperator: ['~\r\n'],
  // elementSeperator: ['*']
  elementSeperator: ['']
} as EdiFormatJson

interface JSONObject {
  segement?: string,
  elementList?: any[]
}

export default class EdiParser856 extends BaseEdiParser {
    constructor(
        protected readonly allService: {
          swivelConfigService: SwivelConfigService,
          outboundService: OutboundService,
        },
      ) {
        super(allService, {}, { export: { formatJson, ediType: '856' } })
      }

  async export(entityJSON: any): Promise<any> {
    const returnJSON = {}
    const data = []
    const currantDate = moment().toDate()
    let index = 0

    const cloneEntityJSON = _.cloneDeep(entityJSON)

    const ISA: JSONObject = {
        segement: 'ISA',
        elementList : []
    }

    const bookingNo = _.get(entityJSON[0], 'bookingNo')
    const removeCharbookingNo = bookingNo.replace(/-/g, '')
    const controlNo = await this.getNewSeq(process.env.NODE_ENV === 'production' ? '856-ipom' : '856-ipom-dev')
    ISA.elementList.push('00', '          ', '00',
    '          ', '12', '718978080      ', '08' , '6112390050     ' , moment(currantDate).format('YYMMDD'), moment(currantDate).format('HHmm'), 'U', '00403', controlNo, '0', 'P', '>')
    data.push(ISA)
    const GS: JSONObject = {
        segement: 'GS',
        elementList: []
    }
    GS.elementList.push('SH', '718978080', '6112390050', moment(currantDate).format('YYYYMMDD'), moment(currantDate).format('HHmm'), parseInt(controlNo, 10), 'X', '004030VICS')
    data.push(GS)

    let lengthOfPreviousData = data.length

    for (const element of cloneEntityJSON)
    {
      index += 1
      const ST: JSONObject = {
          segement: 'ST',
          elementList : []
      }
      ST.elementList.push('856')
      const pad = '0000'
      const elementId = `${pad.substring(0, pad.length - index.toString().length)}${index}`
      ST.elementList.push(`${elementId}`)
      data.push(ST)
      const BSN: JSONObject = {
        segement: 'BSN',
        elementList: []
      }
      const container = _.get(element, 'bookingContainers')
      const containerNo = _.get(container[0], 'containerNo')
      const bookingNo = (_.get(element, 'bookingNo') || '')
      const newBookingNo = `${bookingNo}-${containerNo}`
      BSN.elementList.push('00')
      BSN.elementList.push(newBookingNo.substring(0, 30))
      BSN.elementList.push(moment(_.get(element, 'createdAt')).format('YYYYMMDD'))
      BSN.elementList.push(moment(_.get(element, 'createdAt')).format('HHmm'))
      BSN.elementList.push('0004')
      data.push(BSN)
      let loopObjectList: any[] = []
      const getNumOfLoopItem = (_.get(element, 'bookingContainers').length) + (_.get(element, 'bookingPOPackings').length) + this.getNumOfPo(_.get(element, 'bookingPOPackings'))
      loopObjectList = await this.getLoopObject(loopObjectList, element)
      const filteredList = loopObjectList.filter(value => Object.keys(value).length !== 0)
      data.push(...filteredList)

      await this.removeEmptyElementListObject(data)
      const bookingAmountList = _.get(element, 'bookingAmount')
      const e890Info = bookingAmountList.find(x => x.type === 'OceanFreight')
      const SACE890: JSONObject = {
        segement: 'SAC',
        elementList: []
      }
      SACE890.elementList.push('C', 'E890', '', '',  _.get(e890Info, 'amount') || ' ')
      data.push(SACE890)
      const b510Info = bookingAmountList.find(x => x.type === 'Consolidation')
      const SACEB510: JSONObject = {
        segement: 'SAC',
        elementList: []
      }
      SACEB510.elementList.push('C', 'B510', '', '',  _.get(b510Info, 'amount') || ' ')
      data.push(SACEB510)
      const CTT: JSONObject = {
        segement : 'CTT',
        elementList : []
      }
      CTT.elementList.push(getNumOfLoopItem.toString().substring(0, 6))
      data.push(CTT)

      const SE: JSONObject = {
        segement : 'SE',
        elementList: []
      }
      SE.elementList.push((data.length - lengthOfPreviousData + 1).toString().substring(0, 6))
      SE.elementList.push(`${pad.substring(0, pad.length - index.toString().length)}${index}`)
      data.push(SE)
      lengthOfPreviousData += data.length

    }
    const GE: JSONObject = {
      segement: 'GE',
      elementList : []
    }
    GE.elementList.push(index.toString(), parseInt(controlNo, 10))
    const IEA: JSONObject = {
      segement: 'IEA',
      elementList : []
    }
    IEA.elementList.push('1', controlNo)
    data.push(GE, IEA)
    _.set(returnJSON, 'data', data)
    // return cloneEntityJSON
    // return returnJSON
    // const edtResult = this.toExport(returnJSON)
    // return edtResult
    const result = await super.export(returnJSON)
    // return result['ediResults']['item1']
    return [result]
  }
  async removeEmptyElementListObject(data)
  {
    for (let i = data.length - 1; i >= 0; i--)
    {
      let noEmpty = false
      for (const element of data[i].elementList)
      {
        if (element.trim())
        {
          noEmpty = true
          break
        }
      }
      if (noEmpty === false)
      {
        data.splice(i, 1)
      }
    }
    return data
  }

  async getLoopObject(loopObjectList, element)
  {
    if ((_.get(element, 'bookingContainers') || []).length)
    {
      for (const container of element.bookingContainers)
      {
        let shipmentCumanlateNo = 1
        const poList = this.getTargetPoList(element, container.containerNo)
        const HL: JSONObject = {
          segement : 'HL',
          elementList : []
        }
        HL.elementList.push(shipmentCumanlateNo.toString().substring(0, 12))
        HL.elementList.push('')// not used
        HL.elementList.push('S')
        loopObjectList.push(HL)
        if (poList.length)
        {
          let totalWeight = 0
          let numberOfPacking = 0
          let totalVolume = 0
          let totalShipUnit = 0
          let missingPosition = 1
          for (const booking of poList)
          {
            if (_.get(booking, 'bookWeight') || _.get(booking, 'bookWeight') === 0)
            {
              totalWeight += _.get(booking, 'bookWeight')
            }
            else
            {
              throw new Error(`missing the bookWeight in bookingPOPackings ${missingPosition}`)
            }
            if (_.get(booking, 'bookVolume') || _.get(booking, 'bookVolume') === 0)
            {
              totalVolume += _.get(booking, 'bookVolume')
            }
            else
            {
              throw new Error(`missing the bookVolume in bookingPOPackings ${missingPosition}`)
            }
            if (_.get(booking, 'bookQuantity') || _.get(booking, 'bookQuantity') === 0)
            {
              totalShipUnit += _.get(booking, 'bookQuantity')
            }
            else
            {
              throw new Error(`missing the bookQuantity in bookingPOPackings ${missingPosition}`)
            }
            if (_.get(booking, 'bookCtns') || _.get(booking, 'bookCtns') === 0)
            {
              numberOfPacking += _.get(booking, 'bookCtns')
            }
            else
            {
              throw new Error(`missing the bookCtns in bookingPOPackings ${missingPosition}`)
            }
            missingPosition++
          }
          if (totalWeight >= 0)
          {
            const MEA: JSONObject = {
              segement: 'MEA',
              elementList: []
            }
            totalWeight = Number.parseFloat(totalWeight.toPrecision(5))
            MEA.elementList.push('')// not used
            MEA.elementList.push( 'WT', totalWeight.toString().substring(0, 20), 'KG')
            loopObjectList.push(MEA)
          }
          if (totalVolume >= 0)
          {
            const MEA: JSONObject = {
              segement: 'MEA',
              elementList: []
            }
            totalVolume = Number.parseFloat(totalVolume.toPrecision(5))
            MEA.elementList.push('')// not used
            MEA.elementList.push( 'VOL', totalVolume.toString().substring(0, 20), 'CO')
            loopObjectList.push(MEA)
          }
          if (numberOfPacking >= 0)
          {
            const MEA: JSONObject = {
              segement: 'MEA',
              elementList: []
            }
            MEA.elementList.push('')// not used
            MEA.elementList.push( 'NM', numberOfPacking.toString().substring(0, 20), 'CT')
            loopObjectList.push(MEA)
          }
          if (totalShipUnit >= 0)
          {
            const MEA: JSONObject = {
              segement: 'MEA',
              elementList: []
            }
            MEA.elementList.push('')// not used
            MEA.elementList.push( 'SU', totalShipUnit.toString().substring(0, 20), 'PC')
            loopObjectList.push(MEA)
          }
        }
        const carrierCode = _.get(element, 'carrierCode')
        const pad2 = '    '
        const scacMapper = {
          MSC: 'MSCU',
          HII: 'HLCU',
          HSU: 'SUDU',
          ONE: 'ONEY',
          MSK: 'MAEU',
          CMA: 'CMDU'
        }
        let scac = '    '
        if (!carrierCode || (!scacMapper[carrierCode] && carrierCode.length < 4))
        {
          throw new Error('missing carrierCode')
        }
        if (carrierCode)
        {
          scac = scacMapper[carrierCode] || `${carrierCode}${pad2.substring(0, pad2.length - carrierCode.length || ''.toString().length)}`
        }
        const TD5OA: JSONObject = {
          segement : 'TD5',
          elementList : []
        }
        TD5OA.elementList.push('O')
        TD5OA.elementList.push('2')
        TD5OA.elementList.push(scac)
        TD5OA.elementList.push('') // not used
        TD5OA.elementList.push('') // not used
        TD5OA.elementList.push('') // not used
        TD5OA.elementList.push('OA')
        TD5OA.elementList.push(_.get(element, 'portOfLoading').substring(0, 30))
        loopObjectList.push(TD5OA)

        const TD5PB: JSONObject = {
          segement : 'TD5',
          elementList : []
        }
        TD5PB.elementList.push('O')
        TD5PB.elementList.push('2')
        TD5PB.elementList.push(scac)
        TD5PB.elementList.push('')// not used
        TD5PB.elementList.push('')// not used // space or no space
        TD5PB.elementList.push('')// not used // space or no space
        TD5PB.elementList.push('PB')
        TD5PB.elementList.push(_.get(element, 'portOfDischarge').substring(0, 30))
        loopObjectList.push(TD5PB)

        if (!_.get(element, 'finalDestination'))
        {
          throw new Error('there is no finalDesination')
        }
        const TD5DE: JSONObject = {
          segement : 'TD5',
          elementList : []
        }
        TD5DE.elementList.push('O')
        TD5DE.elementList.push('2')
        TD5DE.elementList.push(scac)
        TD5DE.elementList.push('') // not used
        TD5DE.elementList.push('') // not used
        TD5DE.elementList.push('') // not used
        TD5DE.elementList.push('DE')
        TD5DE.elementList.push((_.get(element, 'finalDestination') || ' ').substring(0, 30))
        loopObjectList.push(TD5DE)
        const TD5DL: JSONObject = {
          segement : 'TD5',
          elementList : []
        }
        TD5DL.elementList.push('O')
        TD5DL.elementList.push('2')
        TD5DL.elementList.push(scac)
        TD5DL.elementList.push('') // not used
        TD5DL.elementList.push('') // not used
        TD5DL.elementList.push('') // not used
        TD5DL.elementList.push('DL')
        TD5DL.elementList.push((_.get(element, 'finalDestination') || ' ').substring(0, 30))
        loopObjectList.push(TD5DL)
        const TD5KL: JSONObject = {
          segement : 'TD5',
          elementList : []
        }
        TD5KL.elementList.push('O')
        TD5KL.elementList.push('2')
        TD5KL.elementList.push(scac)
        TD5KL.elementList.push('')// not used
        TD5KL.elementList.push('')// not used // space or no space
        TD5KL.elementList.push('')// not used // space or no space
        TD5KL.elementList.push('KL')
        TD5KL.elementList.push(_.get(element, 'portOfLoading').substring(0, 30))
        loopObjectList.push(TD5KL)
        const TD3: JSONObject = {
          segement: 'TD3',
          elementList: []
        }
        TD3.elementList.push('') // not used // space or no space
        TD3.elementList.push((_.get(container, 'containerNo') || ' ').substr(0, 4))
        TD3.elementList.push((_.get(container, 'containerNo') || ' ').substr(4, 10))
        if (_.get(container, 'sealNo1') && _.get(container, 'sealNo1'))
        {
          TD3.elementList.push('', '', '', '', '') // not used
          TD3.elementList.push(_.get(container, 'sealNo1'))
          TD3.elementList.push(_.get(container, 'isoNo'))
        }
        loopObjectList.push(TD3)
        const REF: JSONObject = {
          segement: 'REF',
          elementList: []
        }
        const servciesMap = {
          CFS : 'CFS/DOOR',
          CY : 'CY/DOOR',
          // SD : 'CFS/SD'
        }
        const refNO = servciesMap[_.get(element, 'service')] ? servciesMap[_.get(element, 'service')] : 'MICP'
        REF.elementList.push('KK', refNO)
        loopObjectList.push(REF)
        if (_.get(element, 'cargoReceipt'))
        {
          const DTM: JSONObject = {
              segement : 'DTM',
              elementList : []
          }
          DTM.elementList.push('050')
          DTM.elementList.push(moment(_.get(element, 'cargoReceipt')).format('YYYYMMDD'))
          loopObjectList.push(DTM)
        }
        if (_.get(element, 'estimatedDepartureDate'))
        {
          const DTM: JSONObject = {
              segement : 'DTM',
              elementList : []
          }
          DTM.elementList.push('ABK')
          DTM.elementList.push(moment(_.get(element, 'estimatedDepartureDate')).format('YYYYMMDD'))
          loopObjectList.push(DTM)
        }
        if (_.get(element, 'estimatedDepartureDate'))
        {
          const DTM: JSONObject = {
              segement : 'DTM',
              elementList : []
          }
          DTM.elementList.push('370')
          DTM.elementList.push(moment(_.get(element, 'estimatedDepartureDate')).format('YYYYMMDD'))
          loopObjectList.push(DTM)
        }
        if (_.get(element, 'estimatedArrivalDate'))
        {
          const DTM: JSONObject = {
              segement : 'DTM',
              elementList : []
          }
          DTM.elementList.push('371')
          DTM.elementList.push(moment(_.get(element, 'estimatedArrivalDate')).format('YYYYMMDD'))
          loopObjectList.push(DTM)
        }
        const V1: JSONObject = {
          segement : 'V1',
          elementList : []
        }
        const vesselCode = _.get(element, 'vesselCode')
        const pad = '        '
        let vesselCodeWithLength = '        '
        if (vesselCode)
        {
          vesselCodeWithLength = `${vesselCode}${pad.substring(0, pad.length - vesselCode.toString().length)}`.substring(0, 8)
        }
        V1.elementList.push(vesselCodeWithLength)
        V1.elementList.push((_.get(element, 'vesselName') || '').substring(0, 28) )
        V1.elementList.push('')// not used
        V1.elementList.push((_.get(element, 'voyageFlightNumber') || '').substring(0, 10))
        loopObjectList.push(V1)
        shipmentCumanlateNo++
        loopObjectList = this.handleOrder(poList, shipmentCumanlateNo, loopObjectList, element)
      }
    }
    return loopObjectList
  }
  handleOrder(poList, shipmentCumanlateNo, loopObjectList, element)
  {
    let i = shipmentCumanlateNo
    const ItemList = poList
    const source = from(ItemList)
    const grouped = source.pipe(
      groupBy(item => item.poNo),
      // return each item in group as array
      mergeMap(group => group.pipe(toArray()))
    )
    const shipmentPoList = []
    grouped.subscribe(val => shipmentPoList.push(val))
    let index = 1
    for (const subPoList of shipmentPoList)
    {
      let itemIndex = 0
      const HLO: JSONObject = {
        segement : 'HL',
        elementList : []
      }
      HLO.elementList.push(i.toString().substr(0, 12))
      HLO.elementList.push('1')
      HLO.elementList.push('O')
      loopObjectList.push(HLO)
      const PRF: JSONObject = {
        segement : 'PRF',
        elementList : []
      }
      PRF.elementList.push((_.get(subPoList[0], 'poNo') || '').substring(0, 10))
      if (_.get(subPoList[0], 'poDate'))
      {
        PRF.elementList.push('', '') // not used
        PRF.elementList.push(moment(_.get(subPoList[0], 'poDate')).format('YYYYMMDD'))
      }
      loopObjectList.push(PRF)
      const carrierCode = _.get(element, 'carrierCode')
      const pad2 = '    '
      const scacMapper = {
        MSC: 'MSCU',
        HII: 'HLCU',
        HSU: 'SUDU',
        ONE: 'ONEY',
        MSK: 'MAEU',
        CMA: 'CMDU'
      }
      let scac = '    '
      if (carrierCode)
      {
        scac = scacMapper[carrierCode] || `${carrierCode}${pad2.substring(0, pad2.length - carrierCode.toString().length)}`
      }
      // if (_.get(subPoList[0], 'pol') || _.get(element, 'portOfLoading'))
      // {
        const TD5OR: JSONObject = {
          segement : 'TD5',
          elementList : []
        }
        TD5OR.elementList.push('O')
        TD5OR.elementList.push('2')
        TD5OR.elementList.push(scac)
        TD5OR.elementList.push('') // not used
        TD5OR.elementList.push('') // not used
        TD5OR.elementList.push('') // not used
        TD5OR.elementList.push('OR')
        TD5OR.elementList.push((_.get(element, 'placeOfReceipt') || ' ').substring(0, 30))
        loopObjectList.push(TD5OR)
      // }
      // if (_.get(subPoList[0], 'pod') || _.get(element, 'portOfDischarge'))
      // {
        const TD5: JSONObject = {
          segement : 'TD5',
          elementList : []
        }
        TD5.elementList.push('O')
        TD5.elementList.push('2')
        TD5.elementList.push(scac)
        TD5.elementList.push('') // not used
        TD5.elementList.push('') // not used
        TD5.elementList.push('') // not used
        TD5.elementList.push('DL')
        TD5.elementList.push((_.get(element, 'finalDestination') || ' ').substring(0, 30))
        loopObjectList.push(TD5)
      // }

      // const ItemList = _.get(element, 'bookingPOPackings') // find packing# however in this case packing# same as Item #
      const totalItemNo = subPoList.length

      const bookingReferences = _.get(element, 'bookingReferences') || []
      const refBMinfo = bookingReferences.find(x => x.refName === 'MBL')
      const REFBM: JSONObject = {
        segement : 'REF',
        elementList : []
      }
      REFBM.elementList.push('BM', _.get(refBMinfo, 'refDescription') || ' ')
      loopObjectList.push(REFBM)
      const refFNinfo = bookingReferences.find(x => x.refName === 'HBL')
      const REFFN: JSONObject = {
        segement : 'REF',
        elementList : []
      }
      REFFN.elementList.push('FN', _.get(refFNinfo, 'refDescription') || ' ')
      loopObjectList.push(REFFN)
      // if (bookingReferences.length)
      // {
        // for (const ref of bookingReferences)
        // {
          // const refMapper = {
          //  MBL: 'BM',
          //  HBL: 'FN'
          // }
          // const refName = _.get(ref, 'refName')
          // if (refMapper[refName])
          // {
            // const REF: JSONObject = {
            //  segement : 'REF',
            //  elementList : []
            // }
            // REF.elementList.push(refMapper[refName], _.get(ref, 'refDescription'))
            // loopObjectList.push(REF)
          // }
        // }
      // }
      const folderNo = _.get(element, 'folderNo')
      if (!folderNo)
      {
        throw new Error('missing the CR')
      }
      const REF: JSONObject = {
        segement : 'REF',
        elementList : []
      }
      REF.elementList.push('CR', folderNo)
      loopObjectList.push(REF)
      const invoiceNo = _.get(element, 'invoiceNo')
      if (invoiceNo)
      {
        const REF: JSONObject = {
          segement : 'REF',
          elementList : []
        }
        REF.elementList.push('IK', invoiceNo)
        loopObjectList.push(REF)
      }
      if (_.get(element, 'cargoReceipt'))
      {
        const DTM: JSONObject = {
            segement : 'DTM',
            elementList : []
        }
        DTM.elementList.push('050')
        DTM.elementList.push(moment(_.get(element, 'cargoReceipt')).format('YYYYMMDD'))
        loopObjectList.push(DTM)
      }
      while (itemIndex < totalItemNo)
      {
        const HLI: JSONObject = {
          segement : 'HL',
          elementList : []
        }
        HLI.elementList.push((i + itemIndex + 1).toString().substring(0, 12))
        HLI.elementList.push(i.toString().substring(0, 12))
        HLI.elementList.push('I')
        loopObjectList.push(HLI)
        const LIN: JSONObject = {
          segement : 'LIN',
          elementList : []
        }
        LIN.elementList.push(index.toString().substring(0, 6))
        LIN.elementList.push('SK')
        LIN.elementList.push((_.get(subPoList[itemIndex], 'style') || ' ').substring(0, 30))
        LIN.elementList.push('BO')
        LIN.elementList.push((_.get(subPoList[itemIndex], 'colorDesc') || ' ').substring(0, 30))
        LIN.elementList.push('IZ')
        LIN.elementList.push((_.get(subPoList[itemIndex], 'size') || ' ').substring(0, 30))
        LIN.elementList.push('')
        LIN.elementList.push('')
        LIN.elementList.push('')
        LIN.elementList.push('')
        loopObjectList.push(LIN)
        const SLN: JSONObject = {
          segement: 'SLN',
          elementList : []
        }
        SLN.elementList.push('1')
        SLN.elementList.push('')// not used
        SLN.elementList.push('I')
        SLN.elementList.push((_.get(subPoList[itemIndex], 'bookQuantity') || ' ').toString().substring(0, 15))
        SLN.elementList.push('PC')
        loopObjectList.push(SLN)
        const PID: JSONObject = {
          segement: 'PID',
          elementList : []
        }
        PID.elementList.push('F')
        PID.elementList.push('')// not used
        PID.elementList.push('')
        PID.elementList.push('')
        PID.elementList.push((_.get(subPoList[itemIndex], 'productDescription') || ' ').toString().substring(0, 20))
        loopObjectList.push(PID)
        if (_.get(ItemList[itemIndex], 'bookWeight') || _.get(ItemList[itemIndex], 'bookWeight') === 0)
          {
              const MEA: JSONObject = {
                segement: 'MEA',
                elementList: []
            }
            MEA.elementList.push('', 'WT', _.get(subPoList[itemIndex], 'bookWeight').toString().substring(0, 20),  'KG')
            loopObjectList.push(MEA)
          }
        if (_.get(ItemList[itemIndex], 'bookVolume') || _.get(ItemList[itemIndex], 'bookVolume') === 0)
        {
            const MEA: JSONObject = {
              segement: 'MEA',
              elementList: []
          }
          MEA.elementList.push('', 'VOL', _.get(subPoList[itemIndex], 'bookVolume').toString().substring(0, 20),  'CO')
          loopObjectList.push(MEA)
        }
        if (_.get(subPoList[itemIndex], 'bookCtns') || _.get(subPoList[itemIndex], 'bookCtns') === 0)
        {
          const MEANUM: JSONObject = {
            segement: 'MEA',
            elementList: []
          }
          MEANUM.elementList.push('', 'NM', _.get(subPoList[itemIndex], 'bookCtns').toString().substring(0, 20),  'CT')
          loopObjectList.push(MEANUM)
        }
        if (_.get(ItemList[itemIndex], 'bookQuantity') || _.get(subPoList[itemIndex], 'bookQuantity') === 0)
        {
          const MEA: JSONObject = {
              segement: 'MEA',
              elementList: []
          }
          MEA.elementList.push('', 'SU', _.get(subPoList[itemIndex], 'bookQuantity').toString().substring(0, 20),  'PC')
          loopObjectList.push(MEA)
        }

        index++
        itemIndex++
      }
      i += itemIndex + 1
    }
    return loopObjectList
  }
  getTargetPoList(element, containerNo)
  {
    let poList = []
    if ((_.get(element, 'bookingPOPackings') || []).length)
    {
      poList = _.get(element, 'bookingPOPackings').filter(x => x.containerNo === containerNo)
    }
    return poList
  }

  getNumOfPo(Item) {
    const uniquePo = []
    for (const po of Item) {
      if (!uniquePo.includes(po.poNo)) {
        uniquePo.push(po.poNo)
      }
    }
    return uniquePo.length
  }

  toExport(returnJSON)
  {
    let result = ''
    for (const item of returnJSON['data'])
    {
        const elementList = (item['elementList'])
        for (let i = elementList.Count - 1; i > -1; i--)
        {
            if (elementList[i] === '')
            {
                elementList.RemoveAt(i)
            }
            else{
                break
            }
        }
        if (elementList.Count === 0)
        {
            continue
        }

        result += item['segement']

        for (const element of item['elementList'])
        {
            result += formatJson.elementSeperator[0]
            result += element
        }
        result += formatJson.segmentSeperator[0]
    }
    // string result = (string) json["data"][1]["segement"];

    return result
  }
}
