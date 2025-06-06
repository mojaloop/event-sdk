import { EventType, LogEventAction, LogResponseStatus, TypeEventTypeAction, EventMessage, EventMetadata, TypeEventMetadata, TypeMessageMetadata } from "./model/EventMessage";
import { EventLoggingServiceClient } from "./transport/EventLoggingServiceClient";
import Config from "./lib/config";

const stringify = require('safe-stable-stringify')
const Logger = require('./lib/RecorderLogger')
/*  !!! IMPORTANT !!!
      Switching this logger to @mojaloop/central-services-logger caused  RangeError: Maximum call stack size exceeded
      in QS handler integration tests, see details: https://infitx-technologies.atlassian.net/browse/CSI-1297
 */

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
      } else if (message && ('event' in message)) {
        type = message.event.type!
        action = message.event.action!
      } else {
        type = EventType.log
        action = LogEventAction.info
      }

      if (type === EventType.log && Object.values(LogEventAction).includes(<LogEventAction>action)) {
        Logger.log(action, `LOG_EVENT_ACTION - ${stringify(message)}`)
      } else {
        Logger.log(type, `LOG_EVENT_TYPE - ${stringify(message)}`)
      }

      resolve({ status: LogResponseStatus.accepted })
    } catch(e) {
      reject({ status: LogResponseStatus.error, error: e })
    }
  })
}


class DefaultLoggerRecorder implements IEventRecorder {
  recorder: Function

  constructor(recorder?: EventLoggingServiceClient) {
    this.recorder = recorder ? recorder : Logger
    return this
  }

  preProcess = (event: EventMessage): EventMessage | TypeMessageMetadata => {
    if (Config.EVENT_LOGGER_LOG_METADATA_ONLY) {
      return event.metadata!
    }
    return event
  }

  postProcess = (result: any): any => {
    return result
  }

  async record(event: EventMessage, doLog: boolean = true): Promise<any> {
    if (!doLog) {
      return Promise.resolve({ status: LogResponseStatus.accepted })
    }
    let updatedEvent = this.preProcess(event)
    let result = await logWithLevel(updatedEvent)
    return this.postProcess(result)
  }
}

class DefaultSidecarRecorder implements IEventRecorder {
  recorder: EventLoggingServiceClient

  constructor(recorder: EventLoggingServiceClient) {
    this.recorder = recorder
    return this
  }

  preProcess = (event: EventMessage): EventMessage | TypeMessageMetadata => {
    return event
  }

  logLoad = (event: EventMessage): EventMessage | TypeMessageMetadata => {
    if (Config.EVENT_LOGGER_LOG_METADATA_ONLY) {
      return event.metadata!
    }
    return event
  }

  postProcess = (result: any): any => {
    return result
  }

  async record(event: EventMessage, doLog: boolean = true): Promise<any> {
    doLog && await logWithLevel(this.logLoad(event))
    let updatedEvent = this.preProcess(event)
    let result = await this.recorder.log(<EventMessage>updatedEvent)
      return this.postProcess(result)
  }
}

class DefaultSidecarRecorderAsync implements IEventRecorder {
  recorder: EventLoggingServiceClient

  constructor(recorder: EventLoggingServiceClient) {
    this.recorder = recorder
    return this
  }

  preProcess = (event: EventMessage): EventMessage => {
    return event
  }

  logLoad = (event: EventMessage): EventMessage | TypeMessageMetadata => {
    if (Config.EVENT_LOGGER_LOG_METADATA_ONLY) {
      return event.metadata!
    }
    return event
  }

  async record(event: EventMessage, doLog: boolean = true, callback?: (result: any) => void): Promise<any> {
    doLog && await logWithLevel(this.logLoad(event))
    let updatedEvent = this.preProcess(event)
    let result = this.recorder.log(updatedEvent)
    if (callback) {
      return callback(result)
    } else {
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
