import {LoggerConfiguration, ConsoleSink, DynamicLevelSwitch, LogEventLevel, Logger} from 'serilogger';

export class StaticLogger {
  private static instance: Logger;
  private static levelSwitch = new DynamicLevelSwitch();
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static Default(): Logger {
    if(!StaticLogger.instance) {
      // Logger.levelSwitch.information();
      StaticLogger.instance = new LoggerConfiguration()
        .minLevel(StaticLogger.levelSwitch)
        .writeTo(new ConsoleSink({ includeTimestamps: true }))
        .create()
    }

    return StaticLogger.instance;
  }

  public static CreateLoggerForSource(source: string): Logger {
    return new LoggerConfiguration()
      .enrich({
        source: source
      })
      .writeTo(StaticLogger.Default())
      .create();
  }

  public static async setLevel(input: string): Promise<boolean>  {
    if(!Object.keys(LogEventLevel).some(k => k === input)) return false;
    const level = (LogEventLevel as any)[input]
    switch (level) {
      case LogEventLevel.verbose:
        await StaticLogger.levelSwitch.verbose();
        break;
      case LogEventLevel.debug:
        await StaticLogger.levelSwitch.debug();
        break;
      case LogEventLevel.information:
        await StaticLogger.levelSwitch.information();
        break;
      case LogEventLevel.warning:
        await StaticLogger.levelSwitch.warning();
        break;
      default:
        return false;
    }
    StaticLogger.Default().info('LogLevel changed to {level}', input)
    return true;
  }

}