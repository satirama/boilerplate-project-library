/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/books')
    .get(function (req, res){
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        db.collection('library').aggregate({
          $project: {
            title: 1,
            _id: 1,
            commentcount: {
              $size: "$comments"
            } 
          }
        }, function(err, result) {
          res.status(200)
            .send(result);
        });
      });
    })
    
    .post(function (req, res){
      var title = req.body.title;
      //response will contain new book object including atleast _id and title
      var query = {
        title: title,
        comments: []
      };
    
      if (title == '' || typeof title != 'string') {
        res.status(400).send('no title was sent');
      } else {
        MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
          db.collection('library').insert(query, function(err, result) {
            db.collection('library').findOne(
              {_id: new ObjectId(result.insertedIds[0])},
              {_id: 1, title: 1},
              (err, doc) => {
                res.status(200)
                  .send(doc);
              });
          });  
        });
      }
    })
    
    .delete(function(req, res){
      //if successful response will be 'complete delete successful'
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        db.collection('library').remove(
          {},
          (err, doc) => {
            if (err) res.status(500).type('text').send('could not delete books');
            res.status(200).type('text').send('complete delete successful');
        });
      });
    });



  app.route('/api/books/:id')
    .get(function (req, res){
      var bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      var query = {
        _id: new ObjectId(bookid)
      };
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        db.collection('library').find(query).toArray(function(err, result) {
          if (result.length < 1) res.status(400).send({message: 'no book exists'});
          else {
            res.status(200).send(result);
          }
        });  
      });
    })
    
    .post(function(req, res){
      var bookid = req.params.id;
      var comment = req.body.comment;
      //json res format same as .get
      var query = {
        _id: new ObjectId(bookid)
      };
      var update = {
        $push: {
          comments: comment
        }
      };
    
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        db.collection('library').findOneAndUpdate(
          query,
          update,
          {returnNewDocument: true},
          function(err, result) {
            if (err) res.status(500).type('text').send('could not update ' + bookid);
            res.status(200)
                .send(result.value);
        });
      });
      
    })
    
    .delete(function(req, res){
      var bookid = req.params.id;
      var query = {
        _id: new ObjectId(bookid)
      };
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        db.collection('library').removeOne(
          query,
          (err, doc) => {
            if (err) res.status(500).type('text').send('could not delete ' + bookid);
            res.status(200).type('text').send('deleted successful');
        });
      });
    });
  
};
