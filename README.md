# jrf-graylog

## Description 

A package that implements the `udp` logging client for [Graylog](https://www.graylog.org/)

## Example

```js
const Graylog = require('jrf-graylog');

const graylog = new Graylog({
  address: 'graylog.server.address',
  host: 'my-web-project.com',
  node: 'dev.log.test'
});

graylog.log('String line log');
graylog.log({code: 1245, label: 'label'});
graylog.log({code: 1245, label: 'label'}, graylog.level.DEBUG);
graylog.log({code: 1245, label: 'label', level: 6});
graylog.log({code: 1245, label: 'label', level: graylog.level.ALERT});
graylog.log({code: 1245, label: 'label', level: 'error'});

graylog.log({
  data: ['sss', 'sfdsf', 'sfddsf', {odd: {a: 'a', b: {b: [{a: 'a', b: {a: 'a'}}, 'ss']}}}],
  message: 'array data'
});

let error;
try {
  throw new Error('test error');
} catch (e) {
  error = e;
}
graylog.error(error);
graylog.error({message: 'exec test error', error});

graylog.info('info');
graylog.debug('debug');
graylog.emergency('emergency');
graylog.alert('alert');
graylog.critical('critical');
graylog.notice('notice');
```

## Levels

`graylog.level[levelNameUppercase]`

| code | name | description |
|---|---|---|
| 0 | emergency | system is unusable |
| 1 | alert | action must be taken immediately |
| 2 | critical | critical conditions |
| 3 | error | error conditions |
| 4 | warning | warning conditions |
| 5 | notice | normal, but significant, condition |
| 6 | info | informational message |
| 7 | debug | debug level message |

## Constructor

| name | type | default | description |
|---|---|---|---|
| port | number | 12201 | port on server |
| address | string | localhost | Address Graylog server |
| host | string |  | client hostname |
| node | string | node | client node name |
| defaultLevel | string/number/Object | INFO | default log level |
