import {LoggerConfiguration, ColoredConsoleSink, DynamicLevelSwitch, LogEventLevel, Logger} from 'serilogger';

export class StaticLogger {
  private static instance: Logger;
  private static levelSwitch = new DynamicLevelSwitch(LogEventLevel.information);
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static Default(): Logger {
    if(!StaticLogger.instance) {
      // Logger.levelSwitch.information();
      StaticLogger.instance = new LoggerConfiguration()
        .minLevel(StaticLogger.levelSwitch)
        .writeTo(new ColoredConsoleSink({ includeTimestamps: true }))
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
    await StaticLogger.levelSwitch.set(level)

    StaticLogger.Default().info('LogLevel changed to {level}', input)
    return true;
  }
}
