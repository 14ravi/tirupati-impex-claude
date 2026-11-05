# Project documents

The design and research live as Claude Docs, so they can be edited and commented on. The links are private to the owner's Claude account until shared.

- [Lead Generation Platform: Design & Research](https://claude.ai/artifact/DEG44zuex4BZJDsXXXdwi9): the five stages, the lead funnel, data providers, email delivery, legal notes, the data model, and the decisions made so far.
- [Legal Review Brief: Lead Generation Platform](https://claude.ai/artifact/NmJ4mwh3q8xE8XdEpU2zoH): the points for the legal team to review before launch.

## Decisions so far

- First market: hotels in New Delhi.
- The platform buys all data centrally and sells agencies lead credits.
- An agency has 15 days to send the first email, may send at most 3 follow-ups, and loses the lead if there's no reply within 30 days of the first email.
- Sending through Instantly for version 1.
- Stack: Next.js frontend, FastAPI (Python) backend, PostgreSQL.
- App layout: Dashboard, Workflows (task graph with a settings panel per task, run now or on a schedule), Leads, Emails, Settings, and log out at the bottom of the sidebar.
