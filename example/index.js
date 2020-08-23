const Graylog = require('../index');

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