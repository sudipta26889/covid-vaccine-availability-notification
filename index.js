const GoogleHome = require('./googleHomePush');
const got = require('got');
const request = require('request');


let today = new Date();

// let dates_to_check = [
//     ("0" + (today.getDate() + 0 )).slice(-2)+"-"+("0" + (today.getMonth() + 1)).slice(-2)+"-"+today.getFullYear(),
//     ("0" + (today.getDate() + 1 )).slice(-2)+"-"+("0" + (today.getMonth() + 1)).slice(-2)+"-"+today.getFullYear(),
//     ("0" + (today.getDate() + 2 )).slice(-2)+"-"+("0" + (today.getMonth() + 1)).slice(-2)+"-"+today.getFullYear(),
// ];

let dates_to_check = ["28-08-2021", ]

let district_list = [
	{
		district_name: "Pune",
		district_id: 363,
		min_age_limit: 18,
		available_capacity: 1
	},
	// {
	// 	district_name: "Purba Medinipur",
	// 	district_id: 732,
	// 	min_age_limit: 18,
	// 	available_capacity: 1
	// }
];



(async () => {
  let available_centers = [];
  for (var j = 0; j < district_list.length; j++) {
    let each_district_data = district_list[j];
    for (var i = 0; i < dates_to_check.length; i++) {
      let each_date = dates_to_check[i];
      let url = 'https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id='+each_district_data['district_id']+'&date='+each_date;
      //console.log(url);
      try {
        const response = await got(url, { json: true });
        available_centers = make_available_center_data(response.body, available_centers, each_district_data);
        
      } catch (error) {
        console.log(error.response.body);
      }
    }
  }
  notify_me(available_centers);
})();


function make_available_center_data(response_json, available_centers, district_data) {
  response_json['centers'].forEach(function (each_center) {
    each_center['sessions'].forEach(function (each_session) {
      //console.log(each_session);
       if (parseInt(each_session['available_capacity_dose2']) >= district_data['available_capacity_dose2'] && parseInt(each_session['min_age_limit']) == district_data['min_age_limit']) {
         // console.log(each_center);
         available_centers.push({
            name: each_center['name'],
            address: each_center['address'],
            pincode: each_center['pincode'],
            block_name: each_center['block_name'],
            fee_type: each_center['fee_type'],
            available_capacity: each_session['available_capacity_dose2'],
            date: each_session['date'],
            vaccine: each_session['vaccine'],
            text: "Vaccine is available at Pincode "+each_center['pincode']+" on "+each_session['date']+"."
          })
       }
    });
  });
  return available_centers;
}

function notify_me(available_centers) {
  let text_to_speak = '';
  available_centers.forEach(function(each_center){
    text_to_speak += each_center.text+" and ";
    console.log(each_center.text);
  });
  var lastIndex = text_to_speak.lastIndexOf(" and ");
  text_to_speak = text_to_speak.substring(0, lastIndex);
  
  if (text_to_speak.length > 0){
  	console.log(text_to_speak);
    
    send_slack_notification(text_to_speak);
    //send_sms(text_to_speak);
    send_google_home_alert(text_to_speak);
    
  }
}

function send_sms(msg){
  var send_sms_options = {
    'method': 'GET',
    'url': 'https://www.fast2sms.com/dev/bulkV2?authorization=PMtG7QANIrJKa0pBRZvCyifo2TFgu1lLcmjYdOW8zxsn4khqEUuWwyKDrfo3IVjbJsHntMvYkF69SRiL&message='+msg+'&language=english&route=q&numbers=9851904515,9647834751',
    'headers': {
    }
  };
  request(send_sms_options, function (error, response) {
    if (error) throw new Error(error);
  });
}

async function send_slack_notification(msg) {
  const { WebClient, LogLevel } = require("@slack/web-api");
  const client = new WebClient(process.env.SLACK_TOKEN_DHARA, {
    logLevel: LogLevel.ERROR
  });
  const channelId = "#general";
  try {
    const result = await client.chat.postMessage({
      channel: channelId,
      text: msg
    });

    // console.log(result);
  }
  catch (error) {
    console.error(error);
  }
}

function send_google_home_alert(msg) {
  let options = {
    language: "hi",
    port: "8009"
  };
  const myHome1 = new GoogleHome("192.168.1.107", options);
  const myHome2 = new GoogleHome("192.168.1.106", options);
  myHome1.speak(msg.substring(0, 200));
  myHome2.speak(msg.substring(0, 200));
}

