import { EventType, LogEventAction, LogResponseStatus, TypeEventTypeAction, EventMessage, EventMetadata, TypeEventMetadata, TypeMessageMetadata } from "./model/EventMessage";
import { EventLoggingServiceClient } from "./transport/EventLoggingServiceClient";
import Config from "./lib/config";

const Logger = require('@mojaloop/central-services-logger')
const Metrics = require('@mojaloop/central-services-metrics')

/**
 * Describes Event Recorder interface
 * @param recorder instance of EventLogingServiceClient or another recorder
 * @param preProcess preprocessing method with null implementation in the current release
 * @param postProcess postprocessing method with null implementation in the current release
 * @param record the method that records the event depending on the recorder implementation
 */

interface IEventRecorder {
  recorder: EventLoggingServiceClient | Function
  preProcess: (event: EventMessage) => EventMessage | TypeMessageMetadata
  postProcess?: (result: any) => any
  record: (event: EventMessage, doLog?: boolean, callback?: (result: any) => void ) => Promise<any>
}

type LogResponseType = LogResponseTypeAccepted | LogResponseTypeError
type LogResponseTypeAccepted = {
  status: LogResponseStatus.accepted,
}

type LogResponseTypeError = {
  status: LogResponseStatus,
  error: any,
}



const logWithLevel = async (message: EventMessage | TypeMessageMetadata): Promise<LogResponseType> => {
  return new Promise((resolve, reject) => {
    try {
      let type: TypeEventTypeAction['type']
      let action: TypeEventTypeAction['action']
      if (message && ('metadata' in message) && ('event' in message.metadata!)) {
        type = message.metadata!.event.type!
        action = message.metadata!.event.action!
      } else {
        type = EventType.log
        action = LogEventAction.info
      }

      if (type === EventType.log && Object.values(LogEventAction).includes(<LogEventAction>action)) {
        Logger.log(action, JSON.stringify(message, null, 2))
      }
      else {
        Logger.log(type, JSON.stringify(message, null, 2))
      }

      resolve({ status: LogResponseStatus.accepted })
    } catch(e) {
      reject({status: LogResponseStatus.error, error: e})
    }
  })
}


class DefaultLoggerRecorder implements IEventRecorder {
  recorder: Function

  constructor(recorder?: EventLoggingServiceClient) {
    const histTimerEnd = Metrics.getHistogram(
        'eventSdk_defaultLoggerRecorder_constructor',
        'Default Logger Recorder constructor',
        ['success']
    ).startTimer()
    this.recorder = recorder ? recorder : Logger
    histTimerEnd({success: true})
    return this
  }

  preProcess = (event: EventMessage): EventMessage | TypeMessageMetadata => {
    const histTimerEnd = Metrics.getHistogram(
        'eventSdk_defaultLoggerRecorder_preProcess',
        'Default Logger Recorder preProcess',
        ['success']
    ).startTimer()
    if (Config.EVENT_LOGGER_LOG_METADATA_ONLY) {
      histTimerEnd({success: true})
      return event.metadata!
    }
    histTimerEnd({success: true})
    return event
  }

  postProcess = (result: any): any => {
    const histTimerEnd = Metrics.getHistogram(
        'eventSdk_defaultLoggerRecorder_postProcess',
        'Default Logger Recorder postProcess',
        ['success']
    ).startTimer()
    histTimerEnd({success: true})
    return result
  }

  async record(event: EventMessage, doLog: boolean = true): Promise<any> {
    const histTimerEnd = Metrics.getHistogram(
        'eventSdk_defaultLoggerRecorder_record',
        'Default Logger Recorder record',
        ['success']
    ).startTimer()
    if (!doLog) {
      histTimerEnd({success: true})
      return Promise.resolve({ status: LogResponseStatus.accepted })
    }
    let updatedEvent = this.preProcess(event)
    let result = await logWithLevel(updatedEvent)
    histTimerEnd({success: true})
    return this.postProcess(result)
  }
}

class DefaultSidecarRecorder implements IEventRecorder {
  recorder: EventLoggingServiceClient

  constructor(recorder: EventLoggingServiceClient) {
    const histTimerEnd = Metrics.getHistogram(
        'eventSdk_defaultSidecarRecorder_constructor',
        'Default Sidecar Recorder constructor',
        ['success']
    ).startTimer()
    this.recorder = recorder
    return this
  }

  preProcess = (event: EventMessage): EventMessage => {
    const histTimerEnd = Metrics.getHistogram(
        'eventSdk_defaultSidecarRecorder_preProcess',
        'Default Sidecar Recorder preProcess',
        ['success']
    ).startTimer()
    histTimerEnd({success: true})
    return event
  }

  postProcess = (result: any): any => {
    const histTimerEnd = Metrics.getHistogram(
        'eventSdk_defaultSidecarRecorder_postProcess',
        'Default Sidecar Recorder postProcess',
        ['success']
    ).startTimer()
    histTimerEnd({success: true})
    return result
  }

  async record(event: EventMessage, doLog: boolean = true): Promise<any> {
    const histTimerEnd = Metrics.getHistogram(
        'eventSdk_defaultSidecarRecorder_record',
        'Default Sidecar Record record',
        ['success']
    ).startTimer()
    doLog && await logWithLevel(event)
    let updatedEvent = this.preProcess(event)
    let result = await this.recorder.log(updatedEvent)
    histTimerEnd({success: true})
    return this.postProcess(result)
  }
}

class DefaultSidecarRecorderAsync implements IEventRecorder {
  recorder: EventLoggingServiceClient

  constructor(recorder: EventLoggingServiceClient) {
    const histTimerEnd = Metrics.getHistogram(
        'eventSdk_defaultSidecarRecorderAsync_constructor',
        'Default Sidecar Recorder Async constructor',
        ['success']
    ).startTimer()
    this.recorder = recorder
    histTimerEnd({success: true})
    return this
  }

  preProcess = (event: EventMessage): EventMessage => {
    const histTimerEnd = Metrics.getHistogram(
        'eventSdk_defaultSidecarRecorderAsync_preProcess',
        'Default Sidecar Recorder Async preProcess',
        ['success']
    ).startTimer()
    histTimerEnd({success: true})
    return event
  }

  async record(event: EventMessage, doLog: boolean = true, callback?: (result: any) => void): Promise<any> {
    const histTimerEnd = Metrics.getHistogram(
        'eventSdk_defaultSidecarRecorderAsync_record',
        'Default Sidecar Recorder Async record',
        ['success']
    ).startTimer()
    doLog && logWithLevel(event)
    let updatedEvent = this.preProcess(event)
    let result = this.recorder.log(updatedEvent)
    if (callback) {
      histTimerEnd({success: true})
      return callback(result)
    } else {
      histTimerEnd({success: true})
      return result
    }
  }
}

export {
  DefaultLoggerRecorder,
  DefaultSidecarRecorder,
  DefaultSidecarRecorderAsync,
  IEventRecorder,
  LogResponseType,
  LogResponseTypeAccepted,
  LogResponseTypeError
}
