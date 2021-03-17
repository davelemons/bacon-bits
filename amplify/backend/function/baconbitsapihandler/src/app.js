/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/



const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
var bodyParser = require('body-parser')
var express = require('express')

AWS.config.update({ region: process.env.TABLE_REGION });

const dynamodb = new AWS.DynamoDB.DocumentClient();
const csd = new AWS.CloudSearchDomain({endpoint: `search-${process.env.CLOUD_SEARCH_DOMAIN}`});
const csdd = new AWS.CloudSearchDomain({endpoint: `doc-${process.env.CLOUD_SEARCH_DOMAIN}`});


let tableName = "baconbitsdynamodb";
if(process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + '-' + process.env.ENV;
}

const userIdPresent = false; // TODO: update in case is required to use that definition
const partitionKeyName = "id";
const partitionKeyType = "S";
const sortKeyName = "service";
const sortKeyType = "S";
const queryName = "query";
const queryType = "S";
const hasSortKey = sortKeyName !== "";
const path = "/bits";
const searchPath = "/search";
const UNAUTH = 'UNAUTH';
const hashKeyPath = '/:' + partitionKeyName;
const sortKeyPath = hasSortKey ? '/:' + sortKeyName : '';
const queryPath = '/:' + queryName;

// declare a new express app
var app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
});

// convert url string param to expected Type
const convertUrlType = (param, type) => {
  switch(type) {
    case "N":
      return Number.parseInt(param);
    default:
      return decodeURI(param);
  }
}

const getBits = async () => {
  let result, ExclusiveStartKey;
  let accumulated = [];

  do {
    result = await dynamodb.scan({
            TableName: tableName
        }).promise();

    ExclusiveStartKey = result.LastEvaluatedKey;
    accumulated = [...accumulated, ...result.Items];
  } while (result.LastEvaluatedKey);

  return {Items: accumulated};
};

/********************************
 * HTTP Get method for get all *
 ********************************/

app.get(path, function(req, res) {
  //TODO: this likely needs some work as eventually we will return too much.

  getBits().then(function(bits) {
    res.json(bits.Items);
  }).catch(function(e) {
    res.statusCode = 500;
    res.json({error: 'Could not load items: ' + e});
  });

});


/********************************
 * HTTP Get method for search   *
 ********************************/

app.get(path + searchPath + queryPath, function(req, res) {
  var query;

  try {
      query = convertUrlType(req.params[queryName], queryType);
      console.log('Query: ',query);

      var params = {
        query: query /* required */
      };
      
      csd.search(params, function (err, data) {
          if (err) { 
            console.log(err, err.stack); // an error occurred
            res.statusCode = 500;
            res.json({error: 'Error returned from CloudSearch' + err});
          } else {
            console.log(data);           // successful response
            res.json(data);
          }
        });
    } catch(err) {
      res.statusCode = 500;
      res.json({error: 'Unhandled error from CloudSearch ' + err});
    }

});

/********************************
 * HTTP Get method for list objects *
 ********************************/

app.get(path + hashKeyPath, function(req, res) {
  var condition = {}
  condition[partitionKeyName] = {
    ComparisonOperator: 'EQ'
  }

  if (userIdPresent && req.apiGateway) {
    condition[partitionKeyName]['AttributeValueList'] = [req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH ];
  } else {
    try {
      condition[partitionKeyName]['AttributeValueList'] = [ convertUrlType(req.params[partitionKeyName], partitionKeyType) ];
    } catch(err) {
      res.statusCode = 500;
      res.json({error: 'Wrong column type ' + err});
    }
  }

  let queryParams = {
    TableName: tableName,
    KeyConditions: condition
  }

  dynamodb.query(queryParams, (err, data) => {
    if (err) {
      res.statusCode = 500;
      res.json({error: 'Could not load items: ' + err});
    } else {
      res.json(data.Items);
    }
  });
});

/*****************************************
 * HTTP Get method for get single object *
 *****************************************/

app.get(path + '/object' + hashKeyPath + sortKeyPath, function(req, res) {
  var params = {};
  if (userIdPresent && req.apiGateway) {
    params[partitionKeyName] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  } else {
    params[partitionKeyName] = req.params[partitionKeyName];
    try {
      params[partitionKeyName] = convertUrlType(req.params[partitionKeyName], partitionKeyType);
    } catch(err) {
      res.statusCode = 500;
      res.json({error: 'Wrong column type ' + err});
    }
  }
  if (hasSortKey) {
    try {
      params[sortKeyName] = convertUrlType(req.params[sortKeyName], sortKeyType);
    } catch(err) {
      res.statusCode = 500;
      res.json({error: 'Wrong column type ' + err});
    }
  }

  let getItemParams = {
    TableName: tableName,
    Key: params
  }

  console.log(getItemParams);

  dynamodb.get(getItemParams,(err, data) => {
    if(err) {
      res.statusCode = 500;
      res.json({error: 'Could not load items: ' + err.message});
    } else {
      if (data.Item) {
        res.json(data.Item);
      } else {
        res.json(data) ;
      }
    }
  });
});


/************************************
* HTTP put method for insert object *
*************************************/

