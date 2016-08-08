'use strict';

const tape = require('tape');
const path = require('path');
const Bouncer = require(path.join(process.cwd(), 'src', 'bouncer.js'));
const url = require('url');
const AuthorizationError = require(
    path.join(process.cwd(), 'src', 'authorization-error.js')
);

const defaultOpts = {
  targetBaseUrl: 'http://localhost:5432',
};

/**
 * create a bouncer instance
 * @param  {object} config                configuration options
 * @param  {object} postConstructionProps load into instance post construction
 * @return {Bouncer}                       Bouncer object
 */
const factory = (config, postConstructionProps) => {
  config = config || {};
  postConstructionProps = postConstructionProps || {};
  const bouncer = new Bouncer(Object.assign({}, defaultOpts, config));
  return Object.assign(bouncer, postConstructionProps);
};

/**
 * get a mock function / spy
 * @param  {Function} fn function to be executed whenever this fn is called
 * @return {Function}    spy function, contains a `callCount` property
 */
const getMockFn = (fn) => {
  function spy(...args) {
    spy.callCount++;
    if (fn) {
      // call callback with current context and args
      return fn.apply(this, args);
    }

    return;
  }

  spy.callCount = 0;
  return spy;
};

tape('Bouncer: constructor', (t) => {
  t.plan(6);
  const badFactory = () => {
    return factory({ targetBaseUrl: null });
  };

  const bouncer = factory({ targetBaseUrl: 'http://foo.com' });
  t.deepEquals(
        bouncer.targetBaseUrl,
        url.parse('http://foo.com'),
        'has a targetBaseUrl property'
    );
  t.equals(
        typeof bouncer.handler.proxy.mapUri,
        'function',
        'has a handler property'
    );
  t.ok(
        bouncer.consortiumHasMember instanceof Function,
        'has consortiumHasMember method'
    );
  t.ok(
        bouncer.consortiumIsOwnedBy instanceof Function,
        'has consortiumIsOwnedBy method'
    );
  t.ok(
        bouncer.consortiumHasMember instanceof Function,
        'has consortiumHasMember method'
    );

  t.throws(
        badFactory,
        /.*/,
        'fails without targetBaseUrl'
    );
});

tape('Bouncer: testPathRegExp', (t) => {
  t.plan(2);
  const bouncer = factory({ pathRegExp: /^\/foo/ });
  const mockRequest = {
    path: '/foo/',
  };
  const mockRequest2 = {
    path: '/bar/',
  };
  t.equals(bouncer.testPathRegExp(mockRequest), true, 'Return true if match');
  t.equals(bouncer.testPathRegExp(mockRequest2), false, 'Return false');
});

tape('Bouncer: mapUri', (t) => {
  t.plan(11);

    // Create mock methods
  const mocks = {
    reject: getMockFn(),
    allow: getMockFn(),
    valConOwn: getMockFn(() => { return Promise.resolve(true); }),
    valConMem: getMockFn(() => { return Promise.resolve(true); }),
    valConMemThrow: getMockFn(() => { return Promise.reject(false); }),
    handleAuthRejection: getMockFn(),
    testPathRegExp: getMockFn(() => { return true; }),
  };

  const resetMocks = () => {
    Object.keys(mocks).forEach((key) => {
      mocks[key].callCount = 0;
    });
  };

  factory({ rejectEverybody: true }, { reject: mocks.reject }).mapUri();
  t.equals(mocks.reject.callCount, 1, 'calls reject method');

  factory({ allowEverybody: true }, { allow: mocks.allow }).mapUri();
  t.equals(mocks.allow.callCount, 1, 'calls allow method');

  const testValidationOK = () => {
    resetMocks();
    return factory(
      {
        consortiumMembersOnly: true,
        consortiumOwnersOnly: true,
      },
      {
        allow: mocks.allow,
        validateConsortiumMembership: mocks.valConMem,
        validateConsortiumOwnership: mocks.valConOwn,
        handleAuthRejection: mocks.handleAuthRejection,
        testPathRegExp: mocks.testPathRegExp,
      }
        ).mapUri().then(() => {
          t.equals(mocks.valConMem.callCount, 1, 'calls valConMem');
          t.equals(mocks.valConOwn.callCount, 1, 'calls valConOwn');
          t.equals(mocks.allow.callCount, 1, 'calls allow');
          t.equals(mocks.handleAuthRejection.callCount, 0, 'does not reject');
          t.equals(mocks.testPathRegExp.callCount, 1, 'calls testPathRegExp');
          return;
        });
  };

  const testValidationErr = () => {
    resetMocks();
    return factory(
      {
        consortiumMembersOnly: true,
        consortiumOwnersOnly: true,
      },
      {
        allow: mocks.allow,
        validateConsortiumMembership: mocks.valConMemThrow,
        validateConsortiumOwnership: mocks.valConOwn,
        handleAuthRejection: mocks.handleAuthRejection,
      }
        ).mapUri().then(() => {
          t.equals(mocks.valConMemThrow.callCount, 1, 'calls valConMemThrow');
          t.equals(mocks.valConOwn.callCount, 0, 'does not call valConOwn');
          t.equals(mocks.allow.callCount, 0, 'does not call allow');
          t.equals(mocks.handleAuthRejection.callCount, 1, 'calls reject');
          return;
        });
  };

  testValidationOK().then(testValidationErr);
});

