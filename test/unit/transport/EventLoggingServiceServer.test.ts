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

 - Lewis Daly <lewisd@crosslaketech.com>

 --------------
 ******/

jest.mock('@grpc/grpc-js')
jest.mock('../../../src/transport/EventLoggerServiceLoader')

const grpc = require('@grpc/grpc-js')

import { EventLoggingServiceServer } from '../../../src/transport/EventLoggingServiceServer'
import { loadEventLoggerService } from '../../../src/transport/EventLoggerServiceLoader'
import { LogResponse, LogResponseStatus } from '../../../src/model/EventMessage'

describe('EventLoggingServiceServer', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('constructor', () => {
    it('creates a new EventLoggingServiceServer', () => {
      // Arrange
      const mockAddService = jest.fn()
      //@ts-ignore
      loadEventLoggerService.mockReturnValueOnce({
        service: 'mock'
      })
      grpc.Server.mockImplementationOnce(() => ({
        addService: mockAddService
      }))

      // Act
      new EventLoggingServiceServer('localhost', 4444)

      // Assert
      expect(grpc.Server).toHaveBeenCalledTimes(1)
      expect(mockAddService).toHaveBeenCalledTimes(1)
    })
  })

  describe('start', () => {
    it('starts the grpc server', () => {
      // Arrange
      //@ts-ignore
      loadEventLoggerService.mockReturnValueOnce({
        service: 'mock'
      })

      const mockServer = {
        addService: jest.fn(),
        bindAsync: jest.fn((_, __, callback) => {
          callback(null, 4444)
        }),
        start: jest.fn()
      }
      grpc.Server.mockImplementationOnce(() => mockServer)
      const server = new EventLoggingServiceServer('localhost', 4444)

      // Act
      server.start()

      // Assert
      expect(mockServer.bindAsync).toHaveBeenCalledTimes(1)
    })
  })

  describe('start error', () => {
    it('starts the grpc server with error', () => {
      // Arrange
      //@ts-ignore
      loadEventLoggerService.mockReturnValueOnce({
        service: 'mock'
      })

      const mockServer = {
        addService: jest.fn(),
        bindAsync: jest.fn((_, __, callback) => {
          callback(new Error('error'))
        }),
        start: jest.fn()
      }
      grpc.Server.mockImplementationOnce(() => mockServer)
      const server = new EventLoggingServiceServer('localhost', 4444)

      // Act
      expect(() => server.start()).toThrow('error')

      // Assert
      expect(mockServer.bindAsync).toHaveBeenCalledTimes(1)
    })
  })

  describe('logEventReceivedHandler', () => {
    beforeEach(() => {
      //@ts-ignore
      loadEventLoggerService.mockReturnValueOnce({
        service: 'mock'
      })
      const mockServer = {
        addService: jest.fn(),
        bind: jest.fn(),
        start: jest.fn()
      }
      grpc.Server.mockImplementationOnce(() => mockServer)
    })

    it('sends a callback with the accepted LogResponse', () => {
      // Arrange
      const server = new EventLoggingServiceServer('localhost', 4444)
      server.emit = jest.fn()
      const call = {
        request: {
          id: '12345',
        }
      }
      const callback = jest.fn()
      const expectedResponse = new LogResponse(LogResponseStatus.accepted)

      // Act
      server.logEventReceivedHandler(call, callback)

      // Assert
      expect(server.emit).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(null, expectedResponse)
    })

    it('handles an event with content', () => {
      // Arrange
      const server = new EventLoggingServiceServer('localhost', 4444)
      server.emit = jest.fn()
      const call = {
        request: {
          id: '12345',
          content: {
            type_url: 'application/json',
            value: `{"hello":true}`
          }
        }
      }
      const callback = jest.fn()
      const expectedResponse = new LogResponse(LogResponseStatus.accepted)

      // Act
      server.logEventReceivedHandler(call, callback)

      // Assert
      expect(server.emit).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(null, expectedResponse)
    })

    it('handles an event with invalid content', () => {
      // Arrange
      const server = new EventLoggingServiceServer('localhost', 4444)
      server.emit = jest.fn()
      const call = {
        request: {
          id: '12345',
          content: {
            type_url: 'invalid',
            value: `{"hello":true}`
          }
        }
      }
      const callback = jest.fn()
      const expectedResponse = new LogResponse(LogResponseStatus.error)

      // Act
      server.logEventReceivedHandler(call, callback)

      // Assert
      expect(server.emit).toHaveBeenCalledTimes(0)
      expect(callback).toHaveBeenCalledWith(null, expectedResponse)
    })

    it('handles an event with no id', () => {
      // Arrange
      const server = new EventLoggingServiceServer('localhost', 4444)
      server.emit = jest.fn()
      const call = {
        request: {
          content: {
            type_url: 'invalid',
            value: `{"hello":true}`
          }
        }
      }
      const callback = jest.fn()
      const expectedResponse = new LogResponse(LogResponseStatus.error)


      // Act
      server.logEventReceivedHandler(call, callback)

      // Assert
      expect(server.emit).toHaveBeenCalledTimes(0)
      expect(callback).toHaveBeenCalledWith(new Error(`Couldn't parse message parameter. It doesn't have an id property. parameter: ${call.request}`))
    })
  })
})
