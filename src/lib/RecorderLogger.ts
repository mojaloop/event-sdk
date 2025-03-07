const { createLogger, format, transports } = require('winston')
const { combine, timestamp, colorize, printf } = format

const allLevels = { error: 0, warn: 1, audit: 2, trace: 3, info: 4, perf: 5, verbose: 6, debug: 7, silly: 8 }
// const customLevelsArr = customLevels.split(/ *, */) // extra white space before/after the comma is ignored
// const ignoredLevels = customLevels ? Object.keys(allLevels).filter(key => !customLevelsArr.includes(key)) : []

interface formatInput {
  level: string
  message: string
  timestamp: string
}

const customFormat = printf(({ level, message, timestamp }: formatInput) => {
  return `${timestamp} - ${level}: ${message}`
})

const transport = new transports.Console()

const RecorderLogger = createLogger({
  level: 'silly',
  levels: allLevels,
  format: combine(
    timestamp(),
    colorize({
      colors: {
        audit: 'magenta',
        trace: 'white',
        perf: 'green'
      }
    }),
    customFormat
  ),
  transports: [
    transport
  ],
  exceptionHandlers: [
    transport
  ],
  exitOnError: false
})

module.exports = RecorderLogger
