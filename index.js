const dgram = require('dgram');
const crypto = require('crypto');

module.exports = class Graylog {

  /**
   * Create Graylog client
   *
   * @param {number} [port = 12201] - Port Graylog server, for udp log
   * @param {string} [address = 'localhost'] - Address Graylog server
   * @param {string} [host] - client hostname
   * @param {string} [node = 'node'] - client node name
   * @param {string|number|Object} [defaultLevel = INFO] - default log level
   */
  constructor({port = 12201, address = 'localhost', host, node = 'node', defaultLevel}) {

    this.level = {
      EMERGENCY: {code: 0, name: 'emergency', description: 'system is unusable'},
      ALERT: {code: 1, name: 'alert', description: 'action must be taken immediately'},
      CRITICAL: {code: 2, name: 'critical', description: 'critical conditions'},
      ERROR: {code: 3, name: 'error', description: 'error conditions'},
      WARNING: {code: 4, name: 'warning', description: 'warning conditions'},
      NOTICE: {code: 5, name: 'notice', description: 'normal, but significant, condition'},
      INFO: {code: 6, name: 'info', description: 'informational message'},
      DEBUG: {code: 7, name: 'debug', description: 'debug level message'}
    };

    this.port = port;
    this.address = address;
    this.host = host;
    this.node = node;
    this.defaultLevel = defaultLevel || this.level.INFO;

    this._version = '1.1';
    this._bufferSize = 1100;

  }

  /**
   * Send log to graylog
   *
   * @param {*} log - Log: string, number, Object, error
   * @param {Object, number, string} [level=INFO] - log level
   * @param {Boolean} [background=true]
   * @return {undefined|Graylog}
   */
  log(log, level, background = true,) {

    if (background) {
      setImmediate(() => this.send(log, level));
      return this;
    }

    return this.send(log, level);

  }

  /**
   * Send emergency log to graylog
   *
   * @param {*} log - Log: string, number, Object, error
   * @param {Boolean} [background=true]
   * @return {undefined|Graylog}
   */
  emergency(log, background = true) {
    const level = this.level.EMERGENCY;
    return this.log(log, level, background);
  }

  /**
   * Send alert log to graylog
   *
   * @param {*} log - Log: string, number, Object, error
   * @param {Boolean} [background=true]
   * @return {undefined|Graylog}
   */
  alert(log, background = true) {
    const level = this.level.ALERT;
    return this.log(log, level, background);
  }

  /**
   * Send critical log to graylog
   *
   * @param {*} log - Log: string, number, Object, error
   * @param {Boolean} [background=true]
   * @return {undefined|Graylog}
   */
  critical(log, background = true) {
    const level = this.level.CRITICAL;
    return this.log(log, level, background);
  }

  /**
   * Send error log to graylog
   *
   * @param {*} log - Log: string, number, Object, error
   * @param {Boolean} [background=true]
   * @return {undefined|Graylog}
   */
  error(log, background = true) {
    const level = this.level.ERROR;
    return this.log(log, level, background);
  }

  /**
   * Send warning log to graylog
   *
   * @param {*} log - Log: string, number, Object, error
   * @param {Boolean} [background=true]
   * @return {undefined|Graylog}
   */
  warning(log, background = true) {
    const level = this.level.WARNING;
    return this.log(log, level, background);
  }

  /**
   * Send notice log to graylog
   *
   * @param {*} log - Log: string, number, Object, error
   * @param {Boolean} [background=true]
   * @return {undefined|Graylog}
   */
  notice(log, background = true) {
    const level = this.level.NOTICE;
    return this.log(log, level, background);
  }

  /**
   * Send info log to graylog
   *
   * @param {*} log - Log: string, number, Object, error
   * @param {Boolean} [background=true]
   * @return {undefined|Graylog}
   */
  info(log, background = true) {
    const level = this.level.INFO;
    return this.log(log, level, background);
  }

  /**
   * Send debug log to graylog
   *
   * @param {*} log - Log: string, number, Object, error
   * @param {Boolean} [background=true]
   * @return {undefined|Graylog}
   */
  debug(log, background = true) {
    const level = this.level.DEBUG;
    return this.log(log, level, background);
  }

  /**
   * Send udp message to graylog
   *
   * @param {*} log - Log: string, number, Object, error
   * @param {Object, number, string} [level=INFO] - log level
   */
  send(log, level) {

    const noObject = typeof log !== 'object';
    if (noObject) log = {message: String(log)};

    const noSend = this._isBadLog(log);

    if (noSend) return;

    log = this._processLog(log, level);

    const message = Buffer.from(JSON.stringify(log));

    const logLength = message.length;
    const bufferSize = this._bufferSize;
    const send = logLength <= bufferSize;

    if (send) {

      const client = dgram.createSocket('udp4');
      client.send(message, this.port, this.address, error => {
        if (error) console.error(error);
        client.close();
      });

      return;

    }

    const mesId = crypto.randomBytes(8);
    const chunkCounts = Math.ceil(logLength / bufferSize);

    for (let i = 0; i < chunkCounts; i++) {

      const start = bufferSize * i;
      const end = Math.min(start + bufferSize, message.length);
      const chunkSize = end - start + 12;

      let chunk = Buffer.allocUnsafe(chunkSize);
      chunk[0] = 30;
      chunk[1] = 15;

      mesId.copy(chunk, 2, 0, 8);
      chunk[10] = i;
      chunk[11] = chunkCounts;

      message.copy(chunk, 12, start, end);

      const client = dgram.createSocket('udp4');
      client.send(chunk, this.port, this.address, error => {
        if (error) console.error(error);
        client.close();
      });

    }

    return this;

  }

  _processLog(log, level) {

    const isError = log instanceof Error;
    if (isError) {
      log = {error: log};
    }

    if (Array.isArray(log)) {
      log = {message: JSON.stringify(log)};
    }

    if (!log.message) {
      log.message = JSON.stringify(log);
    }

    log.version = log.version || this._version;
    log.timestamp = log.timestamp || Date.now() / 1000;
    log.node = log.node || this.node;
    log.host = log.host || this.host;
    if (level) {
      log.level = level;
    }

    level = this._getLevel(log.level);
    delete log.level;
    if (level.code) log.level = level.code;
    if (level.name) log.levelName = level.name;

    log = this._processTypes(log);

    return log;

  }

  _processTypes(log) {

    const excludeFields = ['message', 'version', 'timestamp', 'node', 'host', 'level', 'levelName'];
    const keys = Object.keys(log).filter(key => !excludeFields.includes(key));

    for (const key of keys) {

      const value = log[key];
      const next = typeof value === 'number' || typeof value === 'string';
      if (next) continue;

      const isNull = value === null;
      if (isNull) {
        log[key] = 'null';
        continue;
      }

      const isUndefined = value === undefined;
      if (isUndefined) {
        log[key] = 'undefined';
        continue;
      }

      const isError = value instanceof Error;
      if (isError) {

        log.messageError = value.message;
        log.stack = value.stack;
        log[key] = this._processError(value);

        const noMessage = log.message === '{"error":{}}';
        if (noMessage) log.message = value.toString();

        continue;

      }

      const isArray = Array.isArray(value);
      if (isArray) {
        log[key] = JSON.stringify(value, null, 2);
        continue;
      }

      const isObject = typeof value === 'object';
      log[key] = isObject ? JSON.stringify(value, null, 2) : String(value);

    }

    return log;

  }

  _processError(value) {

    const error = {};

    Object.getOwnPropertyNames(value).forEach(key => {
      error[key] = value[key];
    });

    return error;

  }

  _getLevel(level) {

    const isEmpty = level === null || level === undefined;
    if (isEmpty) level = this.defaultLevel;

    const isObject = level !== null && typeof level === 'object';
    if (isObject) {
      return {code: level.code, name: level.name};
    }

    const isNumber = typeof level === 'number';
    if (isNumber) {
      const values = Object.values(this.level);
      const foundLevel = values.find(el => el.code === level) || {code: level};
      return foundLevel;
    }

    level = String(level).trim().toLowerCase();
    const values = Object.values(this.level);
    const foundLevel = values.find(el => el.name === level) || {name: level};
    return foundLevel;

  }

  _isBadLog(log) {

    const bad = log === null || log === undefined;
    if (bad) return true;

    try {
      JSON.stringify(log);
    } catch (e) {
      return true;
    }

    return false;

  }

}