# Glossary: Software Architecture

**Architecture** — The high-level structure of a software system: the components, their relationships, and the principles guiding its design and evolution.

**Architectural style** — A named pattern for overall system organization (e.g., microservices, event-driven). Sets constraints across the whole system.

**Architectural pattern** — A reusable solution to a recurring structural problem within a style (e.g., CQRS within event-driven).

**Quality attribute (ility)** — A non-functional requirement the architecture must satisfy: scalability, reliability, maintainability, security, performance, availability.

**Coupling** — The degree to which components depend on each other. Low coupling → easier to change independently.

**Cohesion** — How closely related the responsibilities inside a component are. High cohesion → one clear reason to exist.

**Bounded context** — (DDD) A boundary within which a domain model is consistently defined. Prevents concept leakage between parts of the system.

**ADR (Architecture Decision Record)** — A short doc capturing a significant architectural decision: context, options considered, decision made, and consequences.

**SoC (Separation of Concerns)** — Each module addresses a distinct concern, with minimal overlap.

**Hexagonal Architecture (Ports & Adapters)** — Isolates application core from external dependencies via ports (interfaces) and adapters (implementations).

**CQRS (Command Query Responsibility Segregation)** — Separates write operations (commands) from read operations (queries) into distinct models.

**Event Sourcing** — Stores state as a sequence of events rather than the current snapshot. The log is the source of truth.

**Monolith** — A single deployable unit containing all application functionality. Simple operationally; harder to scale parts independently.

**Microservices** — System decomposed into small, independently deployable services each owning its data. Operationally complex; scales and evolves independently.

**Service mesh** — Infrastructure layer (e.g., Istio) that handles service-to-service communication, observability, and security in a microservices system.
