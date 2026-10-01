import time
from env_loader import load_private_env
load_private_env()

import database
import mailer

def run_once():
    database.init()
    database.account_migrate()
    mails=database.pending_emails(20)
    print(f"EMAIL WORKER: {len(mails)} pending")
    sent=0;failed=0
    for item in mails:
        try:
            message_id=mailer.send(item["recipient"],item["subject"],item["body"])
            database.mark_email_sent(item["id"])
            sent+=1
            print(f"  SENT id={item['id']} message_id={bool(message_id)}")
        except Exception as e:
            database.mark_email_failed(item["id"],e)
            failed+=1
            print(f"  RETRY/FAILED id={item['id']} error={type(e).__name__}: {e}")
    print(f"EMAIL WORKER DONE: sent={sent} failed={failed}")
    return sent,failed

if __name__=="__main__":
    run_once()
