window.LESSONS = {

"architecture": {
  title: "Software Architecture",
  icon: "🏛️",
  xpMax: 300,
  sections: [
    {
      id: "what-is-architecture",
      title: "What is Architecture?",
      content: `
<p>Architecture is the set of decisions that are <strong>hard to reverse</strong>. Not the choice of variable name or which library to parse JSON — the decisions that, if you got wrong, would cost months to fix.</p>

<p>A senior engineer is defined by their ability to make those decisions <em>deliberately</em>, knowing the trade-offs, rather than by accident.</p>

<blockquote>"Architecture is what remains when you can't easily change it anymore."</blockquote>

<p>Think of it this way: when you join a bank codebase, the architecture is already there. Understanding it — why things are structured the way they are, what constraints shaped those decisions — is the first thing that separates a senior from a junior engineer.</p>
`
    },
    {
      id: "cohesion-coupling",
      title: "The Core Rule: Cohesion & Coupling",
      content: `
<p>Before any pattern, memorize this:</p>

<div class="callout">
  <strong>High cohesion within a component. Low coupling between components.</strong>
</div>

<ul>
  <li><strong>Cohesion</strong> — how focused a component's responsibilities are. A class that does one thing well has high cohesion.</li>
  <li><strong>Coupling</strong> — the degree of dependency between components. If changing A forces you to change B, they are tightly coupled.</li>
</ul>

<p>Every architectural pattern you'll ever learn exists primarily to <strong>reduce coupling</strong>. If you understand why coupling is bad, you can reason about any architecture without memorizing patterns.</p>

<h3>A Banking Example</h3>

<p>A junior engineer might write a loan approval service like this:</p>

<pre><code class="java">// ❌ Low cohesion + tight coupling
@Service
public class LoanService {
    public void approveLoan(Loan loan) {
        CreditScore score = creditBureau.check(loan.customerId());
        if (score.value() > 650) {
            loanRepository.save(loan.approve());
            emailService.sendApprovalEmail(loan);   // coupled to email
            smsService.sendApprovalSMS(loan);        // coupled to SMS
            auditLogger.log("LOAN_APPROVED", loan);  // coupled to audit
        }
    }
}</code></pre>

<p>Every new notification channel means changing <code>LoanService</code>. If <code>emailService</code> is down, loan approval fails entirely.</p>

<p>A senior engineer decouples it with an event:</p>

<pre><code class="java">// ✅ High cohesion + loose coupling
@Service
public class LoanService {
    public void approveLoan(Loan loan) {
        CreditScore score = creditBureau.check(loan.customerId());
        if (score.value() > 650) {
            loanRepository.save(loan.approve());
            eventPublisher.publish(new LoanApprovedEvent(loan)); // done
        }
    }
}

// Lives in its own class — LoanService doesn't know it exists
@EventListener
public class NotificationService {
    public void onLoanApproved(LoanApprovedEvent event) { ... }
}</code></pre>

<p>Now <code>NotificationService</code> can fail without taking down <code>LoanService</code>. Adding a push notification? New listener, zero changes to loan logic.</p>
`
    },
    {
      id: "architectural-styles",
      title: "Architectural Styles at a Bank",
      content: `
<p>An <strong>architectural style</strong> is the overall organizational pattern for a system. Banks rarely use just one — you'll see a mix depending on the age and purpose of each system.</p>

<table>
  <thead>
    <tr><th>Style</th><th>What it looks like</th><th>Why banks use it</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Layered Monolith</strong></td>
      <td>One deployable unit: Controller → Service → Repository</td>
      <td>Legacy core banking. Stable, auditable, simple to operate.</td>
    </tr>
    <tr>
      <td><strong>SOA</strong></td>
      <td>Services communicate via an Enterprise Service Bus (ESB)</td>
      <td>Large banks integrating mainframes, COBOL systems, and external partners.</td>
    </tr>
    <tr>
      <td><strong>Microservices</strong></td>
      <td>Small independent services, each owns its data</td>
      <td>Greenfield projects within the bank. Independent deployability.</td>
    </tr>
    <tr>
      <td><strong>Event-Driven</strong></td>
      <td>Services publish/consume events (Kafka, RabbitMQ)</td>
      <td>Fraud detection, transaction streaming, audit logs.</td>
    </tr>
  </tbody>
</table>

<div class="callout callout-info">
  <strong>Reality check:</strong> At a bank you will almost certainly work with a <em>mix</em>. The 40-year-old core ledger runs on a mainframe. The payments API is a Spring Boot monolith. The fraud detection pipeline is event-driven. Your job is to understand each piece and how they talk to each other.
</div>
`
    },
    {
      id: "layered-architecture",
      title: "The Layered Architecture",
      content: `
<p>This is the most common pattern you'll write Spring Boot code in day-to-day. Know it cold.</p>

<pre><code>┌─────────────────────────────────────┐
│  Presentation Layer                 │  ← @RestController  (Angular calls here)
├─────────────────────────────────────┤
│  Application / Service Layer        │  ← @Service         (business logic)
├─────────────────────────────────────┤
│  Domain Layer                       │  ← POJOs, Entities  (the real rules)
├─────────────────────────────────────┤
│  Infrastructure / Data Layer        │  ← @Repository, JPA (DB, external APIs)
└─────────────────────────────────────┘</code></pre>

<h3>The Cardinal Rule</h3>
<p>Dependencies only flow <strong>downward</strong>. Your <code>@Service</code> can call a <code>@Repository</code>. Your <code>@Repository</code> must never call a <code>@Service</code>. Violating this creates circular dependencies and logic that's impossible to test in isolation.</p>

<h3>Why the Domain Layer Matters at a Bank</h3>
<p>In banking, the Domain Layer is where auditors look. It contains the business rules: interest calculations, account limits, transaction validation. These must be <strong>pure Java with no framework dependencies</strong> so they can be tested and audited without spinning up a Spring container.</p>

<pre><code class="java">// Domain object — no @Service, no @Repository, no Spring annotations
public class LoanApplication {
    public boolean isEligible(CreditScore score, Income income) {
        return score.value() >= 650 && income.monthly().compareTo(MIN_INCOME) > 0;
    }
}

// Service layer orchestrates
@Service
public class LoanService {
    public Result apply(LoanRequest req) {
        var app = new LoanApplication(req); // domain object
        if (app.isEligible(score, income)) {
            loanRepository.save(app.approve());
        }
    }
}</code></pre>
`
    },
    {
      id: "quality-attributes",
      title: "Quality Attributes",
      content: `
<p>Every architecture is optimizing for something. At a bank, the priorities are very different from a startup.</p>

<table>
  <thead>
    <tr><th>Attribute</th><th>Bank priority</th><th>Why</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Reliability</strong></td><td>🔴 Critical</td><td>A failed or double-processed payment is a regulatory and reputational disaster.</td></tr>
    <tr><td><strong>Security</strong></td><td>🔴 Critical</td><td>PCI-DSS, data protection laws, fraud risk. Non-negotiable.</td></tr>
    <tr><td><strong>Auditability</strong></td><td>🔴 Critical</td><td>Every transaction must have a complete, tamper-proof trail.</td></tr>
    <tr><td><strong>Availability</strong></td><td>🟠 High</td><td>Core banking downtime = customers can't pay rent or make transfers.</td></tr>
    <tr><td><strong>Scalability</strong></td><td>🟡 Medium</td><td>Banks have predictable load (month-end spikes, not viral growth).</td></tr>
    <tr><td><strong>Developer velocity</strong></td><td>🟡 Medium</td><td>Stability beats speed. Change management processes are strict.</td></tr>
  </tbody>
</table>

<h3>Availability Numbers</h3>
<p>When someone says "we need five nines," here's what that means:</p>

<table>
  <thead>
    <tr><th>SLA</th><th>Downtime per year</th><th>Downtime per month</th></tr>
  </thead>
  <tbody>
    <tr><td>99%</td><td>3.65 days</td><td>7.2 hours</td></tr>
    <tr><td>99.9%</td><td>8.7 hours</td><td>43 minutes</td></tr>
    <tr><td>99.99%</td><td>52 minutes</td><td>4.3 minutes</td></tr>
    <tr><td>99.999%</td><td>5.2 minutes</td><td>26 seconds</td></tr>
  </tbody>
</table>

<div class="callout callout-warning">
  Quality attributes often <strong>conflict</strong>. Maximizing availability costs money. High security can hurt performance. Adding auditability adds latency. Your job as a senior engineer is to <em>prioritize</em> them for your specific context — and document why.
</div>
`
    },
    {
      id: "tradeoff-mindset",
      title: "The Trade-Off Mindset",
      content: `
<p>This is the most important thing in this entire lesson:</p>

<blockquote>"It depends" is the correct answer — as long as you can finish the sentence.</blockquote>

<p>Senior engineers don't pick patterns from a checklist. They pick based on <strong>context + constraints + consequences</strong>.</p>

<h3>The ADR (Architecture Decision Record)</h3>
<p>Every significant architectural decision should be documented in an ADR. It's a short file that captures:</p>

<ol>
  <li><strong>Context</strong> — what situation are we in?</li>
  <li><strong>Decision</strong> — what did we decide?</li>
  <li><strong>Options considered</strong> — what else did we evaluate?</li>
  <li><strong>Consequences</strong> — what are the trade-offs we're accepting?</li>
</ol>

<p>Banks care about ADRs because auditors and regulators ask why decisions were made. "We thought it was a good idea" is not an acceptable answer. "We chose the layered monolith over microservices because our team of 6 lacked the operational maturity to manage distributed tracing and independent deployments at this stage" — that's an answer.</p>

<h3>Common Trap: Cargo Culting</h3>
<p>"Netflix uses microservices" is not a reason to use microservices. Netflix has thousands of engineers, years of investment in tooling, and a fundamentally different scale problem. Adopting their architecture without their constraints is <strong>cargo culting</strong> — copying the form without understanding the function.</p>

<p>Always ask: <em>What specific problem am I solving? Does this pattern solve that problem in my context?</em></p>
`
    },
    {
      id: "solid",
      title: "SOLID Principles",
      content: `
<p>Five principles that, together, push you toward low coupling and high cohesion. A senior engineer who knows SOLID can evaluate any codebase — because the reasoning transfers to every language and framework.</p>

<h3>S — Single Responsibility Principle</h3>
<div class="callout">A class should have only one reason to change.</div>

<p>"One reason to change" means one stakeholder, one concern. If your class changes when the business rule changes <em>and</em> when the database schema changes <em>and</em> when the notification format changes — it has three responsibilities.</p>

<pre><code>// ❌ Four reasons to change: limit rules, DB schema, email template, audit format
@Service
public class AccountService {
    public void transfer(Transfer t) {
        if (t.amount().compareTo(DAILY_LIMIT) > 0) throw new LimitExceededException();
        accountRepository.debit(t.from(), t.amount());
        accountRepository.credit(t.to(), t.amount());
        String body = "Dear " + t.from().name() + ", your transfer of $" + t.amount() + "...";
        emailClient.send(t.from().email(), body);
        auditLog.write("[TRANSFER] " + t.from() + " -> " + t.to());
    }
}</code></pre>

<pre><code>// ✅ Each class has one reason to change
@Service
public class TransferService {
    public void transfer(Transfer t) {
        transferValidator.validate(t);
        accountRepository.debit(t.from(), t.amount());
        accountRepository.credit(t.to(), t.amount());
        eventPublisher.publish(new TransferCompletedEvent(t));
    }
}

@EventListener class NotificationService { ... }  // only notifications
@EventListener class AuditService         { ... }  // only audit</code></pre>

<h3>O — Open/Closed Principle</h3>
<div class="callout">Open for extension, closed for modification.</div>

<p>Add new behavior without editing existing, working code. In Spring Boot this appears as <strong>strategy injection</strong>.</p>

<pre><code>// ❌ Every new fee type = edit this method
public BigDecimal calculateFee(Transaction t) {
    if (t.type() == DOMESTIC)      return t.amount().multiply(new BigDecimal("0.001"));
    if (t.type() == INTERNATIONAL) return t.amount().multiply(new BigDecimal("0.025"));
}

// ✅ New fee type = new class, zero edits to existing code
public interface FeeStrategy {
    BigDecimal calculate(Transaction t);
}

@Component("DOMESTIC")      class DomesticFeeStrategy     implements FeeStrategy { ... }
@Component("INTERNATIONAL") class InternationalFeeStrategy implements FeeStrategy { ... }

@Service
public class FeeService {
    private final Map&lt;String, FeeStrategy&gt; strategies; // Spring injects all
    public BigDecimal calculateFee(Transaction t) {
        return strategies.get(t.type().name()).calculate(t);
    }
}</code></pre>

<h3>L — Liskov Substitution Principle</h3>
<div class="callout">Subtypes must be substitutable for their parent types without breaking the program.</div>

<p>If a method accepts a <code>BankAccount</code>, it must work correctly with <em>any</em> subclass — <code>SavingsAccount</code>, <code>CurrentAccount</code>, <code>FixedDepositAccount</code> — without the caller checking which one it got.</p>

<pre><code>// ❌ LSP violation — caller is forced to know the concrete type
if (account instanceof SavingsAccount sa) {
    sa.applyInterest();
}

// ✅ Caller doesn't care what subtype it is
account.applyPeriodEndProcessing(); // each subtype implements it correctly</code></pre>

<p>If you find yourself writing <code>instanceof</code> checks in business logic, the type hierarchy is probably wrong.</p>

<h3>I — Interface Segregation Principle</h3>
<div class="callout">Clients should not be forced to depend on methods they don't use.</div>

<pre><code>// ❌ One fat interface forces every implementor to stub unused methods
public interface AccountOperations {
    void deposit(BigDecimal amount);
    void withdraw(BigDecimal amount);
    void applyInterest();      // only savings accounts
    void processOverdraft();   // only current accounts
    void lockForFixedTerm();   // only fixed deposit accounts
}

// ✅ Small focused interfaces — each class implements only what makes sense
public interface Depositable    { void deposit(BigDecimal amount); }
public interface Withdrawable   { void withdraw(BigDecimal amount); }
public interface InterestBearing { void applyInterest(); }

class SavingsAccount      implements Depositable, Withdrawable, InterestBearing { ... }
class FixedDepositAccount implements Depositable, InterestBearing { ... }</code></pre>

<h3>D — Dependency Inversion Principle</h3>
<div class="callout">High-level modules should not depend on low-level modules. Both should depend on abstractions.</div>

<p>This is the principle Spring Boot is <em>built around</em>. Spring's dependency injection exists specifically to implement DIP.</p>

<pre><code>// ❌ High-level service hardcoded to a specific low-level implementation
@Service
public class LoanService {
    private final MySQLLoanRepository repo = new MySQLLoanRepository();
}

// ✅ Depends on abstraction — Spring injects whatever implements it
@Service
public class LoanService {
    private final LoanRepository repo; // interface

    public LoanService(LoanRepository repo) { this.repo = repo; }
    // swap to InMemoryLoanRepository in tests — zero changes here
}</code></pre>
`
    },
    {
      id: "dry-kiss-yagni",
      title: "DRY, KISS & YAGNI",
      content: `
<p>Three principles senior engineers use to <strong>resist over-engineering</strong>.</p>

<table>
  <thead>
    <tr><th>Principle</th><th>Rule</th><th>Common violation</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>DRY</strong><br><small>Don't Repeat Yourself</small></td>
      <td>Every piece of knowledge has one authoritative source</td>
      <td>Copy-pasting validation logic across 5 controllers</td>
    </tr>
    <tr>
      <td><strong>KISS</strong><br><small>Keep It Simple</small></td>
      <td>Prefer the simpler solution until complexity is justified by evidence</td>
      <td>Using CQRS + Event Sourcing for a 3-table CRUD app</td>
    </tr>
    <tr>
      <td><strong>YAGNI</strong><br><small>You Aren't Gonna Need It</small></td>
      <td>Don't build for hypothetical future requirements</td>
      <td>Adding a plugin system "in case we need it someday"</td>
    </tr>
  </tbody>
</table>

<div class="callout callout-warning">
  <strong>At a bank, YAGNI is especially important.</strong> Banks have strict change management. Every line of code is a line someone must review, test, deploy, and maintain in a regulated environment. Unnecessary complexity is a liability — not a feature.
</div>

<h3>How SOLID Connects to Architecture</h3>
<p>SOLID operates at the class level, but it expresses the same instinct as architectural principles:</p>

<ul>
  <li><strong>SRP</strong> → high cohesion</li>
  <li><strong>OCP</strong> → extensible without touching existing code</li>
  <li><strong>DIP</strong> → depend on abstractions (Spring IoC makes this easy)</li>
</ul>

<p>When you review code at your bank job, you'll encounter violations of these constantly. Naming them gives you the vocabulary to explain <em>why</em> something is wrong — not just that it <em>feels</em> wrong. That's what separates a senior engineer's feedback from a junior engineer's.</p>
`
    }
  ]
},

"system-design": {
  title: "System Design",
  icon: "⚙️",
  xpMax: 400,
  sections: [
    {
      id: "what-is-system-design",
      title: "What is System Design?",
      content: `
<p>System design is the process of defining <strong>how components work together at scale</strong> — across machines, processes, and time. Where architecture answers "how should this service be structured?", system design answers "how do ten services serve ten million users without falling over?"</p>

<p>Senior engineers are expected to reason about systems they haven't built yet. Given a requirement like "design a payment processing system for 1 million daily transactions," you need a structured way to think through it.</p>

<h3>The Design Process</h3>

<p>Always start by asking clarifying questions before drawing boxes. A common trap: jumping to a solution before understanding the problem.</p>

<ol>
  <li><strong>Clarify requirements</strong> — What's the scale? Read-heavy or write-heavy? Strong consistency required, or eventual is fine?</li>
  <li><strong>Estimate scale</strong> — Rough numbers. 1M daily users ≈ ~12 requests/sec average, but peak may be 10×.</li>
  <li><strong>Define the API</strong> — What does the system expose? Input/output shapes anchor the design.</li>
  <li><strong>Design the data model</strong> — What needs to be stored? What are the access patterns?</li>
  <li><strong>Sketch the high-level design</strong> — Services, databases, queues. Keep it simple first.</li>
  <li><strong>Identify bottlenecks</strong> — Where does this break at 10× load? Then add complexity only where needed.</li>
</ol>

<div class="callout">
  <strong>Rule:</strong> Start simple. Add complexity only when you can name the specific problem it solves.
</div>
`
    },
    {
      id: "scalability",
      title: "Scalability: Vertical vs Horizontal",
      content: `
<p>When a system can't handle more load, you have two levers:</p>

<ul>
  <li><strong>Vertical scaling (scale up)</strong> — Give the existing machine more CPU, RAM, or disk. Simple, but has a hard ceiling and a single point of failure.</li>
  <li><strong>Horizontal scaling (scale out)</strong> — Add more machines running the same service. No hard ceiling, but requires your application to be <em>stateless</em>.</li>
</ul>

<h3>Stateless vs Stateful Services</h3>

<p>This is the key constraint. To scale horizontally, each instance must produce the same result for the same request regardless of which instance handles it. If a service stores session state in memory, requests must always route to the same instance — that's sticky sessions, and it's a scaling headache.</p>

<p>The fix: move state out of the application and into a shared store.</p>

<pre><code class="java">// ❌ Stateful — can't scale out freely
@RestController
public class SessionController {
    private Map&lt;String, User&gt; sessions = new HashMap&lt;&gt;(); // in-memory

    @GetMapping("/me")
    public User getUser(HttpServletRequest req) {
        return sessions.get(req.getSession().getId());
    }
}

// ✅ Stateless — any instance can handle any request
@RestController
public class SessionController {
    @Autowired RedisTemplate&lt;String, User&gt; redis;

    @GetMapping("/me")
    public User getUser(@RequestHeader("Authorization") String token) {
        return redis.opsForValue().get(parseUserId(token)); // shared state in Redis
    }
}</code></pre>

<h3>Banking Example</h3>

<p>A bank's account inquiry service is read-heavy and naturally stateless — any instance can look up a balance. But a funds transfer service that checks-and-debits in two steps must handle concurrency carefully. Horizontal scaling doesn't eliminate the need for correct locking at the database level.</p>
`
    },
    {
      id: "caching",
      title: "Caching",
      content: `
<p>Caching is storing the result of an expensive operation so you don't repeat it. It's one of the highest-leverage tools in system design — and one of the most dangerous if misused.</p>

<h3>Where to Cache</h3>

<ul>
  <li><strong>Client-side</strong> — Browser cache, HTTP Cache-Control headers. Free performance for static assets.</li>
  <li><strong>CDN</strong> — Cache at the network edge, close to users. Good for read-heavy public content.</li>
  <li><strong>Application cache</strong> — In-process (e.g., Guava Cache) or distributed (e.g., Redis). Most common for database query results.</li>
  <li><strong>Database cache</strong> — Query result cache, buffer pool. Happens automatically but you can tune it.</li>
</ul>

<h3>Cache Invalidation Strategies</h3>

<p>The hard part of caching isn't storing data — it's knowing when to remove it.</p>

<ul>
  <li><strong>TTL (Time-to-Live)</strong> — Expire entries after N seconds. Simple, but you may serve stale data up to TTL.</li>
  <li><strong>Write-through</strong> — Update the cache every time you write to the DB. Cache always fresh, but adds write latency.</li>
  <li><strong>Cache-aside (lazy loading)</strong> — Read from cache; on miss, load from DB and populate cache. Most common pattern.</li>
  <li><strong>Invalidate on write</strong> — Delete the cache entry when the underlying data changes. Simple but creates a thundering herd if many requests race to repopulate.</li>
</ul>

<pre><code class="java">// Cache-aside pattern (most common)
public AccountBalance getBalance(String accountId) {
    AccountBalance cached = redis.opsForValue().get("balance:" + accountId);
    if (cached != null) return cached;

    AccountBalance fresh = accountRepository.findById(accountId).getBalance();
    redis.opsForValue().set("balance:" + accountId, fresh, Duration.ofSeconds(30));
    return fresh;
}</code></pre>

<div class="callout">
  <strong>Banking caveat:</strong> Account balances require strong consistency. Cache only for read-heavy, tolerance-for-slight-staleness scenarios (e.g., displaying a recent transaction list). Never cache a balance you're using to authorize a debit.
</div>
`
    },
    {
      id: "load-balancing",
      title: "Load Balancing & API Gateways",
      content: `
<p>Once you have multiple instances of a service, something must decide which instance handles each request. That's a <strong>load balancer</strong>.</p>

<h3>Load Balancing Algorithms</h3>

<ul>
  <li><strong>Round robin</strong> — Requests distributed in order: instance 1, 2, 3, 1, 2, 3... Simple and effective when instances are equal.</li>
  <li><strong>Least connections</strong> — Route to the instance with fewest active connections. Better when requests vary in processing time.</li>
  <li><strong>IP hash</strong> — Same client IP always routes to the same instance. Useful for sticky sessions (but try to avoid needing this).</li>
  <li><strong>Weighted</strong> — Send more traffic to more powerful instances.</li>
</ul>

<h3>API Gateway</h3>

<p>In microservice architectures, an API gateway sits in front of all services and handles cross-cutting concerns:</p>

<ul>
  <li>Authentication / JWT validation</li>
  <li>Rate limiting</li>
  <li>Request routing</li>
  <li>SSL termination</li>
  <li>Logging and tracing</li>
</ul>

<p>This keeps each individual service from having to implement these concerns. In a bank, the gateway enforces that every request carries a valid token before it ever reaches the payment service.</p>

<pre><code>
  Client
    │
    ▼
[API Gateway]  ← auth, rate-limit, routing
    │
    ├──► [Account Service]
    ├──► [Payment Service]
    └──► [Notification Service]
</code></pre>

<h3>Health Checks</h3>

<p>Load balancers need to know which instances are healthy. Services expose a <code>/health</code> endpoint; the load balancer polls it and stops routing to instances that fail. In Spring Boot, Spring Actuator gives you this for free at <code>/actuator/health</code>.</p>
`
    },
    {
      id: "reliability",
      title: "Reliability & Fault Tolerance",
      content: `
<p>At scale, failures are not exceptional — they are routine. A senior engineer designs systems that degrade gracefully rather than fail completely.</p>

<h3>Key Reliability Concepts</h3>

<p><strong>Single Point of Failure (SPOF)</strong> — Any component whose failure brings down the whole system. Eliminate them with redundancy: run multiple instances, use replicated databases, deploy across availability zones.</p>

<p><strong>Failover</strong> — When the primary fails, traffic automatically switches to a standby. A primary-replica database setup allows read traffic to continue from replicas if the primary goes down.</p>

<p><strong>Circuit Breaker</strong> — If a downstream service is failing, stop hammering it with requests. After N consecutive failures, "open" the circuit and return a fallback immediately. After a timeout, allow a probe request through ("half-open"). This prevents cascading failures.</p>

<pre><code class="java">// Resilience4j circuit breaker (common in Spring Boot)
@CircuitBreaker(name = "creditScoreService", fallbackMethod = "defaultScore")
public CreditScore getCreditScore(String customerId) {
    return creditBureauClient.check(customerId);
}

public CreditScore defaultScore(String customerId, Exception ex) {
    // Return a conservative default instead of crashing
    return CreditScore.conservative();
}</code></pre>

<p><strong>Retry with backoff</strong> — Transient failures (network blip, temporary overload) often resolve on retry. But don't retry immediately in a tight loop — use exponential backoff to avoid making an overloaded service worse.</p>

<p><strong>Idempotency</strong> — In banking this is critical. If a "transfer $100" request times out, did it execute? The client retries — will the customer be charged twice? Design operations to be idempotent: a retry with the same idempotency key produces the same result without double-executing.</p>

<pre><code class="java">// Idempotent payment endpoint
@PostMapping("/payments")
public PaymentResult createPayment(
    @RequestHeader("Idempotency-Key") String key,
    @RequestBody PaymentRequest req) {

    // Return existing result if this key was already processed
    return paymentService.processIdempotent(key, req);
}</code></pre>

<div class="callout">
  <strong>The key mindset shift:</strong> Stop asking "what happens when everything works?" Start asking "what happens when this specific component fails?" Design the answer before it happens in production.
</div>
`
    }
  ]
},

"design-patterns": {
  title: "Design Patterns",
  icon: "🧩",
  xpMax: 350,
  sections: [
    {
      id: "what-are-patterns",
      title: "What Are Design Patterns?",
      content: `
<p>Design patterns are <strong>named solutions to recurring problems</strong>. They're not libraries you import — they're vocabulary for communicating structure. When a senior engineer says "use a Strategy here," everyone on the team immediately understands the shape of the solution.</p>

<p>The classic reference is the <em>Gang of Four</em> book (1994), which organized 23 patterns into three categories:</p>

<ul>
  <li><strong>Creational</strong> — how objects are created (Builder, Factory, Singleton)</li>
  <li><strong>Structural</strong> — how objects are composed (Decorator, Facade, Adapter)</li>
  <li><strong>Behavioral</strong> — how objects communicate (Strategy, Observer, Command)</li>
</ul>

<div class="callout">
  <strong>The trap:</strong> Pattern overuse. Applying a pattern where a simple function would do is an antipattern in itself. Use patterns when you can name the specific problem they solve, not to appear sophisticated.
</div>

<p>In a Spring Boot codebase, you are already using patterns constantly — Spring's own framework is built on them. The goal here is to recognize them, name them, and know when to reach for them yourself.</p>
`
    },
    {
      id: "strategy-pattern",
      title: "Strategy Pattern",
      content: `
<p>The Strategy pattern defines a <strong>family of interchangeable algorithms</strong> and lets you swap them at runtime without changing the code that uses them. It's one of the most useful patterns in business applications.</p>

<h3>The Problem</h3>

<p>A bank charges different fees depending on account type: premium accounts pay 0.1%, standard accounts pay 0.5%, student accounts pay nothing. Without Strategy:</p>

<pre><code class="java">// ❌ Every new account type requires modifying this method
public BigDecimal calculateFee(Transaction tx, String accountType) {
    if (accountType.equals("PREMIUM")) return tx.amount().multiply(new BigDecimal("0.001"));
    if (accountType.equals("STANDARD")) return tx.amount().multiply(new BigDecimal("0.005"));
    if (accountType.equals("STUDENT")) return BigDecimal.ZERO;
    throw new IllegalArgumentException("Unknown type");
}</code></pre>

<h3>With Strategy</h3>

<pre><code class="java">// ✅ Adding a new account type = new class, zero changes to existing code
public interface FeeStrategy {
    BigDecimal calculate(Transaction tx);
}

@Component("PREMIUM")
public class PremiumFeeStrategy implements FeeStrategy {
    public BigDecimal calculate(Transaction tx) {
        return tx.amount().multiply(new BigDecimal("0.001"));
    }
}

@Component("STUDENT")
public class StudentFeeStrategy implements FeeStrategy {
    public BigDecimal calculate(Transaction tx) { return BigDecimal.ZERO; }
}

@Service
public class FeeService {
    @Autowired Map&lt;String, FeeStrategy&gt; strategies; // Spring injects all implementations

    public BigDecimal calculateFee(Transaction tx, String accountType) {
        return strategies.get(accountType).calculate(tx);
    }
}</code></pre>

<p>Spring's ability to inject all implementations of an interface into a Map makes Strategy particularly clean in Java. Adding a new account type is a new class — nothing else changes.</p>

<p>This is also a direct application of the <strong>Open/Closed Principle</strong>: open for extension, closed for modification.</p>
`
    },
    {
      id: "builder-pattern",
      title: "Builder Pattern",
      content: `
<p>The Builder pattern constructs <strong>complex objects step by step</strong>, separating construction from representation. You use it constantly in Java, often without realizing it.</p>

<h3>The Problem It Solves</h3>

<p>A <code>TransferRequest</code> object has 8 fields. Some are optional. A constructor with 8 parameters is unreadable and error-prone — did you put amount before currency or after?</p>

<pre><code class="java">// ❌ Telescoping constructor — which arg is which?
new TransferRequest("ACC001", "ACC002", new BigDecimal("1000"), "GBP", true, null, "REF-123", Instant.now());</code></pre>

<h3>With Builder</h3>

<pre><code class="java">// ✅ Readable, self-documenting, optional fields handled cleanly
TransferRequest request = TransferRequest.builder()
    .fromAccount("ACC001")
    .toAccount("ACC002")
    .amount(new BigDecimal("1000"))
    .currency("GBP")
    .urgent(true)
    .reference("REF-123")
    .build();
</code></pre>

<p>In modern Java projects, <strong>Lombok's <code>@Builder</code></strong> generates this for you:</p>

<pre><code class="java">@Builder
@Value // immutable
public class TransferRequest {
    String fromAccount;
    String toAccount;
    BigDecimal amount;
    String currency;
    boolean urgent;
    String note;      // optional — defaults to null
    String reference;
    Instant requestedAt;
}</code></pre>

<h3>You Use It Everywhere Already</h3>

<ul>
  <li><code>HttpRequest.newBuilder()...build()</code></li>
  <li><code>ResponseEntity.ok().header(...).body(...)</code></li>
  <li>Spring Security's <code>http.authorizeRequests()...build()</code></li>
  <li>JPA's <code>CriteriaBuilder</code></li>
</ul>

<p>Recognize the pattern in unfamiliar APIs — chained method calls returning <code>this</code>, terminated by <code>build()</code> — and you'll read new libraries faster.</p>
`
    },
    {
      id: "decorator-pattern",
      title: "Decorator Pattern",
      content: `
<p>The Decorator pattern <strong>wraps an object to add behaviour without changing the original class</strong>. It's the structural backbone of AOP (Aspect-Oriented Programming), which Spring uses extensively.</p>

<h3>Manual Decorator</h3>

<p>You have a <code>PaymentService</code>. You want to add logging and timing without touching the service itself:</p>

<pre><code class="java">public interface PaymentService {
    PaymentResult process(PaymentRequest req);
}

@Primary
@Service
public class LoggingPaymentService implements PaymentService {
    private final PaymentService delegate; // wraps the real service
    private final Logger log = LoggerFactory.getLogger(getClass());

    public LoggingPaymentService(@Qualifier("realPaymentService") PaymentService delegate) {
        this.delegate = delegate;
    }

    public PaymentResult process(PaymentRequest req) {
        log.info("Processing payment {}", req.reference());
        long start = System.currentTimeMillis();
        PaymentResult result = delegate.process(req); // delegate to original
        log.info("Completed in {}ms", System.currentTimeMillis() - start);
        return result;
    }
}</code></pre>

<h3>Spring AOP = Decorator Under the Hood</h3>

<p>When you write <code>@Transactional</code> or <code>@Cacheable</code>, Spring wraps your bean in a proxy that adds that behaviour. You never see the wrapper, but it's a decorator.</p>

<pre><code class="java">@Service
public class AccountService {

    @Transactional          // Spring wraps this method in a transaction decorator
    @Cacheable("accounts")  // and a caching decorator
    public Account findById(String id) {
        return accountRepository.findById(id).orElseThrow();
    }
}</code></pre>

<div class="callout">
  <strong>Key insight:</strong> Every time you add a Spring annotation that changes behaviour without modifying logic (<code>@Transactional</code>, <code>@Cacheable</code>, <code>@Secured</code>, <code>@Retryable</code>), you are using the Decorator pattern via AOP. Understanding this makes Spring's proxy model far less mysterious.
</div>
`
    },
    {
      id: "anti-patterns",
      title: "Anti-patterns",
      content: `
<p>An anti-pattern is a response to a recurring problem that seems reasonable but makes things worse. Knowing them by name lets you spot and name the problem in code reviews.</p>

<h3>God Object</h3>

<p>A class that knows too much or does too much. It accumulates responsibilities over time until it's impossible to test or change in isolation.</p>

<pre><code class="java">// ❌ One class owns validation, fee calculation, notification, audit, and persistence
public class TransactionManager {
    public void process(Transaction tx) {
        validate(tx);
        BigDecimal fee = calculateFee(tx);
        save(tx, fee);
        sendEmail(tx);
        writeAuditLog(tx);
        updateMetrics(tx);
    }
    // ...200 more lines
}</code></pre>

<p>The fix: split by responsibility. Each concern gets its own class. <code>TransactionManager</code> becomes a thin coordinator — or a Facade.</p>

<h3>Anemic Domain Model</h3>

<p>Entities are pure data bags with no behaviour. All logic lives in services.</p>

<pre><code class="java">// ❌ Anemic — Account is just getters/setters, no behaviour
public class Account {
    private BigDecimal balance;
    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
}

// Logic scattered across services
public class AccountService {
    public void withdraw(Account account, BigDecimal amount) {
        if (account.getBalance().compareTo(amount) < 0) throw new InsufficientFundsException();
        account.setBalance(account.getBalance().subtract(amount));
    }
}</code></pre>

<pre><code class="java">// ✅ Rich domain model — behaviour lives on the entity
public class Account {
    private BigDecimal balance;

    public void withdraw(BigDecimal amount) {
        if (balance.compareTo(amount) < 0) throw new InsufficientFundsException();
        balance = balance.subtract(amount);
    }
}</code></pre>

<p>The anemic model is common in Spring Boot codebases because <code>@Entity</code> classes are often treated as simple DTOs. It's not always wrong, but when business rules multiply, push logic back onto the domain object.</p>

<h3>Spaghetti Code</h3>

<p>Tangled control flow with no clear structure — deep nesting, large methods, logic scattered across unrelated classes. Symptoms: methods longer than a screen, deeply nested if/else, no single place to look for a given behaviour.</p>

<div class="callout">
  <strong>Rule of thumb:</strong> If you can't describe what a class does in one sentence, it's probably a God object. If you can't find where a business rule lives without searching, it's probably spaghetti.
</div>
`
    },
    {
      id: "when-not-to-use",
      title: "When NOT to use patterns",
      content: `
<p>The most expensive pattern mistake isn't using the wrong one — it's using any pattern where none is needed. YAGNI (You Aren't Gonna Need It) applies directly here.</p>

<h3>Signs you're over-engineering</h3>

<ul>
  <li><strong>One concrete implementation:</strong> A Strategy with a single implementation is just an interface for its own sake. Add the second algorithm when it exists, not in anticipation.</li>
  <li><strong>Two-field objects:</strong> A Builder for a class with two required fields is ceremony. Use a constructor.</li>
  <li><strong>Single service call:</strong> A Facade over one method on one service adds indirection with no payoff.</li>
  <li><strong>Pattern-shaped refactors with no new requirement:</strong> "Let's extract a Strategy here in case we need a second algorithm" — this is speculative complexity.</li>
</ul>

<h3>The test</h3>

<p>Before reaching for a pattern, ask: <em>what specific problem does this solve today?</em> If you can't name a concrete problem — a real second algorithm, a real complex object, a real subsystem — don't use the pattern.</p>

<pre><code class="java">// ❌ Over-engineered — there is only ever one fee calculation
public interface FeeStrategy { BigDecimal calculate(Transaction tx); }

@Component
public class StandardFeeStrategy implements FeeStrategy {
    public BigDecimal calculate(Transaction tx) {
        return tx.amount().multiply(new BigDecimal("0.005"));
    }
}

// ✅ Just a method
public BigDecimal calculateFee(Transaction tx) {
    return tx.amount().multiply(new BigDecimal("0.005"));
}</code></pre>

<h3>In a banking context</h3>

<p>Banks have strict change management. Every class, interface, and layer of indirection must be reviewed, tested, and maintained. Unnecessary abstractions aren't neutral — they have a cost in every future change.</p>

<div class="callout">
  <strong>The senior engineer move:</strong> Knowing a pattern well enough to choose <em>not</em> to use it. Junior engineers apply patterns to appear sophisticated; senior engineers apply them because they've named a specific problem the pattern solves.
</div>
`
    },
    {
      id: "facade-pattern",
      title: "Facade Pattern",
      content: `
<p>The Facade pattern provides a <strong>simplified interface to a complex subsystem</strong>. Rather than callers knowing about 5 internal services, they interact with one surface that orchestrates them.</p>

<h3>Banking Example</h3>

<p>Opening a new bank account involves: KYC verification, credit check, account creation, welcome notification, and audit logging. Without a facade, the controller knows about all of it:</p>

<pre><code class="java">// ❌ Controller doing too much orchestration
@PostMapping("/accounts")
public Account openAccount(@RequestBody NewAccountRequest req) {
    kycService.verify(req.customerId());
    CreditScore score = creditService.check(req.customerId());
    Account account = accountRepository.create(req, score);
    notificationService.sendWelcome(account);
    auditService.log("ACCOUNT_OPENED", account);
    return account;
}</code></pre>

<pre><code class="java">// ✅ Facade hides the complexity
@PostMapping("/accounts")
public Account openAccount(@RequestBody NewAccountRequest req) {
    return accountOpeningFacade.open(req); // single call
}

@Service
public class AccountOpeningFacade {
    public Account open(NewAccountRequest req) {
        kycService.verify(req.customerId());
        CreditScore score = creditService.check(req.customerId());
        Account account = accountRepository.create(req, score);
        notificationService.sendWelcome(account);
        auditService.log("ACCOUNT_OPENED", account);
        return account;
    }
}</code></pre>

<p>The controller is now trivially testable. The orchestration logic lives in one place. If the account-opening process changes, you update the facade — not every controller that participates in it.</p>

<h3>Facade vs Service Layer</h3>

<p>In Spring Boot, your <code>@Service</code> classes often <em>are</em> facades — they hide repository and domain complexity from controllers. The distinction matters when a service grows too large: split the internal complexity into focused sub-services, then keep the facade as the public entry point.</p>

<div class="callout">
  <strong>Recognizing the pattern in code reviews:</strong> If a controller method is longer than ~10 lines and calls more than 2–3 services, it's probably missing a facade. Extract the orchestration.
</div>
`
    }
  ]
},

"distributed-systems": {
  title: "Distributed Systems",
  icon: "🌐",
  xpMax: 500,
  sections: [
    {
      id: "what-are-distributed-systems",
      title: "What Are Distributed Systems?",
      content: `
<p>A distributed system is a set of independent components, running on different machines, that must work together and appear as one coherent system. The moment you have a load balancer in front of two service instances, a database with a read replica, or a cache cluster — you are already operating a distributed system, whether or not it feels like one.</p>

<p>The single hardest thing about distributed systems is this: <strong>the network is not reliable</strong>. A local method call either succeeds or throws. A network call can succeed, fail, or — worst of all — <em>you never find out</em>, because the response was lost even though the operation completed on the other end.</p>

<h3>The Fallacies of Distributed Computing</h3>

<p>A famous list of assumptions engineers make that are all false:</p>

<ul>
  <li>The network is reliable</li>
  <li>Latency is zero</li>
  <li>Bandwidth is infinite</li>
  <li>The network is secure</li>
  <li>Topology doesn't change</li>
  <li>There is one administrator</li>
  <li>Transport cost is zero</li>
  <li>The network is homogeneous</li>
</ul>

<div class="callout callout-warning">
  <strong>Why this matters at a bank:</strong> A payment service calling a fraud-check service over the network can time out with the fraud check <em>having already run</em>. If you treat "no response" as "it didn't happen" and retry blindly, you risk a double charge. Every distributed interaction needs an explicit answer to: what happens if this call times out?
</div>
`
    },
    {
      id: "cap-theorem",
      title: "The CAP Theorem",
      content: `
<p>When a network partition happens — two parts of your system can't talk to each other — you must choose between two guarantees:</p>

<ul>
  <li><strong>Consistency (C)</strong> — every read sees the most recent write, everywhere.</li>
  <li><strong>Availability (A)</strong> — every request gets a response, even if it might not be the latest data.</li>
</ul>

<p>You cannot have both during a partition. <strong>Partition tolerance (P) is not optional</strong> — networks partition whether you like it or not, so in practice the real choice is CP or AP.</p>

<table>
  <thead>
    <tr><th>Choice</th><th>Behavior during a partition</th><th>Banking example</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>CP</strong></td>
      <td>Reject requests rather than risk an inconsistent answer</td>
      <td>The core ledger. Better to reject a transfer than let two data centers disagree on an account balance.</td>
    </tr>
    <tr>
      <td><strong>AP</strong></td>
      <td>Keep answering, accept the data might be a few seconds stale</td>
      <td>"Recent transactions" list on a mobile app. Showing a transaction 2 seconds late is fine; showing an error is not.</td>
    </tr>
  </tbody>
</table>

<div class="callout">
  <strong>Key insight:</strong> CAP is not a property of your whole system — it's a property of each individual operation. The same bank can run CP for balance-affecting writes and AP for read-only dashboards. Deciding which each endpoint needs is a design decision you make explicitly, not by accident.
</div>
`
    },
    {
      id: "consistency-models",
      title: "Consistency Models",
      content: `
<p>"Consistency" is not binary — it's a spectrum, and picking the wrong point on it causes real bugs.</p>

<table>
  <thead>
    <tr><th>Model</th><th>Guarantee</th><th>Cost</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Strong consistency</strong></td><td>Every read sees the latest write immediately</td><td>Higher latency, lower availability</td></tr>
    <tr><td><strong>Eventual consistency</strong></td><td>All replicas converge <em>eventually</em>, given no new writes</td><td>Reads can be stale for a window</td></tr>
    <tr><td><strong>Read-your-writes</strong></td><td>A user always sees their own writes, even if others don't yet</td><td>Requires routing a user's reads to the replica that has their write</td></tr>
</tbody>
</table>

<h3>A Bug This Causes in Real Banking Apps</h3>

<pre><code class="java">// Customer transfers $500, then immediately refreshes their balance
transferService.transfer(from, to, amount);           // writes to primary DB
BigDecimal balance = accountRepository.getBalance(from); // reads from a replica

// If the replica hasn't caught up yet, the customer sees their OLD balance
// right after making a transfer they just watched succeed — this reads as a bug
// even though the system is "eventually consistent" and technically correct.</code></pre>

<p>The fix is usually one of: route the immediate post-write read to the primary, cache the just-written value client-side, or accept the staleness and design the UI to say "processing" rather than showing a number that might be wrong.</p>

<div class="callout callout-warning">
  Eventual consistency is a legitimate, common trade-off — but it must be a <em>decision</em>, not something discovered in production when a customer calls in confused about their balance.
</div>
`
    },
    {
      id: "consensus-coordination",
      title: "Consensus & Coordination",
      content: `
<p>Some operations must happen on exactly one node, even when you're running many instances of a service. A nightly batch job that calculates interest must not run twice — double-running it means double-crediting every account.</p>

<h3>Distributed Locks</h3>

<p>A distributed lock ensures only one instance proceeds, coordinated through a shared system like Redis, Zookeeper, or a database row.</p>

<pre><code class="java">// ShedLock — a common Spring Boot library for exactly this problem
@Scheduled(cron = "0 0 1 * * *")
@SchedulerLock(name = "calculateNightlyInterest", lockAtMostFor = "30m")
public void calculateNightlyInterest() {
    // Even with 5 instances of this service running, only one executes this
    accountService.applyInterestToAllAccounts();
}</code></pre>

<h3>Leader Election</h3>

<p>Instead of locking per-operation, some systems elect one instance as "leader" that handles all coordination duties, with the others on standby ready to take over if it dies. This is how Kafka brokers, Zookeeper ensembles, and many databases (e.g. a Postgres primary-replica setup) organize themselves. The underlying algorithms — Raft and Paxos — solve the same core problem: getting a group of unreliable nodes to agree on one fact (who's the leader, what's the next log entry) even when some nodes fail or messages are lost.</p>

<div class="callout">
  <strong>You rarely implement Raft or Paxos yourself.</strong> The value as an engineer is recognizing when you have a "must run once" or "must all agree" problem, and reaching for a battle-tested tool (Zookeeper, etcd, a DB-backed lock, ShedLock) instead of hand-rolling coordination logic — hand-rolled consensus is a notorious source of subtle, hard-to-reproduce production bugs.
</div>
`
    },
    {
      id: "distributed-transactions-saga",
      title: "Distributed Transactions & the Saga Pattern",
      content: `
<p>A single-database transaction is easy: <code>BEGIN</code>, do work, <code>COMMIT</code> or <code>ROLLBACK</code>. But what if a transfer must debit an account owned by the "Accounts" service and credit one owned by the "Payments" service — two separate databases, no shared transaction?</p>

<h3>Two-Phase Commit (2PC) — and Why It's Rare Today</h3>

<p>2PC coordinates a commit across multiple databases: a coordinator asks every participant "can you commit?" (phase 1), and only if everyone says yes does it tell them all to actually commit (phase 2). It gives strong consistency, but the coordinator is a single point of failure and participants hold locks while waiting — under network issues, resources can be blocked for a long time. Most modern microservice architectures avoid it.</p>

<h3>The Saga Pattern</h3>

<p>A saga breaks a distributed transaction into a sequence of local transactions, each with a <strong>compensating action</strong> that undoes it if a later step fails.</p>

<pre><code class="java">// Money transfer as a saga across two services
public class TransferSaga {
    public void execute(TransferRequest req) {
        try {
            accountsService.debit(req.fromAccount(), req.amount());     // step 1
            paymentsService.credit(req.toAccount(), req.amount());      // step 2
        } catch (CreditFailedException e) {
            accountsService.compensateDebit(req.fromAccount(), req.amount()); // undo step 1
            throw new TransferFailedException(req, e);
        }
    }
}</code></pre>

<p>Two coordination styles:</p>

<ul>
  <li><strong>Orchestration</strong> — a central saga coordinator calls each service and decides what happens next (shown above). Easier to reason about and debug.</li>
  <li><strong>Choreography</strong> — each service publishes an event when it finishes, and the next service reacts to that event. No central coordinator, but the overall flow is harder to see in one place.</li>
</ul>

<div class="callout callout-warning">
  <strong>Sagas trade atomicity for availability.</strong> There is a real window where the debit has happened but the credit hasn't. Your system must tolerate that window being observed — e.g. by making balances eventually consistent and reconciling, or by holding funds "pending" until the saga completes. This is a genuine design decision, not an implementation detail to skip over.
</div>
`
    },
    {
      id: "messaging-delivery-guarantees",
      title: "Messaging & Delivery Guarantees",
      content: `
<p>Asynchronous messaging (Kafka, RabbitMQ, SQS) decouples services in time — the producer doesn't wait for the consumer. This is central to event-driven banking systems: a "transaction completed" event might be consumed by fraud detection, notifications, and analytics, all independently.</p>

<h3>Delivery Guarantees</h3>

<table>
  <thead>
    <tr><th>Guarantee</th><th>Meaning</th><th>Risk</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>At-most-once</strong></td><td>Message delivered zero or one times</td><td>Messages can be silently lost</td></tr>
    <tr><td><strong>At-least-once</strong></td><td>Message delivered one or more times</td><td>Duplicates are possible and must be handled</td></tr>
    <tr><td><strong>Exactly-once</strong></td><td>Message delivered and processed exactly once</td><td>Hard to achieve end-to-end; usually simulated</td></tr>
  </tbody>
</table>

<p>In practice, almost every real system runs <strong>at-least-once</strong> delivery and achieves the effect of exactly-once through <strong>idempotent consumers</strong> — the same discipline used for idempotent API endpoints.</p>

<pre><code class="java">@KafkaListener(topics = "transaction-completed")
public void onTransactionCompleted(TransactionEvent event) {
    // Guard against duplicate delivery — Kafka guarantees at-least-once
    if (processedEvents.exists(event.id())) {
        return; // already handled this exact event, skip
    }
    fraudCheckService.evaluate(event);
    processedEvents.markProcessed(event.id());
}</code></pre>

<div class="callout">
  <strong>Rule of thumb:</strong> Never assume a message arrives exactly once. Design every consumer to be safe if it receives the same message twice — checking an idempotency key or event ID before acting is nearly always cheaper than the alternative: debugging a production incident where a customer got charged, or notified, twice.
</div>
`
    }
  ]
},

"databases": {
  title: "Databases & Data Modeling",
  icon: "🗄️",
  xpMax: 400,
  sections: [
    {
      id: "choosing-a-database",
      title: "Choosing a Database",
      content: `
<p>"SQL vs NoSQL" is the wrong frame. The right question is: <strong>what are the access patterns, and what consistency does this data need?</strong></p>

<table>
  <thead>
    <tr><th>Type</th><th>Strengths</th><th>Banking use case</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Relational (Postgres, MySQL, Oracle)</strong></td><td>ACID transactions, joins, strong schema, mature tooling</td><td>Core ledger, account data, anything requiring double-entry bookkeeping correctness</td></tr>
    <tr><td><strong>Document (MongoDB)</strong></td><td>Flexible schema, nested data, fast iteration</td><td>Customer profile data, KYC document metadata</td></tr>
    <tr><td><strong>Key-value (Redis, DynamoDB)</strong></td><td>Extremely fast reads/writes on simple lookups</td><td>Session storage, caching, rate-limit counters</td></tr>
    <tr><td><strong>Columnar (Cassandra, BigQuery)</strong></td><td>Massive write throughput, analytical scans</td><td>Transaction logs, audit trails, fraud analytics at scale</td></tr>
    <tr><td><strong>Search (Elasticsearch)</strong></td><td>Full-text search, fuzzy matching</td><td>Searching customer support tickets, transaction descriptions</td></tr>
  </tbody>
</table>

<div class="callout callout-warning">
  <strong>Default to relational at a bank.</strong> Money requires ACID guarantees, and the cost of a NoSQL database silently losing consistency on financial data is enormous. Reach for a specialized store only when you can name the specific access pattern the relational database handles poorly — e.g. "we need sub-millisecond session lookups at 50k requests/sec," not "NoSQL scales better" as a vague generality.
</div>
`
    },
    {
      id: "data-modeling",
      title: "Data Modeling & Normalization",
      content: `
<p>Normalization organizes data to eliminate redundancy: each fact lives in exactly one place. This matters enormously for financial data — a customer's name should exist in one row, not copied into every transaction record, or an update can leave the copies disagreeing.</p>

<pre><code class="java">// ❌ Denormalized — customer name duplicated on every row
// transactions(id, customer_id, customer_name, amount, date)
// Update the customer's name? Now you must update thousands of transaction rows.

// ✅ Normalized — one source of truth
// customers(id, name)
// transactions(id, customer_id, amount, date)  -- joins to customers for the name</code></pre>

<h3>When to Denormalize Anyway</h3>

<p>Normalization isn't free — it costs joins, and joins cost query performance. Deliberately denormalizing (duplicating some data) is a valid trade-off when read performance matters more than write simplicity, as long as you accept the responsibility of keeping the copies in sync.</p>

<div class="callout">
  A transaction statement often stores a <em>snapshot</em> of the account name and address at the time of the transaction, deliberately denormalized — because a statement must show what was true <em>then</em>, not what's true today if the customer later changes their name.
</div>
`
    },
    {
      id: "indexing",
      title: "Indexing",
      content: `
<p>An index lets the database find rows without scanning the whole table — the difference between a full table scan and a lookup that's effectively instant, even at millions of rows.</p>

<pre><code class="sql">-- Without an index: full table scan of every transaction ever made
SELECT * FROM transactions WHERE account_id = 'ACC001' AND created_at > '2026-01-01';

-- Add an index on the columns you filter by
CREATE INDEX idx_transactions_account_date ON transactions(account_id, created_at);</code></pre>

<h3>Indexes Are Not Free</h3>

<p>Every index speeds up reads that use it but slows down every <code>INSERT</code>, <code>UPDATE</code>, and <code>DELETE</code> on that table, because the index itself must be updated too. A table with 15 indexes "just in case" is a table with slow writes for no measured benefit.</p>

<div class="callout callout-warning">
  <strong>The senior engineer move:</strong> add an index because a specific slow query's execution plan (<code>EXPLAIN ANALYZE</code>) shows a sequential scan on a large table — not preemptively on every column that "might" be queried someday.
</div>
`
    },
    {
      id: "transactions-acid",
      title: "Transactions & ACID",
      content: `
<p>ACID is the contract that makes a database safe to build a ledger on:</p>

<ul>
  <li><strong>Atomicity</strong> — a transaction fully happens or fully doesn't. A transfer's debit and credit succeed together or not at all.</li>
  <li><strong>Consistency</strong> — a transaction moves the database from one valid state to another (constraints, foreign keys hold).</li>
  <li><strong>Isolation</strong> — concurrent transactions don't see each other's uncommitted changes.</li>
  <li><strong>Durability</strong> — once committed, data survives a crash.</li>
</ul>

<h3>Isolation Levels — Where the Real Bugs Live</h3>

<table>
  <thead>
    <tr><th>Level</th><th>Prevents</th><th>Allows</th></tr>
  </thead>
  <tbody>
    <tr><td>Read Uncommitted</td><td>Nothing</td><td>Dirty reads — seeing another transaction's uncommitted change</td></tr>
    <tr><td>Read Committed</td><td>Dirty reads</td><td>Non-repeatable reads — same query, different result, within one transaction</td></tr>
    <tr><td>Repeatable Read</td><td>Non-repeatable reads</td><td>Phantom reads — a new row appears on re-query</td></tr>
    <tr><td>Serializable</td><td>All of the above</td><td>Nothing — but at the cost of throughput</td></tr>
  </tbody>
</table>

<h3>A Classic Race Condition</h3>

<pre><code class="java">// ❌ Race condition: two concurrent withdrawals can both pass the check
public void withdraw(String accountId, BigDecimal amount) {
    BigDecimal balance = accountRepository.getBalance(accountId); // read
    if (balance.compareTo(amount) < 0) throw new InsufficientFundsException();
    accountRepository.setBalance(accountId, balance.subtract(amount)); // write
    // Between read and write, another thread's withdrawal can slip in —
    // both reads saw a sufficient balance, both writes succeed, account goes negative
}

// ✅ Let the database enforce it atomically
@Query("UPDATE Account a SET a.balance = a.balance - :amount " +
       "WHERE a.id = :id AND a.balance >= :amount")
int withdraw(String id, BigDecimal amount); // returns 0 rows updated if insufficient</code></pre>

<div class="callout">
  Most balance bugs aren't caused by picking the wrong isolation level — they're caused by a read-then-write pattern in application code that should have been a single atomic database operation.
</div>
`
    },
    {
      id: "replication-sharding",
      title: "Replication & Sharding",
      content: `
<p>As a single database instance runs out of capacity, you scale it in two different ways that solve two different problems.</p>

<h3>Replication — Scaling Reads, Adding Durability</h3>

<p>A primary database handles writes; one or more replicas continuously copy its data and can serve reads. This scales read throughput and gives you a failover target if the primary dies — but replicas typically lag the primary by a small amount, which is exactly the read-your-writes problem covered in distributed systems.</p>

<h3>Sharding — Scaling Writes</h3>

<p>Sharding splits one logical table across multiple physical databases, each holding a subset of rows, chosen by a shard key.</p>

<pre><code>-- Shard by customer region — a common banking approach
Shard 1: customers with account_id starting 'EU-...'
Shard 2: customers with account_id starting 'US-...'
Shard 3: customers with account_id starting 'APAC-...'</code></pre>

<div class="callout callout-warning">
  <strong>Sharding is expensive to retrofit.</strong> Cross-shard joins and transactions become hard or impossible — a transfer between an EU-shard account and a US-shard account can no longer be one local database transaction, forcing you into saga-style patterns. Reach for sharding only once you have evidence a single database's write capacity is the actual bottleneck, not as a default for "web scale."
</div>
`
    },
    {
      id: "orm-pitfalls",
      title: "ORM Pitfalls: The N+1 Query",
      content: `
<p>Spring Data JPA / Hibernate make database access convenient — and make it easy to accidentally write catastrophically slow code without a single line looking wrong.</p>

<pre><code class="java">// ❌ N+1 query problem
List&lt;Account&gt; accounts = accountRepository.findAll();       // 1 query
for (Account a : accounts) {
    a.getTransactions().size();  // lazy-loaded — 1 query PER account
}
// 1,000 accounts = 1,001 queries instead of 2</code></pre>

<pre><code class="java">// ✅ Fetch join — one query, eagerly loads the association
@Query("SELECT a FROM Account a LEFT JOIN FETCH a.transactions")
List&lt;Account&gt; findAllWithTransactions();</code></pre>

<div class="callout">
  <strong>How to catch this before production:</strong> enable Hibernate's SQL logging in local/test environments and actually look at query counts for a page that lists accounts. An endpoint that silently issues 1,001 queries at 50ms each is a 50-second response time waiting to happen the moment traffic grows.
</div>
`
    }
  ]
},

"apis": {
  title: "APIs & Protocols",
  icon: "🔌",
  xpMax: 300,
  sections: [
    {
      id: "rest-fundamentals",
      title: "REST Fundamentals",
      content: `
<p>REST models a system as <strong>resources</strong> (nouns), manipulated through a small set of HTTP verbs. Getting this right makes an API predictable to every consumer — including the Angular frontend calling it.</p>

<table>
  <thead>
    <tr><th>Verb</th><th>Meaning</th><th>Example</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>GET</strong></td><td>Read, no side effects</td><td><code>GET /accounts/123/transactions</code></td></tr>
    <tr><td><strong>POST</strong></td><td>Create a new resource</td><td><code>POST /accounts/123/transfers</code></td></tr>
    <tr><td><strong>PUT</strong></td><td>Replace a resource entirely</td><td><code>PUT /accounts/123/profile</code></td></tr>
    <tr><td><strong>PATCH</strong></td><td>Partially update a resource</td><td><code>PATCH /accounts/123</code> with just the changed fields</td></tr>
    <tr><td><strong>DELETE</strong></td><td>Remove a resource</td><td><code>DELETE /accounts/123/standing-orders/9</code></td></tr>
  </tbody>
</table>

<pre><code class="java">// ❌ Verb-based URL — not resource-oriented
POST /getAccountTransactions
POST /createTransfer

// ✅ Resource-oriented, uses HTTP verbs to express the action
GET  /accounts/{id}/transactions
POST /accounts/{id}/transfers</code></pre>

<h3>Status Codes That Actually Mean Something</h3>

<ul>
  <li><strong>200 OK</strong> — success with a body</li>
  <li><strong>201 Created</strong> — a resource was created (with a <code>Location</code> header)</li>
  <li><strong>204 No Content</strong> — success, nothing to return</li>
  <li><strong>400 Bad Request</strong> — the client sent invalid data</li>
  <li><strong>401 Unauthorized</strong> — no valid credentials</li>
  <li><strong>403 Forbidden</strong> — valid credentials, but not allowed to do this</li>
  <li><strong>404 Not Found</strong> — resource doesn't exist</li>
  <li><strong>409 Conflict</strong> — the request conflicts with current state (e.g. duplicate transfer)</li>
  <li><strong>422 Unprocessable Entity</strong> — well-formed request, fails business validation</li>
  <li><strong>500 Internal Server Error</strong> — your bug, not the client's</li>
</ul>

<div class="callout callout-warning">
  Returning <code>200 OK</code> with <code>{ "success": false, "error": "..." }</code> in the body defeats the purpose of HTTP status codes — every client, load balancer, and monitoring tool that understands status codes is now blind to your errors.
</div>
`
    },
    {
      id: "api-versioning",
      title: "API Versioning",
      content: `
<p>An API is a contract. Once an Angular app or a partner bank depends on a field's shape, changing it breaks them — often without you finding out until support tickets arrive.</p>

<h3>Breaking vs Non-Breaking Changes</h3>

<table>
  <thead>
    <tr><th>Non-breaking (safe)</th><th>Breaking (needs a version bump)</th></tr>
  </thead>
  <tbody>
    <tr><td>Adding a new optional field</td><td>Removing or renaming a field</td></tr>
    <tr><td>Adding a new endpoint</td><td>Changing a field's type or meaning</td></tr>
    <tr><td>Adding a new enum value <em>if clients are told to ignore unknowns</em></td><td>Making an optional field required</td></tr>
  </tbody>
</table>

<h3>Versioning Strategies</h3>

<pre><code>-- URI versioning — explicit, cacheable, easy to route
GET /v1/accounts/123
GET /v2/accounts/123

-- Header versioning — cleaner URLs, harder to discover/test
GET /accounts/123
Accept: application/vnd.bank.v2+json</code></pre>

<div class="callout">
  <strong>In banking, breaking a consumer is expensive</strong> — the caller might be a mobile app that can't be force-updated, or a partner integration that takes weeks to change on their end. Prefer additive, backward-compatible changes whenever possible, and treat a version bump as the expensive last resort, not the default way to ship any change.
</div>
`
    },
    {
      id: "idempotency-safety",
      title: "Idempotency & Safe Methods",
      content: `
<p>Two properties every API designer must reason about explicitly:</p>

<ul>
  <li><strong>Safe</strong> — the method doesn't change server state (GET, HEAD). Safe to retry, cache, and prefetch freely.</li>
  <li><strong>Idempotent</strong> — calling it once or many times has the same effect on server state (GET, PUT, DELETE are idempotent by spec; POST is not).</li>
</ul>

<p><code>POST</code> is the dangerous one, because "create a transfer" called twice creates two transfers. This is why payment APIs require an explicit idempotency key from the client.</p>

<pre><code class="java">@PostMapping("/transfers")
public TransferResult createTransfer(
    @RequestHeader("Idempotency-Key") String key,
    @RequestBody TransferRequest req) {

    Optional&lt;TransferResult&gt; existing = transferRepository.findByIdempotencyKey(key);
    if (existing.isPresent()) {
        return existing.get(); // same key, same request → return the original result, don't redo it
    }
    return transferService.execute(key, req);
}</code></pre>

<div class="callout callout-warning">
  A mobile app on a flaky connection <em>will</em> retry a POST that actually succeeded server-side but timed out client-side. Idempotency keys are not an edge case to handle later — for any endpoint that moves money, they're part of the contract from day one.
</div>
`
    },
    {
      id: "pagination-rate-limiting",
      title: "Pagination, Filtering & Rate Limiting",
      content: `
<p>Any endpoint returning a list must be designed for the day the list has a million rows, even if it has ten today.</p>

<h3>Pagination</h3>

<pre><code class="java">// Offset pagination — simple, but slow and unstable on large, changing datasets
GET /accounts/123/transactions?page=3&size=20

// Cursor pagination — stable even if rows are inserted/deleted mid-scroll,
// and doesn't degrade as the offset grows
GET /accounts/123/transactions?after=txn_9f81a2&size=20</code></pre>

<p>For a transaction history that grows unbounded and where new rows arrive constantly, cursor-based pagination avoids both the performance cliff of a large <code>OFFSET</code> and the "duplicate row" bug offset pagination has when new rows are inserted between page requests.</p>

<h3>Rate Limiting</h3>

<p>Protects the service from being overwhelmed — by a bug in a client, a retry storm, or abuse.</p>

<pre><code class="java">// Response when a client exceeds their limit
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0</code></pre>

<div class="callout">
  Returning the <code>Retry-After</code> and <code>X-RateLimit-*</code> headers turns rate limiting from a mystery into something well-behaved clients can react to correctly — instead of hammering you even harder on a tight retry loop.
</div>
`
    },
    {
      id: "api-contracts",
      title: "API Contracts",
      content: `
<p>An API contract — commonly written as an OpenAPI (Swagger) spec — defines the shape of requests and responses independently of any implementation. Contract-first development means the spec is agreed on <em>before</em> either the frontend or backend team writes code against it.</p>

<pre><code class="yaml"># Fragment of an OpenAPI spec
paths:
  /accounts/{id}/transfers:
    post:
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [toAccount, amount, currency]
              properties:
                toAccount: { type: string }
                amount: { type: number }
                currency: { type: string, enum: [GBP, USD, EUR] }
      responses:
        '201': { description: Transfer created }
        '422': { description: Business validation failed }</code></pre>

<div class="callout">
  <strong>Why this matters with an Angular frontend:</strong> a shared, versioned OpenAPI spec lets the frontend team generate a typed HTTP client and start building against a mock server before the backend endpoint exists — and it becomes the single source of truth both teams review changes against, instead of the contract living implicitly in whatever the backend happens to currently return.
</div>
`
    },
    {
      id: "sync-vs-async-apis",
      title: "Sync vs Async APIs",
      content: `
<p>Not every interaction fits a request-response call that blocks until done. Some operations take too long, or the caller doesn't need the result immediately.</p>

<table>
  <thead>
    <tr><th>Style</th><th>When to use</th><th>Banking example</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Synchronous REST</strong></td><td>Caller needs the result now, operation is fast</td><td>"Get account balance"</td></tr>
    <tr><td><strong>Polling</strong></td><td>Long-running operation, simple client</td><td>Client checks <code>GET /transfers/{id}/status</code> every few seconds</td></tr>
    <tr><td><strong>Webhooks</strong></td><td>Server-to-server, notify when something happens</td><td>Payment processor calls your endpoint when a payment settles</td></tr>
    <tr><td><strong>Message queue</strong></td><td>Internal service-to-service, decoupled, needs durability</td><td>"Transaction completed" event consumed by fraud detection</td></tr>
    <tr><td><strong>gRPC</strong></td><td>Internal, high-throughput, low-latency service-to-service calls</td><td>Real-time fraud scoring between internal services</td></tr>
  </tbody>
</table>

<div class="callout callout-warning">
  A webhook consumer must be idempotent for the same reason a POST endpoint must be — payment processors retry webhook delivery on failure, so "payment settled" can arrive twice. Treat every webhook handler as at-least-once delivery.
</div>
`
    },
    {
      id: "error-handling",
      title: "Error Handling & Status Codes",
      content: `
<p>Inconsistent error shapes across endpoints — one returns a string, another an object, another an array of strings — force every client to write bespoke handling per endpoint. Standardize on one error format across the whole API.</p>

<pre><code class="java">// RFC 7807 "Problem Details" — a widely adopted standard error shape
{
  "type": "https://api.bank.com/errors/insufficient-funds",
  "title": "Insufficient Funds",
  "status": 422,
  "detail": "Account ACC001 has a balance of 50.00 GBP, which is less than the requested 100.00 GBP",
  "instance": "/accounts/ACC001/transfers"
}</code></pre>

<pre><code class="java">@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(InsufficientFundsException.class)
    public ResponseEntity&lt;ProblemDetail&gt; handle(InsufficientFundsException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        problem.setTitle("Insufficient Funds");
        problem.setDetail(ex.getMessage());
        return ResponseEntity.of(problem).build();
    }
}</code></pre>

<div class="callout">
  A centralized <code>@RestControllerAdvice</code> ensures every controller produces errors in the same shape, without every controller method needing its own try/catch — this is the Facade/Decorator instinct from the design patterns lesson applied to error handling.
</div>
`
    }
  ]
},

"observability": {
  title: "Observability & Reliability",
  icon: "📊",
  xpMax: 400,
  sections: [
    {
      id: "three-pillars",
      title: "The Three Pillars: Logs, Metrics, Traces",
      content: `
<p>Observability is the ability to answer questions about your system's internal state <em>that you didn't anticipate needing to ask</em>, using only its external outputs. Monitoring tells you <em>that</em> something is wrong; observability helps you figure out <em>why</em>.</p>

<table>
  <thead>
    <tr><th>Pillar</th><th>Answers</th><th>Tooling example</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Logs</strong></td><td>What exactly happened, in detail, for one request</td><td>Logback, ELK stack</td></tr>
    <tr><td><strong>Metrics</strong></td><td>Aggregate numeric trends over time</td><td>Micrometer, Prometheus, Grafana</td></tr>
    <tr><td><strong>Traces</strong></td><td>How one request flowed across multiple services</td><td>OpenTelemetry, Jaeger, Zipkin</td></tr>
  </tbody>
</table>

<div class="callout">
  <strong>How they work together:</strong> a metric dashboard shows payment latency spiked at 14:32. A trace for a slow request in that window shows the time was spent in the fraud-check service. The logs for that specific trace ID show exactly why — a downstream credit bureau call retried three times before succeeding. Each pillar alone gives you a piece; together they give you the story.
</div>
`
    },
    {
      id: "structured-logging",
      title: "Structured Logging",
      content: `
<p>A log line meant to be read by a human at 3am during an incident is a very different thing from a log line meant to be queried by a machine across millions of entries. Structured logging serves both.</p>

<pre><code class="java">// ❌ Unstructured — a human can read one line, a machine can't query it
log.info("Transfer of " + amount + " from " + from + " to " + to + " completed");

// ✅ Structured — queryable: find every failed transfer for account X in the last hour
log.info("Transfer completed", kv("amount", amount), kv("from", from),
          kv("to", to), kv("correlationId", correlationId));
// → { "msg": "Transfer completed", "amount": 500, "from": "ACC001", "to": "ACC002",
//     "correlationId": "a1b2c3", "timestamp": "..." }</code></pre>

<h3>Correlation IDs</h3>

<p>A single customer request often touches five services. A correlation ID, generated at the edge (API gateway) and propagated through every downstream call and log line, lets you pull every log related to one request across every service with one query — essential for debugging a distributed system, and directly connects to the tracing covered next.</p>

<div class="callout callout-warning">
  <strong>Never log PII or PCI data</strong> — full card numbers, passwords, national ID numbers. Mask or omit them (<code>"card": "****1234"</code>). Logs are often retained for years and accessed by more people than the production database — logging sensitive data there is a compliance incident waiting to happen, not a hypothetical.
</div>
`
    },
    {
      id: "metrics-monitoring",
      title: "Metrics & Monitoring",
      content: `
<p>Metrics are numbers tracked over time. The RED method gives a simple, effective starting set for any service.</p>

<ul>
  <li><strong>Rate</strong> — requests per second</li>
  <li><strong>Errors</strong> — failed requests per second</li>
  <li><strong>Duration</strong> — how long requests take (track percentiles, not just average)</li>
</ul>

<div class="callout callout-warning">
  <strong>Averages lie.</strong> If 99 requests take 10ms and 1 takes 10 seconds, the average is ~110ms — which describes almost none of your actual traffic. Always track p50, p95, and p99 latency. The p99 is what your slowest, most frustrated 1% of customers actually experience.
</div>

<pre><code class="java">// Micrometer — Spring Boot's standard metrics facade, works with Prometheus/Grafana
@Timed(value = "transfer.duration", percentiles = { 0.5, 0.95, 0.99 })
@PostMapping("/transfers")
public TransferResult createTransfer(@RequestBody TransferRequest req) {
    return transferService.execute(req);
}</code></pre>

<h3>SLI, SLO, SLA</h3>

<ul>
  <li><strong>SLI</strong> (Service Level Indicator) — the actual measurement, e.g. "p99 transfer latency"</li>
  <li><strong>SLO</strong> (Objective) — the internal target, e.g. "p99 &lt; 500ms, 99.9% of the time"</li>
  <li><strong>SLA</strong> (Agreement) — the external, often contractual, promise — usually looser than the SLO, leaving a buffer</li>
</ul>
`
    },
    {
      id: "distributed-tracing",
      title: "Distributed Tracing",
      content: `
<p>A trace follows one request as it flows through every service it touches, recording a "span" for each hop with its duration and metadata.</p>

<pre><code>Trace: a1b2c3 (total: 340ms)
├─ API Gateway            12ms
├─ Payment Service        310ms
│  ├─ Fraud Check Service  180ms  ← the bottleneck
│  └─ Accounts Service      95ms
└─ Notification Service     8ms (async, doesn't block response)</code></pre>

<p>Without tracing, "the payment API is slow" requires guessing which of five services is responsible. With tracing, the slow span is visible immediately.</p>

<pre><code class="java">// Spring Boot + OpenTelemetry — trace context propagates automatically
// across HTTP calls and messaging, once the agent/starter is configured
@GetMapping("/accounts/{id}")
public Account getAccount(@PathVariable String id) {
    // this span, and any downstream calls it makes, are automatically
    // linked to the same trace ID as the incoming request
    return accountService.findById(id);
}</code></pre>

<div class="callout">
  The trace ID is exactly the correlation ID from the structured logging lesson — in a mature setup, they're the same identifier, letting you jump from a slow span in a trace straight to the matching log lines.
</div>
`
    },
    {
      id: "alerting",
      title: "Alerting",
      content: `
<p>An alert should mean: a human needs to act, right now. Alert on anything less than that, and engineers learn to ignore alerts — which is how a real incident gets missed inside a wall of noise.</p>

<h3>Alert on Symptoms, Not Causes</h3>

<pre><code>❌ "CPU usage above 80%" — might be fine, might be nothing a human can act on
✅ "p99 latency above 2s for 5 minutes" — a customer is actually affected right now

❌ "Disk usage above 90% on server-14" — needs a human to figure out if that matters
✅ "Write requests failing due to disk full" — directly actionable</code></pre>

<h3>Good Alerts Are Actionable</h3>

<p>Every alert should answer, in the alert itself if possible: what's broken, how bad is it, and where do I start looking (link to the relevant dashboard/runbook). An alert that just says "something is wrong" sends the on-call engineer straight into ten minutes of investigation before they even know what they're investigating.</p>

<div class="callout callout-warning">
  <strong>Banking example:</strong> a spike in failed fraud checks could mean the fraud service is down (page immediately — legitimate transactions are being blocked) or could mean fraud attempts genuinely increased (different response entirely). A good alert distinguishes these, or at least tells the on-call engineer where to look first.
</div>
`
    },
    {
      id: "incident-response",
      title: "Incident Response & Postmortems",
      content: `
<p>When something breaks in production, the goal during the incident is singular: <strong>restore service</strong>. Understanding root cause comes after, not during.</p>

<h3>During an Incident</h3>

<ul>
  <li>One person is the incident commander — coordinates, doesn't necessarily fix</li>
  <li>Mitigate first (rollback, feature flag off, failover) — diagnose the deep root cause later</li>
  <li>Communicate status regularly, even if the update is "still investigating"</li>
</ul>

<h3>The Blameless Postmortem</h3>

<p>After the incident, write up: what happened, the timeline, the impact, the root cause, and concrete follow-up actions. "Blameless" means the document explains what happened and why the system allowed it, not who to blame — an engineer who fears blame hides mistakes, which guarantees they happen again unnoticed.</p>

<div class="callout">
  <strong>In banking, this connects directly to regulatory obligations.</strong> Many incidents affecting customer funds or data require formal reporting to regulators within a defined window. A clear, timestamped incident timeline isn't just good engineering practice — it's often a compliance requirement.
</div>
`
    }
  ]
},

"security": {
  title: "Security Engineering",
  icon: "🔐",
  xpMax: 350,
  sections: [
    {
      id: "authn-authz",
      title: "Authentication vs Authorization",
      content: `
<p>Two questions that get conflated constantly, and confusing them is a common source of security bugs:</p>

<ul>
  <li><strong>Authentication (AuthN)</strong> — who are you? Verifying identity.</li>
  <li><strong>Authorization (AuthZ)</strong> — what are you allowed to do? Checking permissions.</li>
</ul>

<p>A system can authenticate a user perfectly and still have a critical bug if it forgets to check authorization on every request.</p>

<pre><code class="java">// ❌ Authenticated, but not authorized — any logged-in user can view ANY account
@GetMapping("/accounts/{id}")
public Account getAccount(@PathVariable String id) {
    return accountService.findById(id); // no check that the caller owns this account
}

// ✅ Authorization check on every access
@GetMapping("/accounts/{id}")
public Account getAccount(@PathVariable String id, @AuthenticationPrincipal User user) {
    Account account = accountService.findById(id);
    if (!account.belongsTo(user)) throw new AccessDeniedException();
    return account;
}</code></pre>

<h3>OAuth2 / OIDC / JWT</h3>

<p>OAuth2 is an authorization framework; OpenID Connect (OIDC) layers authentication on top of it. A JWT (JSON Web Token) is a common token format carrying claims — who the user is, what scopes they have — signed so the server can verify it hasn't been tampered with.</p>

<div class="callout callout-warning">
  <strong>PSD2 / Strong Customer Authentication:</strong> European banking regulation requires multi-factor authentication for most payment operations — something you know (password), something you have (device/token), something you are (biometric). This isn't optional hardening; it's a legal requirement for many transaction types.
</div>
`
    },
    {
      id: "common-vulnerabilities",
      title: "Common Vulnerabilities (OWASP Top 10)",
      content: `
<p>A handful of vulnerability classes account for the overwhelming majority of real-world breaches. Know these cold.</p>

<h3>SQL Injection</h3>

<pre><code class="java">// ❌ String concatenation — an attacker sends id = "1 OR 1=1" and reads every account
String sql = "SELECT * FROM accounts WHERE id = '" + id + "'";

// ✅ Parameterized query — the driver treats input as data, never as SQL
@Query("SELECT a FROM Account a WHERE a.id = :id")
Account findById(@Param("id") String id);
// Spring Data JPA parameterizes by default — this class of bug requires going out of your way to introduce</code></pre>

<h3>Cross-Site Scripting (XSS)</h3>

<p>Injecting malicious script into a page viewed by other users, typically via unescaped user input rendered as HTML. Angular escapes bound values by default — the danger is explicitly opting out with <code>[innerHTML]</code> or <code>bypassSecurityTrustHtml</code> on unsanitized user content.</p>

<h3>Cross-Site Request Forgery (CSRF)</h3>

<p>Tricking a logged-in user's browser into making an unwanted request (e.g. a hidden form on an attacker's page that submits a transfer using the victim's own session cookie). Spring Security enables CSRF protection by default for session-based apps; token-based APIs (JWT in an Authorization header, not a cookie) are inherently less exposed to this specific attack.</p>

<h3>Broken Access Control</h3>

<p>The authorization-check gap from the previous section — consistently the #1 vulnerability class in the OWASP Top 10 in recent years, precisely because it's a logic error, not something a scanner reliably catches.</p>

<div class="callout">
  <strong>Pattern across all of these:</strong> the fix is almost always "let the framework do it" — parameterized queries instead of string concatenation, Angular's default escaping instead of manual HTML building, Spring Security's method-level <code>@PreAuthorize</code> instead of ad-hoc checks. Security bugs cluster wherever a developer bypassed the framework's safe default.
</div>
`
    },
    {
      id: "secrets-management",
      title: "Secrets Management",
      content: `
<p>A database password, API key, or signing key hardcoded in source code is a secret that's now in every clone of the repo, every CI log that echoes env vars, and permanently in git history even after "removing" it in a later commit.</p>

<pre><code class="java">// ❌ Hardcoded — now in git history forever, visible to anyone with repo access
String apiKey = "sk_live_4f8a9b2c...";

// ✅ Injected at runtime from a secrets manager, never touches source control
@Value("\${payment.api.key}")
private String apiKey;
// backed by Vault, AWS Secrets Manager, or Kubernetes Secrets — not application.yml in the repo</code></pre>

<h3>Key Rotation</h3>

<p>Secrets should be rotated periodically and immediately after any suspected exposure. A secrets manager that supports rotation without a full redeploy (services fetch the current value at call time rather than baking it in at startup) turns rotation from a maintenance event into a non-event.</p>

<div class="callout callout-warning">
  If a secret ever gets committed to git, rotating it is mandatory — removing it from a later commit does not remove it from history, and anyone who cloned the repo in between still has it.
</div>
`
    },
    {
      id: "encryption",
      title: "Encryption",
      content: `
<p>Two distinct concerns, both required:</p>

<ul>
  <li><strong>Encryption in transit</strong> — TLS on every network hop, including internal service-to-service calls, not just the public-facing edge.</li>
  <li><strong>Encryption at rest</strong> — data encrypted on disk, so a stolen backup or disk isn't readable.</li>
</ul>

<h3>PCI-DSS</h3>

<p>The Payment Card Industry Data Security Standard governs anything that stores, processes, or transmits card data. Key implications for engineers:</p>

<ul>
  <li>Full card numbers must be encrypted at rest and masked everywhere they're displayed or logged</li>
  <li>The CVV must <strong>never</strong> be stored, even encrypted, after authorization completes</li>
  <li>Access to systems touching card data must be logged and tightly scoped (least privilege)</li>
</ul>

<pre><code class="java">// Masking a card number for display/logs — never expose the full PAN
public String mask(String cardNumber) {
    return "**** **** **** " + cardNumber.substring(cardNumber.length() - 4);
}</code></pre>

<div class="callout">
  Many banks route actual card data handling through a PCI-compliant third party (a payment processor/vault) specifically so their own systems only ever see a tokenized reference, never the real card number — reducing the compliance scope of the bank's own codebase dramatically.
</div>
`
    },
    {
      id: "secure-coding-spring",
      title: "Secure Coding in Spring Boot",
      content: `
<p>Spring Security provides safe defaults — the job is usually to configure it correctly, not to build security primitives from scratch.</p>

<pre><code class="java">@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
        return http.build();
    }
}</code></pre>

<h3>Input Validation</h3>

<pre><code class="java">public record TransferRequest(
    @NotBlank String toAccount,
    @Positive @Digits(integer = 10, fraction = 2) BigDecimal amount,
    @Pattern(regexp = "GBP|USD|EUR") String currency
) {}

@PostMapping("/transfers")
public TransferResult transfer(@Valid @RequestBody TransferRequest req) {
    // @Valid rejects malformed input before it ever reaches business logic
    return transferService.execute(req);
}</code></pre>

<div class="callout">
  <strong>Validate at the boundary, trust internally.</strong> Once <code>@Valid</code> has accepted a <code>TransferRequest</code>, the service layer shouldn't re-validate the same fields defensively — that's redundant work scattered everywhere instead of enforced once, at the edge where untrusted input enters the system.
</div>
`
    },
    {
      id: "compliance-threat-modeling",
      title: "Compliance & Threat Modeling",
      content: `
<p>Security engineering at a bank isn't just "write secure code" — it's operating inside a framework of regulatory obligations that shape design decisions before a line of code is written.</p>

<table>
  <thead>
    <tr><th>Regulation</th><th>Concerns</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>PCI-DSS</strong></td><td>Card data handling, encryption, access control</td></tr>
    <tr><td><strong>GDPR</strong></td><td>Personal data — consent, right to erasure, data minimization, breach notification within 72 hours</td></tr>
    <tr><td><strong>PSD2</strong></td><td>Strong customer authentication, open banking API access</td></tr>
    <tr><td><strong>SOX</strong></td><td>Financial reporting controls and audit trails</td></tr>
  </tbody>
</table>

<h3>Threat Modeling with STRIDE</h3>

<p>A structured way to ask "what could go wrong?" before building a feature, rather than discovering it in a pentest:</p>

<ul>
  <li><strong>S</strong>poofing — pretending to be someone else</li>
  <li><strong>T</strong>ampering — modifying data or code in transit or at rest</li>
  <li><strong>R</strong>epudiation — denying an action was taken, with no way to prove otherwise</li>
  <li><strong>I</strong>nformation disclosure — exposing data to those not authorized to see it</li>
  <li><strong>D</strong>enial of service — making the system unavailable</li>
  <li><strong>E</strong>levation of privilege — gaining access beyond what was granted</li>
</ul>

<div class="callout">
  For a new feature — say, "customers can add a linked external account" — run through each STRIDE category: can someone spoof a linked account they don't own? Can the link be tampered with in transit? Is there an audit trail if a customer later disputes adding it? This ten-minute exercise catches design-level security gaps that no amount of secure coding fixes after the fact.
</div>
`
    }
  ]
},

"leadership": {
  title: "Engineering Leadership",
  icon: "🎯",
  xpMax: 400,
  sections: [
    {
      id: "ic-to-senior",
      title: "From Individual Contributor to Senior",
      content: `
<p>The jump to senior isn't "writes more code, faster." It's a shift in the unit of impact: from what <em>you</em> ship, to what <em>your team</em> ships — including work you never personally touch.</p>

<table>
  <thead>
    <tr><th>Junior/Mid</th><th>Senior</th></tr>
  </thead>
  <tbody>
    <tr><td>Solves the problem given to them</td><td>Notices problems no one assigned and raises them</td></tr>
    <tr><td>Asks "how do I do this?"</td><td>Asks "should we do this, and what happens if we don't?"</td></tr>
    <tr><td>Optimizes their own PR</td><td>Improves the team's shared standards through review and example</td></tr>
    <tr><td>Reactive to design decisions</td><td>Drives design decisions and owns the trade-offs made</td></tr>
  </tbody>
</table>

<div class="callout">
  <strong>This is influence without authority.</strong> A senior engineer typically has no formal power to assign work to others — the leadership is earned through the quality and consistency of technical judgment, demonstrated repeatedly, until people seek out that opinion before a decision is made rather than after.
</div>
`
    },
    {
      id: "code-review-mentorship",
      title: "Code Review as Mentorship",
      content: `
<p>A code review is the highest-leverage, most frequent teaching moment available to a senior engineer — most engineers read far more review comments over a career than they read books or attend talks.</p>

<h3>What Separates a Useful Review Comment</h3>

<pre><code>❌ "This is wrong."
❌ "Why would you do it this way?"

✅ "This will N+1 query when the account list grows — see the Databases lesson.
   A fetch join here would collapse it to one query."

✅ "Nit: non-blocking, but naming this 'process' hides that it also sends a
   notification — future readers won't expect that from the name."</code></pre>

<p>Good review feedback explains the <em>why</em>, distinguishes must-fix from nice-to-have ("nit:"), and — critically — is specific enough that the author learns something transferable, not just "fix this one line."</p>

<div class="callout callout-warning">
  <strong>Approving with unaddressed "nit" comments is a courtesy, not a loophole.</strong> If every comment blocks merge regardless of severity, authors learn to dread review instead of learning from it. Reserve blocking comments for actual bugs, security issues, or real maintainability problems.
</div>
`
    },
    {
      id: "technical-decision-making",
      title: "Technical Decision Making",
      content: `
<p>Senior engineers are expected to drive decisions that affect the whole team, not just defer everything to the most senior person in the room.</p>

<h3>Driving Alignment</h3>

<ul>
  <li>Write the decision down (an ADR — see the Architecture lesson) before debating it verbally; it forces clarity and gives people time to think instead of reacting live.</li>
  <li>State the options actually considered, not just the chosen one — this is what lets someone push back with "did you consider X?" productively instead of relitigating from zero.</li>
  <li>Time-box the debate. Most technical decisions don't need to be perfect, they need to be made, documented, and revisited if wrong.</li>
</ul>

<h3>Disagree and Commit</h3>

<p>Not every decision will go your way. Once a decision is made after genuine debate, committing to it fully — rather than quietly under-investing or relitigating it in every subsequent conversation — is what lets a team actually move. Voice the disagreement clearly during the debate; drop it once the decision is made.</p>

<div class="callout">
  A senior engineer who's technically right but repeatedly blocks team decisions with unresolved objections is, in practice, less effective than one who states their case clearly once, then commits.
</div>
`
    },
    {
      id: "mentoring",
      title: "Mentoring Junior Engineers",
      content: `
<p>Growing other engineers multiplies your impact far beyond what you can personally ship — and is one of the clearest signals of senior-level performance in most promotion frameworks.</p>

<h3>The Core Skill: Unblocking Without Solving</h3>

<pre><code>❌ "Here, let me just fix it" — solves today's problem, teaches nothing
❌ "Figure it out" — teaches resilience, at the cost of hours lost and confidence damaged

✅ "What have you tried? ... Have you checked what the connection pool logs
   show when this happens?" — guides toward the answer without handing it over</code></pre>

<p>The right level of help depends on the person and the stakes: a junior engineer debugging a learning exercise benefits from being pointed at where to look; the same junior engineer blocked on a production incident needs the answer now, with the teaching moment saved for the retro.</p>

<h3>Pairing</h3>

<p>Pairing on a real task — not a toy exercise — is often more effective than any amount of advice, because it surfaces the actual habits (how someone reads an error, what they check first, when they ask for help) that no code review ever reveals.</p>

<div class="callout">
  Ask more questions than you give answers. "What do you think this error means?" builds a junior engineer's own diagnostic process; immediately supplying the answer trains them to come to you instead of building that process themselves.
</div>
`
    },
    {
      id: "communicating-with-non-engineers",
      title: "Communicating with Non-Engineers",
      content: `
<p>A senior engineer at a bank routinely needs to explain technical risk to product managers, compliance officers, and business stakeholders who don't share the technical vocabulary — and the failure to translate well is a common reason good technical judgment doesn't turn into action.</p>

<pre><code>❌ "We have significant technical debt in the payment reconciliation module
   and need to refactor the persistence layer."

✅ "The system that matches our records against the bank's is held together
   with workarounds from three years ago. Right now, a change here takes twice
   as long to build and test safely as a similar change elsewhere. If we don't
   invest two weeks now, the risk is a reconciliation bug that misstates
   customer balances — and by then it costs a month to fix instead of two weeks."</code></pre>

<p>The translation: lead with business impact and risk (cost, time, customer harm), not implementation detail. Technical vocabulary is a tool for talking to other engineers, not a badge to display when talking to stakeholders who need to make a resourcing decision.</p>

<div class="callout">
  <strong>Quantify when you can.</strong> "This is risky" is easy to deprioritize. "This has caused 3 production incidents in 6 months, each taking 2 days to resolve" is a business case a non-engineer can act on and defend to their own stakeholders.
</div>
`
    },
    {
      id: "leading-incidents",
      title: "Leading Incidents",
      content: `
<p>How a senior engineer behaves during a production incident — especially one involving customer money — is one of the most visible tests of leadership under pressure that exists in the job.</p>

<h3>Staying Effective Under Pressure</h3>

<ul>
  <li>State what you know and don't know explicitly — "transfers are failing for GBP accounts, we don't yet know why" beats silence or speculation presented as fact.</li>
  <li>Default to the safest mitigation first (rollback, disable the feature flag) over the most complete fix — full root-cause analysis can wait until service is restored.</li>
  <li>Delegate explicitly — "can you check the database connection pool metrics while I look at the recent deploys?" — rather than one person trying to do everything.</li>
</ul>

<h3>The Incident Commander Role</h3>

<p>In a well-run incident, one person coordinates — tracking what's been tried, who's doing what, and communicating status outward — while others investigate. This role doesn't have to be the most senior or most technical person in the room; it's a distinct skill from debugging, and a senior engineer should be able to play either role depending on what the incident needs.</p>

<div class="callout callout-warning">
  <strong>Calm is contagious — so is panic.</strong> A senior engineer who stays methodical during an incident sets the tone for everyone else in the call, junior engineers included. That composure is itself a form of leadership, independent of who actually finds the fix.
</div>
`
    }
  ]
}

};