tape('Bouncer: validateConsortiumOwnership', (t) => {
  const mockUsername = 'foo';
  t.test('Valid Update Request', (t) => {
    t.plan(6);

    const mockRequest = {
      payload: { _rev: true },
      path: null,
      auth: { credentials: { username: mockUsername } },
    };

    const mockThis = {
      utils: {
        getConsortium: getMockFn((baseUrl, req) => {
          t.equals(req, mockRequest, 'pass doc to getConsortium');
          return Promise.resolve(req.payload);
        }),
      },
      consortiumIsOwnedBy: getMockFn(function mockFn(username) {
        t.equals(username, mockUsername, 'pass username to isOwnedBy');
        t.equals(this, mockRequest.payload, 'pass doc to isOwnedBy');
        return this;
      }),

      config: { consortiumOwnersOnly: true },
    };

    factory({}, mockThis).validateConsortiumOwnership(mockRequest)
            .then((result) => {
              t.equals(
                    mockThis.utils.getConsortium.callCount,
                    1,
                    'calls getConsortium during update request'
                );
              t.equals(
                    mockThis.consortiumIsOwnedBy.callCount,
                    1,
                    'calls consortiumIsOwnedBy'
                );
              t.equals(
                    result,
                    mockRequest.payload,
                    'promises are chained properly'
                );
            });
  });

  t.test('Valid insert request', (t) => {
    t.plan(4);

    const mockRequest = {
      payload: {},
      path: null,
      auth: { credentials: { username: mockUsername } },
    };

    const mockThis = {
      consortiumIsOwnedBy: getMockFn(function mockFn(username) {
        t.equals(username, mockUsername, 'pass username to isOwnedBy');
        t.equals(mockRequest.payload, this, 'pass doc to isOwnedBy');
        return this;
      }),

      config: { consortiumOwnersOnly: true },
    };

    factory({}, mockThis).validateConsortiumOwnership(mockRequest)
            .then((result) => {
              t.equals(
                    mockThis.consortiumIsOwnedBy.callCount,
                    1,
                    'calls consortiumIsOwnedBy'
                );
              t.equals(result, mockRequest.payload, 'promises chained ok');
            });
  });

  t.test('Invalid Update Request', (t) => {
    t.plan(6);

    const mockRequest = {
      payload: { _rev: true },
      path: null,
      auth: { credentials: { username: mockUsername } },
    };

    const mockThis = {
      utils: {
        getConsortium: getMockFn((baseUrl, req) => {
          t.equals(req, mockRequest, 'pass doc to getConsortium');
          return Promise.resolve(req.payload);
        }),
      },
      consortiumIsOwnedBy: getMockFn(function mockFn(username) {
        t.equals(username, mockUsername, 'pass username to isOwnedBy');
        t.equals(this, mockRequest.payload, 'pass doc to isOwnedBy');
        return false;
      }),

      config: { consortiumOwnersOnly: true },
    };

    factory({}, mockThis).validateConsortiumOwnership(mockRequest)
            .then(() => {
              t.fail('Should reject with AuthorizationError');
            })
            .catch((result) => {
              t.equals(
                    mockThis.utils.getConsortium.callCount,
                    1,
                    'calls getConsortium during update request'
                );
              t.equals(
                    mockThis.consortiumIsOwnedBy.callCount,
                    1,
                    'calls consortiumIsOwnedBy'
                );
              t.ok(
                    result instanceof AuthorizationError,
                    'Should reject with AuthorizationError'
                );
            });
  });

  t.test('Invalid insert request', (t) => {
    t.plan(4);

    const mockRequest = {
      payload: {},
      path: null,
      auth: { credentials: { username: mockUsername } },
    };

    const mockThis = {
      consortiumIsOwnedBy: getMockFn(function mockFn(username) {
        t.equals(username, mockUsername, 'pass username to isOwnedBy');
        t.equals(mockRequest.payload, this, 'pass doc to isOwnedBy');
        return false;
      }),

      config: { consortiumOwnersOnly: true },
    };

    factory({}, mockThis).validateConsortiumOwnership(mockRequest)
            .then(() => {
              t.fail('Should reject with AuthorizationError');
            })
            .catch((result) => {
              t.equals(
                    mockThis.consortiumIsOwnedBy.callCount,
                    1,
                    'calls consortiumIsOwnedBy'
                );
              t.ok(
                    result instanceof AuthorizationError,
                    'Should reject with AuthorizationError'
                );
            });
  });

  t.test('Skip validation', (t) => {
    t.plan(3);

    const mockRequest = {};

    const mockThis = {
      utils: {
        getConsortium: getMockFn(),
      },
      consortiumIsOwnedBy: getMockFn(),
      config: { consortiumOwnersOnly: false },
    };

    factory({}, mockThis).validateConsortiumOwnership(mockRequest)
            .then((result) => {
              t.equals(
                    mockThis.utils.getConsortium.callCount,
                    0,
                    'does not call getConsortium'
                );
              t.equals(
                    mockThis.consortiumIsOwnedBy.callCount,
                    0,
                    'does not call isOwnedBy'
                );
              t.equals(result, true, 'Resolves to true');
            })
            .catch(() => {
              t.fail('Should allow request');
            });
  });
  t.end();
});

