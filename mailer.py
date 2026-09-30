import os, smtplib
from email.message import EmailMessage

SMTP_HOST=os.getenv("SMTP_HOST","")
SMTP_PORT=int(os.getenv("SMTP_PORT","587"))
SMTP_USER=os.getenv("SMTP_USER","")
SMTP_PASSWORD=os.getenv("SMTP_PASSWORD","")
SMTP_FROM=os.getenv("SMTP_FROM",SMTP_USER)
APP_URL=os.getenv("APP_URL","https://marieno.pythonanywhere.com").rstrip("/")

def configured():
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD and SMTP_FROM)

def send(to,subject,text):
    if not configured():
        raise RuntimeError("SMTP_NOT_CONFIGURED")
    msg=EmailMessage()
    msg["From"]=SMTP_FROM;msg["To"]=to;msg["Subject"]=subject
    msg.set_content(text)
    with smtplib.SMTP(SMTP_HOST,SMTP_PORT,timeout=20) as s:
        s.starttls();s.login(SMTP_USER,SMTP_PASSWORD);s.send_message(msg)

def send_username_recovery(email,token):
    link=f"{APP_URL}/?recovery=usernames&token={token}"
    send(email,"BibelQuiz – Benutzerkonten / Comptes",
         f"BibelQuiz\\n\\nÖffne diesen sicheren Link, um die mit dieser E-Mail verbundenen Konten anzuzeigen:\\n{link}\\n\\nDer Link ist 30 Minuten gültig.\\n\\nOuvre ce lien sécurisé pour afficher les comptes associés à cette adresse. Le lien est valable 30 minutes.")

def send_password_recovery(email,display_name,token):
    link=f"{APP_URL}/?recovery=password&token={token}"
    send(email,"BibelQuiz – Passwort zurücksetzen / Réinitialiser le mot de passe",
         f"BibelQuiz\\n\\nKonto / Compte: {display_name}\\n\\nPasswort zurücksetzen:\\n{link}\\n\\nDer Link ist 30 Minuten gültig und nur einmal verwendbar.\\nLe lien est valable 30 minutes et utilisable une seule fois.")
