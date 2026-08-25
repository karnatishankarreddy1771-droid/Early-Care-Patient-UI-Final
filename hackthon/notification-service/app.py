
from flask import Flask, request, jsonify
import os

app=Flask(__name__)

@app.post("/notify")
def notify():
    data=request.get_json(force=True) or {}
    body=data.get("body","Early Care alert")
    to=data.get("to")
    channel=data.get("channel","sms").lower()
    sid=os.getenv("TWILIO_ACCOUNT_SID")
    token=os.getenv("TWILIO_AUTH_TOKEN")
    from_sms=os.getenv("TWILIO_FROM_SMS")
    from_wa=os.getenv("TWILIO_FROM_WHATSAPP")
    if not all([sid,token,to]):
        return jsonify({"ok":False,"message":"Twilio credentials/recipient not configured. Browser notification remains available."}), 503
    try:
        from twilio.rest import Client
        client=Client(sid,token)
        if channel=="whatsapp":
            msg=client.messages.create(body=body,from_=from_wa,to=f"whatsapp:{to}")
        else:
            msg=client.messages.create(body=body,from_=from_sms,to=to)
        return jsonify({"ok":True,"sid":msg.sid})
    except Exception as e:
        return jsonify({"ok":False,"message":str(e)}),500

@app.get("/health")
def health(): return {"ok":True,"service":"Early Care notification gateway"}

if __name__=="__main__":
    app.run(host="127.0.0.1",port=5001,debug=False)