tape('Bouncer: validateConsortiumMembership', (t) => {
  const mockUsername = 'foo';
  t.test('Valid Request', (t) => {
    t.plan(6);

    const mockRequest = {
      payload: { _rev: true },
      path: null,
      auth: { credentials: { username: mockUsername } },
    };

    const mockThis = {
      utils: {
        getConsortium: getMockFn((baseUrl, req) => {
          t.equals(req, mockRequest, 'pass doc to getConsortium');
          return Promise.resolve(req.payload);
        }),
      },
      consortiumHasMember: getMockFn(function mockFn(username) {
        t.equals(username, mockUsername, 'pass username to isOwnedBy');
        t.equals(this, mockRequest.payload, 'pass doc to isOwnedBy');
        return this;
      }),

      config: { consortiumMembersOnly: true },
    };

    factory({}, mockThis).validateConsortiumMembership(mockRequest)
            .then((result) => {
              t.equals(
                    mockThis.utils.getConsortium.callCount,
                    1,
                    'calls getConsortium during update request'
                );
              t.equals(
                    mockThis.consortiumHasMember.callCount,
                    1,
                    'calls consortiumHasMember'
                );
              t.equals(
                    result,
                    mockRequest.payload,
                    'promises are chained properly'
                );
            });
  });

  t.test('Invalid Update Request', (t) => {
    t.plan(6);

    const mockRequest = {
      payload: { _rev: true },
      path: null,
      auth: { credentials: { username: mockUsername } },
    };

    const mockThis = {
      utils: {
        getConsortium: getMockFn((baseUrl, req) => {
          t.equals(req, mockRequest, 'pass doc to getConsortium');
          return Promise.resolve(req.payload);
        }),
      },
      consortiumHasMember: getMockFn(function mockFn(username) {
        t.equals(username, mockUsername, 'pass username to isOwnedBy');
        t.equals(this, mockRequest.payload, 'pass doc to isOwnedBy');
        return false;
      }),

      config: { consortiumMembersOnly: true },
    };

    factory({}, mockThis).validateConsortiumMembership(mockRequest)
            .then(() => {
              t.fail('Should reject with AuthorizationError');
            })
            .catch((result) => {
              t.equals(
                    mockThis.utils.getConsortium.callCount,
                    1,
                    'calls getConsortium during update request'
                );
              t.equals(
                    mockThis.consortiumHasMember.callCount,
                    1,
                    'calls consortiumHasMember'
                );
              t.ok(
                    result instanceof AuthorizationError,
                    'Should reject with AuthorizationError'
                );
            });
  });

  t.test('Skip validation', (t) => {
    t.plan(3);

    const mockRequest = {};

    const mockThis = {
      utils: {
        getConsortium: getMockFn(),
      },
      consortiumHasMember: getMockFn(),
      config: { consortiumMembersOnly: false },
    };

    factory({}, mockThis).validateConsortiumMembership(mockRequest)
            .then((result) => {
              t.equals(
                    mockThis.utils.getConsortium.callCount,
                    0,
                    'does not call getConsortium'
                );
              t.equals(
                    mockThis.consortiumHasMember.callCount,
                    0,
                    'does not call isOwnedBy'
                );
              t.equals(result, true, 'Resolves to true');
            })
            .catch(() => {
              t.fail('Should allow request');
            });
  });
  t.end();
});

