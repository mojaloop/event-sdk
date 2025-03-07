/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 - Ramiro González Maciel <ramiro@modusbox.com>

 --------------
 ******/
import { EventMessage, LogResponse, LogResponseStatus } from "../model/EventMessage";
import { toAny } from "./MessageMapper";

const Logger = require('@mojaloop/central-services-logger')

class EventLoggingServiceClient {
  grpcClient : any;
  toAny: boolean;

  constructor(host: string, port: number, kafkaConfig?: string | { PRODUCER: { EVENT: Record<string, {config: unknown}> }, TOPIC_TEMPLATES: {GENERAL_TOPIC_TEMPLATE: {TEMPLATE: string}}}) {
    if (kafkaConfig && typeof kafkaConfig === 'string') kafkaConfig = JSON.parse(require('fs').readFileSync(kafkaConfig)).KAFKA
    if (kafkaConfig && typeof kafkaConfig === 'object') {
      const Producer = require('@mojaloop/central-services-stream').Util.Producer
      this.toAny = false
      this.grpcClient = {
        log: async (event: EventMessage, callback: (error: unknown, response?: LogResponse) => void) => {
          const type = event.metadata?.event.type || 'trace'
          // istanbul ignore next
          try {
            await Producer.produceMessage(event, {
              topicName: 'topic-event-' + type,
              key: event?.metadata?.trace?.traceId
            }, kafkaConfig.PRODUCER?.EVENT[type.toUpperCase()].config)

            callback(null, { status: LogResponseStatus.accepted })
          } catch (err) {
            Logger.error(`error on producing event: ${err}`)
            callback(err)
          }
        }
      }
    } else {
      const { loadEventLoggerService } = require('./EventLoggerServiceLoader');
      const grpc = require('@grpc/grpc-js')
      const eventLoggerService = loadEventLoggerService();

      const client = new eventLoggerService(`${host}:${port}`, grpc.credentials.createInsecure())
      this.toAny = true
      this.grpcClient = client
    }
  }

  /**
   * Log an event
   */
  log = async (event: EventMessage): Promise<LogResponse> => {
    return new Promise((resolve, reject) => {
      const wireEvent: any = Object.assign({}, event);
      if (!event.content) {
        throw new Error('Invalid eventMessage: content is mandatory');
      }

      try {
        if (this.toAny) {
          wireEvent.content = toAny(event.content, event.type);

          if (Logger.isDebugEnabled) {
            const wireEventCopy = {...wireEvent, content: {...wireEvent.content, value: `Buffer(${wireEvent.content.value.length})`}}
            Logger.debug(`EventLoggingServiceClient.log sending wireEvent: ${JSON.stringify(wireEventCopy, null, 2)}`);
          }
        } else {
          wireEvent.content = event.content
        }
        this.grpcClient.log(wireEvent, (error: unknown, response: LogResponse) => {
          Logger.isDebugEnabled && Logger.debug(`EventLoggingServiceClient.log received response: ${JSON.stringify(response, null, 2)}`);
          if (error) {
            Logger.warn(`EventLoggingServiceClient.log error: ${error}`)
            reject(error);
          } else {
            resolve(response);
          }
        })
      } catch (err: unknown) {
        Logger.error(`error event: ${err}`)
        reject(err)
      }
    })
  }
}

export {
  EventLoggingServiceClient
}
