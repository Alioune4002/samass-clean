from django.db import migrations


def seed_services(apps, schema_editor):
    Service = apps.get_model("products", "Service")

    defaults = [
        {
            "title": "Massage Relaxant Tonique",
            "description": (
                "Un massage complet mêlant douceur et gestes toniques, idéal pour relâcher les tensions "
                "musculaires tout en retrouvant énergie et légèreté. Le massage commence par des mouvements "
                "lents et enveloppants, suivis de pressions toniques ciblant les zones tendues. Le soin se termine "
                "par des manœuvres apaisantes pour un retour au calme profond."
            ),
            "durations_prices": {"60": 80, "90": 120},
        },
        {
            "title": "Massage Tonique",
            "description": (
                "Un massage dynamique conçu pour activer la circulation, dénouer les tensions profondes et "
                "revitaliser tout le corps. Pressions fermes, pétrissages précis et gestes rapides pour un regain d’énergie."
            ),
            "durations_prices": {"45": 50, "80": 70},
        },
        {
            "title": "Massage Tantrique",
            "description": (
                "Un massage profond et intuitif qui invite à reconnecter avec ses sensations et sa respiration. "
                "Mouvements lents, sensoriels et fluides pour apaiser le mental et ramener une sensation d’unité."
            ),
            "durations_prices": {"60": 80, "90": 120},
        },
    ]

    for item in defaults:
        Service.objects.update_or_create(
            title=item["title"],
            defaults={
                "description": item["description"],
                "durations_prices": item["durations_prices"],
                "is_active": True,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ("products", "0003_service_is_active"),
    ]

    operations = [
        migrations.RunPython(seed_services, migrations.RunPython.noop),
    ]
