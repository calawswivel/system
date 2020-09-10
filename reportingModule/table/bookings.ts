import { JqlDefinition } from 'modules/report/interface'

export default {
  jqls: [
    {
      type: 'callDataService',
      dataServiceQuery: ['booking', 'booking']
    }
  ],
  columns: [
    { key: 'updatedAt' },
    { key: 'id' },
    { key: 'shipmentId' },
    { key: 'houseNo' },
    { key: 'masterNo' },
    { key: 'poNo' },
    { key: 'bookingNo' },
    { key: 'moduleType' },
    { key: 'boundType' },
    { key: 'service' },
    { key: 'incoTerms' },
    { key: 'freightTerms' },
    { key: 'otherTerms' },
    { key: 'vesselName' },
    { key: 'voyageFlightNumber' },
    { key: 'commodity' },
    { key: 'polHScode' },
    { key: 'placeOfReceiptName' },
    { key: 'portOfLoadingName' },
    { key: 'portOfDischargeName' },
    { key: 'placeOfDeliveryName' },
    { key: 'finalDestinationName' },
    { key: 'carrierName' },
    { key: 'cargoReadyDateEstimated' },
    { key: 'cargoReadyDateActual' },
    { key: 'cargoReadyDateRemark' },
    { key: 'bookingSubmitDateEstimated' },
    { key: 'bookingSubmitDateActual' },
    { key: 'bookingSubmitDateRemark' },
    { key: 'cYCutOffDateEstimated' },
    { key: 'cYCutOffDateActual' },
    { key: 'cYCutOffDateRemark' },
    { key: 'departureDateEstimated' },
    { key: 'departureDateActual' },
    { key: 'departureDateRemark' },
    { key: 'arrivalDateEstimated' },
    { key: 'arrivalDateActual' },
    { key: 'arrivalDateRemark' },
    { key: 'finalDoorDeliveryDateEstimated' },
    { key: 'finalDoorDeliveryDateActual' },
    { key: 'finalDoorDeliveryDateRemark' },
    { key: 'createdUserEmail' },
    { key: 'updatedUserEmail' },
    { key: 'shipperPartyCode' },
    { key: 'shipperPartyName' },
    { key: 'shipperPartyContactEmail' },
    { key: 'shipperPartyContactName' },
    { key: 'consigneePartyCode' },
    { key: 'consigneePartyName' },
    { key: 'consigneePartyContactEmail' },
    { key: 'consigneePartyContactName' },
    { key: 'forwarderPartyName' },
    { key: 'forwarderPartyCode' },
    { key: 'forwarderPartyContactEmail' },
    { key: 'forwarderPartyContactName' },
    { key: 'notifyPartyPartyCode' },
    { key: 'notifyPartyPartyName' },
    { key: 'notifyPartyPartyContactEmail' },
    { key: 'notifyPartyPartyContactName' },
    { key: 'agentPartyCode' },
    { key: 'agentPartyName' },
    { key: 'agentPartyContactEmail' },
    { key: 'agentPartyContactName' },
    { key: 'containerTypeCode' },
    { key: 'allSoNo' },
    { key: 'allContainerNo' },
    { key: 'totalQuantity' },
    { key: 'totalQuantityUnit' },
  ],
} as JqlDefinition

/* import { Query, FromTable } from 'node-jql'

const query = new Query({
  $from: new FromTable(
    {
      method: 'POST',
      url: 'api/booking/query/booking',
      columns: [
        {
          name: 'updatedAt',
          type: 'string',
        },
        {
          name: 'id',
          type: 'number',
        },

        {
          name: 'houseNo',
          type: 'string',
        },

        {
          name: 'masterNo',
          type: 'string',
        },
        {
          name: 'poNo',
          type: 'string',
        },

        {
          name: 'bookingNo',
          type: 'string',
        },
        {
          name: 'moduleType',
          type: 'string',
        },
        {
          name: 'boundType',
          type: 'string',
        },
        {
          name: 'service',
          type: 'string',
        },
        {
          name: 'incoTerms',
          type: 'string',
        },
        {
          name: 'freightTerms',
          type: 'string',
        },
        {
          name: 'otherTerms',
          type: 'string',
        },
        {
          name: 'vesselName',
          type: 'string',
        },
        {
          name: 'voyageFlightNumber',
          type: 'string',
        },
        {
          name: 'commodity',
          type: 'string',
        },
        {
          name: 'polHScode',
          type: 'string',
        },
        // {
        //   name: 'podHScode',
        //   type: 'string',
        // },
        {
          name: 'placeOfReceiptName',
          type: 'string',
        },
        {
          name: 'portOfLoadingName',
          type: 'string',
        },
        {
          name: 'portOfDischargeName',
          type: 'string',
        },
        {
          name: 'placeOfDeliveryName',
          type: 'string',
        },
        {
          name: 'finalDestinationName',
          type: 'string',
        },
        {
          name: 'carrierName',
          type: 'string',
        },
        {
          name: 'cargoReadyDateEstimated',
          type: 'string',
        },
        {
          name: 'cargoReadyDateActual',
          type: 'string',
        },
        {
          name: 'cargoReadyDateRemark',
          type: 'string',
        },
        {
          name: 'cYCutOffDateEstimated',
          type: 'string',
        },
        {
          name: 'cYCutOffDateActual',
          type: 'string',
        },
        {
          name: 'cYCutOffDateRemark',
          type: 'string',
        },
        {
          name: 'departureDateEstimated',
          type: 'string',
        },
        {
          name: 'departureDateActual',
          type: 'string',
        },
        {
          name: 'departureDateRemark',
          type: 'string',
        },
        {
          name: 'arrivalDateEstimated',
          type: 'string',
        },
        {
          name: 'arrivalDateActual',
          type: 'string',
        },
        {
          name: 'arrivalDateRemark',
          type: 'string',
        },
        {
          name: 'createdUserEmail',
          type: 'string',
        },
        {
          name: 'updatedUserEmail',
          type: 'string',
        },
        {
          name: 'shipperPartyCode',
          type: 'string',
        },
        {
          name: 'shipperPartyName',
          type: 'string',
        },
        {
          name: 'shipperPartyContactEmail',
          type: 'string',
        },
        {
          name: 'shipperPartyContactName',
          type: 'string',
        },
        {
          name: 'consigneePartyCode',
          type: 'string',
        },
        {
          name: 'consigneePartyName',
          type: 'string',
        },
        {
          name: 'consigneePartyContactEmail',
          type: 'string',
        },
        {
          name: 'consigneePartyContactName',
          type: 'string',
        },
        {
          name: 'forwarderPartyName',
          type: 'string',
        },
        {
          name: 'forwarderPartyCode',
          type: 'string',
        },
        {
          name: 'forwarderPartyContactEmail',
          type: 'string',
        },
        {
          name: 'forwarderPartyContactName',
          type: 'string',
        },
        {
          name: 'notifyPartyPartyCode',
          type: 'string',
        },
        {
          name: 'notifyPartyPartyName',
          type: 'string',
        },
        {
          name: 'notifyPartyPartyContactEmail',
          type: 'string',
        },
        {
          name: 'notifyPartyPartyContactName',
          type: 'string',
        },
        {
          name: 'agentPartyCode',
          type: 'string',
        },
        {
          name: 'agentPartyName',
          type: 'string',
        },
        {
          name: 'agentPartyContactEmail',
          type: 'string',
        },
        {
          name: 'agentPartyContactName',
          type: 'string',
        },
      ],
    },
    'booking'
  ),
})

export default query.toJson() */
