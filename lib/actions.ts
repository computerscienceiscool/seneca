/* Copyright © 2014-2022 Richard Rodger and other contributors, MIT License. */


import { Legacy } from './legacy'

const Common = require('./common')

function addActions(instance: any) {
  instance.stats = make_action_seneca_stats(instance.private$)

  // Add builtin actions.
  instance
    .add('sys:seneca,on:point', on_point)

  // TODO: complete merge of v4prep
  // .add('role:transport,cmd:listen', action_listen)
  // .add('role:transport,cmd:client', action_client)



  // LEGACY
  instance.add({ role: 'seneca', cmd: 'ping' }, cmd_ping)
  instance.add({ role: 'seneca', cmd: 'stats' }, instance.stats)
  instance.add({ role: 'seneca', cmd: 'close' }, action_seneca_close)
  instance.add({ role: 'seneca', info: 'fatal' }, action_seneca_fatal)
  instance.add({ role: 'seneca', get: 'options' }, action_options_get)
}

function on_point(this: any, msg: any, reply: any) {
  reply()
}

function cmd_ping(this: any, msg: any, reply: any) {
  reply(this.ping())
}

function action_seneca_fatal(this: any, msg: any, reply: any) {
  reply()
}

function action_seneca_close(this: any, msg: any, reply: any) {
  this.emit('close')
  reply()
}

function make_action_seneca_stats(private$: any) {
  return function action_seneca_stats(this: any, msg: any, reply: any) {
    msg = msg || {}
    var stats

    // TODO: review - this is sort of breaking the "type" of the stats result
    if (private$.stats.actmap[msg.pattern]) {
      stats = private$.stats.actmap[msg.pattern]
      stats.time = private$.timestats.calculate(msg.pattern)
    } else {
      stats = Object.assign({}, private$.stats)
      stats.now = new Date()
      stats.uptime = stats.now - stats.start

      stats.now = new Date(stats.now).toISOString()
      stats.start = new Date(stats.start).toISOString()

      var summary = null == msg.summary || Common.boolify(msg.summary)

      if (summary) {
        stats.actmap = void 0
      } else {
        Object.keys(private$.stats.actmap).forEach((p) => {
          private$.stats.actmap[p].time = private$.timestats.calculate(p)
        })
      }
    }

    if (reply) {
      reply(stats)
    }
    return stats
  }
}

function action_options_get(this: any, msg: any, reply: any) {
  var options = this.options()

  var base = msg.base || null
  var top = base ? options[base] || {} : options
  var val = msg.key ? top[msg.key] : top

  reply(Legacy.copydata(val))
}


export {
  addActions
}
