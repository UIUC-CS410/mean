var data = require('./result.js');
var mongoose = require('mongoose');
var fs = require('fs');

var APAModel = mongoose.model('APA'),
    APTPAModel = mongoose.model('APTPA'),
    APVPAModel = mongoose.model('APVPA'),
    AuthorModel = mongoose.model('Author'),
    AuthorIndexModel = mongoose.model('AuthorIndex'),
    PaperModel = mongoose.model('Paper'),
    PaperIndexModel = mongoose.model('PaperIndex'),
    TermModel = mongoose.model('Term'),
    TermIndexModel = mongoose.model('TermIndex'),
    VenueModel = mongoose.model('Venue'),
    VenueIndexModel = mongoose.model('VenueIndex');

var readline = require('readline'),
    stream = require('stream');
var async = require('async');

var cleanup=function(cb){
  async.parallel([
        function(callback){
          AuthorModel.remove({}, function(err) {
            callback(err);
          });
        },
        function(callback){
          AuthorIndexModel.remove({}, function(err) {
            callback(err);
          });
        },
        function(callback){
          PaperModel.remove({}, function(err) {
            callback(err);
          });
        },
        function(callback){
          PaperIndexModel.remove({}, function(err) {
            callback(err);
          });
        },
        function(callback){
          TermModel.remove({}, function(err) {
            callback(err);
          });
        },
        function(callback){
          TermIndexModel.remove({}, function(err) {
            callback(err);
          });
        },
        function(callback){
          VenueModel.remove({}, function(err) {
            callback(err);
          });
        },
        function(callback){
          VenueIndexModel.remove({}, function(err) {
            callback(err);
          });
        }
      ],
      function(err, results){
        if(err){
          console.log('Finished cleaning up data with error: ' + err);
        } else {
          console.log('Finished cleaning up data with no error');
        }
        if(cb){
          cb(err)
        }
      });
}

var loadAllData=function(cb){
  async.parallel([
        function(callback){
          loadDefinitionData('authors.json',AuthorModel,function(){
            callback(null);
          });
        },
        function(callback){
          loadDefinitionData('papers.json',PaperModel,function(){
            callback(null);
          });
        },
        function(callback){
          loadDefinitionData('terms.json',TermModel,function(){
            callback(null);
          });
        },
        function(callback){
          loadDefinitionData('venues.json',VenueModel,function(){
            callback(null);
          });
        },
        function(callback){
          loadIndexData('authorIndex.json', AuthorIndexModel, function(){
            callback(null);
          });
        },
        function(callback){
          loadIndexData('paperIndex.json', PaperIndexModel, function(){
            callback(null);
          });
        },
        function(callback){
          loadIndexData('termIndex.json', TermIndexModel, function(){
            callback(null);
          });
        },
        function(callback){
          loadIndexData('venueIndex.json', VenueIndexModel, function(){
            callback(null);
          });
        }
      ],
      function(err, results){
        if(cb){
          cb(err)
        }
      });
}

var loadDefinitionData = function(fileName, model, cb) {
  fs.readFile('./packages/custom/graph/server/data/'+fileName, 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    var terms=JSON.parse(data);
    for (var prop in terms) {
      // skip loop if the property is from prototype
      if(!terms.hasOwnProperty(prop)) continue;
      var newItem = new model({
        name: terms[prop],
        id: parseInt(prop)
      });
      newItem.save(function(err, item) {
        if (err) {
          console.log("Error adding new data: " + err.message);
        }
      });
    }
    console.log("Finished loading " + fileName);
    cb();
  });
};

var loadIndexData = function(fileName, model, cb) {
  fs.readFile('./packages/custom/graph/server/data/'+fileName, 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    var array=JSON.parse(data);
    for(var i=1; i<=array.length; i++){
      var id=array[i-1];
      var newItem = new model({
        index: i,
        id: parseInt(id)
      });
      newItem.save(function(err, item) {
        if (err) {
          console.log("Error adding new data: " + err.message);
        }
      });
    }
    console.log("Finished loading " + fileName);
    cb();
  });
};
var loadMatrixData = function(fileName, model, cb) {
  async.waterfall([
    function(callback) {
      model.remove({}, function(err) {
        callback(err);
      });
    },
    function(callback) {
      var instream = fs.createReadStream('./packages/custom/graph/server/data/'+fileName),
          outstream = new stream(),
          rl = readline.createInterface(instream, outstream);

      rl.on('line', function (line) {
        var regex = /^([0-9]+)[\t\s]?([0-9]+)[\t\s]?([0-9]+)/g;
        var match = regex.exec(line);
        var row=match[1],
            col=match[2],
            value=match[3];
        var newItem = new model({
          row: row,
          column: col,
          value: value
        });
        newItem.save(function(err, item) {
          if (err) {
            console.log("Error adding new data: " + err.message);
          }
        });
      });

      rl.on('close', function (line) {
        callback(null);
        console.log("Finished loading " + fileName);
      });
    },
  ], function (err, result) {
    if(cb){
      cb(err)
    }
  });



}

module.exports = {
  loadData: function(cb) {
    async.waterfall([
      function(callback) {
        cleanup(function(err){
          callback(err);
        })
      },
      function(callback) {
        loadAllData(function(err){
          callback(err);
        })
      },
    ], function (err, result) {
      if(cb){
        cb(err)
      }
    });
  },
  loadAPA: function(cb) {
    loadMatrixData('apa.txt',APAModel,cb);
  },
  loadAPTPA: function(cb) {
    loadMatrixData('aptpa.txt',APTPAModel,cb);
  },
  loadAPVPA: function(cb) {
    loadMatrixData('apvpa.txt',APVPAModel,cb);
  },

  getResult: function(req, res) {
    res.status(200).json(data);
  },

};