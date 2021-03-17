
const AWS = require('aws-sdk')
const dynamodb = new AWS.DynamoDB.DocumentClient();
let tableName = "baconbitsdynamodb-prod";
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
  
getBits().then(function(bits) {
    //console.log(bits.Items);

    bits.Items.forEach(bit => {
      //What do you want to change?
      if (!bit.createdBy) bit.createdBy = "davelem";
      if (!bit.modifiedBy) bit.modifiedBy = "davelem";
      if (bit.internal == true) bit.internal = "true"
      else bit.internal = "false"
      console.log(bit);

      let putItemParams = {
        TableName: tableName,
        Item: bit
      }
      dynamodb.put(putItemParams, (err, data) => {
        if(err) {
          console.log({error: err});
        } else{
          console.log({success: 'put call succeed!', data: data})
        }
      });
    });
}).catch(function(e) {
    console.log(e)
});
  