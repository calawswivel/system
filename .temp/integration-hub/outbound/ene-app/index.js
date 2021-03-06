function ENEAPPHandler() {
  this.handle = function(appId, params, helper) {
    var purchaseOrder = helper.persistence.models.purchaseOrder
    // var purchaseOrderItem = helper.persistence.models.purchaseOrderItem;
    // purchaseOrder.hasMany(purchaseOrderItem);
    console.log('[ENE]', 'Sending Data...')
    const url = 'http://tzumimod.com/controllers/API/api.php'
    var {
      transactionPeople,
      people,
      bookingPartiesPeople,
      workflowStatusList,
      trackingReferences,
      ...booking
    } = params.data
    return Promise.all(
      (booking.bookingPOPackings || [])
        .reduce((selected, bookingPOPacking) => {
          if (!selected.includes(bookingPOPacking.purchaseOrderId)) {
            selected.push(bookingPOPacking.purchaseOrderId)
          }
          return selected
        }, [])
        .map(selectedPoID => {
          return purchaseOrder.findOne({
            // include: [
            //   { model: purchaseOrderItem }
            // ],
            where: { id: selectedPoID },
          })
        })
    )
      .then(purchaseOrders => {
        const reqPayLoad = { ...booking, purchaseOrders }
        console.log('[ENE]', url)
        console.log('[ENE]', JSON.stringify(reqPayLoad))
        try {
          helper.request.post(
            {
              url,
              form: JSON.stringify(JSON.stringify(reqPayLoad)),
              headers: {
                'Content-Type': 'application/json',
                Token: 'Bearer kRXEe3eVDJJw/3bnhtzTOvLf4DlKjM6AzWrUGd+42vU=',
              },
            },
            function(err, httpResponse, body) {
              console.log('ENE Return')
              if (err) {
                helper.saveLog(
                  appId,
                  url,
                  'booking',
                  booking.id,
                  JSON.stringify(reqPayLoad),
                  null,
                  JSON.stringify(err)
                )
                helper.emailer.sendFreeMail(
                  {
                    to: ['ken.chan+ene@swivelsoftware.com'].join(','), //TODO REMOVE HARD-CODED
                    from: 'administrator@swivelsoftware.com',
                    subject: `TEST-ENEAPP [FAIL]`,
                    html: `<p>return ${JSON.stringify(err)}</p>`,
                  },
                  {}
                )
                return console.error('[ENE]', JSON.stringify(err))
              }
              console.log('[ENE]', body)
              if (body === '<pre>{"msg":"info se1nd"}</pre>') {
                helper.saveLog(
                  appId,
                  url,
                  'booking',
                  booking.id,
                  JSON.stringify(reqPayLoad),
                  JSON.stringify(body),
                  null
                )
                helper.emailer.sendFreeMail(
                  {
                    to: ['ken.chan+ene@swivelsoftware.com'].join(','), //TODO REMOVE HARD-CODED
                    from: 'administrator@swivelsoftware.com',
                    subject: `TEST-ENEAPP [SUCCESS]`,
                    html: `RETURN SUCCESS`,
                  },
                  {}
                )
                return console.log('[ENE] reutrn success')
              }
              helper.saveLog(
                appId,
                url,
                'booking',
                booking.id,
                JSON.stringify(reqPayLoad),
                null,
                JSON.stringify(body)
              )
              helper.emailer.sendFreeMail(
                {
                  to: ['ken.chan+ene@swivelsoftware.com'].join(','), //TODO REMOVE HARD-CODED
                  from: 'administrator@swivelsoftware.com',
                  subject: `TEST-ENEAPP [FAIL]`,
                  html: `<p>return ${JSON.stringify(body)}</p>`,
                },
                {}
              )
            }
          )
        } catch (e) {
          console.error(e.message, e.stack)
          helper.emailer.sendFreeMail(
            {
              to: ['ken.chan+ene@swivelsoftware.com'].join(','), //TODO REMOVE HARD-CODED
              from: 'administrator@swivelsoftware.com',
              subject: `TEST-ENEAPP [FAIL]`,
              html: `<p>return ${JSON.stringify(e)}</p>`,
            },
            {}
          )
          helper.saveLog(appId, url, 'booking', booking.id, null, null, JSON.stringify(e))
        }
      })
      .catch(e => {
        console.error('[ENE]', JSON.stringify(e))
        helper.saveLog(appId, url, 'booking', booking.id, null, null, JSON.stringify(e))
        helper.emailer.sendFreeMail(
          {
            to: ['ken.chan+ene@swivelsoftware.com'].join(','), //TODO REMOVE HARD-CODED
            from: 'administrator@swivelsoftware.com',
            subject: `TEST-ENEAPP [FAIL]`,
            html: `${JSON.stringify(e)}`,
          },
          {}
        )
      })
  }
}

module.exports = new ENEAPPHandler()
