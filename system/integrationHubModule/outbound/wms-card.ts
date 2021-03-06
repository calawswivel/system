import { ERROR } from 'utils/error'

const app = {
  constants: {
    getPostProcessFunc: null as Function,
    partyGroup: null as any,
    url: '',
    zyh: 0,
    zyd: 0,
  },
  method: 'POST',
  getUrl: ({ partyGroup: { api } }: any, params: any, constants: any) => {
    if (!api.wms || !api.wms.url) throw ERROR.WMS_NOT_SETUP()
    constants.url = `${api.wms.url}/getschrptlist`
    return `${api.wms.url}/getschrptdata`
  },
  requestHandler: ({ id, getPostProcessFunc, partyGroup }: any, params: any, constants: any) => {
    constants.partyGroup = partyGroup
    constants.getPostProcessFunc = getPostProcessFunc
    if (!params.subqueries || !params.subqueries.type) throw ERROR.MISSING_EXTERNAL_CARD_TYPE()
    return {
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        zyh: constants.zyh = id,
        zyd: constants.zyd = params.subqueries.type.value,
        ...(partyGroup.api.wms.body || {}),
      }),
    }
  },
  responseHandler: async(
    response: { responseBody: any; responseOptions: any },
    { getPostProcessFunc, partyGroup, url, zyh, zyd }: { [key: string]: any },
    helper: { [key: string]: Function }
  ) => {
    // parse results
    const responseBody = JSON.parse(JSON.parse(response.responseBody).d) as any[]
    if (!responseBody.length) throw ERROR.WMS_REPORT_NOT_READY()

    let card = await helper.prepareCard(responseBody[0], 'wms', 'Swivel WMS', zyh, zyd, {
      method: 'POST',
      url,
      headers: { 'content-type': 'application/json' },
      data: {
        ...(partyGroup.api.wms.body || {}),
      },
    })

    const postProcessFunc = await getPostProcessFunc(partyGroup.code, `wms-card/${zyh}`)
    card = postProcessFunc(card)

    return { ...response, responseBody: card }
  },
}

export default app
