import { SwivelConfigService } from 'modules/swivel-config/service'
import { OutboundService } from 'modules/integration-hub/services/outbound'

import { BaseEdiParser } from 'modules/parser/parser/edi'
import { EdiFormatJson } from 'modules/edi/interface'
import { History } from 'models/main/history'

const moment = require('moment')
const _ = require('lodash')

export const formatJson = {
  removeCharacter: [],
  segmentSeperator: ['~\r\n'],
  elementSeperator: ['*'],
  // elementSeperator: [''],

  formatType: {
    resultType: 'manyFile',
    header: [
      {
        name: 'ISA',
        type: 'header',
        elementList: [
          {
            element: '00000',
            type: 'hardcode',
            max: 2,
            min: 2
          },
          {
            element: '          ',
            type: 'hardcode',
            max: 10,
            min: 10
          },
          {
            element: '00',
            type: 'hardcode'
          },
          {
            element: '12',
            type: 'hardcode'
          },
          {
            element: '718978080',
            type: 'hardcode'
          },
          {
            element: '08',
            type: 'hardcode'
          },
          {
            element: '6112390050',
            type: 'hardcode'
          },
          {
            element: 'now',
            type: 'datetime',
            format: 'yyyyMMdd'
          },
          {
            element: 'now',
            type: 'datetime',
            format: 'HHmm'
          },
          {
            element: 'U',
            type: 'hardcode'
          },
          {
            element: '00401',
            type: 'hardcode'
          },
          {
            element: 'controlNo',
            type: 'sequence'
          },
        ],
      },
      {
        name: 'GS',
        type: 'header',
        elementList: [
          {
            element: 'now',
            type: 'datetime',
            format: 'yyyyMMdd'
          }
        ]
      },
    ],
    content: {
      contentLocation: 'trackingContainers',
      otherRequireField: ['trackingReference.flexData.data'],
      specialRequirement: false,
      function: {
        param: [
          {
            type: 'fromJson',
            name: 'trackingReference.flexData.data'
          }
        ],
        functionName: 'dummyFunction',
        code: 'public static JToken dummyFunction(JToken json, string location){return splitVariableLocation(location,json);}'
      },
      contentInfo: [
        {
          name: 'ST',
          type: 'content',
          elementList: [
            {
              element: '315',
              type: 'hardcode',
            },
            {
              element: 'content',
              type: 'sequence',
              max: 4,
              min: 4,
              padDirection: 'L',
              padChar: '0',
            }
          ]
        },
        {
          name: 'B4',
          elementList: [
            {
              type: 'not use'
            },
            {
              type: 'not use',
            },
            {
              element: 'lastStatusCode',
              type: 'variable',
              match: {
                GITM: 'I',
                DLPT: 'VD',
                BDAR: 'VA',
                DSCH: 'UV',
                DECL: 'CT',
                PASS: 'OA',
                TMPS: 'D',
                RCVE: 'RD',
              }
            },
            {
              element: 'lastStatusDate',
              type: 'datetime',
              format: 'yyyyMMdd',
            },
            {
              element: 'lastStatusDate',
              type: 'datetime',
              format: 'HHmm',
            },
            {
              type: 'not use',
            },
            {
              element: 'containerNo',
              type: 'variable',
              startAt: 0,
              length: 4,
            },
            {
              element: 'containerNo',
              type: 'variable',
              startAt: 4,
            },
            {
              element: 'lastStatusCode',
              type: 'variable',
              match: {
                GITM: 'E',
                DLPT: 'L',
                BDAR: 'L',
                DSCH: 'E',
                DECL: 'L',
                PASS: 'L',
                TMPS: 'L',
                RCVE: 'E',
              }
            },
            {
              element: 'container',
              type: 'variable',
              match: {
                '20OT': 2251,
                '40OT': 4351,
                '40HRF': 4662,
                '45HRF': 9532,
                '20RF': 2232,
                '40RF': 4332,
                '40HC': 4500,
                '45HC': 9500,
              }
            },
            {
              element: 'trackingStatus',
              type: 'variable',
              requirement: {
                index: -1,
                value: 'statusPlace',
                reorder: true,
                orderBy: 'statusDate',
                isFilter: true,
                filterInfoList: [
                  {
                    filterBy: 'isEstimated',
                    sign: '==',
                    value: false,
                  }
                ],
                specialRequirement: false,
                function: {
                  param: [
                    {
                      type: 'fromJson',
                      name: 'trackingStatus'
                    }
                  ],
                  functionName: 'dummyFunction',
                  code: 'public static string dummyFunction(JToken json, string location){var loopList=json[$"{location}"] as JArray; loopList=HelperFunction.filter(loopList, (Func<JToken,bool>) (x => x.Value<bool>("isEstimated")==false )); loopList=HelperFunction.orderBy(loopList,(Func<JToken,dynamic>) (x => !String.IsNullOrEmpty((string)x["statusDate"])?((DateTime) x["statusDate"]).Ticks : 0));return (string) loopList[loopList.Count-1]["statusPlace"];}'
                },
              }
            }
          ],
        },
        {
          name: 'N9',
          type: 'content',
          elementList: [
            {
              element: 'BN',
              type: 'hardcode'
            },
            {
              element: 'extraData1.bookingNo',
              type: 'variable'
            },
            {
              element: 'ORIGINAL BKG NBR',
              type: 'hardcode'
            }
          ],
        },
        {
          name: 'Q2',
          type: 'content',
          elementList: [
            {
              element: 'extraData1.vesselCode',
              type: 'variable'
            },
            {
              element: '0001',
              type: 'hardcode'
            },
            {
              type: 'not use',
            }
          ],
        },
        {
          name: 'R4',
          type: 'content',
          isLoop: true,
          jsonLocation: 'trackingStatus',
          requirement: {
            reorder: true,
            orderBy: 'statusDate',
            needAdd: true,
            otherRequireField: ['extraData1'],
            needFiltout: true,
            filteOutIndex: -1,
            specialRequirement: false,
            function: {
              param: [
                {
                  type: 'fromJson',
                  name: 'trackingStatus'
                }
              ],
              functionName: 'dummyFunction',
              code: 'public static JToken dummyFunction(JToken json, string location){var loopList=json[$"{location}"] as JArray; loopList=HelperFunction.filter(loopList, (Func<JToken,bool>) (x => x.Value<bool>("isEstimated")==false )); loopList=HelperFunction.orderBy(loopList,(Func<JToken,dynamic>) (x => !String.IsNullOrEmpty((string)x["statusDate"])?((DateTime) x["statusDate"]).Ticks : 0));return loopList;}'
            },
          },
          elementList: [
            {
              element: 'statusCode',
              type: 'variable',
              match: {
                BKCF: 'R',
                EPRL: 'R',
                STSP: 'R',
                GITM: 'L',
                LOBD: 'L',
                DLPT: 'L',
                TSLB: 'I',
                TSDC: 'I',
                BDAR: 'D',
                DSCH: 'D',
                PSCG: 'D',
                DECL: 'D',
                PASS: 'D',
                TMPS: 'D',
                STCS: 'E',
                RCVE: 'E',
              },
              mustExist: true
            },
            {
              element: 'UN',
              type: 'hardcode',
            },
            {
              element: 'statusPlace',
              type: 'variable',
            },
            {
              type: 'not use'
            },
            {
              element: 'statusCode',
              type: 'variable',
              jsonMatchList: [
                {
                  GITM: 'portOfLoading',
                  LOBD: 'portOfLoading',
                  DLPT: 'portOfLoading',
                  BDAR: 'portOfDischarge',
                  DSCH: 'portOfDischarge',
                  PSCG: 'portOfDischarge',
                  DECL: 'portOfDischarge',
                  PASS: 'portOfDischarge',
                  TMPS: 'portOfDischarge',
                  STCS: 'placeOfDelivery',
                  RCVE: 'placeOfDelivery',
                  BKCF: 'placeOfReceipt',
                  EPRL: 'placeOfReceipt',
                  STSP: 'placeOfReceipt',
                },
                {
                  STCS: 'portOfDischarge',
                  RCVE: 'portOfDischarge',
                  BKCF: 'portOfLoading',
                  EPRL: 'portOfLoading',
                  STSP: 'portOfLoading',
                }
              ],
              jsonLocation: 'extraData1',
              hasDefault: true,
              defaultValue: 'XX',
              length: 2,
            },
          ],
          subSegmentList: [
            {
              name: 'DTM',
              type: 'content',
              isLoop: true,
              jsonLocation: '',
              elementList: [
                {
                  element: 'isEstimated',
                  type: 'variable',
                  match: {
                    False: '140',
                  }
                },
                {
                  element: 'statusDate',
                  type: 'datetime',
                  format: 'yyyyMMdd',
                  mustExist: true
                },
                {
                  element: 'statusDate',
                  type: 'datetime',
                  format: 'HHmm',
                  mustExist: true
                }
              ],
            },
          ]
        },
        {
          name: 'R4',
          type: 'content',
          isLoop: true,
          jsonLocation: 'trackingStatus',
          requirement: {
            reorder: true,
            orderBy: 'statusDate',
            needAdd: true,
            otherRequireField: ['extraData1'],
            needhold: true,
            holdIndex: -1,
          },
          elementList: [
            {
              element: '5',
              type: 'hardcode',
              mustExist: true
            },
            {
              element: 'UN',
              type: 'hardcode',
            },
            {
              element: 'statusPlace',
              type: 'variable',
            },
            {
              type: 'not use'
            },
            {
              element: 'statusCode',
              type: 'variable',
              jsonMatchList: [
                {
                  GITM: 'portOfLoading',
                  LOBD: 'portOfLoading',
                  DLPT: 'portOfLoading',
                  BDAR: 'portOfDischarge',
                  DSCH: 'portOfDischarge',
                  PSCG: 'portOfDischarge',
                  DECL: 'portOfDischarge',
                  PASS: 'portOfDischarge',
                  TMPS: 'portOfDischarge',
                  STCS: 'placeOfDelivery',
                  RCVE: 'placeOfDelivery',
                  BKCF: 'placeOfReceipt',
                  EPRL: 'placeOfReceipt',
                  STSP: 'placeOfReceipt',
                },
                {
                  STCS: 'portOfDischarge',
                  RCVE: 'portOfDischarge',
                  BKCF: 'portOfLoading',
                  EPRL: 'portOfLoading',
                  STSP: 'portOfLoading',
                }
              ],
              jsonLocation: 'extraData1',
              hasDefault: true,
              defaultValue: 'XX',
              length: 2,
            },
          ],
          subSegmentList: [
            {
              name: 'DTM',
              type: 'content',
              isLoop: true,
              jsonLocation: '',
              elementList: [
                {
                  element: 'isEstimated',
                  type: 'variable',
                  match: {
                    False: '140',
                  }
                },
                {
                  element: 'statusDate',
                  type: 'datetime',
                  format: 'yyyyMMdd',
                  mustExist: true
                },
                {
                  element: 'statusDate',
                  type: 'datetime',
                  format: 'HHmm',
                  mustExist: true
                }
              ],
            },
          ]
        },
        {
          name: 'SE',
          type: 'content',
          elementList: [
            {
              element: 'content',
              type: 'total',
              totalValue: 'content',
            },
            {
              element: 'content',
              type: 'sequence',
            }
          ],
        },
      ]
    },
    footer: [
      {
        name: 'GE',
        type: 'footer',
        elementList: [
          {
            element: '01',
            type: 'hardcode',
          },
          {
            element: 'content',
            type: 'sequence',
          }
        ],
      },
      {
        name: 'ISA',
        type: 'footer',
        elementList: [
          {
            element: '01',
            type: 'hardcode',
          },
          {
            element: 'content',
            type: 'sequence',
          }
        ],
      },
    ]

  }

} as EdiFormatJson

