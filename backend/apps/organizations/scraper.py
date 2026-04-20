"""
Internship scraper for real Nigerian job boards.

Sources:
  - MyJobMag  (https://www.myjobmag.com/jobs?q=internship)
  - Jobberman (https://www.jobberman.com/jobs?position=intern)
  - GraduateJobsNigeria (https://www.graduatesjobsnigeria.com/category/internship/)

All scraped postings are linked to synthetic org accounts so they do not
collide with genuine user-created organisations.

HTML selectors were verified by live inspection of each site on 2026-04-20.
"""

import re
import logging
from datetime import date, timedelta

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────

REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

NIGERIAN_STATES = [
    "Lagos", "Abuja", "FCT", "Kano", "Ogun", "Rivers", "Enugu", "Kaduna",
    "Anambra", "Delta", "Oyo", "Imo", "Edo", "Plateau", "Benue", "Sokoto",
    "Kwara", "Niger", "Kogi", "Osun", "Ekiti", "Ondo", "Abia", "Cross River",
]

TECH_KEYWORDS = [
    "Python", "JavaScript", "Java", "SQL", "React", "Node.js", "Django",
    "PHP", "Flutter", "Dart", "HTML", "CSS", "C++", "C#", "TypeScript",
    "Data Analysis", "Machine Learning", "Excel", "Power BI", "Tableau",
    "Git", "Linux", "AWS", "Azure", "Docker", "Kubernetes", "MongoDB",
    "PostgreSQL", "MySQL", "REST API", "GraphQL", "Figma", "AutoCAD",
]

SECTOR_MAP = {
    "bank": "Finance", "finance": "Finance", "fintech": "Finance",
    "pay": "Finance", "insurance": "Finance",
    "tech": "Technology", "software": "Technology", "digital": "Technology",
    "it ": "Technology", "data": "Technology",
    "health": "Healthcare", "hospital": "Healthcare", "pharma": "Healthcare",
    "engineer": "Engineering", "mechanical": "Engineering", "civil": "Engineering",
    "oil": "Oil & Gas", "gas": "Oil & Gas", "energy": "Oil & Gas",
    "media": "Media", "telecoms": "Telecoms", "telecom": "Telecoms",
    "marketing": "Marketing", "sales": "Marketing",
    "manufacture": "Manufacturing", "production": "Manufacturing",
    "consult": "Consulting", "law": "Legal", "legal": "Legal",
    "education": "Education", "school": "Education",
    "logistics": "Logistics", "supply": "Logistics",
}


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _get_soup(url: str, timeout: int = 20):
    """Fetch URL and return BeautifulSoup, or None on failure."""
    try:
        resp = requests.get(url, headers=REQUEST_HEADERS, timeout=timeout)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "lxml")
    except Exception as exc:
        logger.warning("Request failed for %s: %s", url, exc)
        return None


def _detect_state(text: str) -> str:
    tl = text.lower()
    for state in NIGERIAN_STATES:
        if state.lower() in tl:
            return state
    return "Lagos"


def _detect_sector(text: str) -> str:
    tl = text.lower()
    for kw, sector in SECTOR_MAP.items():
        if kw in tl:
            return sector
    return "General"


def _extract_skills(text: str) -> list:
    tl = text.lower()
    return [s for s in TECH_KEYWORDS if s.lower() in tl][:8]


def _split_title_company(full_title: str):
    """
    Split 'Job Title at Company Name' → (title, company).
    MyJobMag encodes both in the anchor text.
    """
    m = re.search(r"\bat\b(.+)$", full_title, re.IGNORECASE)
    if m:
        return full_title[: m.start()].strip(), m.group(1).strip()
    return full_title.strip(), "Unknown Company"


# ─────────────────────────────────────────────
# Source 1 – MyJobMag
# ─────────────────────────────────────────────

