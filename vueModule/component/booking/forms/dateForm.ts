export default {
  components: [{
    is: 'WidgetMoreForm',
    props: {
      mainKey: 'Date',
      formProps: {
        z: {
          class: 'xs-12 padding-4'
        }
      },
      labelProps: {
        z: {
          isComponent: 'v-label',
          i18nContext: 'Widget',
          class: 'font-110'
        },
        cargoReady: {
          class: 'font-110 blue--text'
        },
        cYCutOff: {
          class: 'font-110 teal--text'
        },
        pickup: {
          class: 'font-110 green--text'
        },
        departure: {
          class: 'font-110 brown--text'
        },
        arrival: {
          class: 'font-110 indigo--text'
        },
        finalDoorDelivery: {
          class: 'font-110 pink--text'
        }
      },
      fixedKeys: [
        'cargoReady',
        'cYCutOff',
        'pickup',
        'departure',
        'arrival',
        'finalDoorDelivery'
      ],
      alwaysShowKeys: [
        'cargoReady',
        'cYCutOff',
        'pickup',
        'departure',
        'arrival',
        'finalDoorDelivery'
      ],
      canAdd: true,
      canAddProps: {
        class: 'xs-12 padding-20 min-height-200 margin-auto'
      },
      fields: [{
          label: 'Widget.estimatedDate',
          name: '{{flex}}{{key}}DateEstimated',
          component: 'DateTimePicker',
          class: 'xs-12 md-6',
          props: {
            type: 'datetime',
            utc: true,
            defaultFormat: 'ddd MMM DD YYYY HH:mm:ss',
            useOwnFormat: true
          }
        },
        {
          label: 'Widget.actualDate',
          name: '{{flex}}{{key}}DateActual',
          component: 'DateTimePicker',
          class: 'xs-12 md-6',
          props: {
            type: 'datetime',
            utc: true,
            defaultFormat: 'ddd MMM DD YYYY HH:mm:ss',
            useOwnFormat: true
          }
        },
        {
          label: 'Widget.remark',
          name: '{{flex}}{{key}}Remark',
          component: 'v-text-field',
          class: 'xs-12 md-12',
          readonlyClass: 'hidden'
        }]
    }
  }]
}