tape('Bouncer: reject', (t) => {
  t.plan(3);
  const mockRequest = {
    url: {
      pathname: '/up/consortia/consortium-id',
    },
    method: 'GET',
  };
  const mockGetUnauthorizedUrl = getMockFn((request, msg) => {
    t.deepEquals(
            request,
            mockRequest,
            'passes request to getUnauthorizedUrl'
        );
    t.equals(
            msg,
            'Not authorized to make GET requests',
            'passes msg to getUnauthorizedUrl'
        );
    return 'foo';
  });
  const mockCallback = (err, url) => {
    t.equals(
            url,
            'foo',
            'Calls callback with url from getUnauthorizedUrl'
        );
  };

  factory({}, { utils: { getUnauthorizedUrl: mockGetUnauthorizedUrl } })
        .reject(mockRequest, mockCallback);
});

tape('Bouncer: handleAuthRejection', (t) => {
  t.plan(4);
  const mockRequest = {
    url: {
      pathname: '/up/consortia/consortium-id',
    },
    method: 'GET',
  };
  const mockGetUnauthorizedUrl = getMockFn((request, msg) => {
    t.deepEquals(
            request,
            mockRequest,
            'passes request to getUnauthorizedUrl'
        );
    t.equals(
            msg,
            'test msg',
            'passes msg to getUnauthorizedUrl'
        );
    return 'foo';
  });

  const mockAuthCallback = (err, url) => {
    t.equals(
            url,
            'foo',
            'Calls callback with url from getUnauthorizedUrl'
        );
  };

  const mockErrCallback = () => {
    t.fail('should not call callback on a non-auth error');
  };

  const mockAuthError = new AuthorizationError('test msg');
  const mockError = new Error('unexpected server error');

  const handleUnexpectedError = () => {
    factory({}, { utils: { getUnauthorizedUrl: mockGetUnauthorizedUrl } })
            .handleAuthRejection(mockRequest, mockErrCallback, mockError);
  };

  factory({}, { utils: { getUnauthorizedUrl: mockGetUnauthorizedUrl } })
        .handleAuthRejection(mockRequest, mockAuthCallback, mockAuthError);

  t.throws(
        handleUnexpectedError,
        mockError.msg,
        'throws non-auth errors up stack'
    );
});

tape('Bouncer: unauthorizedRoute', (t) => {
  t.plan(8);
  t.ok(Bouncer.unauthorizedRoute instanceof Object, 'has unauthorizedRoute');
  t.equals(typeof Bouncer.unauthorizedRoute.path, 'string', 'has path');
  t.equals(Bouncer.unauthorizedRoute.method, '*', 'covers all REST verbs');
  t.ok(Bouncer.unauthorizedRoute.handler instanceof Function, 'has handler');
  t.equals(Bouncer.unauthorizedRoute.config.auth, false, 'no auth required');

  const mockRequest = {
    query: { msg: 'test message' },
  };

  const mockReply = (response) => {
    t.ok(response.isBoom, 'responds wth Boom error');
    t.equals(response.output.statusCode, 401, 'has 401 status code');
    t.equals(response.message, mockRequest.query.msg, 'Includes message');
  };

  Bouncer.unauthorizedRoute.handler(mockRequest, mockReply);
});
