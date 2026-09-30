import os, json, urllib.request, urllib.error

BREVO_API_KEY=os.getenv("BREVO_API_KEY","")
BREVO_FROM_EMAIL=os.getenv("BREVO_FROM_EMAIL","")
BREVO_FROM_NAME=os.getenv("BREVO_FROM_NAME","BibelQuiz")
APP_URL=os.getenv("APP_URL","https://marieno.pythonanywhere.com").rstrip("/")
BREVO_URL="https://api.brevo.com/v3/smtp/email"

def configured():
    return bool(BREVO_API_KEY and BREVO_FROM_EMAIL)

def send(to,subject,text):
    if not configured():
        raise RuntimeError("BREVO_NOT_CONFIGURED")
    payload={
        "sender":{"name":BREVO_FROM_NAME,"email":BREVO_FROM_EMAIL},
        "to":[{"email":to}],
        "subject":subject,
        "textContent":text,
        "tags":["bibelquiz-recovery"]
    }
    req=urllib.request.Request(
        BREVO_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "accept":"application/json",
            "api-key":BREVO_API_KEY,
            "content-type":"application/json"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req,timeout=20) as resp:
            body=json.loads(resp.read().decode("utf-8") or "{}")
            return body.get("messageId")
    except urllib.error.HTTPError as e:
        detail=e.read().decode("utf-8",errors="replace")
        raise RuntimeError(f"BREVO_HTTP_{e.code}: {detail}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"BREVO_CONNECTION_ERROR: {e.reason}") from e

def send_username_recovery(email,token):
    link=f"{APP_URL}/?recovery=usernames&token={token}"
    return send(email,"BibelQuiz – Benutzerkonten / Comptes",
         f"""BibelQuiz

Öffne diesen sicheren Link, um die mit dieser E-Mail verbundenen Konten anzuzeigen:
{link}

Der Link ist 30 Minuten gültig und nur einmal verwendbar.

Ouvre ce lien sécurisé pour afficher les comptes associés à cette adresse.
Le lien est valable 30 minutes et utilisable une seule fois.""")

def send_password_recovery(email,display_name,token):
    link=f"{APP_URL}/?recovery=password&token={token}"
    return send(email,"BibelQuiz – Passwort zurücksetzen / Réinitialiser le mot de passe",
         f"""BibelQuiz

Konto / Compte: {display_name}

Passwort zurücksetzen / Réinitialiser le mot de passe:
{link}

Der Link ist 30 Minuten gültig und nur einmal verwendbar.
Le lien est valable 30 minutes et utilisable une seule fois.""")
