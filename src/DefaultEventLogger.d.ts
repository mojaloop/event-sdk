/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Ramiro González Maciel <ramiro@modusbox.com>

 --------------
 ******/
import { EventMessage, EventTraceMetadata, IEventTrace, AuditEventAction } from "./model/EventMessage";
import { EventLoggingServiceClient } from "./transport/EventLoggingServiceClient";
import { EventLogger, ObjectWithKeys } from './EventLogger';
import { EventPostProcessor } from './EventPostProcessor';
import { EventPreProcessor } from './EventPreProcessor';
import { EventStateMetadata } from "./model/EventMessage";
/**
 * DefaultEventLogger sends all the EventLogger commands to the default EventLoggingServiceClient.
 * It provides null implementation of EventPreProcessor and EventPostProcessor.
 * It can be extended to implement some of these methods.
 *
*/
declare class DefaultEventLogger implements EventLogger, EventPreProcessor, EventPostProcessor {
    client: EventLoggingServiceClient;
    constructor(client?: EventLoggingServiceClient);
    preProcess: (event: EventMessage) => EventMessage;
    postProcess: (result: any) => any;
    extract(carrier: ObjectWithKeys, path?: string): Promise<EventTraceMetadata>;
    inject(carrier: ObjectWithKeys, traceContext: IEventTrace, path?: string): Promise<ObjectWithKeys>;
    createNewTraceMetadata(traceContext: IEventTrace): EventTraceMetadata;
    trace(trace: EventTraceMetadata, state?: EventStateMetadata): Promise<EventTraceMetadata>;
    audit(message: EventMessage, action?: AuditEventAction, state?: EventStateMetadata, traceContext?: IEventTrace): Promise<any>;
    /**
     * Log an event
     */
    record(event: EventMessage): Promise<any>;
}
export { DefaultEventLogger };