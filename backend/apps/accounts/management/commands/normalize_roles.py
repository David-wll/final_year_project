from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Normalize user role values to lowercase for consistency'

    def handle(self, *args, **options):
        User = get_user_model()
        users = User.objects.all()
        changed = 0
        for u in users:
            try:
                if u.role and isinstance(u.role, str) and u.role != u.role.lower():
                    old = u.role
                    u.role = u.role.lower()
                    u.save(update_fields=['role'])
                    changed += 1
                    self.stdout.write(self.style.SUCCESS(f'Normalized {u.email}: {old} -> {u.role}'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Could not normalize {getattr(u, "email", "<unknown>")}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Done. Normalized {changed} users.'))
