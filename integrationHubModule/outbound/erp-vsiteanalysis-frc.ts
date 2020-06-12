import { BadRequestException, ForbiddenException, NotImplementedException } from '@nestjs/common'
import moment = require('moment')

const app = {
  consumeError: true,
  constants: {
    months: [] as string[],
    site: '' as string,
    boundTypes: [] as string[],
  },
  method: 'POST',
  getUrl: ({ api }: { api: any }) => {
    if (!api.erp || !api.erp.url) throw new NotImplementedException()
    return `${api.erp.url}/vsiteanalysis`
  },
  requestHandler: async(
    { query, roles, roleService, partyGroup, party, partyService, user }: any,
    body: any,
    constants: { [key: string]: any },
    helper: { [key: string]: Function }
  ) => {
    // resolve role filters
    roles = await helper.resolveRoles(roleService, partyGroup, roles)
    const roleFilters = roles
      .map(({ filter }) => filter.shipment && filter.shipment.outbound)
      .filter(f => f)

    // resolve parties
    party = await helper.resolveParties(partyService, partyGroup, party)
    if (!party.length) throw new ForbiddenException('NO_ACCESS_RIGHT')

    const subqueries = query.subqueries || {}

    // datefr && dateto
    if (!subqueries.date) throw new BadRequestException('MISSING_DATE_RANGE')
    const datefr = moment(subqueries.date.from, 'YYYY-MM-DD')
    const dateto = moment(subqueries.date.to, 'YYYY-MM-DD')
    if (dateto.diff(datefr, 'years', true) > 1)
      throw new BadRequestException('DATE_RANGE_TOO_LARGE')

    const months = (constants.months = [])
    const momentStart = moment(datefr).startOf('month')
    while (momentStart.isSameOrBefore(dateto)) {
      months.push(momentStart.format('YYYY-MM'))
      momentStart.add(1, 'month')
    }

    // xmodule
    const availableModuleTypes = helper.getModuleTypes(roleFilters)
    let xmodule: string
    if (availableModuleTypes.length === 0 && subqueries.moduleTypeCode) {
      throw new ForbiddenException('NO_ACCESS_RIGHT')
    } else if (subqueries.moduleTypeCode) {
      // warning : getting the first one only
      xmodule = availableModuleTypes.find(type => type === subqueries.moduleTypeCode.value[0])

      if (!xmodule) throw new BadRequestException('INVALID_MODULE_TYPE')
    } else if (availableModuleTypes.length === 1) {
      xmodule = availableModuleTypes[0]
    } else {
      xmodule = ''
    }

    // xbound
    const availableBoundTypes = helper.getBoundType(roleFilters)
    let xbound: string[]
    if (availableBoundTypes.length === 0) {
      throw new ForbiddenException('NO_ACCESS_RIGHT')
    } else if (subqueries.boundTypeCode) {
      // warning : getting the first one only
      xbound = availableBoundTypes.filter(type => type === subqueries.boundTypeCode.value[0])

      if (!xbound) throw new BadRequestException('INVALID_BOUND_TYPE')
    } else {
      xbound = availableBoundTypes
    }
    constants.boundTypes = xbound

    // xsite
    const sites = helper.getOfficeParties('erp-site', party, subqueries.officePartyId)
    if (!sites.length) throw new BadRequestException('MISSING_SITE')
    if (!subqueries.viaHKG && sites.length > 1) throw new BadRequestException('TOO_MANY_SITES')
    let xsite = (constants.site = sites[0])

    // via HKG => xsite = 'HKG'
    if (subqueries.viaHKG) {
      if (helper.findParty('erp-site', party, 'HKG')) {
        xsite = (constants.site = 'HKG')
      }
      else {
        throw new BadRequestException('NO_ACCESS_RIGHT')
      }
    }

    // xdivision
    const availableDivisions = helper.getDivisions(roleFilters)

    // warning : getting the first one only
    const xdivision = subqueries.division
      ? availableDivisions.find(division => subqueries.division.value.indexOf(division) > -1)
      : 'Total'

    // xsalesman
    let xsalesman = ''
    if (user.thirdPartyCode && user.thirdPartyCode.erp) xsalesman = user.thirdPartyCode.erp
    else if (subqueries.salesmanCode) xsalesman = subqueries.salesmanCode.value
    else if (subqueries.rSalesmanCode) xsalesman = subqueries.rSalesmanCode.value

    // xfreehand
    // warning : getting the first one only
    let xfreehand = ''
    if (subqueries.nominatedTypeCode) xfreehand = subqueries.nominatedTypeCode.value[0]

    // xicltype && xigntype
    const xCustomer = {
      xicltype: '',
      xigntype: '',
    }

    if (subqueries.isColoader) {
      // filter isColoader cannot be used together with controllingCustomerIncludeRole OR controllingCustomerExcludeRole
      if (subqueries.controllingCustomerIncludeRole || subqueries.controllingCustomerExcludeRole)
        throw new BadRequestException('ISCOLOADER_INCLUDE_EXCLUDE_CUSTOMER_EITHER_ONE')

      if (subqueries.isColoader.value) {
        xCustomer.xicltype = 'F'
      } else {
        xCustomer.xigntype = 'F'
      }
    }

    if (subqueries.controllingCustomerIncludeRole && subqueries.controllingCustomerExcludeRole)
      throw new BadRequestException('INCLUDE_EXCLUDE_CUSTOMER_EITHER_ONE')
    if (subqueries.controllingCustomerIncludeRole) {
      const values = subqueries.controllingCustomerIncludeRole.value.map(v => helper.getRole(v))
      xCustomer.xicltype = values.join('')
    }
    else if (subqueries.controllingCustomerExcludeRole) {
      const values = subqueries.controllingCustomerExcludeRole.value.map(v => helper.getRole(v))
      xCustomer.xigntype = values.join('')
    }

    // xgrpname
    let xgrpname = ''
    // if (subqueries.agentGroup) xgrpname = subqueries.agentGroup.value[0]
    if (subqueries.agentGroup && subqueries.agentGroup.value.length) xgrpname = JSON.stringify(subqueries.agentGroup.value)

    // inblno && exblno
    const xHouseNo = {
      inblno: '',
      exblno: '',
    }
    if (subqueries.houseNoLike && subqueries.houseNoNotLike)
      throw new BadRequestException('LIKE_NOTLIKE_HOUSENO_EITHER_ONE')
    if (subqueries.houseNoLike) xHouseNo.inblno = subqueries.houseNoLike.value
    if (subqueries.houseNoNotLike) xHouseNo.exblno = subqueries.houseNoNotLike.value

    return {
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        datefr: datefr.format('YYYY/MM/DD'),
        dateto: dateto.format('YYYY/MM/DD'),
        curr: '',
        xmodule,
        xbound: xbound.join(''),
        xsite,
        xdivision: helper.getDivision(xdivision),
        xsalesman,
        xfreehand,
        ...xCustomer,
        xgrpname,
        ...xHouseNo,
        grpcarrier: 1,
        grpfreehand: 1,
      }),
    }
  },
  responseHandler: (response: { responseBody: any; responseOptions: any }, { boundTypes, months, site }: any) => {
    // parse results
    let responseBody = JSON.parse(JSON.parse(response.responseBody).d)

    const carriers: string[] = []

    // regroup results
    responseBody = responseBody.reduce((result, row) => {
      if (row.carrier.trim()) {
        const jobMonth = moment(row.yymm, 'YYYYMM').format('YYYY-MM')
        let resultRow = result.find(r => r.officePartyCode === row.xsite && r.carrierName === row.carrier && r.jobMonth === jobMonth)
        let totalRow = result.find(r => r.officePartyCode === row.xsite && r.carrierName === row.carrier && r.jobMonth === 'total')
        if (!resultRow)
          result.push((resultRow = { officePartyCode: row.xsite, carrierName: row.carrier, currency: row.currency, jobMonth }))
        if (!totalRow)
          result.push((totalRow = { officePartyCode: row.xsite, carrierName: row.carrier, currency: row.currency, jobMonth: 'total' }))

        if (carriers.indexOf(row.carrier) === -1) carriers.push(row.carrier)

        const nominatedTypeCode = row.freehand

        resultRow[`${nominatedTypeCode}_grossProfit`] =
          (resultRow[`${nominatedTypeCode}_grossProfit`] || 0) +
          boundTypes.reduce(
            (result, type) => result + (row[`${type.toLocaleLowerCase()}profit`] || 0),
            0
          )
        resultRow[`${nominatedTypeCode}_profitShareIncome`] =
          (resultRow[`${nominatedTypeCode}_profitShareIncome`] || 0) +
          boundTypes.reduce(
            (result, type) => result + (row[`${type.toLocaleLowerCase()}ps_income`] || 0),
            0
          )
        resultRow[`${nominatedTypeCode}_profitShareCost`] =
          (resultRow[`${nominatedTypeCode}_profitShareCost`] || 0) +
          boundTypes.reduce(
            (result, type) => result + (row[`${type.toLocaleLowerCase()}ps_cost`] || 0),
            0
          )
        resultRow[`${nominatedTypeCode}_profitShare`] =
          (resultRow[`${nominatedTypeCode}_profitShare`] || 0) +
          boundTypes.reduce((result, type) => result + (row[`${type.toLocaleLowerCase()}ps`] || 0), 0)
        resultRow[`${nominatedTypeCode}_otherProfit`] =
          (resultRow[`${nominatedTypeCode}_otherProfit`] || 0) +
          boundTypes.reduce(
            (result, type) => result + (row[`${type.toLocaleLowerCase()}othprofit`] || 0),
            0
          )
        resultRow[`${nominatedTypeCode}_revenue`] =
          (resultRow[`${nominatedTypeCode}_revenue`] || 0) +
          boundTypes.reduce(
            (result, type) => result + (row[`${type.toLocaleLowerCase()}sales`] || 0),
            0
          )

        totalRow[`${nominatedTypeCode}_grossProfit`] =
          (totalRow[`${nominatedTypeCode}_grossProfit`] || 0) +
          boundTypes.reduce(
            (result, type) => result + (row[`${type.toLocaleLowerCase()}profit`] || 0),
            0
          )
        totalRow[`${nominatedTypeCode}_profitShareIncome`] =
          (totalRow[`${nominatedTypeCode}_profitShareIncome`] || 0) +
          boundTypes.reduce(
            (result, type) => result + (row[`${type.toLocaleLowerCase()}ps_income`] || 0),
            0
          )
        totalRow[`${nominatedTypeCode}_profitShareCost`] =
          (totalRow[`${nominatedTypeCode}_profitShareCost`] || 0) +
          boundTypes.reduce(
            (result, type) => result + (row[`${type.toLocaleLowerCase()}ps_cost`] || 0),
            0
          )
        totalRow[`${nominatedTypeCode}_profitShare`] =
          (totalRow[`${nominatedTypeCode}_profitShare`] || 0) +
          boundTypes.reduce((result, type) => result + (row[`${type.toLocaleLowerCase()}ps`] || 0), 0)
        totalRow[`${nominatedTypeCode}_otherProfit`] =
          (totalRow[`${nominatedTypeCode}_otherProfit`] || 0) +
          boundTypes.reduce(
            (result, type) => result + (row[`${type.toLocaleLowerCase()}othprofit`] || 0),
            0
          )
        totalRow[`${nominatedTypeCode}_revenue`] =
          (totalRow[`${nominatedTypeCode}_revenue`] || 0) +
          boundTypes.reduce(
            (result, type) => result + (row[`${type.toLocaleLowerCase()}sales`] || 0),
            0
          )
      }

      return result
    }, [])

    responseBody.sort((l, r) => {
      if (l.officePartyCode !== r.officePartyCode)
        return l.officePartyCode.localeCompare(r.officePartyCode)
      if (l.carrierName !== r.carrierName)
        return l.carrierName.localeCompare(r.carrierName)
      return l.jobMonth.localeCompare(r.jobMonth)
    })

    let result = [] as any[]
    const anyRow = responseBody.find(r => r.officePartyCode === site)
    const currency = anyRow ? anyRow.currency : 'HKD'
    for (const carrier of carriers) {
      const row: any = { officePartyCode: site, carrierName: carrier, currency }
      const rows = responseBody.filter(r => r.officePartyCode === site && r.carrierName === carrier)

      for (const month of [...months, 'total']) {
        const r = rows.find(r => r.jobMonth === month)
        const monthName = month === 'total' ? month : moment(month, 'YYYY-MM').format('MMMM')
        for (const nominatedTypeCode of ['F', 'R', 'C']) {
          for (const field of ['grossProfit', 'profitShareIncome', 'profitShareCode', 'profitShare', 'otherProfit', 'revenue']) {
            row[`${monthName}_${nominatedTypeCode}_${field}`] = (r && r[`${nominatedTypeCode}_${field}`]) || 0
          }
        }
      }

      result.push(row)
    }

    result = result.sort((l, r) => {
      const l_grossProfit = (l.total_F_grossProfit || 0) + (l.total_R_grossProfit || 0) + (l.total_C_grossProfit || 0)
      const r_grossProfit = (r.total_F_grossProfit || 0) + (r.total_R_grossProfit || 0) + (r.total_C_grossProfit || 0)
      return l_grossProfit < r_grossProfit ? 1 : l_grossProfit > r_grossProfit ? -1 : 0
    })

    /* {
      officePartyCode: string,
      carrierName: string,
      currency: string,

      // by month, by frc
      grossProfit: number,
      profitShareIncome: number,
      profitShareCost: number,
      profitShare: number,
      otherProfit: number,
      revenue: number,
    } */

    return { ...response, responseBody: result }
  },
}

export default app
