import http.client
import json
import sys
import time
import os
import argparse
import slack_notifications as slack
from datetime import date, timedelta
import covidVaccineBook
import pygooglehomenotifier



slack.ACCESS_TOKEN = os.environ.get('SLACK_TOKEN_DHARA')


min_age_limit = 18
available_capacity = 2

# dates_to_check = [
#                   date.today().strftime("%d-%m-%Y"), 
#                   (date.today()+timedelta(days = 1)).strftime("%d-%m-%Y"),
#                   # (date.today()+timedelta(days = 2)).strftime("%d-%m-%Y"),
#               ]

dates_to_check = ["28-08-2021", "01-09-2021", "06-09-2021"]
district_ids = [363,]



conn = http.client.HTTPSConnection("cdn-api.co-vin.in")
payload = ''
headers = {}
interval_in_sec = 15


def get_available_centers():
    available_centers = []
    for each_district_id in district_ids:
        for each_date in dates_to_check:
            print("Checking available slots for district id: "+str(each_district_id)+" on: "+str(each_date), end="\r", flush=True)  
            url = "/api/v2/appointment/sessions/public/calendarByDistrict?district_id="+str(each_district_id)+"&date="+str(each_date)
            try:
                conn.request("GET", url, payload, headers)
                res = conn.getresponse()
                if res.status == 200:
                    data = res.read()
                    response = json.loads(data.decode("utf-8"))
                    for each_center in response['centers']:
                        for each_session in each_center['sessions']:
                            if each_session['vaccine'].lower()=="covishield" and int(each_session['available_capacity_dose2']) >= available_capacity and int(each_session['min_age_limit']) == min_age_limit:
                                available_centers.append({
                                    'name': each_center['name'],
                                    'address': each_center['address'],
                                    'pincode': each_center['pincode'],
                                    'block_name': each_center['block_name'],
                                    'fee_type': each_center['fee_type'],
                                    'available_capacity': each_session['available_capacity_dose2'],
                                    'date': each_session['date'],
                                    'vaccine': each_session['vaccine'],
                                    'text': "Dose 2 available at Pin "+str(each_center['pincode'])+" on "+str(each_session['date'])+"."
                                })
            except Exception as e:
                print("Failed to get data for url: "+str(url), end="\r", flush=True)
                print(e)
                time.sleep(15)
            sys.stdout.flush()

    # print("Available Centers:", json.dumps(available_centers), end="\r", flush=True)
    # sys.stdout.flush()
    return available_centers


def notify_google_home(text):
    googlehome_hall = pygooglehomenotifier.get_googlehomes(ipaddr = "192.168.1.106")[0]
    googlehome_bedroom = pygooglehomenotifier.get_googlehomes(ipaddr = "192.168.1.107")[0]
    googlehome_hall.wait()
    googlehome_bedroom.wait()
    googlehome_hall.notify(text, lang = "en")
    googlehome_bedroom.notify(text, lang = "en")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('fromworkflow', nargs='?', help='For Run from git action workflow')
    args = parser.parse_args()
    if args.fromworkflow is not None:
        available_centers = get_available_centers()
        available_centers_json = json.dumps(available_centers)
        print("Available Centers:", available_centers_json)
    else:
        try:
            while True:
                time.sleep(1)
                available_centers = get_available_centers()
                if len(available_centers):
                    available_centers_json = json.dumps(available_centers)
                    print("Available Centers:", available_centers_json)
                    notification_txt = ''
                    for each_available_center in available_centers:
                        notification_txt += each_available_center['text'] + "\n"
                    slack.send_notify('#general', text="@channel "+notification_txt)
                    notify_google_home(notification_txt)
                    # covidVaccineBook.main(["--mobile=9851904515"])
                    os.system("python3 covidVaccineBook.py --mobile=9851904515")
                    break
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
