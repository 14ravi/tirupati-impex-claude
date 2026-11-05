"""Workflow definitions. Each workflow is a list of tasks that run left to right; each task
has settings an agency can change. Saved settings live in workflow_configs."""

from dataclasses import dataclass
from typing import Any, Literal

ParamType = Literal["text", "textarea", "number", "select", "checkbox"]

RUN_SECTION = "run"  # settings for the whole run, edited from the page header


@dataclass(frozen=True)
class Param:
    key: str
    label: str
    type: ParamType
    default: Any
    help: str = ""
    options: tuple[str, ...] = ()
    min: int | None = None
    max: int | None = None


@dataclass(frozen=True)
class Task:
    key: str
    name: str
    description: str
    params: tuple[Param, ...] = ()


@dataclass(frozen=True)
class Workflow:
    key: str
    name: str
    description: str
    tasks: tuple[Task, ...]
    run_params: tuple[Param, ...] = ()
    available: bool = True

    def sections(self) -> dict[str, tuple[Param, ...]]:
        return {RUN_SECTION: self.run_params, **{t.key: t.params for t in self.tasks}}

    def defaults(self) -> dict[str, dict[str, Any]]:
        return {section: {p.key: p.default for p in params} for section, params in self.sections().items()}


INDUSTRIES = ("Hotels", "Restaurants", "Clinics and hospitals", "Schools and coaching", "Real estate", "Retail stores")

FIND_LEADS = Workflow(
    key="find-leads",
    name="Find leads",
    description="Finds businesses in an area, checks they fit, finds the decision-maker, scores the marketing gaps and drafts an email.",
    run_params=(
        Param("leads_wanted", "Leads wanted", "number", 20, "The run stops once it has this many leads.", min=1, max=200),
        Param("credit_limit", "Credit limit", "number", 30, "The run stops if it would use more credits than this.", min=1, max=1000),
    ),
    tasks=(
        Task(
            "find_businesses",
            "Find businesses",
            "Search Google Maps in the chosen area.",
            (
                Param("industry", "Industry", "select", "Hotels", options=INDUSTRIES),
                Param("city", "City or area", "text", "New Delhi"),
                Param("radius_km", "Radius (km)", "number", 5, "How far from the centre of the area to search.", min=1, max=50),
                Param("max_businesses", "Most businesses to check", "number", 200, min=10, max=2000),
            ),
        ),
        Task(
            "filter",
            "Filter",
            "Drop businesses that miss the basics, before any AI is used.",
            (
                Param("must_have_website", "Must have a website", "checkbox", True),
                Param("must_be_on_maps", "Must be on Google Maps", "checkbox", True),
                Param("min_reviews", "Fewest Google reviews", "number", 0, min=0, max=10000),
            ),
        ),
        Task(
            "check_fit",
            "Check fit",
            "Claude reads the website and checks your requirement.",
            (
                Param("requirement", "Requirement", "textarea", "At least 50 rooms", "Written in plain words, e.g. \"has a restaurant\"."),
                Param("model", "Checking model", "select", "Fast (Claude Haiku)", options=("Fast (Claude Haiku)", "Careful (Claude Sonnet)")),
            ),
        ),
        Task(
            "find_contact",
            "Find decision-maker",
            "Find a named person who can say yes.",
            (
                Param("roles", "Roles to look for", "text", "Owner, General Manager, Marketing Head"),
                Param("accept_personal", "Accept owner's personal Gmail, phone or WhatsApp", "checkbox", True),
            ),
        ),
        Task(
            "verify",
            "Verify contact",
            "Check the email address works before it's used.",
            (Param("verified_only", "Keep verified contacts only", "checkbox", True),),
        ),
        Task(
            "score",
            "Score",
            "Audit the gaps and score them with your service points.",
            (Param("min_score", "Lowest score to keep (%)", "number", 80, "Higher scores mean fewer leads.", min=0, max=100),),
        ),
        Task(
            "draft_email",
            "Draft emails",
            "Write a personal email for each lead, ready for approval.",
            (
                Param("tone", "Tone", "select", "Use industry setting", options=("Use industry setting", "Friendly", "Assertive", "Careful")),
                Param("extra_instructions", "Extra instructions", "textarea", "", "Optional, e.g. \"mention our hotel case study\"."),
            ),
        ),
    ),
)

SEO_GAPS = Workflow(
    key="seo-gaps",
    name="SEO gap finder",
    description="Finds businesses ranking poorly for their own services in their city, with proof for the pitch.",
    available=False,
    tasks=(
        Task("find_businesses", "Find businesses", "Search the chosen area."),
        Task("check_rankings", "Check rankings", "See where each business ranks."),
        Task("find_contact", "Find decision-maker", "Find a named person."),
        Task("draft_email", "Draft emails", "Write the pitch."),
    ),
)

WORKFLOWS: dict[str, Workflow] = {w.key: w for w in (FIND_LEADS, SEO_GAPS)}


def validate(params: tuple[Param, ...], values: dict[str, Any]) -> dict[str, Any]:
    """Check submitted values against the definitions. Raises ValueError with a message for the user."""
    known = {p.key: p for p in params}
    unknown = set(values) - set(known)
    if unknown:
        raise ValueError(f"Unknown setting: {', '.join(sorted(unknown))}.")
    clean: dict[str, Any] = {}
    for key, value in values.items():
        p = known[key]
        if p.type == "checkbox":
            if not isinstance(value, bool):
                raise ValueError(f"{p.label} must be on or off.")
        elif p.type == "number":
            if isinstance(value, bool) or not isinstance(value, (int, float)) or int(value) != value:
                raise ValueError(f"{p.label} must be a whole number.")
            value = int(value)
            if (p.min is not None and value < p.min) or (p.max is not None and value > p.max):
                raise ValueError(f"{p.label} must be between {p.min} and {p.max}.")
        elif p.type == "select":
            if value not in p.options:
                raise ValueError(f"Choose one of the listed options for {p.label}.")
        else:
            if not isinstance(value, str) or len(value) > 2000:
                raise ValueError(f"{p.label} must be text of up to 2,000 characters.")
            value = value.strip()
        clean[key] = value
    return clean
