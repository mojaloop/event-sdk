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

 * Crosslake
 - Lewis Daly <lewisd@crosslaketech.com>

 --------------
 ******/

const Uuid = require('node:crypto').randomUUID

import { EventLoggingServiceClient } from '../../../src/transport/EventLoggingServiceClient'
import { EventMessage, LogResponse, LogResponseStatus } from '../../../src/model/EventMessage'
const Logger = require('@mojaloop/central-services-logger')


let client: EventLoggingServiceClient

describe('EventLoggingServiceClient', () => {
  beforeAll(() => {
    client = new EventLoggingServiceClient('localhost', 55555)
    jest.resetAllMocks()
  })

  it('throws when content is null or undefined', async () => {
    // Arrange
    const invalidEvent: EventMessage = <EventMessage>{
      type: 'application/json',
      id: <string>Uuid()
    }

    // Act
    const action = async () => await client.log(invalidEvent)

    // Assert
    await expect(action()).rejects.toThrow('Invalid eventMessage: content is mandatory')
  })

  it('handles an exception when processing the event', async () => {
    // Arrange
    const event: EventMessage = <EventMessage>{
      type: 'invalid',
      id: <string>Uuid(),
      content: `{"hello":true}`
    }

    // Act
    const action = async () => client.log(event)

    // Assert
    await expect(action()).rejects.toThrow('toAny called with unsupported data type invalid')
  })

  it('processes the event', async () => {
    // Arrange
    const event: EventMessage = <EventMessage>{
      type: 'application/json',
      id: <string>Uuid(),
      content: `{"hello":true}`
    }
    client.grpcClient = {
      log: jest.fn().mockImplementationOnce((event, cbFunc) => {
        const response = new LogResponse(LogResponseStatus.accepted)
        cbFunc(null, response)
      })
    }

    // Act
    const result = await client.log(event)

    // Assert
    expect(result).toStrictEqual(new LogResponse(LogResponseStatus.accepted))
  })

  it('processes the event with buffer input', async () => {
    // Arrange
    const event: EventMessage = <EventMessage>{
      type: 'text/plain',
      id: <string>Uuid(),
      content: Buffer.from(`{"hello":true}`)
    }
    client.grpcClient = {
      log: jest.fn().mockImplementationOnce((event, cbFunc) => {
        const response = new LogResponse(LogResponseStatus.accepted)
        cbFunc(null, response)
      })
    }

    // Act
    const result = await client.log(event)

    // Assert
    expect(result).toStrictEqual(new LogResponse(LogResponseStatus.accepted))
  })

  it('processes the event with buffer input correctly if log level is `debug`', async () => {
    // Arrange
    const event: EventMessage = <EventMessage>{
      type: 'text/plain',
      id: <string>Uuid(),
      content: Buffer.from(`{"hello":true}`)
    }
    client.grpcClient = {
      log: jest.fn().mockImplementationOnce((event, cbFunc) => {
        const response = new LogResponse(LogResponseStatus.accepted)
        cbFunc(null, response)
      })
    }
    Logger.isDebugEnabled = true

    // Act
    const result = await client.log(event)

    // Assert
    expect(result).toStrictEqual(new LogResponse(LogResponseStatus.accepted))
  })

  it('processes the event with an error callback', async () => {
    // Arrange
    const event: EventMessage = <EventMessage>{
      type: 'application/json',
      id: <string>Uuid(),
      content: `{"hello":true}`
    }
    client.grpcClient = {
      log: jest.fn().mockImplementationOnce((event, cbFunc) => {
        const error = new Error('test error')
        cbFunc(error, null)
      })
    }

    // Act
    const action = async () => client.log(event)

    // Assert
    await expect(action()).rejects.toThrow('test error')
  })
})
