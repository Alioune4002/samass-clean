from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0004_seed_services_defaults"),
    ]

    operations = [
        migrations.AddField(
            model_name="contactmessage",
            name="is_read",
            field=models.BooleanField(default=False),
        ),
    ]
