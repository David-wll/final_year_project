from django.core.management.base import BaseCommand
from organizations.services import sync_adzuna_to_db

class Command(BaseCommand):
    help = 'Sync real internship jobs from Adzuna'

    def handle(self, *args, **options):
        self.stdout.write("Fetching real jobs from Adzuna...")
        count = sync_adzuna_to_db()
        self.stdout.write(self.style.SUCCESS(f"Successfully synced {count} new jobs!"))
