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

 * ModusBox
 - Ramiro González Maciel <ramiro@modusbox.com>
 - Valentin Genev <valentin.genev@modusbox.com>

 * Crosslake
 - Lewis Daly <lewisd@crosslaketech.com>

 --------------
 ******/

'use strict'

// Mock out logging to make output less verbose
// jest.<String>Uuid()('@mojaloop/central-services-logger')

const Uuid = require('node:crypto').randomUUID
// import '@mojaloop/central-services-logger'

import { EventLoggingServiceClient } from '../../src/transport/EventLoggingServiceClient'
import { EventMessage } from '../../src/model/EventMessage'


const expectStringifyToMatch = (result: any, expected: any) => {
  return expect(JSON.stringify(result)).toBe(JSON.stringify(expected))
}

const Config = jest.requireActual('../../src/lib/config')
const mockConfig = Config.default

describe('Tracer', () => {
  jest.mock('../../src/lib/config', () => mockConfig)
  jest.mock('@mojaloop/central-services-stream', () => ({ Util: {Producer: {produceMessage() {}}}}));
  const DefaultSidecarRecorder = jest.requireActual('../../src/Recorder').DefaultSidecarRecorder
  const { EventTraceMetadata, HttpRequestOptions } = jest.requireActual('../../src/model/EventMessage')
  const Tracer = jest.requireActual('../../src/Tracer').Tracer

  const messageProtocol = {
    id: "xyz1234",
    to: "DFSP1",
    from: "DFSP1",
    type: 'application/json',
    content: {
      headers: {},
      payload: "http://example.com/v1/go"
    },
    metadata: {
      event: {
        id: Uuid(),
        type: 'audit',
        action: 'prepare',
        createdAt: new Date(),
        state: {
          status: 'success',
          code: 0
        }
      }
    }
  }


  describe('createChildSpanFromContext', () => {
    it('creates a child span without the vendor prefix tag when EVENT_LOGGER_TRACESTATE_HEADER_ENABLED is false', () => {
      // Arrange
      mockConfig.EVENT_LOGGER_TRACESTATE_HEADER_ENABLED = false
      mockConfig.EVENT_LOGGER_VENDOR_PREFIX = "TEST_VENDOR"

      const tracer = Tracer.createSpan('service1')
      tracer.setTags({ tag: 'value' })
      const spanContext = tracer.getContext()

      // Act
      const childB = Tracer.createChildSpanFromContext('service2', spanContext)

      // Assert
      const tags = childB.getContext().tags!
      expect(tags['tracestate']).not.toBeDefined()
      expect(childB.getTracestateTags()).toEqual({})
    })

    it('creates a child span without the vendor prefix tag when EVENT_LOGGER_TRACESTATE_HEADER_ENABLED is true', () => {
      // Arrange
      mockConfig.EVENT_LOGGER_TRACESTATE_HEADER_ENABLED = true
      mockConfig.EVENT_LOGGER_VENDOR_PREFIX = "TEST_VENDOR"

      const tracer = Tracer.createSpan('service1')
      tracer.setTags({ tag: 'value' })
      const spanContext = tracer.getContext()

      // Act
      const childB = Tracer.createChildSpanFromContext('service2', spanContext)

      // Assert
      const tags = childB.getContext().tags!
      expect(tags['tracestate']).toBeDefined()
    })
  })

  describe('extractContextFromMessage', () => {
    it('extracts the content with basic carrier', () => {
      // Arrange
      const carrier = {
        trace: {
          startTimestamp: '2020-01-07T06:25:24.189Z',
          service: 'service1',
          traceId: '01635e2be91b0fde212e4259f439d9d7',
          spanId: '653ec4db6500f12e',
          parentSpanId: undefined,
          sampled: undefined,
          flags: undefined,
          tags: {tagA: 'valueA'},
          finishTimestamp: undefined,
          tracestates: {}
        }
      }

      // Act
      const result = Tracer.extractContextFromMessage(carrier)

      // Assert
      expect(result).toEqual(carrier.trace)
    })

    it('extracts empty content with an invalid carrier', () => {
      // Arrange
      const carrier = {
        notTrace: {
          startTimestamp: '2020-01-07T06:25:24.189Z',
          service: 'service1',
          traceId: '01635e2be91b0fde212e4259f439d9d7',
          spanId: '653ec4db6500f12e',
          parentSpanId: undefined,
          sampled: undefined,
          flags: undefined,
          tags: {tagA: 'valueA'},
          finishTimestamp: undefined
        }
      }

      // Act
      const result = Tracer.extractContextFromMessage(carrier)

      // Assert
      expect(result).not.toEqual(carrier.notTrace)
    })
  })

  describe('extractContextFromHttpRequest', () => {
    /*
      Note: this is a somewhat invalid test, since there shouldn't really be a case
      where EVENT_LOGGER_TRACESTATE_HEADER_ENABLED is `true`, and there is no `request.headers.tracestate`
    */
    it('has no tracestate tag when EVENT_LOGGER_TRACESTATE_HEADER_ENABLED is true and tracestate does not exist', () => {
      // Arrange
      mockConfig.EVENT_LOGGER_TRACESTATE_HEADER_ENABLED = true
      mockConfig.EVENT_LOGGER_VENDOR_PREFIX = 'TEST_VENDOR'
      const tracer = Tracer.createSpan('service1')
      tracer.setTags({ tag: 'value' })
      const request = Tracer.injectContextToHttpRequest(tracer.getContext(), { headers: { traceparent: '00-1234567890123456-12345678-01' } })

      // Act
      delete request.headers.tracestate
      const result = Tracer.extractContextFromHttpRequest(request)!

      // Assert
      const tracestateTag = result.tags!.tracestate
      expect(tracestateTag).not.toBeDefined()
    })

    it('has no tracestate tag when EVENT_LOGGER_TRACESTATE_HEADER_ENABLED is false and tracestate does not exist', () => {
      // Arrange
      mockConfig.EVENT_LOGGER_TRACESTATE_HEADER_ENABLED = false
      mockConfig.EVENT_LOGGER_VENDOR_PREFIX = 'TEST_VENDOR'
      const tracer = Tracer.createSpan('service1')
      tracer.setTags({ tag: 'value' })
      const request = Tracer.injectContextToHttpRequest(tracer.getContext(), { headers: { traceparent: '00-1234567890123456-12345678-01' } })

      // Act
      delete request.headers.tracestate
      const result = Tracer.extractContextFromHttpRequest(request)!

      // Assert
      const tracestateTag = result.tags!.tracestate
      expect(tracestateTag).not.toBeDefined()
    })

    it('returns undefined when there are no xb3 headers', () => {
      // Arrange
      const tracer = Tracer.createSpan('service1')
      tracer.setTags({ tag: 'value' })
      const request = Tracer.injectContextToHttpRequest(tracer.getContext(), { headers: { traceparent: '00-1234567890123456-12345678-01' } })

      // Act
      const result = Tracer.extractContextFromHttpRequest(request, HttpRequestOptions.xb3)!

      // Assert
      expect(result).not.toBeDefined()
    })

    it('returns undefined when parsing w3c headers with no traceparent', () => {
      // Arrange
      const tracer = Tracer.createSpan('service1')
      tracer.setTags({ tag: 'value' })
      const request = Tracer.injectContextToHttpRequest(tracer.getContext(), { headers: { traceparent: '00-1234567890123456-12345678-01' } })

      // Act
      delete request.headers.traceparent
      const result = Tracer.extractContextFromHttpRequest(request, HttpRequestOptions.w3c)!

      // Assert
      expect(result).not.toBeDefined()
    })
  })

  describe('default tests',() => {
    beforeEach(() => {
      jest.clearAllMocks()

      // Set up config mocks
      mockConfig.EVENT_LOGGER_VENDOR_PREFIX = 'acmevendor'
      mockConfig.EVENT_LOGGER_TRACESTATE_HEADER_ENABLED = true
      mockConfig.EVENT_LOGGER_TRACEID_PER_VENDOR = true
    })

    it('should create a parent span', async () => {
      jest.mock('fs', () => ({ readFileSync: () => JSON.stringify({KAFKA: {PRODUCER: {EVENT: {AUDIT: {config: {}}, LOG: {config: {}}}}}})}));
      // Arrange
      const configWithSidecar = {
        EVENT_LOGGER_SIDECAR_DISABLED: false,
        EVENT_LOGGER_SERVER_HOST: 'localhost',
        EVENT_LOGGER_SERVER_PORT: 50051
      }
      const eventClient = new EventLoggingServiceClient(configWithSidecar.EVENT_LOGGER_SERVER_HOST, configWithSidecar.EVENT_LOGGER_SERVER_PORT, 'config')
      const tracer = Tracer.createSpan('span', {}, { defaultRecorder: new DefaultSidecarRecorder(eventClient), logRecorder: new DefaultSidecarRecorder(eventClient) })

      // Act
      await tracer.info({ content: { messageProtocol } })
      await tracer.debug({ content: { messageProtocol } })
      await tracer.verbose({ content: { messageProtocol } })
      await tracer.error({ content: { messageProtocol } })
      await tracer.warning({ content: { messageProtocol } })
      await tracer.performance({ content: { messageProtocol } })
      mockConfig.EVENT_LOGGER_LOG_METADATA_ONLY = true
      await tracer.info({ content: { messageProtocol } })
      await tracer.debug({ content: { messageProtocol } })
      await tracer.verbose({ content: { messageProtocol } })
      await tracer.error(new Error('error'))
      await tracer.warning({ content: { messageProtocol } })
      await tracer.performance({ content: { messageProtocol } })

      // Assert
      expect(tracer.spanContext.service).toBe('span')
    })

    it('should get the child span', async () => {
      // Arrange
      const tracer = Tracer.createSpan('service1')
      tracer.setTags({ tag: 'value' })

      // Act
      const child = tracer.getChild('service2')

      // Assert
      expect(tracer.spanContext.spanId).toBe(child.spanContext.parentSpanId)
      expect(tracer.spanContext.traceId).toBe(child.spanContext.traceId)
      expect(child.spanContext.service).toBe('service2')
      expect(child.spanContext.tags).toHaveProperty('tag')
      expect(child.spanContext.tags!.tag).toBe('value')
      expect(child.spanContext.tags!.tracestate).toContain('acmevendor')

      const spanContext = child.getContext()
      const IIChild = Tracer.createChildSpanFromContext('service3', spanContext)
      expect(child.spanContext.spanId).toBe(IIChild.spanContext.parentSpanId)
      expect(tracer.spanContext.traceId).toBe(IIChild.spanContext.traceId)
      expect(IIChild.spanContext.service).toBe('service3')

      const expected = Object.assign({}, messageProtocol, { metadata: { event: messageProtocol.metadata.event, trace: IIChild.getContext() } })
      const newMessageA = await Tracer.injectContextToMessage(IIChild.getContext(), messageProtocol)
      const newMessageB = IIChild.injectContextToMessage(messageProtocol)
      expectStringifyToMatch(newMessageA, expected)
      expectStringifyToMatch(newMessageB, expected)

      const extractedContext = Tracer.extractContextFromMessage(newMessageA)
      const IIIChild = Tracer.createChildSpanFromContext('service4', extractedContext)
      expect(IIChild.spanContext.spanId).toBe(IIIChild.spanContext.parentSpanId)
      expect(tracer.spanContext.traceId).toBe(IIIChild.spanContext.traceId)
      expect(IIIChild.spanContext.service).toBe('service4')

      const IVChild = Tracer.createChildSpanFromContext('service4', { ...extractedContext })
      IVChild.setTracestateTags({ bar: 'baz' })
      expect(IVChild.getContext().tracestates[mockConfig.EVENT_LOGGER_VENDOR_PREFIX]).toEqual({ bar: 'baz', spanId: IVChild.getContext().spanId })
      expect(IVChild.getTracestateTags()).toEqual({ bar: 'baz', spanId: IVChild.getContext().spanId })
      expect(IVChild.getTracestates()[mockConfig.EVENT_LOGGER_VENDOR_PREFIX]).toEqual({ bar: 'baz', spanId: IVChild.getContext().spanId })
      expect(IIChild.spanContext.spanId).toBe(IVChild.spanContext.parentSpanId)
      expect(tracer.spanContext.traceId).toBe(IVChild.spanContext.traceId)
      expect(IIIChild.spanContext.service).toBe('service4')

      const newMessageC = IIIChild.injectContextToMessage({ trace: {} })
      const expected1 = { trace: IIIChild.getContext() }
      expectStringifyToMatch(newMessageC, expected1)

      const newMeta = await IIIChild.injectContextToMessage(new EventTraceMetadata({ service: '1' }))
      expectStringifyToMatch(newMeta, IIIChild.getContext())

      const expected2 = { message: { value: { metadata: { here: {}, trace: IIIChild.getContext() } } } }
      const newMessageD = IIIChild.injectContextToMessage({ message: { value: { metadata: { here: {} } } } }, { path: 'message.value.metadata' })
      expectStringifyToMatch(newMessageD, expected2)

      const newMessageE = Tracer.injectContextToMessage(IIIChild.getContext(), { trace: {} })
      const expected3 = { trace: IIIChild.getContext() }
      expectStringifyToMatch(newMessageE, expected3)

      const newMeta2 = await Tracer.injectContextToMessage(IIIChild.getContext(), new EventTraceMetadata({ service: '1' }))
      expectStringifyToMatch(newMeta2, IIIChild.getContext())

      const newMessageF = Tracer.injectContextToMessage(IIIChild.getContext(), { message: { value: { metadata: { here: {} } } } }, { path: 'message.value.metadata' })
      const expected4 = { message: { value: { metadata: { here: {}, trace: IIIChild.getContext() } } } }
      expectStringifyToMatch(newMessageF, expected4)

      let header = await Tracer.injectContextToHttpRequest(IIIChild.getContext(), { headers: {} })
      expect(header.headers.traceparent).not.toBeUndefined()
      header = await Tracer.injectContextToHttpRequest(IIIChild.getContext(), { headers: { tracestate: `m=dadfafa,j=123,acmevendor=12345` } })
      expect(header.headers.traceparent).not.toBeUndefined()

      header = await Tracer.injectContextToHttpRequest(IIIChild.getContext(), { headers: { tracestate: 'm=dadfafa,j=123,mojaloop=dfasdfads' } })
      expect(header.headers.tracestate).toContain('mojaloop')

      header = await tracer.injectContextToHttpRequest({ headers: { tracestate: 'm=dadfafa,j=123,mojaloop=dfasdfads' } })
      expect(header.headers.traceparent).not.toBeUndefined()
      expect(header.headers.tracestate).toContain('mojaloop')

      header = await tracer.injectContextToHttpRequest({ headers: { tracestate: 'm=dadfafa,j=123,mojaloop=dfasdfads' } }, HttpRequestOptions.xb3)
      expect(header.headers['X-B3-SpanId']).not.toBeUndefined()

      header = await IIChild.injectContextToHttpRequest({ headers: { tracestate: 'm=dadfafa,j=123,mojaloop=dfasdfads' } }, HttpRequestOptions.xb3)
      expect(header.headers['X-B3-SpanId']).not.toBeUndefined()

      header = await Tracer.injectContextToHttpRequest(IIIChild.getContext(), { headers: {} })
      const newContextA = Tracer.extractContextFromHttpRequest(header)
      expect(newContextA).not.toBeUndefined()

      const request = {
        headers: {
          host: 'localhost:4000',
          'user-agent': 'curl/7.59.0',
          accept: '*/*',
          traceparent: '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
          tracestate: 'af=spanId:b7ad6b7169203331' // ,acmevendor=eyJzcGFuSWQiOiIyMDNmODljMjM3NDhjZmIxIiwidGltZUFwaVByZXBhcmUiOiIyMjgzMjMyIiwidGltZUFwaUZ1bGZpbCI6IjI4MjMyMjMyIn0'
        }
      }

      const newContext0 = Tracer.extractContextFromHttpRequest(request)
      const zeroChild = Tracer.createChildSpanFromContext('child III service', newContext0) //, { defaultRecorder: new DefaultLoggerRecorder() })

      expect(zeroChild).not.toBeUndefined()

      header = await IIChild.injectContextToHttpRequest({ headers: { tracestate: 'm=dadfafa,j=123,mojaloop=dfasdfads' } }, HttpRequestOptions.xb3)
      const newContextB = Tracer.extractContextFromHttpRequest(header, HttpRequestOptions.xb3)
      expect(newContextB).not.toBeUndefined()

      header = await Tracer.injectContextToHttpRequest(IIIChild.getContext(), { headers: {tracestate: 'mojaloop=12312312', traceparent: '00-1234567890123456-12345678-01'} })
      const newContextC = Tracer.extractContextFromHttpRequest(header)
      expect(newContextC).not.toBeUndefined()

      const finishtime = new Date()
      await tracer.finish('message', undefined, finishtime)
      const a = async () => await IIChild.finish()
      expect(await a()).not.toBeFalsy()

      // Throws when new trying to finish already finished trace
      let action = async () => await tracer.finish()
      await expect(action()).rejects.toThrow('span already finished')

      const newSpan = Tracer.createSpan('span')
      const finish = 'finish'
      // await tracer.finish()
      await newSpan.finish('message', undefined, finish)

      action = async () => await tracer.audit(<EventMessage>newMessageA)
      const actionFinish = async () => await tracer.trace()
      await expect(action()).resolves
      await expect(actionFinish()).resolves
      const logresult = await child.audit(<EventMessage>newMessageA)
      expect(logresult).not.toBeUndefined()
    })
  })
})
