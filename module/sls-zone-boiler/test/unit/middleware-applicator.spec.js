'use strict';

const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
const expect = chai.expect;
//
// const MiddlewareApplicator = require('../../lib/middleware-applicator');
// const ErrorHandler = require('../../lib/error-handler');
// const ResponseFactory = require('../../lib/response/response-factory');
// const RequestMiddleware = require('../../lib/middleware/request-middleware');
// const ResponseMiddleware = require('../../lib/middleware/response-middleware');
// const FinallyMiddleware = require('../../lib/middleware/finally-middleware');
//
// describe('MiddlewareApplicator', function() {
//
//   const fakeEvent = { fake: 'event', httpMethod: 'GET' };
//   const fakeContext = { fake: 'context' };
//   let mockCallback = null;
//   let mockErrorHandler = null;
//   let mockHandler = null;
//   let applicator = null;
//
//   function expectErrorHandlerToBeInvokedWith(error, done) {
//     expect(mockErrorHandler.handle).to.have.been.calledWith(error, fakeEvent, fakeContext);
//     expect(mockErrorHandler.handle.firstCall.args.length).to.equal(4);
//     expect(typeof mockErrorHandler.handle.firstCall.args[3]).to.equal('function');
//     expect(mockCallback).not.to.have.been.called;
//     mockErrorHandler.handle.firstCall.args[3]();
//     setTimeout(() => {
//       expect(mockCallback).to.have.been.called;
//       done();
//     })
//   }
//
//   function expectHandlerToHaveBeenCalledAndRespond(handlerResponse) {
//     expectHandlerToHaveBeenCalled();
//     mockHandler.firstCall.args[2](handlerResponse);
//   }
//
//   function expectHandlerToHaveBeenCalled() {
//     expect(mockHandler).to.have.been.calledWith(fakeEvent, fakeContext);
//     expect(mockHandler.firstCall.args.length).to.equal(3);
//     expect(typeof mockHandler.firstCall.args[2]).to.equal('function');
//   }
//
//   beforeEach(() => {
//     mockCallback = sinon.spy();
//     mockErrorHandler = new ErrorHandler();
//     mockErrorHandler.handle = sinon.spy();
//     mockHandler = sinon.spy();
//     applicator = new MiddlewareApplicator(mockErrorHandler, new ResponseFactory());
//   });
//
//   describe('handler with no middleware', function () {
//     it('should call the handler', done => {
//       const wrappedHandler = applicator.apply(mockHandler, [],[],[]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expectHandlerToHaveBeenCalledAndRespond();
//         setTimeout(() => {
//           expect(mockCallback).to.have.been.called;
//           done();
//         });
//       });
//     });
//
//     it('if the handler throws the error handler should be invoked', done => {
//       const error = new Error('bang');
//       const handler = () => { throw error; };
//       const wrappedHandler = applicator.apply(handler, [],[],[]);
//
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expectErrorHandlerToBeInvokedWith(error, done);
//       });
//     });
//
//     describe('returning a promise', () => {
//       it('should callback when the promise completes', done => {
//         let resolvePromise = null;
//         const handler = () => new Promise((resolve, reject) => resolvePromise = resolve);
//         const wrappedHandler = applicator.apply(handler, [],[],[]);
//
//         wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//         setTimeout(() => {
//           expect(mockCallback).not.to.have.been.called;
//           resolvePromise();
//           setTimeout(() => {
//             expect(mockCallback).to.have.been.called;
//             done();
//           });
//         });
//       });
//
//       it('should invoke the error handler when the promise rejects', done => {
//         const error = new Error('Bang');
//         let rejectPromise = null;
//         const handler = () => new Promise((resolve, reject) => rejectPromise = reject);
//         const wrappedHandler = applicator.apply(handler, [],[],[]);
//
//         wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//         setTimeout(() => {
//           expect(mockErrorHandler.handle).not.to.have.been.called;
//           rejectPromise(error);
//           setTimeout(() => {
//             expectErrorHandlerToBeInvokedWith(error, done);
//           });
//         });
//       });
//
//       it('if error handler calls the callback the serverless callback should be invoked', done => {
//         mockErrorHandler.handle = (error, event, context, callback) => callback();
//         const error = new Error('Bang');
//         let rejectPromise = null;
//         const handler = () => new Promise((resolve, reject) => rejectPromise = reject);
//         const wrappedHandler = applicator.apply(handler, [],[],[]);
//
//         wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//         setTimeout(() => {
//           rejectPromise(error);
//           setTimeout(() => {
//             expect(mockCallback).to.have.been.called;
//             done();
//           });
//         });
//       });
//     });
//   });
//
//   describe('handler with request middleware', function () {
//
//     let requestMiddleware = null;
//
//     beforeEach(() => {
//       requestMiddleware = new RequestMiddleware();
//     });
//
//     it('should call request middleware before the handler', done => {
//       let resolvePromise1 = null;
//       requestMiddleware.process = () => new Promise((resolve, reject) => resolvePromise1 = resolve);
//
//       const requestMiddleware2 = new RequestMiddleware();
//       let resolvePromise2 = null;
//       requestMiddleware2.process = () => new Promise((resolve, reject) => resolvePromise2 = resolve);
//
//       const wrappedHandler = applicator.apply(mockHandler, [requestMiddleware, requestMiddleware2],[],[]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expect(mockHandler).not.to.have.been.called;
//         resolvePromise1(true);
//         setTimeout(() => {
//           expect(mockHandler).not.to.have.been.called;
//           resolvePromise2(true);
//           setTimeout(() => {
//             expect(mockHandler).to.have.been.called;
//             done();
//           });
//         });
//       });
//     });
//
//     it('should call handler if middleware returns a true boolean', done => {
//       requestMiddleware.process = () => true;
//
//       const wrappedHandler = applicator.apply(mockHandler, [requestMiddleware],[],[]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expect(mockHandler).to.have.been.called;
//         done();
//       });
//     });
//
//     it('should not call the handler if the middleware promise returns false', done => {
//       requestMiddleware.process = () => Promise.resolve(false);
//
//       const wrappedHandler = applicator.apply(mockHandler, [requestMiddleware],[],[]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expect(mockHandler).not.to.have.been.called;
//         expect(mockErrorHandler.handle).not.to.have.been.called;
//         done();
//       });
//     });
//
//     it('should not call the handler if the middleware returns false', done => {
//       requestMiddleware.process = () => false;
//
//       const wrappedHandler = applicator.apply(mockHandler, [requestMiddleware],[],[]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expect(mockHandler).not.to.have.been.called;
//         expect(mockErrorHandler.handle).not.to.have.been.called;
//         done();
//       });
//     });
//
//     it('should call the error handler if the middleware returns a promise that rejects', done => {
//       const error = new Error('Bang');
//       let rejectPromise = null;
//       requestMiddleware.process = () => new Promise((resolve, reject) => rejectPromise = reject);
//
//       const wrappedHandler = applicator.apply(mockHandler, [requestMiddleware],[],[]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expect(mockHandler).not.to.have.been.called;
//         rejectPromise(error);
//         setTimeout(() => {
//           expect(mockHandler).not.to.have.been.called;
//           expectErrorHandlerToBeInvokedWith(error, done);
//         });
//       });
//     });
//
//     it('should call the error handler if the middleware throws', done => {
//       const error = new Error('Bang');
//       requestMiddleware.process = () => { throw error; };
//
//       const wrappedHandler = applicator.apply(mockHandler, [requestMiddleware],[],[]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expect(mockHandler).not.to.have.been.called;
//         expectErrorHandlerToBeInvokedWith(error, done);
//       });
//     });
//   });
//
//   describe('handler with response middleware', function () {
//
//     let responseMiddleware = null;
//
//     beforeEach(() => {
//       responseMiddleware = new ResponseMiddleware();
//       mockHandler = sinon.spy(() => {
//         return Promise.resolve();
//       });
//     });
//
//     it('should call response middleware after the handler', done => {
//       let resolvePromise1 = null;
//       responseMiddleware.process = () => new Promise((resolve, reject) => resolvePromise1 = resolve);
//
//       const responseMiddleware2 = new ResponseMiddleware();
//       let resolvePromise2 = null;
//       responseMiddleware2.process = () => new Promise((resolve, reject) => resolvePromise2 = resolve);
//
//       const wrappedHandler = applicator.apply(mockHandler, [],[responseMiddleware, responseMiddleware2],[]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expectHandlerToHaveBeenCalled();
//         expect(mockCallback).not.to.have.been.called;
//         resolvePromise1(true);
//         setTimeout(() => {
//           expect(mockCallback).not.to.have.been.called;
//           resolvePromise2(true);
//           setTimeout(() => {
//             expect(mockCallback).to.have.been.called;
//             done();
//           });
//         });
//       });
//     });
//
//     it('should call callback if middleware returns a true boolean', done => {
//       responseMiddleware.process = () => true;
//
//       const wrappedHandler = applicator.apply(mockHandler, [],[responseMiddleware],[]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expectHandlerToHaveBeenCalled();
//         setTimeout(() => {
//           expect(mockCallback).to.have.been.called;
//           done();
//         });
//       });
//     });
//
//     it('should not call response middleware if handler rejects', done => {
//       const error = new Error('Bang');
//       responseMiddleware.process = sinon.spy(() => Promise.resolve());
//
//       let rejectPromise = null;
//       const handler = () => new Promise((resolve, reject) => rejectPromise = reject);
//       const wrappedHandler = applicator.apply(handler, [],[responseMiddleware],[]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expect(mockCallback).not.to.have.been.called;
//         rejectPromise(error);
//         setTimeout(() => {
//           expect(responseMiddleware.process).not.to.have.been.called;
//           expectErrorHandlerToBeInvokedWith(error, done);
//         });
//       });
//     });
//
//     it('should not call response middleware if handler throws', done => {
//       const error = new Error('Bang');
//       responseMiddleware.process = sinon.spy(() => Promise.resolve());
//
//       const handler = () => { throw error; };
//       const wrappedHandler = applicator.apply(handler, [],[responseMiddleware],[]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expect(mockCallback).not.to.have.been.called;
//         expect(responseMiddleware.process).not.to.have.been.called;
//         expectErrorHandlerToBeInvokedWith(error, done);
//       });
//     });
//
//     it('should not call response middleware if request middleware rejects', done => {
//       const error = new Error('Bang');
//       responseMiddleware.process = sinon.spy(() => Promise.resolve());
//
//       const requestMiddleware = new RequestMiddleware();
//       let rejectPromise = null;
//       requestMiddleware.process = () => new Promise((resolve, reject) => rejectPromise = reject);
//
//       const wrappedHandler = applicator.apply(mockHandler, [requestMiddleware],[responseMiddleware],[]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expect(mockCallback).not.to.have.been.called;
//         rejectPromise(error);
//         setTimeout(() => {
//           expect(responseMiddleware.process).not.to.have.been.called;
//           expectErrorHandlerToBeInvokedWith(error, done);
//         });
//       });
//     });
//
//     it('should not call response middleware if request middleware throws', done => {
//       const error = new Error('Bang');
//       responseMiddleware.process = sinon.spy(() => Promise.resolve());
//
//       const requestMiddleware = new RequestMiddleware();
//       requestMiddleware.process = () => { throw error; };
//
//       const wrappedHandler = applicator.apply(mockHandler, [requestMiddleware],[responseMiddleware],[]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expect(mockCallback).not.to.have.been.called;
//         expect(responseMiddleware.process).not.to.have.been.called;
//         expectErrorHandlerToBeInvokedWith(error, done);
//       });
//     });
//
//     it('should not call the callback if the middleware promise returns false', done => {
//       responseMiddleware.process = () => Promise.resolve(false);
//
//       const wrappedHandler = applicator.apply(mockHandler, [],[responseMiddleware],[]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expectHandlerToHaveBeenCalled();
//         setTimeout(() => {
//           expect(mockCallback).not.to.have.been.called;
//           expect(mockErrorHandler.handle).not.to.have.been.called;
//           done();
//         });
//       });
//     });
//
//     it('should not call the callback if the middleware returns false', done => {
//       responseMiddleware.process = () => false;
//
//       const wrappedHandler = applicator.apply(mockHandler, [],[responseMiddleware],[]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expectHandlerToHaveBeenCalled();
//         setTimeout(() => {
//           expect(mockCallback).not.to.have.been.called;
//           expect(mockErrorHandler.handle).not.to.have.been.called;
//           done();
//         });
//       });
//     });
//
//     it('should call the error handler if the middleware returns a promise that rejects', done => {
//       const error = new Error('Bang');
//       let rejectPromise = null;
//       responseMiddleware.process = () => new Promise((resolve, reject) => rejectPromise = reject);
//
//       const wrappedHandler = applicator.apply(mockHandler, [],[responseMiddleware],[]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expectHandlerToHaveBeenCalled();
//         setTimeout(() => {
//           expect(mockCallback).not.to.have.been.called;
//           rejectPromise(error);
//           setTimeout(() => {
//             expect(mockCallback).not.to.have.been.called;
//             expectErrorHandlerToBeInvokedWith(error, done);
//           });
//         });
//       });
//     });
//
//     it('should call the error handler if the middleware throws', done => {
//       const error = new Error('Bang');
//       responseMiddleware.process = () => {
//         throw error;
//       };
//
//       const wrappedHandler = applicator.apply(mockHandler, [],[responseMiddleware],[]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expectHandlerToHaveBeenCalled();
//         setTimeout(() => {
//           expect(mockCallback).not.to.have.been.called;
//           expectErrorHandlerToBeInvokedWith(error, done);
//         });
//       });
//     });
//   });
//
//   describe('handler with finally middleware', function () {
//
//     let finallyMiddleware = null;
//
//     beforeEach(() => {
//       finallyMiddleware = new FinallyMiddleware();
//       mockHandler = sinon.spy(() => {
//         return Promise.resolve();
//       });
//     });
//
//     it('should call finally middleware after the handler', done => {
//       let resolvePromise1 = null;
//       finallyMiddleware.process = () => new Promise((resolve, reject) => resolvePromise1 = resolve);
//
//       const finallyMiddleware2 = new FinallyMiddleware();
//       let resolvePromise2 = null;
//       finallyMiddleware2.process = () => new Promise((resolve, reject) => resolvePromise2 = resolve);
//
//       const wrappedHandler = applicator.apply(mockHandler, [],[],[finallyMiddleware, finallyMiddleware2]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expectHandlerToHaveBeenCalled();
//         expect(mockCallback).not.to.have.been.called;
//         resolvePromise1(true);
//         setTimeout(() => {
//           expect(mockCallback).not.to.have.been.called;
//           resolvePromise2(true);
//           setTimeout(() => {
//             expect(mockCallback).to.have.been.called;
//             done();
//           });
//         });
//       });
//     });
//
//     it('should call callback if middleware returns a true boolean', done => {
//       finallyMiddleware.process = () => true;
//
//       const wrappedHandler = applicator.apply(mockHandler, [],[],[finallyMiddleware]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expectHandlerToHaveBeenCalled();
//         setTimeout(() => {
//           expect(mockCallback).to.have.been.called;
//           done();
//         });
//       });
//     });
//
//     it('should still call the callback if the middleware promise returns false', done => {
//       finallyMiddleware.process = () => Promise.resolve(false);
//
//       const wrappedHandler = applicator.apply(mockHandler, [],[],[finallyMiddleware]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expectHandlerToHaveBeenCalled();
//         setTimeout(() => {
//           expect(mockCallback).to.have.been.called;
//           expect(mockErrorHandler.handle).not.to.have.been.called;
//           done();
//         });
//       });
//     });
//
//     it('should still call the callback if the middleware returns false', done => {
//       finallyMiddleware.process = () => false;
//
//       const wrappedHandler = applicator.apply(mockHandler, [],[],[finallyMiddleware]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expectHandlerToHaveBeenCalled();
//         setTimeout(() => {
//           expect(mockCallback).to.have.been.called;
//           expect(mockErrorHandler.handle).not.to.have.been.called;
//           done();
//         });
//       });
//     });
//
//     it('should still call middleware if handler rejects', done => {
//       const error = new Error('Bang');
//       finallyMiddleware.process = sinon.spy(() => Promise.resolve());
//
//       let rejectPromise = null;
//       const handler = () => new Promise((resolve, reject) => rejectPromise = reject);
//       const wrappedHandler = applicator.apply(handler, [],[],[finallyMiddleware]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expect(mockCallback).not.to.have.been.called;
//         rejectPromise(error);
//         setTimeout(() => {
//           expectErrorHandlerToBeInvokedWith(error, () => {
//             expect(finallyMiddleware.process).to.have.been.called;
//             done();
//           });
//         });
//       });
//     });
//
//     it('should still middleware if handler throws', done => {
//       const error = new Error('Bang');
//       finallyMiddleware.process = sinon.spy(() => Promise.resolve());
//
//       const handler = () => { throw error; };
//       const wrappedHandler = applicator.apply(handler, [],[],[finallyMiddleware]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expect(mockCallback).not.to.have.been.called;
//         expectErrorHandlerToBeInvokedWith(error, () => {
//           expect(finallyMiddleware.process).to.have.been.called;
//           done();
//         });
//       });
//     });
//
//     it('should still call middleware if request middleware rejects', done => {
//       const error = new Error('Bang');
//       finallyMiddleware.process = sinon.spy(() => Promise.resolve());
//
//       const requestMiddleware = new RequestMiddleware();
//       let rejectPromise = null;
//       requestMiddleware.process = () => new Promise((resolve, reject) => rejectPromise = reject);
//
//       const wrappedHandler = applicator.apply(mockHandler, [requestMiddleware],[],[finallyMiddleware]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expect(mockCallback).not.to.have.been.called;
//         rejectPromise(error);
//         setTimeout(() => {
//           expectErrorHandlerToBeInvokedWith(error, () => {
//             expect(finallyMiddleware.process).to.have.been.called;
//             done();
//           });
//         });
//       });
//     });
//
//     it('should still call middleware if request middleware throws', done => {
//       const error = new Error('Bang');
//       finallyMiddleware.process = sinon.spy(() => Promise.resolve());
//
//       const requestMiddleware = new RequestMiddleware();
//       requestMiddleware.process = () => { throw error; };
//
//       const wrappedHandler = applicator.apply(mockHandler, [requestMiddleware],[],[finallyMiddleware]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expect(mockCallback).not.to.have.been.called;
//         expectErrorHandlerToBeInvokedWith(error, () => {
//           expect(finallyMiddleware.process).to.have.been.called;
//           done();
//         });
//       });
//     });
//
//     it('should still call middleware if response middleware rejects', done => {
//       const error = new Error('Bang');
//       finallyMiddleware.process = sinon.spy(() => Promise.resolve());
//
//       const responseMiddleware = new ResponseMiddleware();
//       let rejectPromise = null;
//       responseMiddleware.process = () => new Promise((resolve, reject) => rejectPromise = reject);
//
//       const wrappedHandler = applicator.apply(mockHandler, [],[responseMiddleware],[finallyMiddleware]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expectHandlerToHaveBeenCalled();
//         setTimeout(() => {
//           expect(mockCallback).not.to.have.been.called;
//           rejectPromise(error);
//           setTimeout(() => {
//             expectErrorHandlerToBeInvokedWith(error, () => {
//               expect(finallyMiddleware.process).to.have.been.called;
//               done();
//             });
//           });
//         });
//       });
//     });
//
//     it('should still call middleware if response middleware throws', done => {
//       const error = new Error('Bang');
//       finallyMiddleware.process = sinon.spy(() => Promise.resolve());
//
//       const responseMiddleware = new ResponseMiddleware();
//       responseMiddleware.process = () => { throw error; };
//
//       const wrappedHandler = applicator.apply(mockHandler, [],[responseMiddleware],[finallyMiddleware]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expectHandlerToHaveBeenCalled();
//         setTimeout(() => {
//           expect(mockCallback).not.to.have.been.called;
//           expectErrorHandlerToBeInvokedWith(error, () => {
//             expect(finallyMiddleware.process).to.have.been.called;
//             done();
//           });
//         });
//       });
//     });
//
//     it('should NOT call the error handler if the middleware returns a promise that rejects', done => {
//       const error = new Error('Bang');
//       let rejectPromise = null;
//       finallyMiddleware.process = () => new Promise((resolve, reject) => rejectPromise = reject);
//
//       const wrappedHandler = applicator.apply(mockHandler, [],[],[finallyMiddleware]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expectHandlerToHaveBeenCalled();
//         setTimeout(() => {
//           expect(mockCallback).not.to.have.been.called;
//           rejectPromise(error);
//           setTimeout(() => {
//             expect(mockCallback).to.have.been.called;
//             expect(mockErrorHandler.handle).not.to.have.been.called;
//             done();
//           });
//         });
//       });
//     });
//
//     it('should NOT call the error handler if the middleware throws', done => {
//       const error = new Error('Bang');
//       finallyMiddleware.process = () => {
//         throw error;
//       };
//
//       const wrappedHandler = applicator.apply(mockHandler, [],[],[finallyMiddleware]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expectHandlerToHaveBeenCalled();
//         setTimeout(() => {
//           expect(mockCallback).to.have.been.called;
//           expect(mockErrorHandler.handle).not.to.have.been.called;
//           done();
//         });
//       });
//     });
//
//     it('should proceed with next finally if the middleware returns a promise that rejects', done => {
//       const error = new Error('Bang');
//
//       let rejectPromise1 = null;
//       finallyMiddleware.process = () => new Promise((resolve, reject) => rejectPromise1 = reject);
//
//       const finallyMiddleware2 = new FinallyMiddleware();
//       let resolvePromise2 = null;
//       finallyMiddleware2.process = () => new Promise((resolve, reject) => resolvePromise2 = resolve);
//
//       const wrappedHandler = applicator.apply(mockHandler, [],[],[finallyMiddleware, finallyMiddleware2]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expectHandlerToHaveBeenCalled();
//         setTimeout(() => {
//           expect(mockCallback).not.to.have.been.called;
//           rejectPromise1(error);
//           setTimeout(() => {
//             expect(mockCallback).not.to.have.been.called;
//             expect(mockErrorHandler.handle).not.to.have.been.called;
//             resolvePromise2();
//             setTimeout(() => {
//               expect(mockCallback).to.have.been.called;
//               done();
//             });
//           });
//         });
//       });
//     });
//
//     it('should proceed with next finally if the middleware throws', done => {
//       const error = new Error('Bang');
//       finallyMiddleware.process = () => {
//         throw error;
//       };
//       const finallyMiddleware2 = new FinallyMiddleware();
//       let resolvePromise2 = null;
//       finallyMiddleware2.process = () => new Promise((resolve, reject) => resolvePromise2 = resolve);
//
//       const wrappedHandler = applicator.apply(mockHandler, [],[],[finallyMiddleware, finallyMiddleware2]);
//       wrappedHandler(fakeEvent, fakeContext, mockCallback);
//
//       setTimeout(() => {
//         expectHandlerToHaveBeenCalled();
//         setTimeout(() => {
//           expect(mockCallback).not.to.have.been.called;
//           expect(mockErrorHandler.handle).not.to.have.been.called;
//           resolvePromise2();
//           setTimeout(() => {
//             expect(mockCallback).to.have.been.called;
//             done();
//           });
//         });
//       });
//     });
//   });
// });