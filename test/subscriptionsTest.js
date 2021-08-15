var request = require('request'),
    expect = require('chai').expect,
    Q = require('q'),
    _ = require('underscore');

TIMEOUT = 200;

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
  /*
  describe('GET /api/subscriptions (index)', function(){
    it('should respond with status 200', function (done) {
      fetcher
        .get(base_url + '/api/subscriptions')
        .then(function(response){
          expect(response.statusCode).to.equal(200);
          done();
        })
        .fail(done);
    });

    it('should respond with a javascript object translated into JSON format', function (done) {
      fetcher
        .get(base_url + '/api/subscriptions')
        .then(function(response) {
          ensureJSON(response, done);
        })
        .fail(done);
    });

    
    it('the JSON object should have one key-value pair. The key should be called "data". The value should be the hardcoded array of subscriptions', function (done) {

      fetcher
        .get(base_url + '/api/subscriptions')
        .then(function (response) {
          expect(response.json)
            .to.have.property("data")
            .and.be.an("array")
              .and.have.property(0)
              .and.have.all.keys(["task", "description", "_id"]);

          done();
        })
        .fail(done);
    });

    it('subscription objects should have properities: _id, description, task', function (done) {
      fetcher
        .get(base_url + '/api/subscriptions')
        .then(function (response) {
          var first_subscription = response.json.data[0]

          expect(first_subscription)
            .to.have.property("task")
            .and.to.be.a("string");

          expect(first_subscription)
            .to.have.property("description")
            .and.to.be.a("string");

          expect(first_subscription)
            .to.have.property("_id")
            .and.to.be.a("number");

          done();
        })
        .fail(done);
    });
  });


  describe('GET /api/subscriptions/:id (show)', function(){

    var actual_response = {};
    var Subscription = new SubscriptionModel;

    before(function(done){
      Subscription.loadAll()
        .then(function(){
          fetcher
            .get(base_url + '/api/subscriptions/' + Subscription.random._id)
            .then(function (response) {
                actual_response.statusCode = response.statusCode;
                actual_response.json = response.json;
                done();
              })
            .fail(done);
        })
        .fail(done);
    });

    it('should respond with status 200 - Success', function (done) {
      expect(actual_response.statusCode).to.equal(200);
      done();
    });

    it('should respond with JSON', function (done) {
      ensureJSON(actual_response, done);
    });

    it('should fetch one specific subscription by _id', function (done) {
      expect(actual_response.json)
        .to.have.property("task")
        .and.equal(Subscription.random.task);

      expect(actual_response.json)
        .to.have.property("description")
        .and.equal(Subscription.random.description);

      expect(actual_response.json)
        .to.have.property("_id")
        .and.equal(Subscription.random._id);

      done();
    });
  });
  */
  describe('POST /api/subscriptions (create)', function(){

    var actual_response = {};
    var Subscription = new SubscriptionModel;
    var new_subscription = {
      task: 'Create random task name #' + Math.random(),
      description: 'Pick a random number, e.g. ' + Math.random()
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


    it('should respond with status 200 - Success', function (done) {
      expect(actual_response.statusCode).to.equal(200);
      done();
    });

    it('should respond with JSON', function (done) {
      ensureJSON(actual_response, done);
    });

    it('should respond with the new subscription object', function (done) {
      expect(actual_response.json)
        .to.have.property("task")
        .and.equal(new_subscription.task);

      expect(actual_response.json)
        .to.have.property("description")
        .and.to.equal(new_subscription.description);

      done();
    });

    it('should assign an _id to the new subscription object', function (done) {
      expect(actual_response.json).to.have.property("_id");
      done();
    });

    it('should increment the _id number by one each time a subscription is created', function (done) {
      var previous_id = actual_response.json._id;
      expect(previous_id).to.be.a("number");

      // we're creating the same subscription again, but the _id should be different this time!
      fetcher
        .post(base_url + '/api/subscriptions', new_subscription)
        .then(
          function(response) {
            expect(response.json)
              .to.have.property("_id")
              .and.to.be.above(previous_id);
            done();
          }
        )
        .fail(done)
    });

  });
  /*
  describe('DELETE /api/subscriptions/:id (destroy)', function(){

    var actual_response = {}
    var Subscription = new SubscriptionModel;

    before(function(done){
      Subscription.loadAll()
        .then(function(){
          fetcher
            .del(base_url + '/api/subscriptions/' + Subscription.random._id)
            .then(function(response) {
              actual_response.statusCode = response.statusCode;
              actual_response.json = response.json;
              done();
            })
            .fail(done)
        })
        .fail(done)
    });

    it('should respond with 200 or 204 on success', function(done) {
      expect([200,204]).to.include(actual_response.statusCode);
      done();
    });

    it('should delete one specific subscription from the list of subscriptions', function (done) {
      fetcher
        .get(base_url + '/api/subscriptions')
        .then(function(response){
          var current_subscriptions = response.json.data;
          expect(current_subscriptions)
            .to.have.length(Subscription.all.length - 1)
            .and.not.deep.include(Subscription.random);

          done();
        })
      .fail(done)
    });
  });


  describe('PUT /api/subscriptions/:id (update)', function(){

    var actual_response = {};
    var Subscription = new SubscriptionModel;
    var updated_subscription = {
      task: 'Return order #' + Math.random(),
      description: 'Shipping label #' + Math.random()
    };

    before(function(done){
      Subscription.loadAll()
        .then(function(){
          fetcher
            .put(base_url + '/api/subscriptions/' + Subscription.random._id, updated_subscription)
            .then(function (response) {
              actual_response.statusCode = response.statusCode;
              actual_response.json = response.json;
              Subscription.original_subscription = Subscription.random;
              done();
            })
            .fail(done);

        })
        .fail(done);
    });

    it('should respond with status 200 - Success', function (done) {
      expect(actual_response.statusCode).to.equal(200);
      done();
    });

    it('should respond with JSON', function (done) {
      ensureJSON(actual_response, done);
    });

    it('should update the properities of one specific subscription', function (done) {
      expect(actual_response.json)
        .to.have.property("task")
        .and.to.equal(updated_subscription.task);

      expect(actual_response.json)
        .to.have.property("description")
        .and.equal(updated_subscription.description);

      expect(actual_response.json)
        .to.have.property("_id")
        .and.equal(Subscription.original_subscription._id);

      done();
    });
  });


  describe('GET /api/subscriptions/search (search)', function(){

    var actual_response = {};
    var Subscription = new SubscriptionModel;
    var search_word = _.sample(["surf", "sperlunk", "ski"])
    var updated_subscription = {
      task: search_word,
      description: 'dude... ' + Math.random()
    };

    before(function(done){
      Subscription.loadAll()
        .then(function(){
          fetcher
            .put(base_url + '/api/subscriptions/' + Subscription.random._id, updated_subscription)
            .then(function(response){
              Subscription.original_subscription = response.json;
              done();
            })
            .fail(done)
        })
        .fail(done)
    });

    it('should list all subscriptions that contain the search term from the query parameter (e.g. `?q=discover`) in the task field', function(done){
      fetcher
        .get(base_url + '/api/subscriptions/search?q=' + search_word)
        .then(function(response){
          expect(response.json)
            .to.have.property("data")
            .and.be.an("array")
            .and.deep.include(Subscription.original_subscription);
          done();
        })
        .fail(done);
    });

  });
  */
});