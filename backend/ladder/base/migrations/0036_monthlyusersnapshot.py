import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("base", "0035_monthlyladdersnapshot"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="MonthlyUserSnapshot",
            fields=[
                (
                    "_id",
                    models.AutoField(editable=False, primary_key=True, serialize=False),
                ),
                ("year", models.PositiveSmallIntegerField()),
                ("month", models.PositiveSmallIntegerField()),
                (
                    "profit",
                    models.DecimalField(decimal_places=2, default=0, max_digits=12),
                ),
                (
                    "debt",
                    models.DecimalField(decimal_places=2, default=0, max_digits=12),
                ),
                ("buy_count", models.PositiveIntegerField(default=0)),
                ("sell_count", models.PositiveIntegerField(default=0)),
                ("is_closed", models.BooleanField(default=False)),
                ("committed_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="monthly_snapshots",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-year", "-month"],
                "unique_together": {("user", "year", "month")},
            },
        ),
    ]
