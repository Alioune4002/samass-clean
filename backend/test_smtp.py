import smtplib
from email.mime.text import MIMEText

sender = "samassbysam@gmail.com"
receiver = "samassbysam@gmail.com"
password = "motdepasseouapppassword" 

msg = MIMEText("Test email depuis SAMASS")
msg['Subject'] = "Test SMTP"
msg['From'] = sender
msg['To'] = receiver

with smtplib.SMTP('smtp.gmail.com', 587) as server:
    server.starttls()
    server.login(sender, password)
    server.sendmail(sender, receiver, msg.as_string())
print("Email de test envoyé avec succès !")