interface JSONObject {
  segment?: string
  elementList?: any[]
}

export default class EdiParser315 extends BaseEdiParser {
  constructor(
    protected readonly allService: {
      swivelConfigService: SwivelConfigService
      outboundService: OutboundService
    }
  ) {
    super(allService, {}, { export: { formatJson, ediType: '315' } })
  }

  async export(entityJSON: any[] | (any[])[]): Promise<any> {
    const result = await super.export(entityJSON)

    return result.ediResults[0].ediContent
    const resultList: any[] = []
    for (const element of entityJSON)
    {
      // const details = _.get(element, 'details')
      // if (!details) {
      //   throw Error('no details')
      // }
      console.log(element)
      const containerList = _.get(element, 'trackingContainers') || []
      console.log(containerList)
      if (containerList.length) {
        for (const container of containerList) {
          const returnJSON = {}
          const data = []
          const ISA: JSONObject = {
            segment: 'ISA',
            elementList: [],
          }
          const currantDate = moment().toDate()
          const containerNo = _.get(container, 'containerNo')
          // const controlNo = (containerNo  || '').substr(4)
          const pad = '000000000'
          const controlNo = `${pad.substring(0, pad.length - (containerNo || '').substr(4).length)}${(
            containerNo || ''
          ).substr(4)}`
          ISA.elementList.push(
            '00',
            '          ',
            '00',
            '          ',
            '12',
            '718978080    ',
            '08',
            '6112390050',
            moment(currantDate).format('YYMMDD'),
            moment(currantDate).format('HHmm'),
            'U',
            '00401',
            controlNo.substring(0, 9),
            '0',
            'P',
            '>'
          )
          data.push(ISA)
          const GS: JSONObject = {
            segment: 'GS',
            elementList: [],
          }

          GS.elementList.push(
            'FA',
            '718978080',
            '6112390050',
            moment(currantDate).format('YYYYMMDD'),
            moment(currantDate).format('HHmm'),
            parseInt(controlNo, 10),
            'X',
            '004030VICS'
          )
          data.push(GS)

          const lengthOfPreviousData = data.length

          const ST: JSONObject = {
            segment: 'ST',
            elementList: [],
          }
          ST.elementList.push('315', `0001`)
          data.push(ST)
          const historyList = _.get(container, 'trackingStatus')
          historyList.sort(function(a, b) {
            if (!a.statusDate) {
              return -1
            }

            if (!b.statusDate) {
              return 1
            }

            return moment(a.statusDate) - moment(b.statusDate)
          })
          // return historyList
          const currentStatusIndex = historyList.map(el => el.isEstimated).lastIndexOf(false)
          const currentStatus = historyList[currentStatusIndex]
          const statusCodeMapper = {
            GITM: 'I',
            DLPT: 'VD',
            BDAR: 'VA',
            DSCH: 'UV',
            DECL: 'CT',
            PASS: 'OA',
            TMPS: 'D',
            RCVE: 'RD',
          }
          const emptyLoadMapper = {
            GITM: 'E',
            DLPT: 'L',
            BDAR: 'L',
            DSCH: 'E',
            DECL: 'L',
            PASS: 'L',
            TMPS: 'L',
            RCVE: 'E',
          }
          const isoCodeMapper = {
            '20OT': 2251,
            '40OT': 4351,
            '40HRF': 4662,
            '45HRF': 9532,
            '20RF': 2232,
            '40RF': 4332,
            '40HC': 4500,
            '45HC': 9500,
          }
          const B4: JSONObject = {
            segment: 'B4',
            elementList: [],
          }
          B4.elementList.push('', '') // not used
          B4.elementList.push(
            statusCodeMapper[_.get(currentStatus, 'statusCode')],
            moment(_.get(currentStatus, 'statusDate')).format('YYYYMMDD'),
            moment(_.get(currentStatus, 'statusDate')).format('HHmm')
          )
          B4.elementList.push('') // not used
          B4.elementList.push(
            (_.get(container, 'containerNo') || '').substr(0, 4),
            (_.get(container, 'containerNo') || '').substr(4, 10)
          )
          B4.elementList.push(
            emptyLoadMapper[_.get(currentStatus, 'statusCode')] || '',
            isoCodeMapper[_.get(container, 'container')] || ' ',
            _.get(currentStatus, 'statusPlace').substr(0, 30)
          )
          B4.elementList.push('UN')
          B4.elementList.push('') // No Equipment Check Digit
          data.push(B4)
          const trackingRefInf = _.get(element, 'trackingReference') || {}
          const flexDataInf = _.get(trackingRefInf, 'flexData') || {}
          const bookingInf = _.get(flexDataInf, 'data')
          if (bookingInf) {
            if (_.get(bookingInf, 'bookingNo')) {
              const N9: JSONObject = {
                segment: 'N9',
                elementList: [],
              }
              N9.elementList.push('BN', _.get(bookingInf, 'bookingNo').substring(0, 18), 'ORIGINAL BKG NBR')
              data.push(N9)
            }
            const Q2: JSONObject = {
              segment: 'Q2',
              elementList: [],
            }
            Q2.elementList.push((_.get(bookingInf, 'vesselCode') || ' ').substring(0, 8))
            Q2.elementList.push('  ')
            for (
              let i = 0;
              i < 6;
              i++ // not used
            ) {
              Q2.elementList.push('')
            }
            Q2.elementList.push(_.get(bookingInf, 'voyageFlightNumber').substring(0, 10))
            for (
              let i = 0;
              i < 3;
              i++ // not used
            ) {
              Q2.elementList.push('')
            }
            Q2.elementList.push((_.get(bookingInf, 'vesselName') || '  ' ).substring(0, 28))
            data.push(Q2)
          }

          const loopObjectList: any[] = []
          loopObjectList.push(this.getLoopObject(loopObjectList, historyList))
          const filteredList = loopObjectList.filter(value => Object.keys(value).length !== 0)
          data.push(...filteredList)
          const SE: JSONObject = {
            segment: 'SE',
            elementList: [],
          }
          SE.elementList.push((data.length - lengthOfPreviousData + 1).toString())
          SE.elementList.push(`0001`)
          data.push(SE)

          const GE: JSONObject = {
            segment: 'GE',
            elementList: [],
          }
          GE.elementList.push('1', parseInt(controlNo, 10))
          data.push(GE)
          const IEA: JSONObject = {
            segment: 'IEA',
            elementList: [],
          }
          IEA.elementList.push('1', controlNo)
          data.push(IEA)
          _.set(returnJSON, 'data', data)
          return returnJSON
          const result = await super.export(returnJSON)
          // return result
          resultList.push(result)
        }
      }
    }
    return resultList
  }
  async getLoopObject(loopObjectList, historyList) {
    const noOfhistory = historyList.length
    for (let i = 0; i < noOfhistory - 1; i++) {
      let noMatch = false
      const R4: JSONObject = {
        segment: 'R4',
        elementList: [],
      }
      switch (historyList[i].statusCode) {
        case 'EPRL':
          R4.elementList.push('R')
          break
        case 'GITM' || 'LOBD' || 'DLPT':
          R4.elementList.push('L')
          break
        case 'BDAR' || 'PSCG' || 'DECL':
          R4.elementList.push('D')
          break
        case 'STCS':
          R4.elementList.push('D')
          break
        case 'TSLB' || 'TSDC':
          R4.elementList.push('I')
          break
        default:
          noMatch = true
      }
      if (noMatch === false) {
        R4.elementList.push(' ', _.get(historyList[i], 'statusPlace').substr(0, 30))
        R4.elementList.push('') // not used
        R4.elementList.push('  ') // No country code
        R4.elementList.push('', '') // not used
        R4.elementList.push('  ') // State or Province Code
        loopObjectList.push(R4)
        if (_.get(historyList[i], 'isEstimated') === false && _.get(historyList[i], 'statusDate')) {
          const DTM: JSONObject = {
            segment: 'DTM',
            elementList: [],
          }
          DTM.elementList.push(
            '140',
            moment(_.get(historyList[i], 'statusDate')).format('YYYYMMDD'),
            moment(_.get(historyList[i], 'statusDate')).format('HHmm')
          )
          DTM.elementList.push('  ') // no time code
          loopObjectList.push(DTM)
        }
      }
    }
    const R4: JSONObject = {
      segment: 'R4',
      elementList: [],
    }
    R4.elementList.push('5', ' ', _.get(historyList[noOfhistory - 1], 'statusPlace').substr(0, 30))
    R4.elementList.push('') // not used
    R4.elementList.push('') // No country code
    R4.elementList.push('', '') // not used
    R4.elementList.push('') // State or Province Code
    loopObjectList.push(R4)
    if (
      _.get(historyList[noOfhistory - 1], 'isEstimated') === false &&
      _.get(historyList[noOfhistory - 1], 'statusDate')
    ) {
      const DTM: JSONObject = {
        segment: 'DTM',
        elementList: [],
      }
      DTM.elementList.push(
        '140',
        moment(_.get(historyList[noOfhistory - 1], 'statusDate')).format('YYYYMMDD'),
        moment(_.get(historyList[noOfhistory - 1], 'statusDate')).format('HHmm')
      )
      DTM.elementList.push('') // no time code
      loopObjectList.push(DTM)
    }
    return loopObjectList
  }
}