app.put(path, function(req, res) {

  if (userIdPresent) {
    req.body['userId'] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  }

  //must be new item so set GUID
  if (!req.body.id) req.body.id = uuidv4();

  let putItemParams = {
    TableName: tableName,
    Item: req.body
  }
  dynamodb.put(putItemParams, (err, data) => {
    if(err) {
      res.statusCode = 500;
      res.json({error: err, url: req.url, body: req.body});
    } else{
      

      //Update CloudSearch
      req.body.createdby = req.body.createdBy;
      req.body.modifiedby = req.body.modifiedBy;
      delete req.body.createdBy;
      delete req.body.modifiedBy;

      var documentsBatch = []
      var document = {}; 
      document.id = `${req.body.id}_${req.body.service}`; 
      document.type = 'add'; 
      document.fields = req.body; 
      documentsBatch.push(document); 
      var params = { contentType: 'application/json', documents:JSON.stringify(documentsBatch) }; 
    
      console.log(params);

      csdd.uploadDocuments(params, function(err, data) { 
    
       if(err) {
          console.log(err.stack);
          res.statusCode = 500;
          res.json({error: err, url: req.url});
       }else{
          console.log('document uploaded successfully',data);
          res.json({success: 'put call succeed!', url: req.url, data: data})
          // //Send SNS notification
          // if(process.env.SNS_ARN){
          //   // Create publish parameters
          //   var params = {
          //     Message: `A Bacon Bit was created/updated in ${process.env.ENV}!\n\n${JSON.stringify(req.body,null,2)}`, /* required */
          //     TopicArn: process.env.SNS_ARN
          //   };

          //   // Create promise and SNS service object
          //   var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();

          //   // Handle promise's fulfilled/rejected states
          //   publishTextPromise.then(
          //     function(data) {
          //       console.log(`Message ${params.Message} sent to the topic ${params.TopicArn}`);
          //       console.log("MessageID is " + data.MessageId);
          //     }).catch(
          //       function(err) {
          //       console.error(err, err.stack);
          //     });
          // }
       }
      }); 
    }
  });
});

/************************************
* HTTP post method for insert object *
*************************************/

app.post(path, function(req, res) {

  if (userIdPresent) {
    req.body['userId'] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  }

  //must be new item so set GUID
  if (!req.body.id) req.body.id = uuidv4();

  let putItemParams = {
    TableName: tableName,
    Item: req.body
  }
  dynamodb.put(putItemParams, (err, data) => {
    if(err) {
      res.statusCode = 500;
      res.json({error: err, url: req.url, body: req.body});
    } else{
      res.json({success: 'post call succeed!', url: req.url, data: data})

      //Send SNS notification
      if(process.env.SNS_ARN){
        // Create publish parameters
        var params = {
          Message: `A Bacon Bit was created/updated in ${process.env.ENV}!\n\n${JSON.stringify(req.body,null,2)}`, /* required */
          TopicArn: process.env.SNS_ARN
        };

        // Create promise and SNS service object
        var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();

        // Handle promise's fulfilled/rejected states
        publishTextPromise.then(
          function(data) {
            console.log(`Message ${params.Message} sent to the topic ${params.TopicArn}`);
            console.log("MessageID is " + data.MessageId);
          }).catch(
            function(err) {
            console.error(err, err.stack);
          });
      }
    }
  });
});

/**************************************
* HTTP remove method to delete object *
***************************************/

app.delete(path + '/object' + hashKeyPath + sortKeyPath, function(req, res) {
  var params = {};
  if (userIdPresent && req.apiGateway) {
    params[partitionKeyName] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  } else {
    params[partitionKeyName] = req.params[partitionKeyName];
     try {
      params[partitionKeyName] = convertUrlType(req.params[partitionKeyName], partitionKeyType);
    } catch(err) {
      res.statusCode = 500;
      res.json({error: 'Wrong column type ' + err});
    }
  }
  if (hasSortKey) {
    try {
      params[sortKeyName] = convertUrlType(req.params[sortKeyName], sortKeyType);
    } catch(err) {
      res.statusCode = 500;
      res.json({error: 'Wrong column type ' + err});
    }
  }

  csID = `${params[partitionKeyName]}_${params[sortKeyName]}`;
  console.log(csID);

  let removeItemParams = {
    TableName: tableName,
    Key: params
  }
  dynamodb.delete(removeItemParams, (err, data)=> {
    if(err) {
      res.statusCode = 500;
      res.json({error: err, url: req.url});
    } else {

      var documentsBatch = []
      var document = {}; 
      document.id = csID; 
      document.type = 'delete'; 
      documentsBatch.push(document); 
      var csParams = { contentType: 'application/json', documents:JSON.stringify(documentsBatch) }; 

      console.log(csParams);
    
      csdd.uploadDocuments(csParams, function(err, data) { 
    
       if(err) {
        console.log(err.stack);
        res.statusCode = 500;
        res.json({error: err, url: req.url});
       }else{
        console.log('document deleted successfully',data);
        res.json({url: req.url, data: data});
       }
      }); 
      
    }
  });
});
app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