def scrape_myjobmag(max_pages: int = 3) -> list:
    """
    Scrape MyJobMag internship search results.

    Confirmed HTML structure (inspected 2026-04-20):
      ul.job-list > li.job-list-li
        li.mag-b > h2 > a      → "Role at Company Name", href = detail URL
        li.job-desc             → short description paragraph
        li.job-item             → date / miscellaneous metadata
    """
    base = "https://www.myjobmag.com"
    listings = []

    for page in range(1, max_pages + 1):
        url = f"{base}/jobs?q=internship&page={page}"
        logger.info("[MyJobMag] page %d → %s", page, url)
        soup = _get_soup(url)
        if not soup:
            break

        cards = soup.select("li.job-list-li")
        if not cards:
            logger.info("[MyJobMag] no cards on page %d – stopping", page)
            break

        for card in cards:
            # Title anchor lives under li.mag-b > h2
            anchor = card.select_one("li.mag-b h2 a") or card.select_one("h2 a")
            if not anchor:
                continue

            full_title = anchor.get_text(strip=True)
            title, company = _split_title_company(full_title)
            detail_url = anchor.get("href", "")
            if detail_url and not detail_url.startswith("http"):
                detail_url = base + detail_url

            desc_el = card.select_one("li.job-desc")
            description = desc_el.get_text(strip=True) if desc_el else (
                f"Internship role: {title} at {company}."
            )

            # Try to find a Nigerian state in the card's metadata items
            location_text = "Nigeria"
            for ji in card.select("li.job-item"):
                txt = ji.get_text(strip=True)
                if any(s.lower() in txt.lower() for s in NIGERIAN_STATES):
                    location_text = txt
                    break

            listings.append({
                "source": "MyJobMag",
                "title": title or full_title,
                "company": company,
                "location": location_text,
                "description": description,
                "url": detail_url,
            })

    logger.info("[MyJobMag] scraped %d listings", len(listings))
    return listings


# ─────────────────────────────────────────────
# Source 2 – Jobberman
# ─────────────────────────────────────────────

def scrape_jobberman(max_pages: int = 3) -> list:
    """
    Scrape Jobberman internship listings.

    The site renders React server-side with many class permutations; we try
    several selectors in priority order.
    """
    base = "https://www.jobberman.com"
    listings = []

    for page in range(1, max_pages + 1):
        url = f"{base}/jobs?position=intern&page={page}"
        logger.info("[Jobberman] page %d → %s", page, url)
        soup = _get_soup(url)
        if not soup:
            break

        # Try progressively broader selectors
        cards = (
            soup.select("article.job-description-card")
            or soup.select("article[data-job-id]")
            or soup.select(".job-listing-item")
            or soup.select(".job-card")
        )
        if not cards:
            logger.info("[Jobberman] no cards on page %d – stopping", page)
            break

        for card in cards:
            title_el = (
                card.select_one("h2.job-title a")
                or card.select_one(".job-title a")
                or card.select_one("h2 a")
                or card.select_one("h3 a")
            )
            if not title_el:
                continue

            company_el = (
                card.select_one(".company-name")
                or card.select_one(".employer-name")
                or card.select_one(".recruiter")
            )
            location_el = (
                card.select_one(".job-location")
                or card.select_one(".location")
            )
            desc_el = card.select_one(".description") or card.select_one("p")

            title = title_el.get_text(strip=True)
            company = company_el.get_text(strip=True) if company_el else "Unknown Company"
            location_text = location_el.get_text(strip=True) if location_el else "Nigeria"
            description = (
                desc_el.get_text(strip=True)
                if desc_el
                else f"Internship opportunity: {title} at {company}."
            )
            detail_url = title_el.get("href", "")
            if detail_url and not detail_url.startswith("http"):
                detail_url = base + detail_url

            listings.append({
                "source": "Jobberman",
                "title": title,
                "company": company,
                "location": location_text,
                "description": description,
                "url": detail_url,
            })

    logger.info("[Jobberman] scraped %d listings", len(listings))
    return listings


# ─────────────────────────────────────────────
# Source 3 – GraduateJobsNigeria (WordPress)
# ─────────────────────────────────────────────

def scrape_graduatesjobsnigeria(max_pages: int = 3) -> list:
    """
    Scrape GraduateJobsNigeria – a simple WordPress blog listing intern roles.
    URL: https://www.graduatesjobsnigeria.com/category/internship/
    """
    base = "https://www.graduatesjobsnigeria.com"
    listings = []

    for page in range(1, max_pages + 1):
        url = (
            f"{base}/category/internship/"
            if page == 1
            else f"{base}/category/internship/page/{page}/"
        )
        logger.info("[GraduateJobsNigeria] page %d → %s", page, url)
        soup = _get_soup(url)
        if not soup:
            break

        # WordPress post loop
        cards = soup.select("article.type-post, article.post, .post-item")
        if not cards:
            logger.info("[GraduateJobsNigeria] no cards on page %d – stopping", page)
            break

        for card in cards:
            title_el = card.select_one(
                "h2.entry-title a, h1.entry-title a, .post-title a"
            )
            if not title_el:
                continue

            full_title = title_el.get_text(strip=True)
            title, company = _split_title_company(full_title)

            desc_el = card.select_one(
                ".entry-summary p, .entry-content p, .post-excerpt"
            )
            description = (
                desc_el.get_text(strip=True)
                if desc_el
                else f"Internship opportunity: {title}."
            )
            detail_url = title_el.get("href", "")

            listings.append({
                "source": "GraduateJobsNigeria",
                "title": title or full_title,
                "company": company,
                "location": "Nigeria",
                "description": description,
                "url": detail_url,
            })

    logger.info("[GraduateJobsNigeria] scraped %d listings", len(listings))
    return listings


