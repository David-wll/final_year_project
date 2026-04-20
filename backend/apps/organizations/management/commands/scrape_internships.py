from django.core.management.base import BaseCommand
from organizations.scraper import run_scraper, AVAILABLE_SOURCES


class Command(BaseCommand):
    help = "Scrape real internship listings from Nigerian job boards and save to DB."

    def add_arguments(self, parser):
        parser.add_argument(
            "--sources",
            nargs="+",
            choices=list(AVAILABLE_SOURCES.keys()),
            default=None,
            help="Which sources to scrape (default: all)",
        )
        parser.add_argument(
            "--pages",
            type=int,
            default=3,
            help="Maximum pages per source (default: 3)",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting internship scraper..."))
        results = run_scraper(
            sources=options["sources"],
            max_pages=options["pages"],
        )

        for source, stats in results.items():
            if source == "total":
                continue
            if "error" in stats:
                self.stdout.write(
                    self.style.ERROR(f"  {source}: ERROR – {stats['error']}")
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  {source}: scraped={stats['scraped']}, "
                        f"created={stats['created']}, skipped={stats['skipped']}"
                    )
                )

        total = results.get("total", {})
        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. Total created={total.get('created', 0)}, "
                f"skipped={total.get('skipped', 0)}"
            )
        )
