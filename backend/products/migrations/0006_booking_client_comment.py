from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0005_contactmessage_is_read"),
    ]

    operations = [
        migrations.AddField(
            model_name="booking",
            name="client_comment",
            field=models.TextField(blank=True),
        ),
    ]
