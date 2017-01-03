Oddcast AWS Transport
=====================
An event broadcast and queue transport for [Oddcast](https://github.com/oddnetworks/oddcast) using Amazon [SNS](http://aws.amazon.com/documentation/sns/) and [SQS](https://aws.amazon.com/documentation/sqs/).

__WORK IN PROGRESS__

Last Jasmine test output:
```
Started
initialize all components
send all the setVideo commands
hanlded with ERROR No handler for pattern {"role":"catalog","cmd":"setVideo"}
hanlded with ERROR No handler for pattern {"role":"catalog","cmd":"setVideo"}
hanlded with ERROR No handler for pattern {"role":"catalog","cmd":"setVideo"}
hanlded with ERROR No handler for pattern {"role":"catalog","cmd":"setVideo"}
success : false
success : false
success : false
success : false
F

Failures:
1) with oddcast bus component A has payloads
  Message:
    Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.
  Stack:
    Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.
        at Timer.listOnTimeout (timers.js:92:15)
  Message:
    TypeError: Cannot read property 'length' of undefined
  Stack:
    TypeError: Cannot read property 'length' of undefined
        at Object.<anonymous> (/Users/kris/Projects/oddcast-aws-transport/spec/with-bus-spec.js:298:27)

1 spec, 2 failures
Finished in 5.015 seconds

An error was thrown in an afterAll
AfterAll Failed: this.server.close is not a function
```


Copyright and License
---------------------
Copyright (c) 2017 Oddnetworks Inc. (https://www.oddnetworks.com).

Unless otherwise indicated, all source code is licensed under the MIT license. See MIT-LICENSE for details.
