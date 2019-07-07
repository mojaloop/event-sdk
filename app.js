const { DefaultEventLogger } = require('./lib/DefaultEventLogger')
// const EventSDK = require('./lib/index')
const { EventMessage } = require('./lib/model/EventMessage')
let logger = new DefaultEventLogger()

let message = new EventMessage({
  type: 'test',
  content: {
    header: 'jeader', payload: 'payload'
  },
  from: 'd',
  to: 'f',
  pp: ''
})

logger.audit(message)

// let trace = logger.createTraceMetadata('service-1')
// let child = logger.createChildTraceMetadata(trace, 'service-2')
// console.log(JSON.stringify(trace))
// console.log(JSON.stringify(child))
// let messageEnvelope = {
//   id: 'dfada',
//   type: 'baba',
//   content: { header: 'jeader', payload: 'payload' },
//   from: 'd',
//   to: 'f',
//   pp: ''
// }

// const routine = async () => {

//   let { traceId, service } = child
//   try {
//     // let newM = await logger.createSpanForMessageEnvelope(messageEnvelope, service, traceId)
//     // console.log(JSON.stringify(newM, null, 2))
//     let newEventMessage = EventSDK.EventMetadata.audit('id', EventSDK.AuditEventAction.default)
//     let newTraceData = new EventSDK.EventTraceMetadata('service', EventMessage.newTraceId(), EventMessage.newSpanId())
//     let newMessageMetadata = new EventSDK.MessageMetadata(newEventMessage, newTraceData)
//     let newEnvelope = new EventSDK.EventMessage('id', 'envelopeType')
//     newEnvelope.metadata = newMessageMetadata
//     logger.log(newEnvelope)
//   } catch (e) {
//     console.error(e)
//   }
// }

// /*
//   recorder.audit(messageEnvelope, action, state?, traceContext?)

//   recorder.trace(traceMetadata, state?)
//   */

// let newEnvelope = new EventSDK.EventMessage(Object.assign(messageEnvelope, {
//   metadata: new EventSDK.MessageMetadata({
//     event: EventSDK.EventMetadata.audit({
//       action: EventSDK.AuditEventAction.default,
//       state: EventSDK.EventStateMetadata.success(),
//       trace: EventSDK.EventTraceMetadata.create('service')
//     })
//   }))

// routine().then(v => console.log(v))