var request = require('request'),
    expect = require('chai').expect,
    Q = require('q'),
    _ = require('underscore');

TIMEOUT = 20000000;

var fetcher = (function(request, q) {
  // This module is a wrapper around the request library.
  // It permits method/promise chaining in the tests,
  // and converts server responses to JSON, raising errors
  // if the request takes too long or is in the wrong format.

  return {
    get:  function(action      ){ return fetch("get",   {url: action})             },
    del:  function(action      ){ return fetch("del",   {url: action})             },
    post: function(action, data){ return fetch("post",  {url: action, form: data}) },
    put:  function(action, data){ return fetch("put",   {url: action, form: data}) }
  };

  ////

  function fetch(method, options){
    var deferred = Q.defer();

    setTimeout(function(){
      // Intended to be more intelligible to students than mocha's stock error of
      //    "Error: timeout of 2000ms exceeded. /
      //     Ensure the done() callback is being called in this test."
      deferred.reject(new Error("No Response From Server"))
    }, TIMEOUT);

    request[method](options, function(error, response){
      if(error){
        return deferred.reject(new Error(error));
      }

      try {
        response.json = JSON.parse(response.body);
      } catch (err) {
        if ( response.body.match("Error") ) {
          // Naive check of whether we got an error message.
          var errMsg = response.body;
          var cleanMsg = errMsg.split("<br> &nbsp; &nbsp;").join("\n\r");
          deferred.reject(new Error(cleanMsg));
        } else {
          // DO NOTHING
        }
      }

      deferred.resolve(response);
    });


    return deferred.promise;
  }

}(request, Q))



var SubscriptionModel = function(){};

// Utility function to fetch all subscriptions from subscriptions#index
// and parse out all, last, and random, for use in tests
SubscriptionModel.prototype.loadAll = function (){
  var self = this;
  var deferred = Q.defer();

  fetcher
    .get(base_url + '/api/subscriptions')
    .then(function(response){
      var all_subscriptions = response.json.data;
      self.all = all_subscriptions
      self.last = _.last(all_subscriptions)
      self.random = _.sample(all_subscriptions)
      deferred.resolve(self);
    })
    .fail(
      deferred.reject
    )

  return deferred.promise;
}


function ensureJSON(response, done){
  if( typeof(response.json) !== "object" ){
    done(new Error("Response body is the " + typeof(response.body) + " \"" + response.body.toString() + "\" and not valid JSON"));
  } else {
    expect(response.json).to.be.an("object");
    done();
  }
}

/*
  BEGIN TEST SUITE
  note: in order to ensure that records are being persisted/deleted correctly
        on the server, each test uses a before action to hit the `index` route
        first, and then compares those initial records to the test output.
*/

var base_url = 'http://localhost:3000';

describe('Subscriptions API', function() {
  // this.timeout(TIMEOUT); // Overriden by timeout error raised in fetcher module
  
  describe('POST /api/subscriptions (create)', function(){

    var actual_response = {};
    var Subscription = new SubscriptionModel;
    var new_subscription = {
      name: 'Bugs Bunny',
      address: "Bug's House",
      shipping_zip: "33004",
      card: /*"4242424242424241",*/"4242424242424242",
      expiration: new Date(3000, 0),
      cvv: "123",
      billing_zip: "33004",
      product: "silver"
    };

    before(function(done){
      fetcher
        .post(base_url + '/api/subscriptions', new_subscription)
        .then(function(response) {
            actual_response.statusCode = response.statusCode;
            actual_response.json = response.json;
            done();
        })
        .fail(done);
    })


    it('should respond with status 204 - Success', function (done) {
      expect(actual_response.statusCode).to.equal(201);
      done();
    });

    it('should respond with JSON', function (done) {
      ensureJSON(actual_response, done);
    });

    it('should not create a new subscription if user already subscribed to the product', function (done) {

      // we're creating the same subscription again, but the _id should be different this time!
      fetcher
        .post(base_url + '/api/subscriptions', new_subscription)
        .then(
          function(response) {
            expect(response.statusCode).to.equal(409);
            expect(response.json.message).to.equal('You are already subscribed to silver. You will still recieve this product.');
            done();
          }
        )
        .fail(done)
    });

  });
});