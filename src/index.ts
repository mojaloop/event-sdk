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
 - Valentin Genev <valentin.genev@modusbox.com>

 --------------
 ******/

'use strict'

import { Tracer } from './Tracer'

import { DefaultLoggerRecorder, DefaultSidecarRecorder, DefaultSidecarRecorderAsync } from './Recorder'

import { Span, ContextOptions, Recorders } from './Span'

import { EventLoggingServiceClient } from "./transport/EventLoggingServiceClient";

import { EventLoggingServiceServer, EVENT_RECEIVED } from "./transport/EventLoggingServiceServer";

import { EventPostProcessor } from './EventPostProcessor';

import { EventPreProcessor } from './EventPreProcessor';

import {
  EventMessage,
  LogEventTypeAction,
  AuditEventTypeAction,
  TraceEventTypeAction,
  LogEventAction,
  AuditEventAction,
  TraceEventAction,
  EventStatusType,
  EventMetadata,
  LogResponseStatus,
  LogResponse,
  TypeMessageMetadata,
  NullEventAction,
  EventType,
  TraceTags,
  TypeEventMessage,
  TypeEventMetadata,
  TypeSpanContext,
  EventTraceMetadata,
  TypeEventTypeAction,
  EventStateMetadata,
  TypeEventAction,
  HttpRequestOptions,
  actionDictionary
 } from "./model/EventMessage"

// Re-export definitions and components on the public API
export {
  LogEventTypeAction,
  AuditEventTypeAction,
  TraceEventTypeAction,
  LogEventAction,
  AuditEventAction,
  TraceEventAction,
  EventStatusType,
  EventMetadata,
  EventMessage,
  LogResponseStatus,
  LogResponse,
  TypeMessageMetadata,
  Tracer,
  DefaultLoggerRecorder,
  DefaultSidecarRecorder,
  Span,
  ContextOptions,
  Recorders,
  NullEventAction,
  EventType,
  TraceTags,
  TypeEventMessage,
  TypeEventMetadata,
  TypeSpanContext,
  EventTraceMetadata,
  TypeEventTypeAction,
  EventStateMetadata,
  TypeEventAction,
  EventLoggingServiceClient,
  EventLoggingServiceServer,
  EVENT_RECEIVED,
  EventPostProcessor,
  EventPreProcessor,
  HttpRequestOptions,
  DefaultSidecarRecorderAsync,
  actionDictionary
}
