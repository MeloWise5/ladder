# Generated manually to fix numeric field overflow

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("base", "0028_alter_ladders_debt_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="ladders",
            name="debt",
            field=models.DecimalField(
                blank=True, decimal_places=2, default=0, max_digits=12, null=True
            ),
        ),
        migrations.AlterField(
            model_name="ladders",
            name="cap",
            field=models.DecimalField(
                blank=True, decimal_places=2, default=0, max_digits=12, null=True
            ),
        ),
        migrations.AlterField(
            model_name="ladders",
            name="cover",
            field=models.DecimalField(
                blank=True, decimal_places=2, default=0, max_digits=12, null=True
            ),
        ),
        migrations.AlterField(
            model_name="ladders",
            name="profit",
            field=models.DecimalField(
                blank=True, decimal_places=2, default=0, max_digits=12, null=True
            ),
        ),
        migrations.AlterField(
            model_name="ladders",
            name="profit_per_trade",
            field=models.DecimalField(
                blank=True, decimal_places=2, default=0, max_digits=12, null=True
            ),
        ),
    ]
