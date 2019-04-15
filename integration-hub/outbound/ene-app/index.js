function ENEAPPHandler () {
  this.handle = function (appId, params, helper) {
    var purchaseOrder = helper.persistence.models.purchaseOrder;
    // var purchaseOrderItem = helper.persistence.models.purchaseOrderItem;
    // purchaseOrder.hasMany(purchaseOrderItem);
    console.log('[ENE]', 'Sending Data...')
    const url = 'http://tzumimod.com/controllers/API/api.php';
    var { transactionPeople, people, bookingPartiesPeople, workflowStatusList, trackingReferences, ...booking } = params.data
    return Promise.all(
      booking.bookingPOPackings.reduce(
        (selected, bookingPOPacking) => {
          if (!selected.includes(bookingPOPacking.purchaseOrderId)) {
            selected.push(bookingPOPacking.purchaseOrderId)
          }
          return selected
        },
        []
      ).map(selectedPoID => {
        return purchaseOrder.findOne({
          // include: [
          //   { model: purchaseOrderItem }
          // ],
          where: { id: selectedPoID }
        })
      })
    )
      .then((purchaseOrders) => {
        let reqPayLoad = {
          data: { ...booking, purchaseOrders },
          headers: {
            "Content-Type": "application/json",
            "Authentication": "Bearer kRXEe3eVDJJw/3bnhtzTOvLf4DlKjM6AzWrUGd+42vU="
          }
        };
        console.log('[ENE]', JSON.stringify(reqPayLoad))
        return helper.restClient.post(url, reqPayLoad, (postData) => {
          if (Buffer.isBuffer(postData)) {
            postData = postData.toString('utf8');
          }
          console.log('[ENE]', `return ${JSON.stringify(postData)}`)
          helper.saveLog(appId, url, 'booking', booking.id, JSON.stringify(reqPayLoad), JSON.stringify(postData), null);
          helper.emailer.sendFreeMail({
            to: ["ken.chan+ene@swivelsoftware.com"].join(','),   //TODO REMOVE HARD-CODED
            from: "administrator@swivelsoftware.com",
            subject: `TEST-ENEAPP [SUCCESS]`,
            html: `${JSON.stringify(reqPayLoad.data)}`
          }, {});
        })
      })
      .catch(e => {
        console.error(e)
        helper.saveLog(appId, url, entity, newTracking.id, null, null, JSON.stringify(e));
        helper.emailer.sendFreeMail({
          to: ["ken.chan+ene@swivelsoftware.com"].join(','),   //TODO REMOVE HARD-CODED
          from: "administrator@swivelsoftware.com",
          subject: `TEST-ENEAPP [FAIL]`,
          html: `${JSON.stringify(reqPayLoad.data)}`
        }, {});
      })
  }
}

module.exports = new ENEAPPHandler();
