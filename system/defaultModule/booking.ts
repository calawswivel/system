import { JwtPayload, JwtPayloadParty } from 'modules/auth/interfaces/jwt-payload'
import { PartyTableService } from 'modules/sequelize/services/table/party'

const convertToPartyOfBookingParty = (
  party: any,
  type: string
) => {
  return {
    [`${type}Party`]: {
      id: party.id,
      name: party.name,
      thirdPartyCode: {
        erp: party.erpCode
      },
      erpCode: party.erpCode,
      shortName: party.shortName,
      groupName: party.groupName,
      fax: party.fax,
      phone: party.phone,
      email: party.email,
      identity: party.identity,
      address: party.address,
      cityCode: party.cityCode,
      stateCode: party.stateCode,
      countryCode: party.countryCode,
      zip: party.zip
    },
    [`${type}PartyCode`]: party.erpCode,
    [`${type}PartyId`]: party.id,
    [`${type}PartyName`]: party.name,
    [`${type}PartyAddress`]: party.address,
    [`${type}PartyCityCode`]: party.cityCode,
    [`${type}PartyStateCode`]: party.stateCode,
    [`${type}PartyCountryCode`]: party.countryCode,
    [`${type}PartyZip`]: party.zip
  }
}

const mainParties = ['shipper', 'consignee', 'roAgent', 'linerAgent', 'agent', 'controllingCustomer', 'notifyParty', 'controllingParty']

export default async (user: JwtPayload, helper: { partyTableService: PartyTableService }) => {
  let bookingParty: any = {}
  const selectedPartyGroup = user.selectedPartyGroup
  if (selectedPartyGroup) {
    const selectedParties = user.parties.filter(party => party.partyGroupCode === selectedPartyGroup.code)
    const internalParties = selectedParties.filter(party => party.isBranch)
    if (internalParties && internalParties.length) { // internal User
      for (const party of internalParties) {
        if (party.partyGroupCode === user.selectedPartyGroup.code && !bookingParty['forwarderPartyId']) {
          if (party.isBranch) {
            bookingParty = {
              ...bookingParty,
              ...convertToPartyOfBookingParty(party, 'forwarder')
            }
          }
        }
      }
    } else { // external party
      let selectedParty = user.parties.find(party => {
        const defaultType = party.defaultType || party.types[0]
        return defaultType && mainParties.includes(defaultType)
      })
      if (!selectedParty) {
        selectedParty = user.parties[0]
      }
      const defaultType = selectedParty.defaultType || selectedParty.types[0]
      if (mainParties.includes(defaultType)) {
        bookingParty = {
          ...bookingParty,
          ...convertToPartyOfBookingParty(selectedParty, defaultType)
        }
      } else {
        bookingParty = {
          ...bookingParty,
          flexData: {
            moreParty: [defaultType],
            ...convertToPartyOfBookingParty(selectedParty, defaultType)
          }
        }
      }
    }
    if (!bookingParty.forwarderPartyId && user.selectedPartyGroup.configuration.defaultBookingForwarderId) {
      const party = await helper.partyTableService.findOne(user.selectedPartyGroup.configuration.defaultBookingForwarderId)
      if (party) {
        bookingParty = {
          ...bookingParty,
          ...convertToPartyOfBookingParty(party, 'forwarder')
        }
      }
    }
  }
  return {
    boundTypeCode: 'O',
    bookingParty: bookingParty,
    bookingDate: {}
  }
}
