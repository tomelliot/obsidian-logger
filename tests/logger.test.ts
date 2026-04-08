import { createLogger } from "../src/index";

describe("createLogger", () => {
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let originalEnv: string | undefined;

  beforeEach(() => {
    consoleDebugSpy = jest.spyOn(console, "debug").mockImplementation();
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    consoleDebugSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
    jest.resetModules();
  });

  describe("prefix", () => {
    it("should use the provided prefix in log messages", () => {
      process.env.NODE_ENV = "development";
      jest.resetModules();
      const { createLogger: create } = require("../src/index");
      const log = create("My Plugin");

      log.debug("test");
      expect(consoleDebugSpy).toHaveBeenCalledWith("[My Plugin]", "test");
    });
  });

  describe("development mode filtering", () => {
    it("should log debug messages in development mode", () => {
      process.env.NODE_ENV = "development";
      jest.resetModules();
      const { createLogger: create } = require("../src/index");
      const log = create("Test");

      log.debug("Debug message");
      expect(consoleDebugSpy).toHaveBeenCalledWith("[Test]", "Debug message");
    });

    it("should not log debug messages in production mode", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { createLogger: create } = require("../src/index");
      const log = create("Test");

      log.debug("Debug message");
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it("should log debug messages when NODE_ENV is undefined", () => {
      delete process.env.NODE_ENV;
      jest.resetModules();
      const { createLogger: create } = require("../src/index");
      const log = create("Test");

      log.debug("Debug message");
      expect(consoleDebugSpy).toHaveBeenCalledWith("[Test]", "Debug message");
    });

    it("should log info messages in development mode", () => {
      process.env.NODE_ENV = "development";
      jest.resetModules();
      const { createLogger: create } = require("../src/index");
      const log = create("Test");

      log.info("Info message");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[Test]", "Info message");
    });

    it("should not log info messages in production mode", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { createLogger: create } = require("../src/index");
      const log = create("Test");

      log.info("Info message");
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });
  });

  describe("always-on logging", () => {
    it("should always log warn messages regardless of environment", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { createLogger: create } = require("../src/index");
      const log = create("Test");

      log.warn("Warning message");
      expect(consoleWarnSpy).toHaveBeenCalledWith("[Test]", "Warning message");
    });

    it("should always log error messages regardless of environment", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { createLogger: create } = require("../src/index");
      const log = create("Test");

      log.error("Error message");
      expect(consoleErrorSpy).toHaveBeenCalledWith("[Test]", "Error message");
    });
  });

  describe("file logging integration", () => {
    it("should append a formatted line when debug logging is enabled", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { createLogger: create } = require("../src/index");
      const log = create("Test");
      const appendLine = jest.fn();

      log.configureFileLogging({
        isDebugEnabled: () => true,
        appendLine,
      });

      log.debug("Debug message", { foo: "bar" });

      expect(appendLine).toHaveBeenCalledTimes(1);
      const line = appendLine.mock.calls[0][0] as string;
      expect(line).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(line).toContain("[DEBUG]");
      expect(line).toContain("Debug message");
      expect(line).toContain('"foo":"bar"');
      expect(line.endsWith("\n")).toBe(true);
    });

    it("should not append when debug logging is disabled", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { createLogger: create } = require("../src/index");
      const log = create("Test");
      const appendLine = jest.fn();

      log.configureFileLogging({
        isDebugEnabled: () => false,
        appendLine,
      });

      log.info("Info message");
      expect(appendLine).not.toHaveBeenCalled();
    });

    it("should log debug to console when isDebugEnabled returns true in production", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { createLogger: create } = require("../src/index");
      const log = create("Test");
      const appendLine = jest.fn();

      log.configureFileLogging({
        isDebugEnabled: () => true,
        appendLine,
      });

      log.debug("Debug visible in prod");
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        "[Test]",
        "Debug visible in prod"
      );
    });

    it("should log info to console when isDebugEnabled returns true in production", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { createLogger: create } = require("../src/index");
      const log = create("Test");
      const appendLine = jest.fn();

      log.configureFileLogging({
        isDebugEnabled: () => true,
        appendLine,
      });

      log.info("Info visible in prod");
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        "[Test]",
        "Info visible in prod"
      );
    });

    it("should not log debug to console when isDebugEnabled returns false in production", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { createLogger: create } = require("../src/index");
      const log = create("Test");
      const appendLine = jest.fn();

      log.configureFileLogging({
        isDebugEnabled: () => false,
        appendLine,
      });

      log.debug("Should not appear");
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it("should serialize Error instances in file logs", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { createLogger: create } = require("../src/index");
      const log = create("Test");
      const appendLine = jest.fn();

      log.configureFileLogging({
        isDebugEnabled: () => true,
        appendLine,
      });

      const error = new Error("Something went wrong");
      log.error("Error occurred", error);

      expect(appendLine).toHaveBeenCalledTimes(1);
      const line = appendLine.mock.calls[0][0] as string;
      expect(line).toContain("[ERROR]");
      expect(line).toContain("Error occurred");
      expect(line).toContain("Something went wrong");
    });
  });
});