# ─────────────────────────────────────────────
# Database persistence
# ─────────────────────────────────────────────

def _get_or_create_scraper_org(company_name: str, sector: str, state: str):
    """Return (or create) a synthetic OrganizationProfile for a scraped company."""
    from django.contrib.auth import get_user_model
    from organizations.models import OrganizationProfile

    User = get_user_model()
    slug = re.sub(r"[^a-z0-9]", "", company_name.lower())[:40] or "scraped"
    email = f"scraper+{slug}@internship-platform.local"

    user, new_user = User.objects.get_or_create(
        email=email,
        defaults={"role": "organization", "is_verified": True, "is_active": True},
    )
    if new_user:
        user.set_unusable_password()
        user.save()

    profile, new_profile = OrganizationProfile.objects.get_or_create(
        user=user,
        defaults={
            "company_name": company_name,
            "industry_sector": sector,
            "state": state,
            "lga": "N/A",
            "address": "See original listing for address details",
            "contact_email": email,
            "description": f"{company_name} – listings imported via job-board scraper.",
            "itf_approval_status": "approved",
            "verified": True,
        },
    )
    if not new_profile:
        changed = False
        if profile.industry_sector in ("", "General") and sector != "General":
            profile.industry_sector = sector
            changed = True
        if profile.state in ("", "Lagos") and state not in ("Lagos", ""):
            profile.state = state
            changed = True
        if changed:
            profile.save()

    return profile


def save_listings(listings: list) -> tuple:
    """
    Persist scraped listings. Returns (created_count, skipped_count).
    Skips duplicates identified by (organization, title__iexact).
    """
    from organizations.models import InternshipOpportunity

    created = skipped = 0
    today = date.today()

    for item in listings:
        title = item["title"][:255]
        if not title:
            continue

        company = item["company"][:255] or "Unknown Company"
        description = item["description"] or f"Internship: {title}."
        location = item["location"]

        state = _detect_state(f"{location} {company}")
        sector = _detect_sector(f"{title} {description} {company}")
        skills = _extract_skills(f"{title} {description}")

        org = _get_or_create_scraper_org(company, sector, state)

        if InternshipOpportunity.objects.filter(
            organization=org, title__iexact=title
        ).exists():
            skipped += 1
            continue

        InternshipOpportunity.objects.create(
            organization=org,
            title=title,
            description=description[:3000],
            required_technical_skills=skills,
            required_soft_skills=[],
            sector=sector,
            location_state=state,
            location_lga="N/A",
            duration_weeks=12,
            start_date=today + timedelta(days=30),
            application_deadline=today + timedelta(days=21),
            slots_available=3,
            slots_filled=0,
            is_active=True,
        )
        created += 1

    return created, skipped


# ─────────────────────────────────────────────
# Public entry point
# ─────────────────────────────────────────────

AVAILABLE_SOURCES = {
    "myjobmag": scrape_myjobmag,
    "jobberman": scrape_jobberman,
    "graduatesjobsnigeria": scrape_graduatesjobsnigeria,
}


def run_scraper(sources=None, max_pages: int = 3) -> dict:
    """
    Run one or more scrapers and persist results.

    Args:
        sources: list of source keys, or None for all
        max_pages: max pages per source

    Returns:
        dict  {source_name: {scraped, created, skipped} | {error: str},
               "total": {created, skipped}}
    """
    active = (
        {k: v for k, v in AVAILABLE_SOURCES.items() if k in sources}
        if sources
        else AVAILABLE_SOURCES
    )

    total_created = total_skipped = 0
    results = {}

    for name, fn in active.items():
        logger.info("Running scraper: %s", name)
        try:
            raw = fn(max_pages=max_pages)
            created, skipped = save_listings(raw)
            results[name] = {"scraped": len(raw), "created": created, "skipped": skipped}
            total_created += created
            total_skipped += skipped
        except Exception as exc:
            logger.exception("Scraper '%s' raised: %s", name, exc)
            results[name] = {"error": str(exc)}

    results["total"] = {"created": total_created, "skipped": total_skipped}
    return results
